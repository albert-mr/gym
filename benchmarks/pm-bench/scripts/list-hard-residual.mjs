#!/usr/bin/env node
// list-hard-residual.mjs
// Re-poll gamma-api for the closed markets in the live-poll window of a given DATE,
// apply Gate 1 + classifyMarket, emit data/markets/<DATE>/hard-residual.jsonl
// with markets that fall into the `hard` bucket. Print a cluster summary by host.
//
// Why: gate1-pass.jsonl is gitignored; we don't have all.jsonl post-poll, so we
// reconstruct the universe by re-polling. closed=true is used because 05-12 markets
// have resolved by 05-13.
//
// Usage:  node scripts/list-hard-residual.mjs [DATE] [POLLED_AT_ISO]
//   DATE: default 2026-05-12
//   POLLED_AT_ISO: default reads from data/markets/<DATE>/summary.json's polled_at_min.
//                  The poll window is [POLLED_AT, POLLED_AT+24h].

import fs from 'node:fs';
import path from 'node:path';
import { classifyMarket } from './cross-day-classify.mjs';

const DATE = process.argv[2] || '2026-05-12';
const SUMMARY_PATH = `data/markets/${DATE}/summary.json`;

let polledAt = process.argv[3];
if (!polledAt) {
  const s = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf-8'));
  polledAt = s.polled_at_min;
}
const start = new Date(polledAt);
const end = new Date(start.getTime() + 24 * 3600 * 1000);
console.log(`window: ${start.toISOString()} → ${end.toISOString()}`);

const PAGE_SIZE = 100;
const MAX_OFFSET = 50000;
const POLITENESS_MS = 50;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(offset) {
  const url = new URL('https://gamma-api.polymarket.com/events');
  url.searchParams.set('closed', 'true');
  url.searchParams.set('end_date_min', start.toISOString());
  url.searchParams.set('end_date_max', end.toISOString());
  url.searchParams.set('order', 'endDate');
  url.searchParams.set('ascending', 'true');
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));
  const res = await fetch(url, { headers: { 'user-agent': 'gym-pm-bench/list-hard-residual', accept: 'application/json' } });
  if (!res.ok) throw new Error(`gamma-api ${res.status} at offset ${offset}: ${await res.text().catch(() => '')}`);
  return await res.json();
}

const allMarkets = [];
let offset = 0;
let pages = 0;
while (offset <= MAX_OFFSET) {
  const batch = await fetchPage(offset);
  pages++;
  if (!Array.isArray(batch) || batch.length === 0) break;
  for (const ev of batch) {
    const evResSrc = ev.resolutionSource ?? null;
    const evDesc = ev.description ?? null;
    const evTitle = ev.title ?? null;
    const markets = Array.isArray(ev.markets) ? ev.markets : [];
    for (const m of markets) {
      if (!m || typeof m !== 'object') continue;
      allMarkets.push({
        id: String(m.id ?? ''),
        question: m.question ?? null,
        description: m.description ?? evDesc ?? '',
        eventResolutionSource: m.resolutionSource ?? evResSrc ?? '',
        eventTitle: evTitle,
        endDate: m.endDate ?? ev.endDate ?? null,
      });
    }
  }
  if (batch.length < PAGE_SIZE) break;
  offset += PAGE_SIZE;
  await sleep(POLITENESS_MS);
}
console.log(`fetched ${pages} pages, ${allMarkets.length} markets`);

const CHAINLINK = ['https://data.chain.link/', 'https://reference.chainlink.com/'];
const PYTH = ['https://pythdata.app/', 'https://hermes.pyth.network/'];
const URL_RE = /\bhttps?:\/\/\S+/i;

function gate1Drop(m) {
  const s = (m.eventResolutionSource || '').trim();
  if (CHAINLINK.some(p => s.startsWith(p))) return 'chainlink';
  if (PYTH.some(p => s.startsWith(p))) return 'pyth';
  if (!s && !URL_RE.test(m.description || '')) return 'no_url';
  return null;
}

const counts = { gate1_chainlink: 0, gate1_pyth: 0, gate1_no_url: 0 };
const byBucket = {};
const residual = [];

for (const m of allMarkets) {
  const drop = gate1Drop(m);
  if (drop) {
    counts['gate1_' + drop]++;
    continue;
  }
  const { bucket, rebindHost } = classifyMarket(m);
  byBucket[bucket] = (byBucket[bucket] || 0) + 1;
  if (bucket === 'hard') {
    residual.push({
      id: m.id,
      question: m.question,
      host: rebindHost,
      eventTitle: m.eventTitle,
      endDate: m.endDate,
      eventResolutionSource: m.eventResolutionSource,
    });
  }
}

console.log('\ngate1 drops:', counts);
console.log('post-gate1 bucket distribution:');
for (const [k, v] of Object.entries(byBucket).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(28)} ${v}`);
}

const outPath = `data/markets/${DATE}/hard-residual.jsonl`;
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, residual.map(r => JSON.stringify(r)).join('\n') + (residual.length ? '\n' : ''));
console.log(`\nhard bucket: ${residual.length} markets → ${outPath}`);

const byHost = {};
for (const r of residual) byHost[r.host || '(empty)'] = (byHost[r.host || '(empty)'] || 0) + 1;
console.log('\nresidual clusters by host:');
for (const [h, n] of Object.entries(byHost).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${h.padEnd(40)} ${n}`);
}

const byEvent = {};
for (const r of residual) byEvent[r.eventTitle || '(no-title)'] = (byEvent[r.eventTitle || '(no-title)'] || 0) + 1;
const topEvents = Object.entries(byEvent).sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log('\nresidual clusters by event (top 15):');
for (const [t, n] of topEvents) {
  console.log(`  ${String(n).padStart(3)}  ${t}`);
}
