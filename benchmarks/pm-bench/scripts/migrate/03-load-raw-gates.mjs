// 03-load-raw-gates.mjs
// Backfill raw.gate_evaluations from gate1-pass.jsonl and gate1-drop-*.jsonl.

import path from 'node:path';
import { sql, listDateDirs, readJsonl, chunks, ensurePoll, MARKETS_DIR, log } from './_shared.mjs';

const SOURCES = [
  { file: 'gate1-pass.jsonl',           passed: true,  droppedAtGate: null, dropReason: null,        bucket: null },
  { file: 'gate1-drop-chainlink.jsonl', passed: false, droppedAtGate: 1,    dropReason: 'chainlink', bucket: 'chainlink' },
  { file: 'gate1-drop-pyth.jsonl',      passed: false, droppedAtGate: 1,    dropReason: 'pyth',      bucket: 'pyth' },
  { file: 'gate1-drop-no-url.jsonl',    passed: false, droppedAtGate: 1,    dropReason: 'no_url',    bucket: null },
];

async function run() {
  const totals = { rowsInserted: 0 };
  for (const date of listDateDirs()) {
    const pollId = await ensurePoll(date);
    let dayCount = 0;
    for (const src of SOURCES) {
      const fpath = path.join(MARKETS_DIR, date, src.file);
      const rows = readJsonl(fpath);
      if (!rows.length) continue;
      const gateRows = rows.map((m) => ({
        poll_id: pollId,
        market_id: String(m.id),
        evaluated_for: date,
        passed: src.passed,
        dropped_at_gate: src.droppedAtGate,
        drop_reason: src.dropReason,
        bucket: src.bucket,
        binding_domain: null,
        binding_url: m.eventResolutionSource ?? null,
        notes: null,
      })).filter((r) => r.market_id);
      for (const batch of chunks(gateRows, 500)) {
        await sql`
          insert into raw.gate_evaluations ${sql(batch, 'poll_id', 'market_id', 'evaluated_for', 'passed', 'dropped_at_gate', 'drop_reason', 'bucket', 'binding_domain', 'binding_url', 'notes')}
        `;
        dayCount += batch.length;
      }
    }
    totals.rowsInserted += dayCount;
    if (dayCount > 0) console.log(`[03] ${date} gate_evals=${dayCount}`);
  }
  log('03-load-raw-gates', totals);
  sql.end();
}

run().catch((err) => { console.error(err); process.exit(1); });
