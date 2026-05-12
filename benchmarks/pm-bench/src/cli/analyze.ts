import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { analyze } from "../analyze/analyze.js";
import { gate1Reason, hasAnyUrl, isGate1Match } from "../analyze/buckets.js";
import { dedupeByLatestPoll, loadJsonl } from "../analyze/load.js";
import { renderMarkdown } from "../analyze/render-markdown.js";
import { requireDateArg } from "../lib/parse-date.js";
import type { PolledMarket } from "../schemas/polled-market.js";

interface CliArgs {
  date: string | null;
  inFile: string | null;
  inDir: string;
  outDir: string | null;
  noDedup: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  let date: string | null = null;
  let inFile: string | null = null;
  let inDir = "data/markets";
  let outDir: string | null = null;
  let noDedup = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--date") date = requireDateArg("--date", argv[++i]);
    else if (a === "--in") inFile = argv[++i] ?? null;
    else if (a === "--in-dir") inDir = argv[++i] ?? inDir;
    else if (a === "--out-dir") outDir = argv[++i] ?? outDir;
    else if (a === "--no-dedup") noDedup = true;
    else if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return { date, inFile, inDir, outDir, noDedup };
}

function printHelp(): void {
  console.log(`pm-bench analyze — descriptive snapshot of a daily JSONL

usage: pnpm --filter @gym/pm-bench analyze [options]

options:
  --date YYYY-MM-DD     pick {in-dir}/{date}/all.jsonl (default: today UTC)
  --in PATH             read this exact JSONL file (overrides --date / --in-dir)
  --in-dir PATH         input base directory (default: data/markets)
  --out-dir PATH        write derived outputs here (default: {in-dir}/{date}/)
  --no-dedup            keep duplicate rows for the same id (default: dedup, latest polled_at wins)
  -h, --help            show this help

writes (into out-dir):
  snapshot.md
  summary.json
  gate1-pass.jsonl
  gate1-drop-chainlink.jsonl
  gate1-drop-no-url.jsonl
`);
}

const utcDateStr = (d: Date): string => d.toISOString().slice(0, 10);

async function writeJsonl(path: string, rows: PolledMarket[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const payload = rows.map((r) => JSON.stringify(r)).join("\n");
  await writeFile(path, payload + (payload.length > 0 ? "\n" : ""), "utf8");
}

async function main(args: CliArgs): Promise<void> {
  const date = args.date ?? utcDateStr(new Date());
  const dayDir = resolve(args.inDir, date);
  const inFile = args.inFile
    ? resolve(args.inFile)
    : resolve(dayDir, "all.jsonl");
  const outDir = args.outDir ? resolve(args.outDir) : dayDir;

  const startedAt = Date.now();
  const raw = await loadJsonl(inFile);
  const rows = args.noDedup ? raw : dedupeByLatestPoll(raw);
  const result = analyze(rows);
  const md = renderMarkdown(date, result);

  const snapshotPath = resolve(outDir, "snapshot.md");
  await mkdir(outDir, { recursive: true });
  await writeFile(snapshotPath, md, "utf8");

  const chainlinkRows = rows.filter((r) => gate1Reason(r.eventResolutionSource) === "chainlink");
  const pythRows = rows.filter((r) => gate1Reason(r.eventResolutionSource) === "pyth");
  const noUrlRows = rows.filter(
    (r) => !isGate1Match(r.eventResolutionSource) && !hasAnyUrl(r),
  );
  const passRows = rows.filter(
    (r) => !isGate1Match(r.eventResolutionSource) && hasAnyUrl(r),
  );

  const passPath = resolve(outDir, "gate1-pass.jsonl");
  const dropChainlinkPath = resolve(outDir, "gate1-drop-chainlink.jsonl");
  const dropPythPath = resolve(outDir, "gate1-drop-pyth.jsonl");
  const dropNoUrlPath = resolve(outDir, "gate1-drop-no-url.jsonl");
  await writeJsonl(passPath, passRows);
  await writeJsonl(dropChainlinkPath, chainlinkRows);
  await writeJsonl(dropPythPath, pythRows);
  await writeJsonl(dropNoUrlPath, noUrlRows);

  const summary = {
    date,
    raw_rows: raw.length,
    after_dedup: rows.length,
    total_rows: result.totalRows,
    unique_markets: result.uniqueMarkets,
    unique_events: result.uniqueEvents,
    unique_templates: result.uniqueTemplates,
    unique_domains: result.uniqueDomains,
    polled_at_min: result.polledAtMin,
    polled_at_max: result.polledAtMax,
    end_date_min: result.endDateMin,
    end_date_max: result.endDateMax,
    gate1_chainlink: { matched: result.gate1Chainlink.matched, pct: result.gate1Chainlink.pct },
    gate1_pyth: { matched: result.gate1Pyth.matched, pct: result.gate1Pyth.pct },
    gate1_no_url: { matched: result.gate1NoUrl.matched, pct: result.gate1NoUrl.pct },
    gate1_dropped: result.gate1Dropped,
    io_addressable_markets: result.ioAddressableMarkets,
    io_addressable_templates: result.ioAddressableTemplates,
    io_addressable_events: result.ioAddressableEvents,
    io_addressable_recurring: result.ioAddressableRecurring,
    io_addressable_non_recurring: result.ioAddressableNonRecurring,
    io_unique_domains: result.ioUniqueDomains,
    truly_io_shaped_markets: result.trulyIoShapedMarkets,
    truly_io_shaped_templates: result.trulyIoShapedTemplates,
    kinds: result.kindBreakdown.map((k) => ({
      kind: k.kind,
      label: k.label,
      markets: k.markets,
      unique_templates: k.uniqueTemplates,
      unique_events: k.uniqueEvents,
      recurring: k.recurring,
      deterministic_feed: k.isDeterministicFeed,
    })),
    resolution_source_buckets: result.resolutionSourceBuckets,
    io_resolution_source_buckets: result.ioResolutionSourceBuckets,
    top_families: result.topFamilies,
  };
  const summaryPath = resolve(outDir, "summary.json");
  await writeFile(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify({
      stage: "analyze",
      in_file: inFile,
      out_dir: outDir,
      snapshot_md: snapshotPath,
      summary_json: summaryPath,
      gate1_pass_jsonl: passPath,
      gate1_drop_chainlink_jsonl: dropChainlinkPath,
      gate1_drop_pyth_jsonl: dropPythPath,
      gate1_drop_no_url_jsonl: dropNoUrlPath,
      raw_rows: raw.length,
      after_dedup: rows.length,
      gate1_dropped: result.gate1Dropped,
      io_addressable_markets: result.ioAddressableMarkets,
      truly_io_shaped_markets: result.trulyIoShapedMarkets,
      elapsed_ms: Date.now() - startedAt,
    }),
  );
}

const entry = process.argv[1];
const isMain = entry ? import.meta.url === pathToFileURL(entry).href : false;

if (isMain) {
  main(parseArgs(process.argv.slice(2))).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ stage: "analyze", error: msg }));
    process.exitCode = 1;
  });
}

export { main as runAnalyze, parseArgs };
