import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { pickSamples, renderSampleMarkdown } from "../analyze/sample.js";
import { dedupeByLatestPoll, loadJsonl } from "../analyze/load.js";
import { requireDateArg } from "../lib/parse-date.js";

interface CliArgs {
  date: string | null;
  inFile: string | null;
  inDir: string;
  outDir: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  let date: string | null = null;
  let inFile: string | null = null;
  let inDir = "data/markets";
  let outDir: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--date") date = requireDateArg("--date", argv[++i]);
    else if (a === "--in") inFile = argv[++i] ?? null;
    else if (a === "--in-dir") inDir = argv[++i] ?? inDir;
    else if (a === "--out-dir") outDir = argv[++i] ?? outDir;
    else if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return { date, inFile, inDir, outDir };
}

function printHelp(): void {
  console.log(`pm-bench sample — pick 5 deliberately-different markets from a daily JSONL

usage: pnpm --filter @gym/pm-bench sample [options]

options:
  --date YYYY-MM-DD     pick {in-dir}/{date}/all.jsonl (default: today UTC)
  --in PATH             read this exact JSONL file
  --in-dir PATH         input base directory (default: data/markets)
  --out-dir PATH        write outputs here (default: {in-dir}/{date}/)
  -h, --help            show this help

writes:
  {out-dir}/header.jsonl
  {out-dir}/header.md
`);
}

const utcDateStr = (d: Date): string => d.toISOString().slice(0, 10);

async function main(args: CliArgs): Promise<void> {
  const date = args.date ?? utcDateStr(new Date());
  const dayDir = resolve(args.inDir, date);
  const inFile = args.inFile ? resolve(args.inFile) : resolve(dayDir, "all.jsonl");
  const outDir = args.outDir ? resolve(args.outDir) : dayDir;

  const startedAt = Date.now();
  const raw = await loadJsonl(inFile);
  const rows = dedupeByLatestPoll(raw);
  const picks = pickSamples(rows);

  await mkdir(outDir, { recursive: true });
  const jsonlOut = resolve(outDir, "header.jsonl");
  const jsonlPayload = picks
    .filter((p) => p.market !== null)
    .map((p) => JSON.stringify({ bucket: p.bucket, rule: p.rule, market: p.market }))
    .join("\n");
  await writeFile(jsonlOut, jsonlPayload + (jsonlPayload.length > 0 ? "\n" : ""), "utf8");

  const mdOut = resolve(outDir, "header.md");
  await writeFile(mdOut, renderSampleMarkdown(date, picks), "utf8");

  const emptyBuckets = picks.filter((p) => p.market === null).map((p) => p.bucket);
  for (const b of emptyBuckets) {
    console.error(`[sample] empty bucket: ${b}`);
  }

  console.log(
    JSON.stringify({
      stage: "sample",
      in_file: inFile,
      out_jsonl: jsonlOut,
      out_md: mdOut,
      raw_rows: raw.length,
      after_dedup: rows.length,
      picks: picks.length,
      empty_buckets: emptyBuckets,
      elapsed_ms: Date.now() - startedAt,
    }),
  );
}

const entry = process.argv[1];
const isMain = entry ? import.meta.url === pathToFileURL(entry).href : false;

if (isMain) {
  main(parseArgs(process.argv.slice(2))).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ stage: "sample", error: msg }));
    process.exitCode = 1;
  });
}

export { main as runSample, parseArgs };
