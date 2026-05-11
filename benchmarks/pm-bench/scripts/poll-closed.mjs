#!/usr/bin/env node
// poll-closed.mjs
// Re-poll Polymarket gamma-api for already-closed markets in a date range,
// extract per-market resolution outcome from final outcomePrices, write closed.jsonl per day.
//
// Usage:
//   node scripts/poll-closed.mjs                    # defaults to 2026-05-06 .. 2026-05-10
//   node scripts/poll-closed.mjs 2026-05-06 2026-05-10
//
// Output: data/markets/<date>/closed.jsonl  (one market per line)
//   {id, eventSlug, question, outcomes, outcomePrices, winner, endDate, closedTime}
//   winner = outcomes[i] where outcomePrices[i] === 1, else 'pending'

import fs from 'node:fs';
import path from 'node:path';

const PAGE_SIZE = 100;
const POLITENESS_MS = 50;
const MAX_OFFSET = 50000;

function isoDay(d) { return d.toISOString().slice(0, 10); }
function addDay(d, n) { const out = new Date(d); out.setUTCDate(out.getUTCDate() + n); return out; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseDate(s) {
  const m = /^\d{4}-\d{2}-\d{2}$/.exec(s);
  if (!m) throw new Error(`bad date: ${s}`);
  return new Date(`${s}T00:00:00Z`);
}

function winnerFromPrices(outcomes, prices) {
  if (!Array.isArray(outcomes) || !Array.isArray(prices)) return null;
  if (outcomes.length !== prices.length) return null;
  const nums = prices.map(p => {
    if (typeof p === 'number') return p;
    if (typeof p === 'string') {
      const n = Number(p);
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  });
  if (nums.some(n => !Number.isFinite(n))) return null;
  // Resolved: exactly one element is ~1.0, others ~0.0
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  if (max >= 0.999 && min <= 0.001) {
    const i = nums.indexOf(max);
    return outcomes[i];
  }
  return null; // still trading or no clean resolution
}

function flattenEvent(ev) {
  const rows = [];
  const eventSlug = ev?.slug ?? null;
  const eventTitle = ev?.title ?? null;
  const markets = Array.isArray(ev?.markets) ? ev.markets : [];
  for (const m of markets) {
    if (!m || typeof m !== 'object') continue;
    let outcomes = m.outcomes;
    let prices = m.outcomePrices;
    // gamma-api returns these as stringified arrays sometimes
    if (typeof outcomes === 'string') { try { outcomes = JSON.parse(outcomes); } catch { outcomes = []; } }
    if (typeof prices === 'string') { try { prices = JSON.parse(prices); } catch { prices = []; } }
    const winner = winnerFromPrices(outcomes, prices);
    rows.push({
      id: String(m.id ?? ''),
      eventSlug,
      eventTitle,
      question: m.question ?? null,
      outcomes: outcomes ?? null,
      outcomePrices: prices ?? null,
      winner: winner ?? 'pending',
      endDate: m.endDate ?? ev.endDate ?? null,
      closedTime: m.closedTime ?? null,
      umaResolutionStatuses: m.umaResolutionStatuses ?? null,
    });
  }
  return rows;
}

async function fetchPage(endDateMin, endDateMax, offset) {
  const url = new URL('https://gamma-api.polymarket.com/events');
  url.searchParams.set('closed', 'true');
  url.searchParams.set('end_date_min', endDateMin.toISOString());
  url.searchParams.set('end_date_max', endDateMax.toISOString());
  url.searchParams.set('order', 'endDate');
  url.searchParams.set('ascending', 'true');
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));
  const res = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!res.ok) throw new Error(`gamma-api ${res.status} at offset ${offset}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function pollDay(date) {
  const start = parseDate(date);
  const end = addDay(start, 1);
  let offset = 0;
  const rows = [];
  let pages = 0;
  while (offset <= MAX_OFFSET) {
    const batch = await fetchPage(start, end, offset);
    pages++;
    if (batch.length === 0) break;
    for (const ev of batch) rows.push(...flattenEvent(ev));
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
    await sleep(POLITENESS_MS);
  }
  return { pages, rows };
}

async function pollRange(startDate, endDate) {
  let offset = 0;
  const rows = [];
  let pages = 0;
  while (offset <= MAX_OFFSET) {
    const batch = await fetchPage(startDate, endDate, offset);
    pages++;
    if (batch.length === 0) break;
    for (const ev of batch) rows.push(...flattenEvent(ev));
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
    await sleep(POLITENESS_MS);
  }
  return { pages, rows };
}

async function main() {
  const args = process.argv.slice(2);
  // Default: query per-day windows for May 5 .. May 13.
  // Per-day pagination avoids the global offset cap on Polymarket's closed=true universe
  // (~20k events per day; cumulative across 9 days well over the single-window cap).
  let start = '2026-05-05';
  let end = '2026-05-13';
  if (args.length === 2) { start = args[0]; end = args[1]; }
  else if (args.length === 1) { start = args[0]; end = args[0]; }

  const days = [];
  let d = parseDate(start);
  const last = parseDate(end);
  while (d.getTime() <= last.getTime()) { days.push(isoDay(d)); d = addDay(d, 1); }
  console.log(`Polling closed events per-day for ${days.length} days: ${days[0]} .. ${days[days.length-1]}`);

  const allRows = [];
  for (const day of days) {
    const startDate = parseDate(day);
    const endDate = addDay(startDate, 1);
    const t0 = Date.now();
    const { pages, rows } = await pollRange(startDate, endDate);
    const resolved = rows.filter(r => r.winner !== 'pending').length;
    console.log(`  ${day}: ${pages} pages, ${rows.length} markets (${resolved} resolved, ${rows.length - resolved} pending), ${Date.now() - t0}ms`);
    const outDir = path.resolve('data/markets', day);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'closed.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''), 'utf8');
    allRows.push(...rows);
  }

  // Global index for fast id→winner lookup by the report builder
  // (dedupes if a market shows up in multiple day buckets due to endDate boundary)
  const dedup = new Map();
  for (const r of allRows) {
    if (r.id && !dedup.has(r.id)) dedup.set(r.id, r);
  }
  const indexDir = path.resolve('data/markets');
  fs.mkdirSync(indexDir, { recursive: true });
  const indexRows = [...dedup.values()];
  fs.writeFileSync(path.join(indexDir, 'closed-index.jsonl'), indexRows.map(r => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  console.log(`Total: ${allRows.length} raw rows -> ${indexRows.length} unique markets in closed-index.jsonl`);
}

main().catch(err => { console.error('poll-closed failed:', err); process.exit(1); });
