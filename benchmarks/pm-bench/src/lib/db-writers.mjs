// Shared DB writers used by every pipeline stage (poll, analyze, poll-closed).
// Plain .mjs so both tsx-run TS scripts and node-run mjs scripts can import it.
// Uses postgres.js directly — no Drizzle dependency here so the runtime is light.

import 'dotenv/config';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
config({ path: path.join(REPO_ROOT, 'apps', 'web', '.env.local') });

const url =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL;
if (!url) throw new Error('POSTGRES_URL_NON_POOLING (or alias) not set; run `vercel env pull apps/web/.env.local`.');

export const sql = postgres(url, { max: 5, prepare: false, idle_timeout: 5 });

function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function createPoll(date, scriptVersion = 'pipeline-v1', notes = null) {
  const rows = await sql`
    insert into raw.polls (poll_date, started_at, finished_at, markets_seen, script_version, notes)
    values (${date}, now(), null, 0, ${scriptVersion}, ${notes ? sql.json(notes) : null})
    returning id
  `;
  return rows[0].id;
}

export async function finishPoll(pollId, marketsSeen) {
  await sql`
    update raw.polls
    set finished_at = now(), markets_seen = ${marketsSeen}
    where id = ${pollId}
  `;
}

function pickEnd(m) {
  return m.endDate ?? m.end_date ?? null;
}
function pickVolume(m) {
  const v = m.volumeNum ?? m.volume_num ?? m.volume ?? null;
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : null;
}

export async function upsertMarkets(rows) {
  if (!rows.length) return 0;
  const mapped = rows.map((m) => ({
    id: String(m.id),
    condition_id: m.conditionId ?? m.condition_id ?? null,
    event_slug: m.eventSlug ?? m.event_slug ?? null,
    slug: m.slug ?? null,
    question: m.question ?? '',
    end_date: pickEnd(m),
    volume_num: pickVolume(m),
    raw_payload: m,
  })).filter((r) => r.id && r.question);

  let total = 0;
  for (const batch of chunks(mapped, 250)) {
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
    total += batch.length;
  }
  return total;
}

export async function insertObservations(pollId, rows) {
  if (!rows.length) return 0;
  const mapped = rows.map((m) => ({
    poll_id: pollId,
    market_id: String(m.id),
    observed_at: m.polled_at || m.polledAt || new Date().toISOString(),
    status: m.closed === true ? 'closed' : (m.active === false ? 'inactive' : 'active'),
    outcome_prices: m.outcomePrices ?? m.outcome_prices ?? null,
    closed: !!m.closed,
  }));
  let total = 0;
  for (const batch of chunks(mapped, 500)) {
    await sql`
      insert into raw.market_observations ${sql(batch, 'poll_id', 'market_id', 'observed_at', 'status', 'outcome_prices', 'closed')}
    `;
    total += batch.length;
  }
  return total;
}

export async function insertGateEvaluations(pollId, evaluatedFor, evaluations) {
  // evaluations: [{ marketId, passed, droppedAtGate, dropReason, bucket, bindingDomain, bindingUrl, notes }]
  if (!evaluations.length) return 0;
  const mapped = evaluations.map((e) => ({
    poll_id: pollId,
    market_id: String(e.marketId),
    evaluated_for: evaluatedFor,
    passed: !!e.passed,
    dropped_at_gate: e.droppedAtGate ?? null,
    drop_reason: e.dropReason ?? null,
    bucket: e.bucket ?? null,
    binding_domain: e.bindingDomain ?? null,
    binding_url: e.bindingUrl ?? null,
    notes: e.notes ? sql.json(e.notes) : null,
  }));
  let total = 0;
  for (const batch of chunks(mapped, 500)) {
    await sql`
      insert into raw.gate_evaluations ${sql(batch, 'poll_id', 'market_id', 'evaluated_for', 'passed', 'dropped_at_gate', 'drop_reason', 'bucket', 'binding_domain', 'binding_url', 'notes')}
    `;
    total += batch.length;
  }
  return total;
}

export async function upsertOutcomes(rows) {
  // rows: [{ id, winner, outcomePrices, endDate, closedTime }]
  if (!rows.length) return 0;
  const mapped = rows.map((r) => ({
    market_id: String(r.id),
    closed_at: r.closedTime || null,
    winner_outcome: r.winner ?? null,
    outcome_prices: r.outcomePrices ?? null,
    source_url: null,
  }));
  let total = 0;
  for (const batch of chunks(mapped, 500)) {
    // Ensure FK target exists — stub-insert any markets not yet known.
    const stubs = batch.map((b) => ({
      id: b.market_id,
      condition_id: null,
      event_slug: null,
      slug: null,
      question: '(stub — outcome-only)',
      end_date: null,
      volume_num: null,
      raw_payload: { stub: true },
    }));
    await sql`
      insert into raw.markets ${sql(stubs, 'id', 'condition_id', 'event_slug', 'slug', 'question', 'end_date', 'volume_num', 'raw_payload')}
      on conflict (id) do nothing
    `;
    await sql`
      insert into raw.market_outcomes ${sql(batch, 'market_id', 'closed_at', 'winner_outcome', 'outcome_prices', 'source_url')}
      on conflict (market_id) do update set
        closed_at = excluded.closed_at,
        winner_outcome = excluded.winner_outcome,
        outcome_prices = excluded.outcome_prices
    `;
    total += batch.length;
  }
  return total;
}

export async function close() {
  await sql.end();
}
