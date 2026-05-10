import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { probeMarket } from "../src/fetch-probe/probe.js";

interface DeepRow {
  id: string;
  raw_url: string;
  deep_url: string;
  strategy: string;
  binding_source_unfetchable: boolean;
  data_likely_available: boolean;
  answer_keywords: string[];
}

const WEBDRIVER = process.env.WEBDRIVER ?? "http://127.0.0.1:4444";
const CONCURRENCY = 4;

const inFile = process.argv[2] ?? "data/markets/2026-05-06/probe-samples/deep-urls-50.jsonl";
const outFile = process.argv[3] ?? "data/markets/2026-05-06/probe-samples/deep-probe-50.jsonl";

async function main() {
  const text = await readFile(resolve(inFile), "utf8");
  const rows: DeepRow[] = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l));

  const records: any[] = [];
  let inflight = 0;
  let idx = 0;
  let done = 0;

  async function next() {
    if (idx >= rows.length) return;
    const i = idx++;
    const row = rows[i]!;
    inflight++;
    const probe = await probeMarket(
      { market_id: row.id, url: row.deep_url },
      {
        webdriverUrl: WEBDRIVER,
        mode: "text",
        loadTimeoutMs: 25_000,
      },
    ).catch((err: unknown) => ({
      market_id: row.id,
      url: row.deep_url,
      classification: "network-error",
      http_status: null,
      body_size: 0,
      head_chars: "",
      elapsed_ms: 0,
      error: err instanceof Error ? err.message : String(err),
    }));

    // Re-fetch full body to check answer keywords (probe only keeps 500-char head)
    let fullBody = "";
    try {
      const target = new URL("/render", WEBDRIVER);
      target.searchParams.set("url", row.deep_url);
      target.searchParams.set("mode", "text");
      target.searchParams.set("loadTimeout", "25000");
      const res = await fetch(target.toString(), {
        signal: AbortSignal.timeout(30_000),
      });
      fullBody = await res.text();
    } catch {}

    const lowerBody = fullBody.toLowerCase();
    const matched: string[] = [];
    for (const kw of row.answer_keywords ?? []) {
      if (kw && lowerBody.includes(kw.toLowerCase())) matched.push(kw);
    }
    const required = Math.min(2, row.answer_keywords?.length ?? 0);
    const answer_found = matched.length >= required && required > 0;

    records.push({
      ...probe,
      raw_url: row.raw_url,
      strategy: row.strategy,
      binding_source_unfetchable: row.binding_source_unfetchable,
      data_likely_available: row.data_likely_available,
      keywords_total: row.answer_keywords?.length ?? 0,
      keywords_matched: matched.length,
      keywords_matched_list: matched,
      answer_found,
    });
    inflight--;
    done++;
    process.stderr.write(
      `[${done}/${rows.length}] ${row.id} ${(probe as any).classification} ` +
        `bytes=${(probe as any).body_size} kw=${matched.length}/${row.answer_keywords?.length ?? 0}\n`,
    );
    await next();
  }

  const workers: Promise<void>[] = [];
  for (let k = 0; k < CONCURRENCY; k++) workers.push(next());
  await Promise.all(workers);

  records.sort((a, b) => rows.findIndex((r) => r.id === a.market_id) - rows.findIndex((r) => r.id === b.market_id));
  const payload = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await writeFile(resolve(outFile), payload, "utf8");

  const rollup: Record<string, number> = {};
  for (const r of records) rollup[r.classification] = (rollup[r.classification] ?? 0) + 1;
  const answered = records.filter((r) => r.answer_found).length;
  const answeredAvailable = records.filter((r) => r.answer_found && r.data_likely_available).length;
  const expectedAnswerable = records.filter((r) => r.data_likely_available).length;
  console.log(
    JSON.stringify({
      total: records.length,
      classification_rollup: rollup,
      answer_found: answered,
      answer_found_among_likely_available: answeredAvailable,
      expected_answerable: expectedAnswerable,
      out_file: outFile,
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
