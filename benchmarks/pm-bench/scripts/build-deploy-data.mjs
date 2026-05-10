#!/usr/bin/env node
// Build per-market deploy data for the binding-render bucket.
// Output: data/markets/2026-05-07/binding-render-deep-urls.jsonl
//
// One row per market with: market_id, deep_url, ctor_args (constructor args
// for IntelligentOracle in the order the constructor expects them).

import fs from 'fs';
import path from 'path';

const ROOT = '/Users/albert/conductor/workspaces/gym/beijing/benchmarks/pm-bench';
const SRC = path.join(ROOT, 'data/markets/2026-05-07/gate1-pass.jsonl');
const OUT = path.join(ROOT, 'data/markets/2026-05-07/binding-render-deep-urls.jsonl');

// Per-domain deep URL assignments — established by yesterday's strict-grading.
// Wunderground & weather.gov differ by station; UEFA differs by fixture.
const STATIC_URL = {
  // Single-URL-per-domain (one URL serves all markets in domain)
  'apps.apple.com': 'https://apps.apple.com/us/charts/iphone',
  'www.weather.gov.hk': 'https://www.weather.gov.hk/en/cis/dailyExtract.htm?y=2026&m=5',
  'www.cdc.gov': 'https://www.cdc.gov/fluview/surveillance/2026-week-17.html',
  'www.nhl.com': 'https://www.nhl.com/gamecenter/car-vs-phi/2026/05/07/2025030223',
  'www.euroleaguebasketball.net': 'https://www.euroleaguebasketball.net/euroleague/game-center/2025-26/hapoel-ibi-tel-aviv-real-madrid/E2025/398/',
};

// UEFA fixture URLs — matched by which teams the question mentions
const UEFA_URLS = {
  'crystal palace': 'https://www.uefa.com/uefaconferenceleague/news/02a5-209210ca6927-41ba4164b0be-1000--crystal-palace-2-1-shakhtar-donetsk-agg-5-2-highlights-i/',
  'shakhtar': 'https://www.uefa.com/uefaconferenceleague/news/02a5-209210ca6927-41ba4164b0be-1000--crystal-palace-2-1-shakhtar-donetsk-agg-5-2-highlights-i/',
  'strasbourg': 'https://www.uefa.com/uefaconferenceleague/news/02a5-20921b385c29-3aad830cbbda-1000--strasbourg-0-1-rayo-vallecano-agg-0-2-highlights-rayo-vall/',
  'rayo': 'https://www.uefa.com/uefaconferenceleague/news/02a5-20921b385c29-3aad830cbbda-1000--strasbourg-0-1-rayo-vallecano-agg-0-2-highlights-rayo-vall/',
};

// Wunderground city → station URL
const WUNDERGROUND_URLS = {
  london: 'https://www.wunderground.com/history/daily/gb/london/EGLC/date/2026-5-7',
  paris: 'https://www.wunderground.com/history/daily/fr/bonneuil-en-france/LFPB/date/2026-5-7',
};

// weather.gov city → station URL
const WEATHER_GOV_URLS = {
  'tel aviv': 'https://www.weather.gov/wrh/timeseries?site=LLBG',
  moscow: 'https://www.weather.gov/wrh/timeseries?site=UUWW',
};

// All binding-render-bucket domains we care about
const RENDER_DOMAINS = new Set([
  'www.wunderground.com', 'www.uefa.com', 'apps.apple.com',
  'www.weather.gov.hk', 'www.weather.gov', 'www.cdc.gov',
  'www.nhl.com', 'www.euroleaguebasketball.net',
]);

// The 63 markets we explicitly strict-graded yesterday — only deploy these
// so the LLM-resolve outcome can be compared 1:1 with our deterministic grade.
const VALIDATED_IDS = new Set([
  // Wunderground London EGLC (8)
  '2161570', '2161580', '2161542', '2161551',
  '2161603', '2161534', '2161561', '2161590',
  // Wunderground Paris LFPB (2)
  '2161670', '2161671',
  // UEFA Crystal Palace (3)
  '2062283', '2062284', '2062285',
  // UEFA Strasbourg (7)
  '2062286', '2062287', '2062288',
  '2065556', '2065557', '2065558', '2065559',
  // Apple iPhone Free Charts (10)
  '2167450', '2167451', '2167452', '2167453', '2167454',
  '2167455', '2167456', '2167457', '2167458', '2167459',
  // HK Observatory (10)
  '2161781', '2161780', '2161771', '2161772', '2161773',
  '2161774', '2161775', '2161776', '2161777', '2161778',
  // weather.gov Tel Aviv (7)
  '2161986', '2161987', '2161988', '2161989',
  '2161990', '2161991', '2161992',
  // weather.gov Moscow (3)
  '2162195', '2162196', '2162197',
  // CDC FluView Week 17 (6)
  '2126784', '2126785', '2126786', '2126787', '2126788', '2126789',
  // NHL Hurricanes-Flyers (6)
  '2148546', '2161337', '2148547', '2148548', '2148550', '2148551',
  // Euroleague Hapoel-Real Madrid (1)
  '2174971',
]);

function bindingDomain(market) {
  const url = market.eventResolutionSource || '';
  if (url) {
    try { return new URL(url).hostname; } catch {}
  }
  // Fall back to first parenthesized URL in description, then any URL
  const desc = market.description || '';
  const paren = desc.match(/\((https?:\/\/[\w./?=&%#:-]+)\)/);
  if (paren) {
    try { return new URL(paren[1]).hostname; } catch {}
  }
  const m = desc.match(/https?:\/\/([\w.-]+)/);
  return m ? m[1] : null;
}

function deepUrlFor(market) {
  const host = bindingDomain(market);
  if (!host || !RENDER_DOMAINS.has(host)) return null;
  if (STATIC_URL[host]) return STATIC_URL[host];
  const q = (market.question || '').toLowerCase();
  if (host === 'www.uefa.com') {
    for (const [team, url] of Object.entries(UEFA_URLS)) {
      if (q.includes(team)) return url;
    }
    return null;
  }
  if (host === 'www.wunderground.com') {
    for (const [city, url] of Object.entries(WUNDERGROUND_URLS)) {
      if (q.includes(city)) return url;
    }
    return null;
  }
  if (host === 'www.weather.gov') {
    for (const [city, url] of Object.entries(WEATHER_GOV_URLS)) {
      if (q.includes(city)) return url;
    }
    return null;
  }
  return null;
}

// Split market description into rule-shaped sentences (split on "will resolve", etc.)
function extractRules(description) {
  if (!description) return [];
  // Boundary phrases that start new rule clauses
  const splits = description.split(/(?=will resolve|resolution source|will be considered|primary resolution|if the |otherwise|in the event)/i);
  return splits
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 800)
    .slice(0, 8); // cap at 8 rules max
}

// Collapse all whitespace (incl. newlines) to single spaces — genlayer CLI argv
// can choke on embedded newlines in long string args.
function flatten(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function buildCtorArgs(market, deepUrl) {
  const endIso = market.endDate || market.eventEndDate || '2026-05-07T00:00:00Z';
  const earliest = endIso.slice(0, 10); // YYYY-MM-DD
  const rules = extractRules(market.description).map(flatten);
  // genlayer-cli quirk: digit-only --args tokens get auto-coerced to int.
  // Prefix the market_id so it parses as str in the constructor.
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

// === main ===
const lines = fs.readFileSync(SRC, 'utf-8').trim().split('\n');
const out = [];
const stats = { total: 0, byDomain: {}, skipped: 0 };

for (const line of lines) {
  let m;
  try { m = JSON.parse(line); } catch { continue; }
  if (!VALIDATED_IDS.has(String(m.id))) continue;
  const host = bindingDomain(m);
  if (!host || !RENDER_DOMAINS.has(host)) continue;
  const deepUrl = deepUrlFor(m);
  if (!deepUrl) {
    stats.skipped++;
    continue;
  }
  const row = {
    market_id: String(m.id),
    binding_domain: host,
    question: m.question,
    deep_url: deepUrl,
    ctor_args: buildCtorArgs(m, deepUrl),
  };
  out.push(row);
  stats.total++;
  stats.byDomain[host] = (stats.byDomain[host] || 0) + 1;
}

fs.writeFileSync(OUT, out.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log('Wrote', stats.total, 'rows to', OUT);
console.log('By domain:');
Object.entries(stats.byDomain).sort((a,b)=>b[1]-a[1]).forEach(([h,n]) =>
  console.log('  ', String(n).padStart(4), h));
console.log('Skipped (no deep URL match):', stats.skipped);
