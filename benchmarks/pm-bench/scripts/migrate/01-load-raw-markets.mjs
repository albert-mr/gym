// 01-load-raw-markets.mjs
// Backfill raw.markets + raw.market_observations from per-day JSONL files.
//
// Heterogeneous: some dates have all.jsonl (full polled universe),
// most have only closed.jsonl (post-resolution snapshot) and gate1-drop-*.jsonl.
// We load whatever's there. The most recent poll wins for the "raw_payload"
// column (last_seen_at-style); older observations are kept in market_observations.

import path from 'node:path';
import { sql, listDateDirs, readJsonl, chunks, ensurePoll, MARKETS_DIR, log } from './_shared.mjs';

const FILES_PER_DATE = ['all.jsonl', 'gate1-pass.jsonl', 'gate1-drop-chainlink.jsonl', 'gate1-drop-pyth.jsonl', 'gate1-drop-no-url.jsonl', 'closed.jsonl'];

function pickEndDate(m) {
  return m.endDate || m.end_date || null;
}

function pickVolume(m) {
  const v = m.volumeNum ?? m.volume_num ?? m.volume ?? null;
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : null;
}

async function run() {
  const totals = { marketsUpserted: 0, observationsInserted: 0, files: 0 };
  for (const date of listDateDirs()) {
    const pollId = await ensurePoll(date);
    let dayMarkets = 0;
    let dayObs = 0;

    for (const fname of FILES_PER_DATE) {
      const fpath = path.join(MARKETS_DIR, date, fname);
      const rows = readJsonl(fpath);
      if (!rows.length) continue;
      totals.files++;

      const marketRows = rows.map((m) => ({
        id: String(m.id),
        condition_id: m.conditionId ?? m.condition_id ?? null,
        event_slug: m.eventSlug ?? m.event_slug ?? null,
        slug: m.slug ?? null,
        question: m.question ?? '',
        end_date: pickEndDate(m),
        volume_num: pickVolume(m),
        raw_payload: m,
      })).filter((r) => r.id && r.question);

      // Upsert markets in batches; raw_payload only overwritten when fresher data arrives.
      for (const batch of chunks(marketRows, 250)) {
        await sql`
          insert into raw.markets ${sql(batch, 'id', 'condition_id', 'event_slug', 'slug', 'question', 'end_date', 'volume_num', 'raw_payload')}
          on conflict (id) do update set
            condition_id = excluded.condition_id,
            event_slug = coalesce(excluded.event_slug, raw.markets.event_slug),
            slug = coalesce(excluded.slug, raw.markets.slug),
            question = excluded.question,
            end_date = coalesce(excluded.end_date, raw.markets.end_date),
            volume_num = coalesce(excluded.volume_num, raw.markets.volume_num),
            raw_payload = excluded.raw_payload,
            last_seen_at = now()
        `;
        dayMarkets += batch.length;
      }

      // Record one observation per row (per poll, per file).
      const obsRows = rows.map((m) => {
        const observedAt = m.polled_at || m.polledAt || `${date}T00:00:00Z`;
        return {
          poll_id: pollId,
          market_id: String(m.id),
          observed_at: observedAt,
          status: m.closed === true ? 'closed' : (m.active === false ? 'inactive' : 'active'),
          outcome_prices: m.outcomePrices ?? m.outcome_prices ?? null,
          closed: !!m.closed,
        };
      }).filter((r) => r.market_id);

      for (const batch of chunks(obsRows, 500)) {
        await sql`
          insert into raw.market_observations ${sql(batch, 'poll_id', 'market_id', 'observed_at', 'status', 'outcome_prices', 'closed')}
        `;
        dayObs += batch.length;
      }
    }
    totals.marketsUpserted += dayMarkets;
    totals.observationsInserted += dayObs;
    console.log(`[01] ${date} markets=${dayMarkets} obs=${dayObs}`);
  }
  log('01-load-raw-markets', totals);
}

run().then(() => sql.end()).catch((err) => { console.error(err); process.exit(1); });
