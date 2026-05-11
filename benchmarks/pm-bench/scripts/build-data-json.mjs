#!/usr/bin/env node
// build-data-json.mjs
// Generate the BenchmarkData JSON consumed by apps/web (the Next.js dashboard).
// Same data shape as build-html-report.mjs builds internally, written as JSON.
//
// Usage:
//   node scripts/build-data-json.mjs                       # 2026-05-06 .. 2026-05-10
//   node scripts/build-data-json.mjs --start 2026-05-06 --end 2026-05-10
//   node scripts/build-data-json.mjs --out-dir ../../data/pm-bench

import fs from 'node:fs';
import path from 'node:path';
import { classifyMarket, SOLVED_BUCKETS } from './cross-day-classify.mjs';
import { deriveHierarchy, deriveTemplate } from './lib/hierarchy.mjs';

// Reader-friendly labels. Internal bucket keys stay stable (render/alt/api/...)
// for classifier compatibility; these labels are what shows in the UI.
const BUCKET_LABELS = {
  render: 'Direct source',
  alt: 'Alternative source',
  api: 'Direct source (JSON API)',
  liquipedia_recover: 'Alternate: Liquipedia',
  bo3_recover: 'Alternate: bo3.gg',
  frmf_via_flashscore: 'Alternate: Flashscore',
  eurovision_via_wiki: 'Alternate: Wikipedia',
  studio_blocked: 'Blocked by validator infrastructure',
  hltv_lost: 'No alternate available',
  yahoo: 'Paywalled',
  hard: 'No alternate available',
  subjective: 'Consensus-only (no canonical source)',
  no_source: 'No source URL',
  misc: 'Unclassified',
};
const BUCKET_COLORS = {
  render: '#16a34a',
  alt: '#10b981',
  api: '#059669',
  liquipedia_recover: '#65a30d',
  bo3_recover: '#ca8a04',
  frmf_via_flashscore: '#84cc16',
  eurovision_via_wiki: '#4d7c0f',
  studio_blocked: '#dc2626',
  hltv_lost: '#dc2626',
  yahoo: '#ea580c',
  hard: '#dc2626',
  subjective: '#7c3aed',
  no_source: '#64748b',
  misc: '#64748b',
};

const DIRECT_BUCKETS = new Set(['render', 'api']);
const ALT_BUCKETS = new Set(['alt', 'liquipedia_recover', 'bo3_recover', 'frmf_via_flashscore', 'eurovision_via_wiki']);

function parseArgs(argv) {
  const out = { start: '2026-05-06', end: '2026-05-10', outDir: '../../data/pm-bench' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--start') out.start = argv[++i];
    else if (argv[i] === '--end') out.end = argv[++i];
    else if (argv[i] === '--out-dir') out.outDir = argv[++i];
  }
  return out;
}
const isoDay = (d) => d.toISOString().slice(0, 10);
const addDay = (d, n) => { const o = new Date(d); o.setUTCDate(o.getUTCDate() + n); return o; };
const parseDate = (s) => new Date(`${s}T00:00:00Z`);
const hostOf = (url) => { try { return new URL(url).hostname; } catch { return null; } };
const isDeepUrl = (url) => {
  try {
    const p = new URL(url).pathname || '/';
    const segs = p.split('/').filter(Boolean);
    return segs.length >= 2 || (segs.length === 1 && /\d/.test(segs[0]));
  } catch { return false; }
};

function loadClosedIndex() {
  const p = path.resolve('data/markets/closed-index.jsonl');
  if (!fs.existsSync(p)) {
    console.error(`Missing ${p}. Run 'node scripts/poll-closed.mjs' first.`);
    process.exit(1);
  }
  const idx = new Map();
  for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
    if (!line) continue;
    try { const d = JSON.parse(line); idx.set(String(d.id), d); } catch {}
  }
  return idx;
}

function pickExample(markets, closedIdx) {
  const scored = markets.map(m => {
    const cl = closedIdx.get(String(m.id));
    return { m, winner: cl ? cl.winner : 'pending', vol: Number(m.volumeNum ?? 0) || 0 };
  });
  scored.sort((a, b) => {
    const aR = a.winner !== 'pending' ? 1 : 0;
    const bR = b.winner !== 'pending' ? 1 : 0;
    if (aR !== bR) return bR - aR;
    return b.vol - a.vol;
  });
  return scored[0];
}

function dominantBucket(buckets) {
  let best = null, bestN = -1;
  for (const [b, n] of Object.entries(buckets)) {
    if (n > bestN) { best = b; bestN = n; }
  }
  return best;
}

function build() {
  const { start, end, outDir } = parseArgs(process.argv.slice(2));
  const days = [];
  for (let d = parseDate(start); d.getTime() <= parseDate(end).getTime(); d = addDay(d, 1)) days.push(isoDay(d));

  const closedIdx = loadClosedIndex();
  console.log(`Closed index: ${closedIdx.size} markets | window ${start}..${end} (${days.length} days)`);

  // Per-day rows (one row per market per day it appeared in poll). Used for the
  // per-day activity table — cross-day dupes are valid here (a market in the
  // 24h window appears in poll N and poll N-1).
  const allDayRows = [];
  const perDay = {};
  for (const date of days) {
    const file = path.resolve('data/markets', date, 'gate1-pass.jsonl');
    if (!fs.existsSync(file)) { console.warn(`missing ${file}`); continue; }
    const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
    const counts = {};
    let resolved = 0;
    for (const line of lines) {
      let m; try { m = JSON.parse(line); } catch { continue; }
      const { bucket, rebindHost } = classifyMarket(m);
      const h = deriveHierarchy(m);
      const tpl = deriveTemplate(m.question, m.outcomes, m.eventTitle);
      const cl = closedIdx.get(String(m.id));
      const winner = cl ? cl.winner : 'pending';
      const eventSlug = cl?.eventSlug || '';
      counts[bucket] = (counts[bucket] || 0) + 1;
      if (winner !== 'pending') resolved++;
      allDayRows.push({
        id: String(m.id), date,
        L1: h.L1, L2: h.L2, L3: h.L3, template: tpl,
        question: m.question ?? '', eventTitle: m.eventTitle ?? '', eventSlug,
        eRS: m.eventResolutionSource ?? '', eRSHost: hostOf(m.eventResolutionSource ?? '') ?? '',
        rebindHost: rebindHost ?? '', bucket, winner, outcomes: m.outcomes ?? [],
        volumeNum: Number(m.volumeNum ?? 0) || 0,
      });
    }
    const solved = Object.entries(counts).filter(([b]) => SOLVED_BUCKETS.has(b)).reduce((s, [,n]) => s + n, 0);
    let directDeep = 0, directShallow = 0, alt = 0, unsolvable = 0;
    for (const r of allDayRows) {
      if (r.date !== date) continue;
      if (DIRECT_BUCKETS.has(r.bucket)) { if (isDeepUrl(r.eRS)) directDeep++; else directShallow++; }
      else if (ALT_BUCKETS.has(r.bucket)) alt++;
      else unsolvable++;
    }
    perDay[date] = {
      gate1Pass: lines.length, solved,
      solvedPct: lines.length ? (100 * solved / lines.length) : 0,
      resolved, buckets: counts,
      directDeep, directShallow, alt, unsolvable,
    };
  }

  // Dedup by market id for the cumulative totals: a market resolving May 7 noon
  // legitimately appears in both May 6's and May 7's poll (both polls catch
  // markets ending in their next 24h). We count each unique market once.
  const seen = new Set();
  const allRows = [];
  for (const r of allDayRows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    allRows.push(r);
  }
  const dupCount = allDayRows.length - allRows.length;
  if (dupCount > 0) console.log(`Deduped ${dupCount} cross-day duplicate market rows (${allDayRows.length} → ${allRows.length} unique).`);

  // Compute the on-chain-feed exclusion stats (Chainlink + Pyth) across the
  // whole window, deduped by id. This drives the hero footnote and methodology
  // page so they can quote the actual share of Polymarket markets resolved by
  // deterministic on-chain oracles.
  const chainlinkIds = new Set();
  const pythIds = new Set();
  for (const date of days) {
    for (const f of [`data/markets/${date}/gate1-drop-chainlink.jsonl`, `data/markets/${date}/gate1-drop-pyth.jsonl`]) {
      const p = path.resolve(f);
      if (!fs.existsSync(p)) continue;
      for (const line of fs.readFileSync(p, 'utf-8').split('\n').filter(Boolean)) {
        try {
          const m = JSON.parse(line);
          if (f.includes('chainlink')) chainlinkIds.add(String(m.id));
          else pythIds.add(String(m.id));
        } catch {}
      }
    }
  }
  const chainlink = chainlinkIds.size;
  const pyth = pythIds.size;
  const addressable = allRows.length;
  const polledUniverse = chainlink + pyth + addressable;
  const onchainFeedStats = {
    chainlink, pyth,
    chainlinkPlusPyth: chainlink + pyth,
    addressable,
    polledUniverse,
    chainlinkPct: polledUniverse ? (100 * chainlink / polledUniverse) : 0,
    pythPct: polledUniverse ? (100 * pyth / polledUniverse) : 0,
    onchainFeedPct: polledUniverse ? (100 * (chainlink + pyth) / polledUniverse) : 0,
    addressablePct: polledUniverse ? (100 * addressable / polledUniverse) : 0,
  };

  // Templates
  const groups = new Map();
  for (const r of allRows) {
    const k = `${r.L1}|${r.L2}|${r.L3}|${r.template}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const templates = [];
  let tplCounter = 0;
  for (const [key, rows] of groups.entries()) {
    const [L1, L2, L3, template] = key.split('|');
    const buckets = {};
    const eRSHostCounts = {};
    const datesSeen = new Set();
    for (const r of rows) {
      buckets[r.bucket] = (buckets[r.bucket] || 0) + 1;
      if (r.eRSHost) eRSHostCounts[r.eRSHost] = (eRSHostCounts[r.eRSHost] || 0) + 1;
      datesSeen.add(r.date);
    }
    const ex = pickExample(rows, closedIdx);
    const topHosts = Object.entries(eRSHostCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([h])=>h);
    templates.push({
      id: `tpl-${tplCounter++}`,
      L1, L2, L3, template,
      count: rows.length,
      buckets,
      dominantBucket: dominantBucket(buckets),
      eRSHosts: topHosts,
      rebindHost: ex.m.rebindHost ?? '',
      dates: [...datesSeen].sort(),
      example: {
        id: ex.m.id, date: ex.m.date, question: ex.m.question,
        eventTitle: ex.m.eventTitle, eventSlug: ex.m.eventSlug,
        eRS: ex.m.eRS, eRSHost: ex.m.eRSHost, rebindHost: ex.m.rebindHost,
        bucket: ex.m.bucket, winner: ex.winner, outcomes: ex.m.outcomes,
      },
    });
  }
  templates.sort((a, b) => b.count - a.count);

  // Domains — also track L1 categories per host so the sources benchmark page
  // can show "what kind of stuff this source is for" without market counts.
  const domainMap = new Map();
  for (const r of allRows) {
    const h = r.eRSHost || '(none)';
    if (!domainMap.has(h)) domainMap.set(h, { host: h, count: 0, buckets: {}, rebind: r.rebindHost || '', _l1Counts: {} });
    const d = domainMap.get(h);
    d.count++;
    d.buckets[r.bucket] = (d.buckets[r.bucket] || 0) + 1;
    d._l1Counts[r.L1] = (d._l1Counts[r.L1] || 0) + 1;
    if (!d.rebind && r.rebindHost) d.rebind = r.rebindHost;
  }
  const domains = [...domainMap.values()].sort((a,b) => b.count - a.count);
  for (const d of domains) {
    d.dominantBucket = dominantBucket(d.buckets);
    d.category = dominantBucket(d._l1Counts) ?? 'Other'; // L1 with the most markets
    delete d._l1Counts; // internal only
  }

  // Unsolvables
  const unsolvedBuckets = new Set(['hard','subjective','yahoo','studio_blocked','hltv_lost','misc','no_source']);
  const unsolvables = allRows.filter(r => unsolvedBuckets.has(r.bucket)).map(r => ({
    id: r.id, date: r.date, question: r.question, bucket: r.bucket,
    eRS: r.eRS, eRSHost: r.eRSHost, slug: r.eventSlug, winner: r.winner,
  }));

  // Markets-by-template
  const keyToId = new Map(templates.map(t => [`${t.L1}|${t.L2}|${t.L3}|${t.template}`, t.id]));
  const marketsByTemplate = {};
  for (const t of templates) marketsByTemplate[t.id] = [];
  for (const r of allRows) {
    const tplId = keyToId.get(`${r.L1}|${r.L2}|${r.L3}|${r.template}`);
    if (!tplId) continue;
    marketsByTemplate[tplId].push({
      id: r.id, date: r.date, question: r.question,
      eRSHost: r.eRSHost, rebindHost: r.rebindHost,
      bucket: r.bucket, winner: r.winner, slug: r.eventSlug,
    });
  }

  // Headline — computed against the deduped cumulative dataset, not the
  // per-day rows. A market that appeared in 2 days' polls counts once.
  const totalPass = allRows.length;
  const totalSolved = allRows.filter(r => SOLVED_BUCKETS.has(r.bucket)).length;
  const headlinePct = totalPass ? (100 * totalSolved / totalPass) : 0;

  const data = {
    meta: { dates: days, generatedAt: new Date().toISOString(), totalPass, totalSolved, headlinePct, window: { start, end } },
    perDay,
    templates,
    domains,
    unsolvables,
    marketsByTemplate,
    onchainFeedStats,
    bucketLabels: BUCKET_LABELS,
    bucketColors: BUCKET_COLORS,
  };

  // Resolve outDir relative to pm-bench root
  const outAbs = path.resolve(outDir);
  fs.mkdirSync(outAbs, { recursive: true });
  const windowFile = path.join(outAbs, `${start}-to-${end}.json`);
  const latestFile = path.join(outAbs, 'latest.json');
  fs.writeFileSync(windowFile, JSON.stringify(data) + '\n', 'utf8');
  fs.writeFileSync(latestFile, JSON.stringify(data) + '\n', 'utf8');
  const sizeMB = (fs.statSync(windowFile).size / 1024 / 1024).toFixed(2);
  console.log(`Wrote ${windowFile} (${sizeMB} MB)`);
  console.log(`Wrote ${latestFile} (copy)`);
  console.log(`Templates: ${templates.length}, Markets: ${allRows.length}, Unsolvables: ${unsolvables.length}, Headline: ${headlinePct.toFixed(1)}%`);
}

build();
