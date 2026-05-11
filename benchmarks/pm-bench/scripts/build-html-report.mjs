#!/usr/bin/env node
// build-html-report.mjs
// Generates a self-contained HTML briefing of pm-bench routability for a date range.
// Reads:
//   data/markets/<date>/gate1-pass.jsonl  (per day, addressable universe)
//   data/markets/closed-index.jsonl       (global resolution outcomes, from poll-closed.mjs)
// Writes:
//   data/report/pm-bench-<start>-<end>-report.html  (single self-contained file)
//
// Usage:
//   node scripts/build-html-report.mjs               # defaults to 2026-05-06 .. 2026-05-10
//   node scripts/build-html-report.mjs --start 2026-05-06 --end 2026-05-10

import fs from 'node:fs';
import path from 'node:path';
import { classifyMarket, SOLVED_BUCKETS } from './cross-day-classify.mjs';
import { deriveHierarchy, deriveTemplate } from './lib/hierarchy.mjs';

const BUCKET_LABELS = {
  render: 'Render',
  alt: 'Alt (Studio-verified reroute)',
  api: 'API (JSON)',
  liquipedia_recover: 'Liquipedia recover (HLTV)',
  bo3_recover: 'bo3.gg recover (per-map kills)',
  frmf_via_flashscore: 'Flashscore reroute',
  eurovision_via_wiki: 'Wikipedia reroute',
  studio_blocked: 'Studio-blocked',
  hltv_lost: 'HLTV-lost',
  yahoo: 'Yahoo/WSJ (paywall)',
  hard: 'Hard (no recovery)',
  subjective: 'Subjective',
  no_source: 'No source',
  misc: 'Misc residual',
};
const BUCKET_COLOR = {
  render: '#86efac',
  alt: '#a7f3d0',
  api: '#bbf7d0',
  liquipedia_recover: '#d9f99d',
  bo3_recover: '#fef08a',
  frmf_via_flashscore: '#bef264',
  eurovision_via_wiki: '#a3e635',
  studio_blocked: '#fca5a5',
  hltv_lost: '#fca5a5',
  yahoo: '#fdba74',
  hard: '#f87171',
  subjective: '#c4b5fd',
  no_source: '#cbd5e1',
  misc: '#cbd5e1',
};

function parseArgs(argv) {
  const out = { start: '2026-05-06', end: '2026-05-10' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--start') out.start = argv[++i];
    else if (argv[i] === '--end') out.end = argv[++i];
  }
  return out;
}

function isoDay(d) { return d.toISOString().slice(0, 10); }
function addDay(d, n) { const out = new Date(d); out.setUTCDate(out.getUTCDate() + n); return out; }
function parseDate(s) { return new Date(`${s}T00:00:00Z`); }
function hostOf(url) {
  try { return new URL(url).hostname; } catch { return null; }
}

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
  // Prefer a market that is resolved (winner != 'pending'), then highest volume,
  // then any.
  const withScore = markets.map(m => {
    const cl = closedIdx.get(String(m.id));
    const winner = cl ? cl.winner : 'pending';
    const vol = Number(m.volumeNum ?? 0) || 0;
    return { m, winner, vol };
  });
  withScore.sort((a, b) => {
    const aR = a.winner !== 'pending' ? 1 : 0;
    const bR = b.winner !== 'pending' ? 1 : 0;
    if (aR !== bR) return bR - aR;
    return b.vol - a.vol;
  });
  return withScore[0];
}

function groupBy(arr, keyFn) {
  const map = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(x);
  }
  return map;
}

function dominantBucket(buckets) {
  let best = null, bestN = -1;
  for (const [b, n] of Object.entries(buckets)) {
    if (n > bestN) { best = b; bestN = n; }
  }
  return best;
}

function build() {
  const { start, end } = parseArgs(process.argv.slice(2));
  const days = [];
  for (let d = parseDate(start); d.getTime() <= parseDate(end).getTime(); d = addDay(d, 1)) {
    days.push(isoDay(d));
  }
  console.log(`Building report for ${days.length} days: ${days[0]} .. ${days[days.length-1]}`);

  const closedIdx = loadClosedIndex();
  console.log(`Closed index has ${closedIdx.size} markets`);

  // Per-market enriched rows
  const allRows = [];
  const perDay = {};
  for (const date of days) {
    const file = path.resolve('data/markets', date, 'gate1-pass.jsonl');
    if (!fs.existsSync(file)) { console.warn(`missing ${file}`); continue; }
    const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
    const counts = {};
    let resolved = 0;
    for (const line of lines) {
      let m;
      try { m = JSON.parse(line); } catch { continue; }
      const { bucket, rebindHost } = classifyMarket(m);
      const h = deriveHierarchy(m);
      const tpl = deriveTemplate(m.question, m.outcomes, m.eventTitle);
      const cl = closedIdx.get(String(m.id));
      const winner = cl ? cl.winner : 'pending';
      // closed-index carries the event-level slug (gate1-pass only has the per-market slug)
      const eventSlug = cl?.eventSlug || '';
      counts[bucket] = (counts[bucket] || 0) + 1;
      if (winner !== 'pending') resolved++;
      allRows.push({
        id: String(m.id),
        date,
        L1: h.L1, L2: h.L2, L3: h.L3,
        template: tpl,
        question: m.question ?? '',
        eventTitle: m.eventTitle ?? '',
        eventSlug,
        eRS: m.eventResolutionSource ?? '',
        eRSHost: hostOf(m.eventResolutionSource ?? '') ?? '',
        rebindHost: rebindHost ?? '',
        bucket,
        winner,
        outcomes: m.outcomes ?? [],
        volumeNum: Number(m.volumeNum ?? 0) || 0,
      });
    }
    const solved = Object.entries(counts).filter(([b]) => SOLVED_BUCKETS.has(b))
                                          .reduce((s, [,n]) => s + n, 0);
    perDay[date] = {
      gate1Pass: lines.length,
      solved,
      solvedPct: lines.length ? (100 * solved / lines.length) : 0,
      resolved,
      buckets: counts,
    };
  }

  // Build template groups
  const groups = groupBy(allRows, r => `${r.L1}|${r.L2}|${r.L3}|${r.template}`);
  const templates = [];
  let tplCounter = 0;
  for (const [key, rows] of groups.entries()) {
    const [L1, L2, L3, template] = key.split('|');
    const buckets = {};
    const eRSHosts = {};
    const datesSeen = new Set();
    for (const r of rows) {
      buckets[r.bucket] = (buckets[r.bucket] || 0) + 1;
      if (r.eRSHost) eRSHosts[r.eRSHost] = (eRSHosts[r.eRSHost] || 0) + 1;
      datesSeen.add(r.date);
    }
    const ex = pickExample(rows, closedIdx);
    const dom = dominantBucket(buckets);
    const topHosts = Object.entries(eRSHosts).sort((a,b) => b[1]-a[1]).slice(0,3).map(([h])=>h);
    templates.push({
      id: `tpl-${tplCounter++}`,
      L1, L2, L3, template,
      count: rows.length,
      buckets,
      dominantBucket: dom,
      eRSHosts: topHosts,
      rebindHost: ex.m.rebindHost ?? '',
      dates: [...datesSeen].sort(),
      example: {
        id: ex.m.id,
        date: ex.m.date,
        question: ex.m.question,
        eventTitle: ex.m.eventTitle,
        eventSlug: ex.m.eventSlug,
        eRS: ex.m.eRS,
        eRSHost: ex.m.eRSHost,
        rebindHost: ex.m.rebindHost,
        bucket: ex.m.bucket,
        winner: ex.winner,
        outcomes: ex.m.outcomes,
      },
    });
  }
  templates.sort((a, b) => b.count - a.count);

  // Per-domain table
  const domainMap = new Map();
  for (const r of allRows) {
    const h = r.eRSHost || '(none)';
    if (!domainMap.has(h)) domainMap.set(h, { host: h, count: 0, buckets: {}, rebind: r.rebindHost || '' });
    const d = domainMap.get(h);
    d.count++;
    d.buckets[r.bucket] = (d.buckets[r.bucket] || 0) + 1;
    if (!d.rebind && r.rebindHost) d.rebind = r.rebindHost;
  }
  const domains = [...domainMap.values()].sort((a, b) => b.count - a.count);
  for (const d of domains) d.dominantBucket = dominantBucket(d.buckets);

  // Unsolvable list (HARD + SUBJECTIVE + YAHOO + STUDIO_BLOCKED)
  const unsolvedBuckets = new Set(['hard','subjective','yahoo','studio_blocked','hltv_lost','misc','no_source']);
  const unsolvables = allRows.filter(r => unsolvedBuckets.has(r.bucket)).map(r => ({
    id: r.id, date: r.date, question: r.question, bucket: r.bucket,
    eRS: r.eRS, eRSHost: r.eRSHost, slug: r.eventSlug, winner: r.winner,
  }));

  // Headline aggregate
  let totalPass = 0, totalSolved = 0;
  for (const d of Object.values(perDay)) { totalPass += d.gate1Pass; totalSolved += d.solved; }
  const headlinePct = totalPass ? (100 * totalSolved / totalPass) : 0;

  const data = {
    meta: {
      dates: days,
      generatedAt: new Date().toISOString(),
      totalPass,
      totalSolved,
      headlinePct,
    },
    perDay,
    templates,
    domains,
    unsolvables,
    bucketLabels: BUCKET_LABELS,
    bucketColors: BUCKET_COLOR,
    // Compact per-market index for the "show all N" expand. Key: tplId
    marketsByTemplate: (() => {
      const out = {};
      for (const tpl of templates) {
        out[tpl.id] = [];
      }
      // re-walk allRows and key by L1|L2|L3|template, then map to tplId via groups
      // (computing in two passes to keep template ordering stable)
      const keyToId = new Map(templates.map(t => [`${t.L1}|${t.L2}|${t.L3}|${t.template}`, t.id]));
      for (const r of allRows) {
        const key = `${r.L1}|${r.L2}|${r.L3}|${r.template}`;
        const tplId = keyToId.get(key);
        if (!tplId) continue;
        out[tplId].push({
          id: r.id, date: r.date, question: r.question,
          eRSHost: r.eRSHost, rebindHost: r.rebindHost, bucket: r.bucket,
          winner: r.winner, slug: r.eventSlug,
        });
      }
      return out;
    })(),
  };

  const html = renderHTML(data, start, end);
  const outDir = path.resolve('data/report');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `pm-bench-${start}-to-${end}-report.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(`Wrote ${outPath} (${sizeMB} MB)`);
  console.log(`Templates: ${templates.length}, Markets: ${allRows.length}, Unsolvables: ${unsolvables.length}`);
  console.log(`Headline: ${headlinePct.toFixed(1)}% solvable across ${totalPass} markets`);
}

// ============================================================================
// HTML rendering
// ============================================================================
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}

function renderHTML(data, start, end) {
  const dataJson = JSON.stringify(data);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>pm-bench routability briefing — ${esc(start)} to ${esc(end)}</title>
<style>${CSS}</style>
</head>
<body>
<header>
  <h1>pm-bench: GenLayer intelligent oracle routability briefing</h1>
  <p class="subtitle">Window: <strong>${esc(start)}</strong> → <strong>${esc(end)}</strong> · ${data.meta.dates.length} days · ${data.meta.totalPass.toLocaleString()} addressable markets · Generated ${esc(data.meta.generatedAt)}</p>
  <nav>
    <a href="#overview">Overview</a>
    <a href="#methodology">Methodology</a>
    <a href="#numbers">5-day numbers</a>
    <a href="#drilldown">Drill-down</a>
    <a href="#domains">Per-domain</a>
    <a href="#unsolvables">Unsolvables</a>
    <a href="#limitations">Limitations</a>
    <a href="#nextsteps">Next steps</a>
  </nav>
</header>

<main>
${renderOverview(data)}
${renderMethodology()}
${renderNumbers(data)}
${renderDrilldown(data)}
${renderDomains(data)}
${renderUnsolvables(data)}
${renderLimitations()}
${renderNextSteps()}
</main>

<script id="data" type="application/json">${dataJson.replace(/</g,'\\u003c')}</script>
<script>${JS}</script>
</body>
</html>`;
}

function renderOverview(data) {
  const dates = data.meta.dates;
  return `<section id="overview"><h2>Executive summary</h2>
<div class="card big">
  <div class="big-pct">${data.meta.headlinePct.toFixed(1)}%</div>
  <div>of Polymarket's UMA-resolved 24h-horizon market universe is routable to a known canonical source family across the <strong>${dates.length}-day window</strong>.</div>
</div>
<p>"Routable" means the classifier maps the market to a source we know how to fetch end-to-end (binding URL, alternate source, JSON API, or recovery path via Liquipedia/bo3.gg/Flashscore/Wikipedia).
This benchmark measures <em>routability</em>, not <em>accuracy</em> — for each market we know the canonical place to look, but we haven't yet validated that an LLM oracle, when fed that source, would return the correct outcome.</p>
<p>Polymarket uses three oracles for resolution: <strong>UMA Optimistic Oracle</strong> (~98% of markets, human-in-the-loop — GenLayer's domain), <strong>Chainlink Data Feeds</strong> (deterministic on-chain), and <strong>Pyth Network</strong> (deterministic on-chain). The percentage above measures only the UMA universe; Chainlink + Pyth markets are filtered at Gate 1 because they're already served by deterministic on-chain oracles where GenLayer plays no role.</p>
</section>`;
}

function renderMethodology() {
  return `<section id="methodology"><h2>Methodology</h2>
<h3>Universe</h3>
<p>24-hour horizon only: markets with <code>endDate</code> in the next 24 hours from the daily poll moment. We do not benchmark long-tail markets (election forecasts ending in November, "X happens by EOY", etc.) because we have no operational rights to substitute their resolution yet. We measure step-by-step, day-by-day.</p>

<h3>Gate funnel</h3>
<pre class="funnel">Polled markets (gamma-api.polymarket.com/events?closed=false)
  ↓ Gate 1a — drop Chainlink (data.chain.link, reference.chainlink.com)
  ↓ Gate 1c — drop Pyth (pythdata.app, hermes.pyth.network)
  ↓ Gate 1b — drop markets with no URL in eventResolutionSource or description
gate1-pass — the addressable universe
  ↓ Bucket classifier (per-domain heuristic; stand-in for the LLM source-adequacy rubric)
solvable estimate</pre>

<h3>Bucket taxonomy</h3>
<ul>
<li><strong>render</strong>: direct fetch of the binding URL via <code>gl.nondet.web.render(mode=text, wait=10s)</code></li>
<li><strong>alt</strong>: binding host isn't fetchable directly; route to a Studio-verified alternate (LaLiga → ESPN esp.1, Bundesliga → ESPN ger.1, etc.)</li>
<li><strong>api</strong>: JSON endpoint via <code>gl.nondet.web.get</code> (Binance, dotabuff)</li>
<li><strong>liquipedia_recover</strong>: HLTV markets (Cloudflare-walled) recovered via Liquipedia</li>
<li><strong>bo3_recover</strong>: per-map total-kills markets recovered via bo3.gg</li>
<li><strong>frmf_via_flashscore</strong>: Moroccan football recovered via Flashscore Botola page</li>
<li><strong>eurovision_via_wiki</strong>: Eurovision markets routed to Wikipedia (eurovision.tv is Cloudflare-walled)</li>
<li><strong>subjective</strong>: requires consensus of credible reporting with no canonical source (Trump tie color, etc.)</li>
<li><strong>hard</strong>: paywall / login wall / captcha with no recovery path (x.com, Yahoo Finance, sooplive)</li>
</ul>

<h3>Studio caveat</h3>
<p>GenLayer Studio is a centralized testbed, not a real testnet. Studio dry-runs verify that a contract+source combination produces a deterministic outcome under our prompt, but they do not prove production credibility — that requires deployment on a real network. The Studio-verification work covered in this benchmark is a sanity check, not a credibility claim.</p>
</section>`;
}

function renderNumbers(data) {
  const dates = data.meta.dates;
  const rows = dates.map(d => {
    const p = data.perDay[d] ?? {};
    return `<tr>
      <td>${esc(d)}</td>
      <td>${(p.gate1Pass ?? 0).toLocaleString()}</td>
      <td>${(p.solved ?? 0).toLocaleString()}</td>
      <td><strong>${(p.solvedPct ?? 0).toFixed(1)}%</strong></td>
      <td>${(p.resolved ?? 0).toLocaleString()}</td>
      <td>${(p.buckets?.subjective ?? 0)}</td>
      <td>${(p.buckets?.hard ?? 0)}</td>
      <td>${(p.buckets?.yahoo ?? 0)}</td>
      <td>${(p.buckets?.misc ?? 0)}</td>
    </tr>`;
  }).join('');
  return `<section id="numbers"><h2>Per-day routability</h2>
<table class="data">
<thead><tr>
<th>Date</th><th>Addressable</th><th>Solved</th><th>Solved %</th><th>Resolved (PM)</th>
<th>Subjective</th><th>Hard</th><th>Yahoo/WSJ</th><th>Misc</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>
<p class="footnote">"Resolved (PM)": Polymarket has resolved the market and the winner is known (via outcomePrices going to 1/0). The remaining markets are still in the UMA challenge window or pending an event outcome. "Solved %" is the classifier's routability estimate — orthogonal to whether the market is resolved yet.</p>
</section>`;
}

function renderDrilldown(data) {
  // Build L1 > L2 > L3 structure for the SSR baseline; client-side JS will rebuild
  // with filters applied.
  return `<section id="drilldown"><h2>Drill-down browser</h2>
<p>Tree by category → sport/asset → region/period → template. Each template row collapses many markets into the question pattern + an example. Click a template to see the example details; click "show all N markets" to enumerate.</p>
<div class="filters">
  <label>Date: <select id="f-date"><option value="">all</option>${data.meta.dates.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('')}</select></label>
  <label>Bucket: <select id="f-bucket"><option value="">all</option>${Object.entries(data.bucketLabels).map(([b, l]) => `<option value="${esc(b)}">${esc(l)}</option>`).join('')}</select></label>
  <label>Solved only: <input type="checkbox" id="f-solvedonly"/></label>
  <label>Search: <input type="text" id="f-search" placeholder="question/template/host"/></label>
  <button id="f-reset">Reset</button>
</div>
<div id="tree" class="tree">Loading...</div>
</section>`;
}

function renderDomains(data) {
  const rows = data.domains.map(d => `<tr>
    <td><code>${esc(d.host)}</code></td>
    <td>${d.count.toLocaleString()}</td>
    <td><span class="badge" style="background:${data.bucketColors[d.dominantBucket] ?? '#e2e8f0'}">${esc(data.bucketLabels[d.dominantBucket] ?? d.dominantBucket)}</span></td>
    <td><code>${esc(d.rebind && d.rebind !== d.host ? d.rebind : '(direct)')}</code></td>
  </tr>`).join('');
  return `<section id="domains"><h2>Per-domain routing</h2>
<p>Every host seen in <code>eventResolutionSource</code> across the window, with its dominant classifier bucket and rebind target. ${data.domains.length} hosts total.</p>
<table class="data">
<thead><tr><th>Host</th><th>Markets</th><th>Bucket</th><th>Rebind / fetch target</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</section>`;
}

function renderUnsolvables(data) {
  // Group by bucket then show counts + sample
  const grouped = new Map();
  for (const u of data.unsolvables) {
    if (!grouped.has(u.bucket)) grouped.set(u.bucket, []);
    grouped.get(u.bucket).push(u);
  }
  const sections = [...grouped.entries()].map(([bucket, items]) => {
    const sample = items.slice(0, 8);
    return `<h3><span class="badge" style="background:${data.bucketColors[bucket] ?? '#e2e8f0'}">${esc(data.bucketLabels[bucket] ?? bucket)}</span> · ${items.length.toLocaleString()} markets</h3>
<table class="data">
<thead><tr><th>Date</th><th>Question</th><th>Host</th><th>Winner</th><th>Verify</th></tr></thead>
<tbody>${sample.map(u => `<tr>
  <td>${esc(u.date)}</td>
  <td>${esc(u.question)}</td>
  <td><code>${esc(u.eRSHost || '-')}</code></td>
  <td>${esc(u.winner)}</td>
  <td>${u.slug ? `<a href="https://polymarket.com/event/${esc(u.slug)}" target="_blank" rel="noopener">link</a>` : '-'}</td>
</tr>`).join('')}</tbody></table>`;
  }).join('');
  return `<section id="unsolvables"><h2>Unsolvables (current limitations)</h2>
<p>Markets the classifier currently considers unsolvable. Reason per bucket; first 8 sampled per group.</p>
${sections}
</section>`;
}

function renderLimitations() {
  return `<section id="limitations"><h2>Known limitations</h2>
<ul>
<li><strong>Studio centralization</strong>: GenLayer Studio is a centralized testbed. Studio dry-runs only validate determinism+source under our exact prompt — they don't prove production credibility (that requires a real network). The Studio-verification work is a sanity check, not a benchmark proof.</li>
<li><strong>Gate 2 LLM rubric stubbed</strong>: in the production-target pipeline, Gate 2 is an LLM source-adequacy rubric applied per market. Currently approximated by the per-domain bucket classifier (which is what generates this report). Cost vs determinism trade-off documented in BENCHMARK-METHODOLOGY.md.</li>
<li><strong>Gate 3 IP probe stubbed</strong>: production should verify each binding URL is accessible from validator-equivalent infrastructure (SofaScore returns 403 to Studio's web.render IPs, etc.). Today we discover this case-by-case via Studio failures.</li>
<li><strong>No accuracy backtest</strong>: we measure <em>routability</em> (can we find the source?), not <em>accuracy</em> (does an LLM oracle return the right outcome when fed the source?). Accuracy backtest requires a storage layer for tracking decisions + ground truth, currently in design.</li>
<li><strong>Pending Polymarket resolutions</strong>: a few percent of markets in the window haven't yet flipped to <code>closed=true</code> on gamma-api (still in UMA challenge window). These show <code>winner=pending</code>.</li>
</ul></section>`;
}

function renderNextSteps() {
  return `<section id="nextsteps"><h2>Next steps</h2>
<ol>
<li><strong>Supabase storage migration</strong> (in design): move from JSONL to a normalized Postgres schema (<code>markets</code>, <code>poll_snapshots</code>, <code>decisions</code>, <code>step_runs</code>). The <code>decisions</code> table becomes the unified events log for the resolution pipeline.</li>
<li><strong>14-day stability series</strong>: continue the daily-snapshot cron until we have 14+ consecutive days with no new domain emergence — that gives us confidence intervals on the headline %.</li>
<li><strong>Local-LLM accuracy backtest</strong>: once storage is in place, replay each closed market by fetching its canonical source, running a local LLM with the resolution prompt, and comparing against Polymarket's outcome. This turns the routability number into an accuracy number.</li>
<li><strong>Real testnet deployment</strong>: when GenLayer has a real testnet (not Studio), redeploy the IntelligentOracle contract there and measure end-to-end resolution credibility under validator consensus.</li>
</ol></section>`;
}

const CSS = `
:root {
  --fg: #0f172a; --bg: #f8fafc; --muted: #64748b; --card: #fff;
  --border: #e2e8f0; --accent: #2563eb;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif; }
header { background: #0f172a; color: #f8fafc; padding: 24px 32px; }
header h1 { font-size: 22px; margin: 0 0 4px; }
header .subtitle { color: #94a3b8; font-size: 14px; margin: 0 0 12px; }
header nav { display: flex; flex-wrap: wrap; gap: 16px; }
header nav a { color: #cbd5e1; text-decoration: none; font-size: 13px; }
header nav a:hover { color: #fff; }
main { max-width: 1200px; margin: 0 auto; padding: 24px 32px; }
section { margin-bottom: 40px; background: var(--card); border-radius: 8px; padding: 20px 24px;
  border: 1px solid var(--border); }
h2 { font-size: 18px; margin: 0 0 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
h3 { font-size: 15px; margin: 16px 0 8px; }
p, li { line-height: 1.6; font-size: 14px; }
code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 12.5px;
  font-family: ui-monospace, "SF Mono", Menlo, monospace; }
pre { background: #f1f5f9; padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto;
  font-family: ui-monospace, "SF Mono", Menlo, monospace; }
.footnote { color: var(--muted); font-size: 12px; }
.card.big { background: linear-gradient(135deg, #1e293b, #0f172a); color: #f8fafc;
  padding: 24px; border-radius: 8px; margin: 12px 0; display: flex; gap: 24px; align-items: center; }
.big-pct { font-size: 56px; font-weight: 800; line-height: 1; }

table.data { width: 100%; border-collapse: collapse; font-size: 13px; }
table.data th, table.data td { border-bottom: 1px solid var(--border); padding: 6px 8px; text-align: left; vertical-align: top; }
table.data th { background: #f1f5f9; font-weight: 600; }
table.data tr:hover { background: #f8fafc; }

.badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #0f172a; }

.filters { display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0; align-items: center;
  padding: 12px; background: #f8fafc; border-radius: 6px; }
.filters label { font-size: 12px; color: var(--muted); display: flex; gap: 6px; align-items: center; }
.filters select, .filters input[type="text"] { padding: 4px 6px; border: 1px solid var(--border); border-radius: 4px;
  font-size: 13px; font-family: inherit; }
.filters button { padding: 4px 10px; border: 1px solid var(--border); background: white; border-radius: 4px; cursor: pointer; }

.tree { font-size: 13px; }
.tree .l1 { margin: 8px 0; }
.tree details { margin-left: 0; }
.tree details > summary { cursor: pointer; padding: 4px 0; user-select: none; }
.tree details.l1 > summary { font-weight: 600; font-size: 14px; }
.tree details.l2 > summary { font-weight: 500; }
.tree details.l2 { margin-left: 14px; }
.tree details.l3 { margin-left: 28px; }
.tree .templates { margin-left: 42px; }
.tree .tpl-row { padding: 6px 8px; border-left: 3px solid #cbd5e1; margin: 4px 0;
  background: #f8fafc; border-radius: 0 4px 4px 0; }
.tree .tpl-row.dom-render { border-left-color: #86efac; }
.tree .tpl-row.dom-alt { border-left-color: #a7f3d0; }
.tree .tpl-row.dom-api { border-left-color: #bbf7d0; }
.tree .tpl-row.dom-liquipedia_recover, .tree .tpl-row.dom-bo3_recover { border-left-color: #d9f99d; }
.tree .tpl-row.dom-frmf_via_flashscore, .tree .tpl-row.dom-eurovision_via_wiki { border-left-color: #bef264; }
.tree .tpl-row.dom-hard, .tree .tpl-row.dom-yahoo { border-left-color: #f87171; }
.tree .tpl-row.dom-subjective { border-left-color: #c4b5fd; }
.tree .tpl-row.dom-misc, .tree .tpl-row.dom-no_source { border-left-color: #cbd5e1; }
.tpl-head { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.tpl-tmpl { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 12.5px; flex: 1; min-width: 250px; }
.tpl-count { font-size: 11px; color: var(--muted); }
.tpl-example { margin-top: 6px; padding-left: 8px; border-left: 2px solid var(--border); font-size: 12.5px;
  color: var(--muted); }
.tpl-example strong { color: var(--fg); font-weight: 500; }
.tpl-example a { color: var(--accent); }
.expand-all { margin-top: 4px; font-size: 11px; color: var(--accent); cursor: pointer; user-select: none; }
.all-markets { margin-top: 6px; padding-left: 8px; max-height: 280px; overflow-y: auto; font-size: 12px; }
.all-markets table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.all-markets td { padding: 2px 6px; border-bottom: 1px dotted var(--border); }
.win-Yes { color: #16a34a; font-weight: 600; }
.win-No  { color: #dc2626; font-weight: 600; }
.win-pending { color: var(--muted); font-style: italic; }
.tree .empty { color: var(--muted); font-style: italic; padding: 8px; }
`;

const JS = `
(function() {
  const data = JSON.parse(document.getElementById('data').textContent);
  const treeEl = document.getElementById('tree');
  const $date = document.getElementById('f-date');
  const $bucket = document.getElementById('f-bucket');
  const $solved = document.getElementById('f-solvedonly');
  const $search = document.getElementById('f-search');
  const $reset = document.getElementById('f-reset');
  const SOLVED = new Set(['render','alt','api','liquipedia_recover','bo3_recover','frmf_via_flashscore','eurovision_via_wiki']);

  function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function applyFilters(templates) {
    const dateF = $date.value, bucketF = $bucket.value, solvedF = $solved.checked;
    const q = ($search.value || '').toLowerCase().trim();
    return templates.filter(t => {
      if (dateF && !t.dates.includes(dateF)) return false;
      if (bucketF && t.dominantBucket !== bucketF) return false;
      if (solvedF && !SOLVED.has(t.dominantBucket)) return false;
      if (q) {
        const hay = (t.template + ' ' + (t.example.question||'') + ' ' + (t.example.eRSHost||'') + ' ' + (t.example.rebindHost||'') + ' ' + t.L1 + ' ' + t.L2 + ' ' + t.L3).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function nest(templates) {
    const root = new Map();
    for (const t of templates) {
      if (!root.has(t.L1)) root.set(t.L1, new Map());
      const m1 = root.get(t.L1);
      if (!m1.has(t.L2)) m1.set(t.L2, new Map());
      const m2 = m1.get(t.L2);
      if (!m2.has(t.L3)) m2.set(t.L3, []);
      m2.get(t.L3).push(t);
    }
    return root;
  }

  function render(filtered) {
    if (filtered.length === 0) { treeEl.innerHTML = '<div class="empty">No templates match these filters.</div>'; return; }
    const nested = nest(filtered);
    let html = '';
    // Sort L1 by total market count desc
    const l1Entries = [...nested.entries()].sort((a, b) => sumCount(b[1]) - sumCount(a[1]));
    for (const [L1, m1] of l1Entries) {
      html += '<details class="l1" open><summary>' + esc(L1) + ' <span class="tpl-count">(' + sumCount(m1).toLocaleString() + ' markets)</span></summary>';
      const l2Entries = [...m1.entries()].sort((a, b) => sumCount(b[1]) - sumCount(a[1]));
      for (const [L2, m2] of l2Entries) {
        html += '<details class="l2"><summary>' + esc(L2) + ' <span class="tpl-count">(' + sumCount(m2).toLocaleString() + ')</span></summary>';
        const l3Entries = [...m2.entries()].sort((a, b) => sumTpls(b[1]) - sumTpls(a[1]));
        for (const [L3, tpls] of l3Entries) {
          html += '<details class="l3"><summary>' + esc(L3) + ' <span class="tpl-count">(' + sumTpls(tpls).toLocaleString() + ' / ' + tpls.length + ' templates)</span></summary>';
          html += '<div class="templates">';
          for (const t of tpls) html += renderTpl(t);
          html += '</div></details>';
        }
        html += '</details>';
      }
      html += '</details>';
    }
    treeEl.innerHTML = html;
    // Hook up expand-all clicks
    for (const el of treeEl.querySelectorAll('.expand-all')) {
      el.addEventListener('click', () => {
        const tplId = el.dataset.tpl;
        const container = el.nextElementSibling;
        if (container.classList.contains('all-markets')) {
          container.style.display = (container.style.display === 'none' ? '' : 'none');
          el.textContent = container.style.display === 'none' ? ('show all ' + el.dataset.count + ' markets') : 'hide all';
        } else {
          const markets = data.marketsByTemplate[tplId] || [];
          const div = document.createElement('div');
          div.className = 'all-markets';
          div.innerHTML = '<table><tbody>' + markets.map(m =>
            '<tr><td>' + esc(m.date) + '</td><td>' + esc(m.question) + '</td><td><code>' + esc(m.eRSHost) + '</code></td><td class="win-' + esc(m.winner === 'Yes' || m.winner === 'Up' || m.winner === 'Over' ? 'Yes' : m.winner === 'pending' ? 'pending' : 'No') + '">' + esc(m.winner) + '</td><td>' + (m.slug ? '<a href="https://polymarket.com/event/' + esc(m.slug) + '" target="_blank">link</a>' : '') + '</td></tr>'
          ).join('') + '</tbody></table>';
          el.parentElement.appendChild(div);
          el.textContent = 'hide all';
        }
      });
    }
  }

  function sumCount(map) {
    let n = 0;
    for (const v of map.values()) {
      if (v instanceof Map) n += sumCount(v);
      else if (Array.isArray(v)) n += sumTpls(v);
    }
    return n;
  }
  function sumTpls(tpls) { return tpls.reduce((s, t) => s + t.count, 0); }

  function renderTpl(t) {
    const ex = t.example;
    const winnerCls = (ex.winner === 'Yes' || ex.winner === 'Up' || ex.winner === 'Over') ? 'Yes' : (ex.winner === 'pending' ? 'pending' : 'No');
    return '<div class="tpl-row dom-' + esc(t.dominantBucket) + '">' +
      '<div class="tpl-head">' +
        '<span class="tpl-tmpl">' + esc(t.template) + '</span>' +
        '<span class="badge" style="background:' + esc(data.bucketColors[t.dominantBucket] || '#e2e8f0') + '">' + esc(data.bucketLabels[t.dominantBucket] || t.dominantBucket) + '</span>' +
        '<span class="tpl-count">' + t.count.toLocaleString() + ' markets · ' + t.dates.length + ' days · hosts: ' + t.eRSHosts.slice(0,2).map(esc).join(', ') + (t.eRSHosts.length>2 ? ' +' + (t.eRSHosts.length-2) : '') + '</span>' +
      '</div>' +
      '<div class="tpl-example">' +
        'Example [' + esc(ex.date) + ']: <strong>' + esc(ex.question) + '</strong>' +
        ' · eRS <code>' + esc(ex.eRS) + '</code>' +
        (ex.rebindHost && ex.rebindHost !== ex.eRSHost ? ' → fetch <code>' + esc(ex.rebindHost) + '</code>' : '') +
        ' · winner <span class="win-' + winnerCls + '">' + esc(ex.winner) + '</span>' +
        (ex.eventSlug ? ' · <a href="https://polymarket.com/event/' + esc(ex.eventSlug) + '" target="_blank" rel="noopener">Verify on Polymarket</a>' : '') +
      '</div>' +
      '<div class="expand-all" data-tpl="' + esc(t.id) + '" data-count="' + t.count + '">show all ' + t.count + ' markets</div>' +
    '</div>';
  }

  function refresh() { render(applyFilters(data.templates)); }

  [$date, $bucket].forEach(el => el.addEventListener('change', refresh));
  $solved.addEventListener('change', refresh);
  let searchTimer = null;
  $search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(refresh, 200);
  });
  $reset.addEventListener('click', () => {
    $date.value = ''; $bucket.value = ''; $solved.checked = false; $search.value = '';
    refresh();
  });

  refresh();
})();
`;

build();
