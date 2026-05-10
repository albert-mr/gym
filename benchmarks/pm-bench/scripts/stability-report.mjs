#!/usr/bin/env node
// stability-report.mjs
// Print cross-day stability of the benchmark from snapshots.jsonl.
// Use after multiple days have been recorded — shows mean, stdev, range per metric,
// plus new-domain emergence rate.
//
// Usage:  node scripts/stability-report.mjs [--horizon 24|720]

import fs from 'fs';
import path from 'path';

const ROOT = '/Users/albert/conductor/workspaces/gym/beijing/benchmarks/pm-bench';
const SNAP_FILE = path.join(ROOT, 'data/benchmark-daily/snapshots.jsonl');

const args = process.argv.slice(2);
const hIdx = args.indexOf('--horizon');
const horizonFilter = hIdx >= 0 ? parseInt(args[hIdx + 1], 10) : null;

if (!fs.existsSync(SNAP_FILE)) {
  console.error('No snapshots yet — run daily-benchmark-run.sh first');
  process.exit(1);
}

let rows = fs.readFileSync(SNAP_FILE, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
if (horizonFilter) rows = rows.filter(r => r.horizon_hours === horizonFilter);
if (rows.length === 0) {
  console.error(`No snapshots match horizon ${horizonFilter}`);
  process.exit(1);
}

function stats(nums) {
  const n = nums.length;
  const mean = nums.reduce((a, b) => a + b, 0) / n;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const stdev = Math.sqrt(variance);
  const sorted = [...nums].sort((a, b) => a - b);
  return { n, mean, stdev, min: sorted[0], max: sorted[n - 1] };
}

console.log(`=== pm-bench stability report ===`);
console.log(`Snapshots: ${rows.length}`);
console.log(`Date range: ${rows[0].date} → ${rows[rows.length - 1].date}`);
console.log(`Horizon filter: ${horizonFilter ? horizonFilter + 'h' : 'all'}`);
console.log();

// Group by horizon
const byHorizon = {};
for (const r of rows) {
  const k = r.horizon_hours;
  (byHorizon[k] = byHorizon[k] || []).push(r);
}

for (const [h, group] of Object.entries(byHorizon).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  console.log(`\n--- ${h}-hour horizon (${group.length} snapshots) ---`);
  const universes = group.map(r => r.universe);
  const solveps = group.map(r => r.solve_pct);
  const newDoms = group.map(r => r.new_domains_count || 0);

  const u = stats(universes);
  const s = stats(solveps);
  const nd = stats(newDoms);

  console.log(`Universe size:      mean=${u.mean.toFixed(0)}  stdev=${u.stdev.toFixed(0)}  range=[${u.min}, ${u.max}]`);
  console.log(`Solve %:            mean=${s.mean.toFixed(2)}%  stdev=${s.stdev.toFixed(2)}pp  range=[${s.min.toFixed(2)}%, ${s.max.toFixed(2)}%]`);
  console.log(`New-domains/day:    mean=${nd.mean.toFixed(1)}  stdev=${nd.stdev.toFixed(1)}  range=[${nd.min}, ${nd.max}]`);

  if (group.length >= 2) {
    const ci95 = 1.96 * s.stdev / Math.sqrt(s.n);
    console.log(`\nHeadline (95% CI): ${s.mean.toFixed(2)}% ± ${ci95.toFixed(2)}pp solvable on ${h}-hour horizon`);
  }

  // Per-bucket trend
  const allBucketKeys = new Set();
  for (const r of group) for (const k of Object.keys(r.buckets || {})) allBucketKeys.add(k);
  console.log('\nPer-bucket mean (rounded) — markets/day:');
  for (const k of [...allBucketKeys].sort()) {
    const ns = group.map(r => r.buckets[k] || 0);
    const st = stats(ns);
    console.log(`  ${k.padEnd(40)}: ${st.mean.toFixed(0).padStart(5)}  (±${st.stdev.toFixed(0)})`);
  }
}

// Lifetime domain emergence
const domainsSeen = path.join(ROOT, 'data/benchmark-daily/domains-seen.json');
if (fs.existsSync(domainsSeen)) {
  const lifetime = JSON.parse(fs.readFileSync(domainsSeen, 'utf-8'));
  console.log(`\n=== Lifetime domain emergence ===`);
  console.log(`Distinct binding domains ever observed: ${lifetime.length}`);
  console.log(`(Stable when new-domains/day → 0 for several consecutive days)`);
}
