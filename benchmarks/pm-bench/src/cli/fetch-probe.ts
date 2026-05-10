import { resolve } from "node:path";
import { stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { loadProbeInputs } from "../fetch-probe/load-input.js";
import { runFetchProbe } from "../fetch-probe/run.js";
import { requireDateArg } from "../lib/parse-date.js";

interface CliArgs {
  date: string | null;
  inFile: string | null;
  inDir: string;
  outDir: string | null;
  webdriverUrl: string;
  mode: "text" | "html";
  loadTimeoutMs: number;
  limit: number | null;
  force: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  let date: string | null = null;
  let inFile: string | null = null;
  let inDir = "data/markets";
  let outDir: string | null = null;
  let webdriverUrl = "http://127.0.0.1:4444";
  let mode: "text" | "html" = "text";
  let loadTimeoutMs = 30_000;
  let limit: number | null = null;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--date") date = requireDateArg("--date", argv[++i]);
    else if (a === "--in") inFile = argv[++i] ?? null;
    else if (a === "--in-dir") inDir = argv[++i] ?? inDir;
    else if (a === "--out-dir") outDir = argv[++i] ?? outDir;
    else if (a === "--webdriver") webdriverUrl = argv[++i] ?? webdriverUrl;
    else if (a === "--mode") {
      const v = argv[++i];
      if (v !== "text" && v !== "html") {
        console.error(`--mode must be text or html, got ${v}`);
        process.exit(2);
      }
      mode = v;
    } else if (a === "--load-timeout-ms") {
      loadTimeoutMs = Number(argv[++i]);
      if (!Number.isFinite(loadTimeoutMs) || loadTimeoutMs <= 0) {
        console.error(`--load-timeout-ms must be > 0`);
        process.exit(2);
      }
    } else if (a === "--limit") {
      limit = Number(argv[++i]);
      if (!Number.isFinite(limit) || limit <= 0) {
        console.error(`--limit must be > 0`);
        process.exit(2);
      }
    } else if (a === "--force") force = true;
    else if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return {
    date,
    inFile,
    inDir,
    outDir,
    webdriverUrl,
    mode,
    loadTimeoutMs,
    limit,
    force,
  };
}

function printHelp(): void {
  console.log(`pm-bench fetch-probe — Gate 3 lite: fetch each market's URL via genvm-webdriver and classify the result

usage: pnpm --filter @gym/pm-bench fetch-probe [options]

options:
  --date YYYY-MM-DD       pick {in-dir}/{date}/header.jsonl (default: today UTC)
  --in PATH               read this exact JSONL file (overrides --date / --in-dir).
                          Accepts polled-market rows or wrapped {bucket,rule,market} rows.
  --in-dir PATH           input base directory (default: data/markets)
  --out-dir PATH          write outputs here (default: {in-dir}/{date}/)
  --webdriver URL         genvm-webdriver base URL (default: http://127.0.0.1:4444)
  --mode text|html        render mode (default: text)
  --load-timeout-ms N     per-page navigation timeout passed to the webdriver (default: 30000)
  --limit N               only probe the first N markets
  --force                 overwrite existing fetch-probe.jsonl (default: refuse)
  -h, --help              show this help

writes:
  {out-dir}/fetch-probe.jsonl
`);
}

const utcDateStr = (d: Date): string => d.toISOString().slice(0, 10);

async function main(args: CliArgs): Promise<void> {
  const date = args.date ?? utcDateStr(new Date());
  const dayDir = resolve(args.inDir, date);
  const inFile = args.inFile
    ? resolve(args.inFile)
    : resolve(dayDir, "header.jsonl");
  const outDir = args.outDir ? resolve(args.outDir) : dayDir;
  const outFile = resolve(outDir, "fetch-probe.jsonl");

  if (!args.force) {
    const exists = await fileExists(outFile);
    if (exists) {
      console.error(
        `[fetch-probe] ${outFile} already exists; pass --force to overwrite`,
      );
      process.exitCode = 2;
      return;
    }
  }

  const startedAt = Date.now();
  const markets = await loadProbeInputs(inFile);

  const result = await runFetchProbe(markets, {
    webdriverUrl: args.webdriverUrl,
    mode: args.mode,
    loadTimeoutMs: args.loadTimeoutMs,
    limit: args.limit,
    outFile,
    log: (msg) => console.error(msg),
  });

  console.log(
    JSON.stringify({
      stage: "fetch-probe",
      in_file: inFile,
      out_file: result.outFile,
      webdriver_url: args.webdriverUrl,
      mode: args.mode,
      total_inputs: result.total_inputs,
      probed: result.records.length,
      skipped_no_url: result.skipped_no_url.length,
      rollup: result.rollup,
      elapsed_ms: Date.now() - startedAt,
    }),
  );
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}

const entry = process.argv[1];
const isMain = entry ? import.meta.url === pathToFileURL(entry).href : false;

if (isMain) {
  main(parseArgs(process.argv.slice(2))).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ stage: "fetch-probe", error: msg }));
    process.exitCode = 1;
  });
}

export { main as runFetchProbeCli, parseArgs };
