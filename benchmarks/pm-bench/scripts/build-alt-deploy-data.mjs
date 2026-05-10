#!/usr/bin/env node
// Build deploy JSONL for ALT-bucket Studio test (2026-05-09).
// Source picks: /tmp/alt_studio_picks.jsonl (16 picks, ALT-bucket football markets with finished games)
// Output: data/markets/2026-05-09/alt-deploy.jsonl

import fs from 'fs';
import path from 'path';

const ROOT = '/Users/albert/conductor/workspaces/gym/beijing/benchmarks/pm-bench';
const PICKS = '/tmp/alt_studio_picks.jsonl';
const GATE1 = path.join(ROOT, 'data/markets/2026-05-09/gate1-pass.jsonl');
const OUT = path.join(ROOT, 'data/markets/2026-05-09/alt-deploy.jsonl');

// Drop Flashscore (game still in progress, expected outcome wrong) and
// repoint Fox Sports picks to SofaScore livescore (Fox Sports league hub doesn't render today's matches).
function rewriteAltUrl(pick) {
  if (pick.alt_source === 'Flashscore') return null; // drop
  if (pick.alt_source === 'Fox Sports') {
    return { ...pick, alt_url: 'https://www.sofascore.com/football/livescore/', alt_source: 'SofaScore (livescore)' };
  }
  return pick;
}

function flatten(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function extractRules(description) {
  if (!description) return [];
  const splits = description.split(/(?=will resolve|resolution source|will be considered|primary resolution|if the |otherwise|in the event)/i);
  return splits.map(s => s.trim()).filter(s => s.length > 20 && s.length < 800).slice(0, 8);
}

function buildCtorArgs(market, deepUrl) {
  const endIso = market.endDate || market.eventEndDate || '2026-05-09T00:00:00Z';
  const earliest = endIso.slice(0, 10);
  const rules = extractRules(market.description).map(flatten);
  const idStr = `m_${market.id}`;
  return [
    idStr,
    flatten(market.question),
    flatten(market.description),
    market.outcomes || ['Yes', 'No'],
    rules.length > 0 ? rules : [flatten(market.description)],
    [], // data_source_domains
    [deepUrl],
    earliest,
  ];
}

// Build market_id → market object lookup
const allMarkets = new Map();
for (const line of fs.readFileSync(GATE1, 'utf-8').trim().split('\n')) {
  try {
    const m = JSON.parse(line);
    allMarkets.set(String(m.id), m);
  } catch {}
}
console.log(`Loaded ${allMarkets.size} gate1 markets`);

// Process picks
const picks = fs.readFileSync(PICKS, 'utf-8').trim().split('\n').map(l => JSON.parse(l));
const out = [];
const stats = { kept: 0, dropped: 0, by_source: {} };

for (const pick of picks) {
  const rewritten = rewriteAltUrl(pick);
  if (!rewritten) { stats.dropped++; continue; }
  const market = allMarkets.get(String(pick.market_id));
  if (!market) {
    console.warn(`  SKIP: market_id ${pick.market_id} not in gate1-pass`);
    stats.dropped++;
    continue;
  }
  const row = {
    market_id: String(market.id),
    binding_domain: pick.binding_domain,
    alt_source: rewritten.alt_source,
    question: market.question,
    deep_url: rewritten.alt_url,
    expected_outcome: pick.expected_outcome,
    evidence: pick.evidence,
    ctor_args: buildCtorArgs(market, rewritten.alt_url),
  };
  out.push(row);
  stats.kept++;
  stats.by_source[rewritten.alt_source] = (stats.by_source[rewritten.alt_source] || 0) + 1;
}

fs.writeFileSync(OUT, out.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log(`Wrote ${stats.kept} rows to ${OUT}`);
console.log(`Dropped ${stats.dropped} (Flashscore game still in progress; missing market lookups)`);
console.log(`By alt_source:`);
Object.entries(stats.by_source).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${String(v).padStart(2)} ${k}`));
