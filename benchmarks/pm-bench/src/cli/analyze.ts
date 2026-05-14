import { pathToFileURL } from "node:url";

import { analyze } from "../analyze/analyze.js";
import { gate1Reason, hasAnyUrl, isGate1Match } from "../analyze/buckets.js";
import { dedupeByLatestPoll } from "../analyze/load.js";
import { requireDateArg } from "../lib/parse-date.js";
import {
  sql,
  createPoll,
  finishPoll,
  insertGateEvaluations,
  close as closeDb,
} from "../lib/db-writers.mjs";
import type { PolledMarket } from "../schemas/polled-market.js";

interface CliArgs {
  date: string | null;
  noDedup: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  let date: string | null = null;
  let noDedup = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--date") date = requireDateArg("--date", argv[++i]);
    else if (a === "--no-dedup") noDedup = true;
    else if (a === "--in" || a === "--in-dir" || a === "--out-dir") {
      argv[++i]; // deprecated, arg-compat only
    } else if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return { date, noDedup };
}

function printHelp(): void {
  console.log(`pm-bench analyze — classify polled markets through Gate 1 and write to raw.gate_evaluations

usage: pnpm --filter @gym/pm-bench analyze [options]

options:
  --date YYYY-MM-DD     poll-date to analyze (default: today UTC)
  --no-dedup            keep duplicate observations (default: dedup, latest polled_at wins)
  -h, --help            show this help

reads:  raw.markets joined with raw.market_observations (polled on --date)
writes: raw.gate_evaluations (one row per market, with passed/dropped + bucket)
`);
}

const utcDateStr = (d: Date): string => d.toISOString().slice(0, 10);

async function loadFromDb(date: string): Promise<PolledMarket[]> {
  // Latest observation per market for the given poll_date, materialised back
  // into the PolledMarket shape via the original raw_payload jsonb.
  const rows = await sql`
    select m.raw_payload as payload
    from raw.market_observations o
    join raw.polls p on p.id = o.poll_id
    join raw.markets m on m.id = o.market_id
    where p.poll_date = ${date}
    order by o.observed_at desc
  ` as Array<{ payload: PolledMarket }>;
  return rows.map((r) => r.payload);
}

async function main(args: CliArgs): Promise<void> {
  const date = args.date ?? utcDateStr(new Date());

  const startedAt = Date.now();
  const raw = await loadFromDb(date);
  const rows = args.noDedup ? raw : dedupeByLatestPoll(raw);
  const result = analyze(rows);

  const chainlinkRows = rows.filter((r) => gate1Reason(r.eventResolutionSource) === "chainlink");
  const pythRows = rows.filter((r) => gate1Reason(r.eventResolutionSource) === "pyth");
  const noUrlRows = rows.filter(
    (r) => !isGate1Match(r.eventResolutionSource) && !hasAnyUrl(r),
  );
  const passRows = rows.filter(
    (r) => !isGate1Match(r.eventResolutionSource) && hasAnyUrl(r),
  );

  const pollId = await createPoll(date, "pipeline-analyze-v1", { rows: rows.length });
  const evaluations = [
    ...passRows.map((r) => ({
      marketId: String(r.id),
      passed: true,
      droppedAtGate: null,
      dropReason: null,
      bucket: null,
      bindingDomain: null,
      bindingUrl: r.eventResolutionSource ?? null,
      notes: null,
    })),
    ...chainlinkRows.map((r) => ({
      marketId: String(r.id),
      passed: false,
      droppedAtGate: 1,
      dropReason: "chainlink",
      bucket: "chainlink",
      bindingDomain: null,
      bindingUrl: r.eventResolutionSource ?? null,
      notes: null,
    })),
    ...pythRows.map((r) => ({
      marketId: String(r.id),
      passed: false,
      droppedAtGate: 1,
      dropReason: "pyth",
      bucket: "pyth",
      bindingDomain: null,
      bindingUrl: r.eventResolutionSource ?? null,
      notes: null,
    })),
    ...noUrlRows.map((r) => ({
      marketId: String(r.id),
      passed: false,
      droppedAtGate: 1,
      dropReason: "no_url",
      bucket: null,
      bindingDomain: null,
      bindingUrl: r.eventResolutionSource ?? null,
      notes: null,
    })),
  ];
  const inserted = await insertGateEvaluations(pollId, date, evaluations);
  await finishPoll(pollId, inserted);

  console.log(
    JSON.stringify({
      stage: "analyze",
      date,
      poll_id: pollId,
      raw_rows: raw.length,
      after_dedup: rows.length,
      gate1_pass: passRows.length,
      gate1_drop_chainlink: chainlinkRows.length,
      gate1_drop_pyth: pythRows.length,
      gate1_drop_no_url: noUrlRows.length,
      gate1_dropped: result.gate1Dropped,
      io_addressable_markets: result.ioAddressableMarkets,
      truly_io_shaped_markets: result.trulyIoShapedMarkets,
      gate_evaluations_inserted: inserted,
      elapsed_ms: Date.now() - startedAt,
    }),
  );
}

const entry = process.argv[1];
const isMain = entry ? import.meta.url === pathToFileURL(entry).href : false;

if (isMain) {
  main(parseArgs(process.argv.slice(2)))
    .then(() => closeDb())
    .catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ stage: "analyze", error: msg }));
      await closeDb();
      process.exitCode = 1;
    });
}

export { main as runAnalyze, parseArgs };
