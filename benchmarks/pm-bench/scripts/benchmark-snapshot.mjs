#!/usr/bin/env node
// benchmark-snapshot.mjs
// Run daily after `poll` + `analyze` complete. Records bucket counts + solve % into
// data/benchmark-daily/snapshots.jsonl (append-only series for cross-day stability tracking).
//
// Usage:  node scripts/benchmark-snapshot.mjs <date>
//   e.g.: node scripts/benchmark-snapshot.mjs 2026-05-10
//
// Output row schema:
//   {
//     "date": "2026-05-10",
//     "horizon_hours": 24 | 720,
//     "universe": <gate1-pass count>,
//     "buckets": { render: ..., alt: ..., api: ..., ... },
//     "solved": <count>,
//     "solve_pct": <0-100>,
//     "new_domains": [...]   // domains in misc-residual not seen before
//   }

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = '/Users/albert/conductor/workspaces/gym/beijing/benchmarks/pm-bench';
const OUT_DIR = path.join(ROOT, 'data/benchmark-daily');
const SNAP_FILE = path.join(OUT_DIR, 'snapshots.jsonl');
const DOMAINS_SEEN_FILE = path.join(OUT_DIR, 'domains-seen.json');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const date = process.argv[2];
if (!date) {
  console.error('usage: node scripts/benchmark-snapshot.mjs <YYYY-MM-DD> [horizon_hours=24]');
  process.exit(1);
}
const horizon_hours = parseInt(process.argv[3] || '24', 10);

const dataPath = horizon_hours >= 168
  ? `data/markets-30d/${date}/gate1-pass.jsonl`
  : `data/markets/${date}/gate1-pass.jsonl`;

if (!fs.existsSync(path.join(ROOT, dataPath))) {
  console.error(`gate1-pass not found at ${dataPath} — run poll + analyze first`);
  process.exit(1);
}

// Run classifier (parses cross-day-classify.mjs output)
const classifierOut = execSync(
  `node scripts/cross-day-classify.mjs ${horizon_hours >= 168 ? `${date}-30d` : date}`,
  { cwd: ROOT, encoding: 'utf-8' }
);

// Parse the classifier output (text-table format)
const buckets = {};
let universe = 0, solved = 0;
for (const line of classifierOut.split('\n')) {
  // Match "[OK]/[--]/Subjective/etc.  bucketName  count (pct%)"
  const m = line.match(/^\s*(?:\[(?:OK|--)\]\s+)?([A-Za-z][\w +→\-(.)/]+?)\s{2,}\d+\s*\(\s*[\d.]+%\)/);
  if (m) {
    const name = m[1].trim();
    const cm = line.match(/(\d+)\s*\(\s*([\d.]+)%\)/);
    if (cm) buckets[name] = parseInt(cm[1], 10);
  }
  const t = line.match(/TOTAL SOLVED\s+(\d+)\s+\(\s*([\d.]+)%\)/);
  if (t) solved = parseInt(t[1], 10);
  const u = line.match(/gate1-pass total\s+(\d+)/);
  if (u) universe = parseInt(u[1], 10);
}
const solve_pct = universe > 0 ? Number((100 * solved / universe).toFixed(2)) : 0;

// Track domain emergence: extract all binding hostnames from the day's misc-residual
const STREAMING = new Set(['www.twitch.tv','kick.com','www.kick.com','www.youtube.com','www.sooplive.com','play-origin.sooplive.com']);
function realBinding(m) {
  const url = m.eventResolutionSource || '';
  let host = null;
  if (url) try { host = new URL(url).hostname; } catch {}
  if (host && STREAMING.has(host)) {
    const desc = m.description || '';
    const sl = desc.match(/official information from\s+(https?:\/\/[\w./?=&%#:-]+)/i);
    if (sl) try { return new URL(sl[1]).hostname.replace(/[.,;:)\]]+$/, ''); } catch {}
  }
  if (host) return host;
  const desc = m.description || '';
  const paren = desc.match(/\((https?:\/\/[\w./?=&%#:-]+)\)/);
  if (paren) try { return new URL(paren[1]).hostname; } catch {}
  return null;
}

const lines = fs.readFileSync(path.join(ROOT, dataPath), 'utf-8').trim().split('\n');
const allHostsToday = new Set();
for (const l of lines) {
  try {
    const m = JSON.parse(l);
    const h = realBinding(m);
    if (h) allHostsToday.add(h);
  } catch {}
}

// Compare with prior days
let priorDomains = new Set();
if (fs.existsSync(DOMAINS_SEEN_FILE)) {
  priorDomains = new Set(JSON.parse(fs.readFileSync(DOMAINS_SEEN_FILE, 'utf-8')));
}
const newDomains = [...allHostsToday].filter(h => !priorDomains.has(h)).sort();
// Update domains-seen
const updated = new Set([...priorDomains, ...allHostsToday]);
fs.writeFileSync(DOMAINS_SEEN_FILE, JSON.stringify([...updated].sort(), null, 2));

const row = {
  date,
  horizon_hours,
  universe,
  solved,
  solve_pct,
  buckets,
  new_domains_count: newDomains.length,
  new_domains: newDomains.slice(0, 50),  // cap for readability
  total_distinct_domains: allHostsToday.size,
  recorded_at: new Date().toISOString(),
};

fs.appendFileSync(SNAP_FILE, JSON.stringify(row) + '\n');
console.log(JSON.stringify(row, null, 2));
console.log(`\nAppended snapshot to ${SNAP_FILE}`);
console.log(`Domains-seen lifetime total: ${updated.size}`);
