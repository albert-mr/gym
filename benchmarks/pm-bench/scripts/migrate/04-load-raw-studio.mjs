// 04-load-raw-studio.mjs
// Backfill raw.studio_deploys from any *studio-results*.jsonl / studio-deploy-results.jsonl
// across per-date directories.

import fs from 'node:fs';
import path from 'node:path';
import { sql, listDateDirs, readJsonl, chunks, MARKETS_DIR, log } from './_shared.mjs';

function listStudioFilesForDate(date) {
  const dir = path.join(MARKETS_DIR, date);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl') && /studio.*results/i.test(f))
    .map((f) => path.join(dir, f));
}

async function run() {
  const totals = { rowsInserted: 0, filesRead: 0 };

  // Ensure all referenced markets exist (FK). Collect first, stub-insert missing, then deploys.
  const allRows = [];
  for (const date of listDateDirs()) {
    for (const file of listStudioFilesForDate(date)) {
      const rows = readJsonl(file);
      if (!rows.length) continue;
      totals.filesRead++;
      for (const r of rows) {
        if (!r.market_id && !r.id) continue;
        allRows.push({
          date,
          source_file: path.basename(file),
          market_id: String(r.market_id ?? r.id),
          binding_domain: r.binding_domain ?? null,
          deploy_ok: r.deploy_ok ?? null,
          resolve_tx: r.resolve_tx ?? null,
          raw_outcome: r.raw_outcome ?? null,
          match: r.match ?? null,
          elapsed_ms: r.elapsed_ms ?? null,
          deployed_at: `${date}T00:00:00Z`,
          notes: r,
        });
      }
    }
  }

  // Stub any missing markets so FK holds.
  const ids = [...new Set(allRows.map((r) => r.market_id))];
  for (const batch of chunks(ids, 500)) {
    const stubs = batch.map((id) => ({
      id,
      condition_id: null,
      event_slug: null,
      slug: null,
      question: '(unknown — referenced by studio deploy only)',
      end_date: null,
      volume_num: null,
      raw_payload: { stub: true, reason: 'referenced by studio deploy with no market record' },
    }));
    await sql`
      insert into raw.markets ${sql(stubs, 'id', 'condition_id', 'event_slug', 'slug', 'question', 'end_date', 'volume_num', 'raw_payload')}
      on conflict (id) do nothing
    `;
  }

  const cleanRows = allRows.map(({ date, source_file, ...rest }) => ({
    ...rest,
    notes: { ...rest.notes, _source_file: source_file, _date: date },
  }));
  for (const batch of chunks(cleanRows, 500)) {
    await sql`
      insert into raw.studio_deploys ${sql(batch, 'market_id', 'binding_domain', 'deploy_ok', 'resolve_tx', 'raw_outcome', 'match', 'elapsed_ms', 'deployed_at', 'notes')}
    `;
    totals.rowsInserted += batch.length;
  }

  log('04-load-raw-studio', totals);
  sql.end();
}

run().catch((err) => { console.error(err); process.exit(1); });
