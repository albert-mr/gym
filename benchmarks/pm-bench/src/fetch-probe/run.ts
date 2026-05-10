import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { probeMarket } from "./probe.js";
import type { Classification, ProbeRecord } from "./types.js";
import type { PolledMarket } from "../schemas/polled-market.js";

export interface RunOptions {
  webdriverUrl: string;
  mode: "text" | "html";
  loadTimeoutMs: number;
  limit: number | null;
  outFile: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  log?: (msg: string) => void;
}

export interface RunResult {
  outFile: string;
  records: ProbeRecord[];
  skipped_no_url: string[];
  rollup: Record<Classification | "no-url", number>;
  total_inputs: number;
}

export async function runFetchProbe(
  markets: PolledMarket[],
  opts: RunOptions,
): Promise<RunResult> {
  const log = opts.log ?? (() => {});
  const limited = opts.limit !== null ? markets.slice(0, opts.limit) : markets;

  const records: ProbeRecord[] = [];
  const skipped_no_url: string[] = [];
  const rollup = emptyRollup();

  for (const m of limited) {
    const url = m.eventResolutionSource;
    if (!url || url.trim().length === 0) {
      skipped_no_url.push(m.id);
      rollup["no-url"]++;
      log(`[fetch-probe] skip ${m.id}: no eventResolutionSource`);
      continue;
    }

    const record = await probeMarket(
      { market_id: m.id, url },
      {
        webdriverUrl: opts.webdriverUrl,
        mode: opts.mode,
        loadTimeoutMs: opts.loadTimeoutMs,
        fetchImpl: opts.fetchImpl,
        now: opts.now,
      },
    );
    records.push(record);
    rollup[record.classification]++;
    log(
      `[fetch-probe] ${m.id} ${record.classification} ` +
        `http=${record.http_status} bytes=${record.body_size} ${record.elapsed_ms}ms`,
    );
  }

  await mkdir(dirname(opts.outFile), { recursive: true });
  const payload = records.map((r) => JSON.stringify(r)).join("\n");
  await writeFile(opts.outFile, payload + (payload.length > 0 ? "\n" : ""), "utf8");

  return {
    outFile: opts.outFile,
    records,
    skipped_no_url,
    rollup,
    total_inputs: limited.length,
  };
}

function emptyRollup(): Record<Classification | "no-url", number> {
  return {
    "ok": 0,
    "empty": 0,
    "paywall": 0,
    "captcha": 0,
    "http-4xx": 0,
    "http-5xx": 0,
    "timeout": 0,
    "webdriver-down": 0,
    "network-error": 0,
    "no-url": 0,
  };
}
