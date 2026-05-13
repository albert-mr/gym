#!/usr/bin/env node
// regen-all-jsonl.mjs
// Reconstruct data/markets/<DATE>/all.jsonl for past dates from gamma-api closed
// events. all.jsonl is gitignored, so machines that didn't run the original live
// poll can't re-derive gate1-pass.jsonl + summary.json + snapshot.md via the
// analyzer. This script bridges that gap by producing a polledMarketSchema-shaped
// all.jsonl from the closed-events repoll, after which `npm run analyze --date X`
// can run normally and produce the standard artifacts.
//
// Caveats:
//   - Uses closed=true filter, so it only catches markets that have ALREADY closed.
//     For past dates this is the full universe (markets close eventually). For
//     today/future, prefer the live closed=false poll (poll-closed.mjs runs that).
//   - polled_at is set to the original live-poll polled_at_min if a summary.json
//     for that date exists, else the current time. This affects nothing in Gate 1
//     or classifyMarket, only the snapshot's "polled_at min/max" cosmetic line.
//   - outcomePrices reflects the final settlement (0/1) rather than the live
//     mid-market price at original-poll time. Doesn't affect bucket classification.
//
// Usage:
//   node scripts/regen-all-jsonl.mjs 2026-05-08 2026-05-09 ...
//   node scripts/regen-all-jsonl.mjs 2026-05-08 --polled-at 2026-05-08T09:30:00Z

import fs from 'node:fs';
import path from 'node:path';

const PAGE_SIZE = 100;
const MAX_OFFSET = 50000;
const POLITENESS_MS = 50;
const SCHEMA_VERSION = '1.0.0';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(start, end, offset) {
  const url = new URL('https://gamma-api.polymarket.com/events');
  url.searchParams.set('closed', 'true');
  url.searchParams.set('end_date_min', start.toISOString());
  url.searchParams.set('end_date_max', end.toISOString());
  url.searchParams.set('order', 'endDate');
  url.searchParams.set('ascending', 'true');
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));
  const res = await fetch(url, { headers: { 'user-agent': 'gym-pm-bench/regen-all-jsonl', accept: 'application/json' } });
  if (!res.ok) throw new Error(`gamma-api ${res.status} at offset ${offset}`);
  return await res.json();
}

function parseMaybeJSON(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return null; }
  }
  return null;
}

function toNumberOrNull(v) {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBoolOrFalse(v) { return v === true || v === 'true'; }

function toIsoOrNull(v) {
  if (!v) return null;
  try { return new Date(v).toISOString(); } catch { return null; }
}

function normalizeMarket(ev, m, polledAt) {
  const outcomes = parseMaybeJSON(m.outcomes) ?? [];
  const outcomePricesRaw = parseMaybeJSON(m.outcomePrices);
  const outcomePrices = outcomePricesRaw
    ? outcomePricesRaw.map(p => {
        const n = toNumberOrNull(p);
        return n == null ? 0 : n;
      })
    : null;
  const tagSlugs = Array.isArray(ev.tags) ? ev.tags.map(t => t?.slug).filter(Boolean) : null;

  return {
    schema_version: SCHEMA_VERSION,
    polled_at: polledAt,

    id: String(m.id ?? ''),
    conditionId: m.conditionId ?? null,
    question: String(m.question ?? ''),
    slug: String(m.slug ?? ''),
    description: m.description ?? ev.description ?? null,

    endDate: toIsoOrNull(m.endDate ?? ev.endDate) ?? polledAt,
    startDate: toIsoOrNull(m.startDate),
    closed: toBoolOrFalse(m.closed),
    active: toBoolOrFalse(m.active),
    archived: toBoolOrFalse(m.archived),

    outcomes: outcomes.map(s => String(s)),
    outcomePrices,

    volumeNum: toNumberOrNull(m.volumeNum ?? m.volume),
    liquidityNum: toNumberOrNull(m.liquidityNum ?? m.liquidity),

    createdAt: toIsoOrNull(m.createdAt),
    updatedAt: toIsoOrNull(m.updatedAt),

    umaResolutionStatuses: parseMaybeJSON(m.umaResolutionStatuses) ?? null,
    marketType: m.marketType ?? null,

    eventId: ev.id != null ? String(ev.id) : null,
    eventTitle: ev.title ?? null,
    eventEndDate: toIsoOrNull(ev.endDate),
    eventResolutionSource: ev.resolutionSource ?? null,

    tags: tagSlugs && tagSlugs.length ? tagSlugs : null,
  };
}

async function regenDate(date, polledAtOverride) {
  // Prefer the original live-poll's polled_at_min so snapshot.md's cosmetic
  // "polled_at min/max" line matches what was on the original snapshot.md.
  let polledAt = polledAtOverride ?? null;
  if (!polledAt) {
    const sumPath = path.resolve('data/markets', date, 'summary.json');
    if (fs.existsSync(sumPath)) {
      try { polledAt = JSON.parse(fs.readFileSync(sumPath, 'utf-8')).polled_at_min; } catch {}
    }
  }
  if (!polledAt) polledAt = new Date().toISOString();

  const start = new Date(polledAt);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  console.log(`\n=== ${date} ===`);
  console.log(`window: ${start.toISOString()} → ${end.toISOString()}`);

  const rows = [];
  let offset = 0;
  let pages = 0;
  while (offset <= MAX_OFFSET) {
    const batch = await fetchPage(start, end, offset);
    pages++;
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const ev of batch) {
      const markets = Array.isArray(ev.markets) ? ev.markets : [];
      for (const m of markets) {
        if (!m || typeof m !== 'object') continue;
        rows.push(normalizeMarket(ev, m, polledAt));
      }
    }
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
    await sleep(POLITENESS_MS);
  }

  const outDir = path.resolve('data/markets', date);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'all.jsonl');
  fs.writeFileSync(outPath, rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
  console.log(`fetched ${pages} pages, ${rows.length} markets → ${outPath}`);
}

const argv = process.argv.slice(2);
let polledAtOverride = null;
const dates = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--polled-at') { polledAtOverride = argv[++i]; }
  else if (/^\d{4}-\d{2}-\d{2}$/.test(argv[i])) dates.push(argv[i]);
  else { console.error(`unknown arg: ${argv[i]}`); process.exit(2); }
}
if (dates.length === 0) {
  console.error('usage: node scripts/regen-all-jsonl.mjs <DATE> [<DATE>...] [--polled-at ISO]');
  process.exit(2);
}

for (const d of dates) {
  await regenDate(d, polledAtOverride);
}
console.log('\nNext step:');
for (const d of dates) console.log(`  npm run analyze -- --date ${d}`);
console.log('  node scripts/build-data-json.mjs --start <START> --end <END>');
