// 02-load-raw-outcomes.mjs
// Backfill raw.market_outcomes from data/markets/closed-index.jsonl.
//
// closed-index.jsonl is cumulative — one row per closed market, ever.
// Each row has: id, winner, outcomes, outcomePrices, closedTime, eventSlug, ...

import path from 'node:path';
import { sql, readJsonl, chunks, MARKETS_DIR, log } from './_shared.mjs';

async function run() {
  const file = path.join(MARKETS_DIR, 'closed-index.jsonl');
  const rows = readJsonl(file);
  if (!rows.length) {
    console.warn(`[02] no rows in ${file}`);
    sql.end();
    return;
  }

  // Some markets may appear in closed-index without first being in raw.markets
  // (e.g., dates whose all.jsonl was discarded). Insert a stub for them so the FK holds.
  const ids = [...new Set(rows.map((r) => String(r.id)))];
  let stubsCreated = 0;
  for (const batch of chunks(ids, 500)) {
    const stubs = batch.map((id) => {
      const r = rows.find((x) => String(x.id) === id);
      return {
        id,
        condition_id: null,
        event_slug: r.eventSlug ?? null,
        slug: null,
        question: r.question ?? '',
        end_date: r.endDate ?? null,
        volume_num: null,
        raw_payload: r,
      };
    });
    const result = await sql`
      insert into raw.markets ${sql(stubs, 'id', 'condition_id', 'event_slug', 'slug', 'question', 'end_date', 'volume_num', 'raw_payload')}
      on conflict (id) do nothing
      returning id
    `;
    stubsCreated += result.length;
  }

  // Now upsert outcomes.
  // Postgres parses "2026-05-13 04:21:08+00" natively, so we hand the string in raw.
  const outcomeRows = rows.map((r) => ({
    market_id: String(r.id),
    closed_at: r.closedTime || null,
    winner_outcome: r.winner ?? null,
    outcome_prices: r.outcomePrices ?? null,
    source_url: null,
  }));

  let upserted = 0;
  for (const batch of chunks(outcomeRows, 500)) {
    await sql`
      insert into raw.market_outcomes ${sql(batch, 'market_id', 'closed_at', 'winner_outcome', 'outcome_prices', 'source_url')}
      on conflict (market_id) do update set
        closed_at = excluded.closed_at,
        winner_outcome = excluded.winner_outcome,
        outcome_prices = excluded.outcome_prices
    `;
    upserted += batch.length;
  }

  log('02-load-raw-outcomes', { stubMarketsCreated: stubsCreated, outcomesUpserted: upserted });
  sql.end();
}

run().catch((err) => { console.error(err); process.exit(1); });
