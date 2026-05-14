import { pathToFileURL } from "node:url";
import { z } from "zod";

import { systemClock, type Clock } from "../lib/clock.js";
import { requireDateArg } from "../lib/parse-date.js";
import { listEventsInWindow } from "../poller/list-events.js";
import { flattenEvents, type FlattenedMarket } from "../poller/flatten.js";
import { filterMarkets } from "../poller/filter.js";
import { enrichTagsForEvents } from "../poller/enrich-tags.js";
import {
  createPoll,
  finishPoll,
  upsertMarkets,
  insertObservations,
  close as closeDb,
} from "../lib/db-writers.mjs";
import {
  polledMarketSchema,
  SCHEMA_VERSION,
  type PolledMarket,
} from "../schemas/polled-market.js";

const HOUR_MS = 60 * 60 * 1000;

interface CliArgs {
  date: string | null;
  horizonHours: number;
  enrichTags: boolean;
  baseUrl: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  let date: string | null = null;
  let horizonHours = 24;
  let enrichTags = false;
  let baseUrl: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--date") date = requireDateArg("--date", argv[++i]);
    else if (a === "--horizon-hours") horizonHours = Number(argv[++i]);
    else if (a === "--out-dir") { argv[++i]; } // deprecated, kept for arg-compat
    else if (a === "--enrich-tags") enrichTags = true;
    else if (a === "--base-url") baseUrl = argv[++i] ?? null;
    else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }

  if (!Number.isFinite(horizonHours) || horizonHours <= 0) {
    console.error(`--horizon-hours must be > 0, got ${horizonHours}`);
    process.exit(2);
  }

  return { date, horizonHours, enrichTags, baseUrl };
}

function printHelp(): void {
  console.log(`pm-bench poll — daily Polymarket poller (next-Nh window)

usage: pnpm --filter @gym/pm-bench poll [options]

options:
  --date YYYY-MM-DD     poll-date tag (default: today UTC)
  --horizon-hours N     window width in hours (default: 24)
  --enrich-tags         fetch /events/{id} per unique event to fill tags (default: off)
  --base-url URL        override Gamma API base (default: env POLYMARKET_API_BASE or production)
  -h, --help            show this help

writes:
  raw.markets, raw.market_observations, raw.polls in Postgres (Vercel/Neon).
  Requires POSTGRES_URL_NON_POOLING in apps/web/.env.local.
`);
}

const utcDateStr = (d: Date): string => d.toISOString().slice(0, 10);

function project(
  row: FlattenedMarket,
  polledAt: string,
  tagsByEvent: Map<string, string[]> | null,
): unknown {
  const m = row.market;
  return {
    schema_version: SCHEMA_VERSION,
    polled_at: polledAt,
    id: m.id,
    conditionId: m.conditionId ?? null,
    question: m.question,
    slug: m.slug,
    description: m.description ?? null,
    endDate: m.endDate,
    startDate: m.startDate ?? null,
    closed: m.closed,
    active: m.active,
    archived: m.archived,
    outcomes: m.outcomes ?? [],
    outcomePrices: parsePrices(m.outcomePrices),
    volumeNum: numericOrNull(m.volumeNum, m.volume),
    liquidityNum: numericOrNull(m.liquidityNum, m.liquidity),
    createdAt: m.createdAt ?? null,
    updatedAt: m.updatedAt ?? null,
    umaResolutionStatuses: m.umaResolutionStatuses ?? null,
    marketType: m.marketType ?? null,
    eventId: row.eventId,
    eventTitle: row.eventTitle,
    eventEndDate: row.eventEndDate,
    eventResolutionSource: row.eventResolutionSource,
    tags: tagsByEvent
      ? tagsByEvent.get(row.eventId) ?? []
      : row.eventTags,
  };
}

const parsePrices = (
  v: unknown,
): number[] | null => {
  if (!Array.isArray(v)) return null;
  const out: number[] = [];
  for (const x of v) {
    const n = typeof x === "number" ? x : Number(x);
    if (!Number.isFinite(n)) return null;
    out.push(n);
  }
  return out;
};

const numericOrNull = (
  primary: number | null | undefined,
  fallback: string | number | null | undefined,
): number | null => {
  if (typeof primary === "number" && Number.isFinite(primary)) return primary;
  if (typeof fallback === "number" && Number.isFinite(fallback)) return fallback;
  if (typeof fallback === "string" && fallback.trim() !== "") {
    const n = Number(fallback);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

export interface PollResult {
  pollId: number;
  pollDate: string;
  summary: {
    stage: "poll";
    events_fetched: number;
    markets_flattened: number;
    after_filter: number;
    dropped: number;
    drop_reasons: Record<string, number>;
    markets_upserted: number;
    observations_inserted: number;
    elapsed_ms: number;
    enrich_tags: boolean;
  };
}

export async function runPoll(
  args: CliArgs,
  clock: Clock = systemClock,
): Promise<PollResult> {
  const startedAt = Date.now();
  const now = clock.now();
  const horizonMs = args.horizonHours * HOUR_MS;
  const windowEnd = new Date(now.getTime() + horizonMs);
  const polledAt = now.toISOString();
  const pollDate = args.date ?? utcDateStr(now);

  const clientOpts = args.baseUrl ? { baseUrl: args.baseUrl } : undefined;

  const events = await listEventsInWindow({
    endDateMin: now,
    endDateMax: windowEnd,
    client: clientOpts,
  });

  const flat = flattenEvents(events);
  const { kept, dropped } = filterMarkets(flat, { start: now, end: windowEnd });

  let tagsByEvent: Map<string, string[]> | null = null;
  if (args.enrichTags) {
    const ids = new Set(kept.map((r) => r.eventId));
    tagsByEvent = await enrichTagsForEvents(ids, { client: clientOpts });
  }

  const rows: PolledMarket[] = kept.map((row) => {
    const projected = project(row, polledAt, tagsByEvent);
    try {
      return polledMarketSchema.parse(projected);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const detail = err.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        throw new Error(
          `PolledMarket schema rejected market id=${row.market.id} (${detail})`,
          { cause: err },
        );
      }
      throw err;
    }
  });

  const pollId = await createPoll(pollDate, "pipeline-poll-v1", {
    horizon_hours: args.horizonHours,
    schema_version: SCHEMA_VERSION,
  });
  const marketsUpserted = await upsertMarkets(rows);
  const observationsInserted = await insertObservations(pollId, rows);
  await finishPoll(pollId, marketsUpserted);

  const dropReasons: Record<string, number> = {};
  for (const d of dropped) dropReasons[d.reason] = (dropReasons[d.reason] ?? 0) + 1;

  return {
    pollId,
    pollDate,
    summary: {
      stage: "poll",
      events_fetched: events.length,
      markets_flattened: flat.length,
      after_filter: rows.length,
      dropped: flat.length - rows.length,
      drop_reasons: dropReasons,
      markets_upserted: marketsUpserted,
      observations_inserted: observationsInserted,
      elapsed_ms: Date.now() - startedAt,
      enrich_tags: args.enrichTags,
    },
  };
}

const entry = process.argv[1];
const isMain = entry ? import.meta.url === pathToFileURL(entry).href : false;

if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  runPoll(args).then(
    async (result) => {
      console.log(JSON.stringify(result.summary));
      console.log(JSON.stringify({ stage: "poll", poll_id: result.pollId, poll_date: result.pollDate }));
      await closeDb();
    },
    async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ stage: "poll", error: msg }));
      await closeDb();
      process.exitCode = 1;
    },
  );
}
