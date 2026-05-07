import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  computeDailyReport,
  renderDailyReportMarkdown,
  type DaySummary,
} from "../analyze/daily-report.js";
import { requireDateArg } from "../lib/parse-date.js";

interface CliArgs {
  date: string | null;
  prevDate: string | null;
  inDir: string;
  outDir: string | null;
  force: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  let date: string | null = null;
  let prevDate: string | null = null;
  let inDir = "data/markets";
  let outDir: string | null = null;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--date") date = requireDateArg("--date", argv[++i]);
    else if (a === "--prev-date") prevDate = requireDateArg("--prev-date", argv[++i]);
    else if (a === "--in-dir") inDir = argv[++i] ?? inDir;
    else if (a === "--out-dir") outDir = argv[++i] ?? outDir;
    else if (a === "--force") force = true;
    else if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return { date, prevDate, inDir, outDir, force };
}

function printHelp(): void {
  console.log(`pm-bench daily-report — day-over-day diff of analyze summaries

usage: pnpm --filter @gym/pm-bench daily-report [options]

options:
  --date YYYY-MM-DD       compare this date (default: latest dir under --in-dir with summary.json)
  --prev-date YYYY-MM-DD  compare against this date (default: most recent prior date with summary.json)
  --in-dir PATH           data root (default: data/markets)
  --out-dir PATH          write output here (default: {in-dir}/{date}/)
  --force                 overwrite an existing daily-report.md (default: refuse)
  -h, --help              show this help

writes:
  {out-dir}/daily-report.md
  {out-dir}/daily-report.json

exit codes:
  0  report written
  3  daily-report.md already exists and --force not supplied (skill should ask the user)
`);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function listDateDirs(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && DATE_RE.test(e.name))
    .map((e) => e.name)
    .sort();
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}

async function loadSummary(path: string): Promise<DaySummary> {
  const text = await readFile(path, "utf8");
  return JSON.parse(text) as DaySummary;
}

async function findLatestWithSummary(
  inDirAbs: string,
  candidates: string[],
): Promise<string | null> {
  for (let i = candidates.length - 1; i >= 0; i--) {
    const d = candidates[i]!;
    if (await fileExists(resolve(inDirAbs, d, "summary.json"))) return d;
  }
  return null;
}

async function main(args: CliArgs): Promise<void> {
  const inDir = resolve(args.inDir);
  const dirs = await listDateDirs(inDir);
  if (dirs.length === 0) {
    throw new Error(`no date directories found under ${inDir}`);
  }

  const date = args.date ?? (await findLatestWithSummary(inDir, dirs));
  if (!date) {
    throw new Error(
      `no summary.json found in any date dir under ${inDir} — run \`analyze\` first`,
    );
  }

  const todayPath = resolve(inDir, date, "summary.json");
  if (!(await fileExists(todayPath))) {
    throw new Error(
      `${todayPath} does not exist — run \`pnpm analyze --date ${date}\` first`,
    );
  }

  const priorCandidates = dirs.filter((d) => d < date);
  const prevDate = args.prevDate ?? (await findLatestWithSummary(inDir, priorCandidates));
  const today = await loadSummary(todayPath);
  const prev = prevDate ? await loadSummary(resolve(inDir, prevDate, "summary.json")) : null;

  const outDir = args.outDir ? resolve(args.outDir) : resolve(inDir, date);
  const reportMdPath = resolve(outDir, "daily-report.md");
  const reportJsonPath = resolve(outDir, "daily-report.json");

  if ((await fileExists(reportMdPath)) && !args.force) {
    console.log(
      JSON.stringify({
        stage: "daily-report",
        status: "exists",
        path: reportMdPath,
        date,
        prev_date: prevDate,
        message: "daily-report.md already exists; pass --force to overwrite",
      }),
    );
    process.exitCode = 3;
    return;
  }

  const startedAt = Date.now();
  const report = computeDailyReport(today, prev);
  const md = renderDailyReportMarkdown(report);
  await writeFile(reportMdPath, md, "utf8");
  await writeFile(reportJsonPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify({
      stage: "daily-report",
      status: "written",
      date,
      prev_date: prevDate,
      report_md: reportMdPath,
      report_json: reportJsonPath,
      kinds_changed: report.kindShifts.filter(
        (k) => k.templatesDelta !== 0 || k.marketsDelta !== 0,
      ).length,
      new_domains: report.newDomains.length,
      dropped_domains: report.droppedDomains.length,
      elapsed_ms: Date.now() - startedAt,
    }),
  );
}

const entry = process.argv[1];
const isMain = entry ? import.meta.url === pathToFileURL(entry).href : false;

if (isMain) {
  main(parseArgs(process.argv.slice(2))).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ stage: "daily-report", error: msg }));
    process.exitCode = 1;
  });
}

export { main as runDailyReport, parseArgs };
