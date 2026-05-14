#!/usr/bin/env node
// rebuild-app.mjs
// Read raw.* tables and rebuild app.* tables deterministically.
// Replaces the legacy cross-day-classify + build-data-json pipeline.
//
// Usage:
//   node scripts/rebuild-app.mjs                  # rebuild for all dates with gate_evaluations
//   node scripts/rebuild-app.mjs --start 2026-05-06 --end 2026-05-13

import { sql, close as closeDb } from '../src/lib/db-writers.mjs';
import { classifyMarket, SOLVED_BUCKETS } from './cross-day-classify.mjs';
import { deriveHierarchy, deriveTemplate } from './lib/hierarchy.mjs';

const SLUG = 'pm-bench';

const BUCKET_LABELS = {
  chainlink: 'Chainlink',
  pyth: 'Pyth',
  render: 'Direct source',
  alt: 'Alternative source',
  api: 'Direct source (JSON API)',
  liquipedia_recover: 'Alternate: Liquipedia',
  bo3_recover: 'Alternate: bo3.gg',
  frmf_via_flashscore: 'Alternate: Flashscore',
  eurovision_via_wiki: 'Alternate: Wikipedia',
  cricinfo_via_espn: 'Alternate: ESPN Cricket',
  studio_blocked: 'Blocked by validator infrastructure',
  hltv_lost: 'No alternate available',
  yahoo: 'Paywalled',
  hard: 'No alternate available',
  subjective: 'Consensus-only (no canonical source)',
  no_source: 'No source URL',
  misc: 'Unclassified',
};
const BUCKET_COLORS = {
  chainlink: '#7c3aed', pyth: '#0ea5e9', render: '#16a34a', alt: '#10b981',
  api: '#059669', liquipedia_recover: '#65a30d', bo3_recover: '#ca8a04',
  frmf_via_flashscore: '#84cc16', eurovision_via_wiki: '#4d7c0f', cricinfo_via_espn: '#a3e635',
  studio_blocked: '#dc2626', hltv_lost: '#dc2626', yahoo: '#ea580c', hard: '#dc2626',
  subjective: '#7c3aed', no_source: '#64748b', misc: '#64748b',
};

const DIRECT_BUCKETS = new Set(['render', 'api']);
const ALT_BUCKETS = new Set(['alt', 'liquipedia_recover', 'bo3_recover', 'frmf_via_flashscore', 'eurovision_via_wiki', 'cricinfo_via_espn']);
const UNSOLVED_BUCKETS = new Set(['hard', 'subjective', 'yahoo', 'studio_blocked', 'hltv_lost', 'misc', 'no_source']);

const hostOf = (url) => { try { return new URL(url).hostname; } catch { return null; } };
const isDeepUrl = (url) => {
  try {
    const p = new URL(url).pathname || '/';
    const segs = p.split('/').filter(Boolean);
    return segs.length >= 2 || (segs.length === 1 && /\d/.test(segs[0]));
  } catch { return false; }
};
function statusOf(bucket) {
  if (DIRECT_BUCKETS.has(bucket)) return 'accessible';
  if (ALT_BUCKETS.has(bucket)) return 'alternative';
  return 'blocked';
}
function circleOf(bucket) {
  if (bucket === 'chainlink') return 'chainlink';
  if (bucket === 'pyth') return 'pyth';
  if (DIRECT_BUCKETS.has(bucket)) return 'direct';
  if (ALT_BUCKETS.has(bucket)) return 'alternative';
  return 'held';
}
function dominantBucket(buckets) {
  let best = null, bestN = -1;
  for (const [b, n] of Object.entries(buckets)) {
    if (n > bestN) { best = b; bestN = n; }
  }
  return best;
}
function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function parseArgs(argv) {
  const out = { start: null, end: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--start') out.start = argv[++i];
    else if (argv[i] === '--end') out.end = argv[++i];
  }
  return out;
}

async function loadPassedMarkets({ start, end }) {
  const rows = await sql`
    select distinct on (ge.market_id, ge.evaluated_for)
      ge.evaluated_for::text as date,
      ge.market_id as id,
      m.raw_payload as payload,
      o.winner_outcome as winner
    from raw.gate_evaluations ge
    join raw.markets m on m.id = ge.market_id
    left join raw.market_outcomes o on o.market_id = m.id
    where ge.passed = true
      ${start ? sql`and ge.evaluated_for >= ${start}::date` : sql``}
      ${end ? sql`and ge.evaluated_for <= ${end}::date` : sql``}
    order by ge.market_id, ge.evaluated_for, ge.created_at desc
  `;
  return rows.map((r) => ({ date: r.date, payload: r.payload, winner: r.winner ?? 'pending' }));
}

async function loadOnchain({ start, end }) {
  const rows = await sql`
    select distinct on (ge.market_id, ge.evaluated_for, ge.drop_reason)
      ge.evaluated_for::text as date,
      ge.drop_reason as circle,
      ge.market_id as id,
      m.raw_payload as payload,
      o.winner_outcome as winner
    from raw.gate_evaluations ge
    join raw.markets m on m.id = ge.market_id
    left join raw.market_outcomes o on o.market_id = m.id
    where ge.passed = false and ge.drop_reason in ('chainlink','pyth')
      ${start ? sql`and ge.evaluated_for >= ${start}::date` : sql``}
      ${end ? sql`and ge.evaluated_for <= ${end}::date` : sql``}
    order by ge.market_id, ge.evaluated_for, ge.drop_reason, ge.created_at desc
  `;
  return rows;
}

async function rebuild() {
  const { start, end } = parseArgs(process.argv.slice(2));
  const startedAt = Date.now();

  const passed = await loadPassedMarkets({ start, end });
  console.log(`Loaded ${passed.length} passed market-days from raw.gate_evaluations`);

  const allDayRows = [];
  for (const p of passed) {
    const m = p.payload;
    const { bucket, rebindHost } = classifyMarket(m);
    const h = deriveHierarchy(m);
    const tpl = deriveTemplate(m.question, m.outcomes, m.eventTitle);
    const eRS = m.eventResolutionSource ?? '';
    const eRSHost = hostOf(eRS) ?? '';
    allDayRows.push({
      id: String(m.id),
      date: p.date,
      L1: h.L1, L2: h.L2, L3: h.L3, template: tpl,
      question: m.question ?? '',
      eventTitle: m.eventTitle ?? '',
      eventSlug: m.eventSlug ?? '',
      eRS, eRSHost, rebindHost: rebindHost ?? '',
      bucket, winner: p.winner,
      outcomes: m.outcomes ?? [],
      volumeNum: Number(m.volumeNum ?? 0) || 0,
    });
  }

  // perDay
  const dates = [...new Set(allDayRows.map((r) => r.date))].sort();
  const perDay = {};
  for (const date of dates) {
    const rowsForDay = allDayRows.filter((r) => r.date === date);
    const counts = {};
    let resolved = 0, directDeep = 0, directShallow = 0, alt = 0, unsolvable = 0;
    for (const r of rowsForDay) {
      counts[r.bucket] = (counts[r.bucket] || 0) + 1;
      if (r.winner && r.winner !== 'pending') resolved++;
      if (DIRECT_BUCKETS.has(r.bucket)) { if (isDeepUrl(r.eRS)) directDeep++; else directShallow++; }
      else if (ALT_BUCKETS.has(r.bucket)) alt++;
      else unsolvable++;
    }
    const solved = Object.entries(counts).filter(([b]) => SOLVED_BUCKETS.has(b)).reduce((s, [, n]) => s + n, 0);
    perDay[date] = {
      gate1Pass: rowsForDay.length, solved,
      solvedPct: rowsForDay.length ? (100 * solved / rowsForDay.length) : 0,
      resolved, buckets: counts, directDeep, directShallow, alt, unsolvable,
    };
  }

  // Onchain
  const onchain = await loadOnchain({ start, end });
  const chainlinkIds = new Set();
  const pythIds = new Set();
  const onchainRowsById = new Map();
  const onchainPerDay = Object.fromEntries(dates.map((d) => [d, { chainlink: 0, pyth: 0 }]));
  for (const r of onchain) {
    const id = String(r.id);
    const circle = r.circle;
    const ids = circle === 'chainlink' ? chainlinkIds : pythIds;
    const isNew = !ids.has(id);
    ids.add(id);
    if (isNew && onchainPerDay[r.date]) onchainPerDay[r.date][circle]++;
    if (!onchainRowsById.has(`${circle}:${id}`)) {
      const m = r.payload;
      const h = deriveHierarchy(m);
      const eventSlug = m.eventSlug || '';
      const namedHost = hostOf(m.eventResolutionSource ?? '') ?? (circle === 'chainlink' ? 'data.chain.link' : 'pythdata.app');
      onchainRowsById.set(`${circle}:${id}`, {
        id, date: r.date,
        question: m.question ?? '',
        circle, bucket: circle,
        namedHost, verifiedHost: namedHost,
        L1: h.L1, L2: h.L2, L3: h.L3,
        template: deriveTemplate(m.question, m.outcomes, m.eventTitle),
        winner: r.winner ?? 'pending',
        slug: id, eventSlug, count: 1,
        detailAvailable: false,
        polymarketUrl: eventSlug ? `https://polymarket.com/event/${eventSlug}` : '',
      });
    }
  }
  for (const [date, counts] of Object.entries(onchainPerDay)) {
    if (perDay[date]) {
      perDay[date].chainlink = counts.chainlink;
      perDay[date].pyth = counts.pyth;
    }
  }

  // Dedup by id for cumulative
  const seen = new Set();
  const allRows = [];
  for (const r of allDayRows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    allRows.push(r);
  }

  // Templates
  const groups = new Map();
  for (const r of allRows) {
    const k = `${r.L1}|${r.L2}|${r.L3}|${r.template}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const templates = [];
  let tplCounter = 0;
  for (const [key, rowsT] of groups.entries()) {
    const [L1, L2, L3, template] = key.split('|');
    const buckets = {};
    const eRSHostCounts = {};
    const datesSeen = new Set();
    for (const r of rowsT) {
      buckets[r.bucket] = (buckets[r.bucket] || 0) + 1;
      if (r.eRSHost) eRSHostCounts[r.eRSHost] = (eRSHostCounts[r.eRSHost] || 0) + 1;
      datesSeen.add(r.date);
    }
    const ex = rowsT.slice().sort((a, b) => {
      const aR = a.winner !== 'pending' ? 1 : 0;
      const bR = b.winner !== 'pending' ? 1 : 0;
      if (aR !== bR) return bR - aR;
      return (b.volumeNum || 0) - (a.volumeNum || 0);
    })[0];
    const topHosts = Object.entries(eRSHostCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h]) => h);
    templates.push({
      id: `tpl-${tplCounter++}`,
      L1, L2, L3, template,
      count: rowsT.length,
      buckets,
      dominantBucket: dominantBucket(buckets),
      eRSHosts: topHosts,
      rebindHost: ex.rebindHost ?? '',
      dates: [...datesSeen].sort(),
      example: {
        id: ex.id, date: ex.date, question: ex.question,
        eventTitle: ex.eventTitle, eventSlug: ex.eventSlug,
        eRS: ex.eRS, eRSHost: ex.eRSHost, rebindHost: ex.rebindHost,
        bucket: ex.bucket, winner: ex.winner, outcomes: ex.outcomes,
      },
    });
  }
  templates.sort((a, b) => b.count - a.count);

  // Domains
  const domainMap = new Map();
  for (const r of allRows) {
    const h = r.eRSHost || '(none)';
    if (!domainMap.has(h)) domainMap.set(h, { host: h, count: 0, buckets: {}, rebind: r.rebindHost || '', _l1: {} });
    const d = domainMap.get(h);
    d.count++;
    d.buckets[r.bucket] = (d.buckets[r.bucket] || 0) + 1;
    d._l1[r.L1] = (d._l1[r.L1] || 0) + 1;
    if (!d.rebind && r.rebindHost) d.rebind = r.rebindHost;
  }
  const domains = [...domainMap.values()].sort((a, b) => b.count - a.count).map((d) => ({
    host: d.host, count: d.count, buckets: d.buckets, dominantBucket: dominantBucket(d.buckets),
    rebind: d.rebind, category: dominantBucket(d._l1) ?? 'Other',
  }));

  // Stats
  const totalPass = allRows.length;
  const totalSolved = allRows.filter((r) => SOLVED_BUCKETS.has(r.bucket)).length;
  const headlinePct = totalPass ? (100 * totalSolved / totalPass) : 0;
  const chainlink = chainlinkIds.size;
  const pyth = pythIds.size;
  const polledUniverse = chainlink + pyth + totalPass;

  // === Write to DB ===
  await sql.begin(async (tx) => {
    // benchmark_meta
    await tx`
      insert into app.benchmark_meta (slug, display_name, description, tagline, status, generated_at, window_start, window_end, total_pass, total_solved, headline_pct, resolved_correctly_pct)
      values (
        ${SLUG},
        'Polymarket benchmark',
        'Daily measurement of GenLayer resolution coverage for Polymarket markets closing in the next 24 hours.',
        'where we measure what GenLayer can do',
        'live',
        now(),
        ${dates[0] ?? null}, ${dates[dates.length - 1] ?? null},
        ${totalPass}, ${totalSolved},
        ${headlinePct}, ${headlinePct}
      )
      on conflict (slug) do update set
        generated_at = excluded.generated_at,
        window_start = excluded.window_start,
        window_end = excluded.window_end,
        total_pass = excluded.total_pass,
        total_solved = excluded.total_solved,
        headline_pct = excluded.headline_pct,
        resolved_correctly_pct = excluded.resolved_correctly_pct
    `;

    // bucket_styles
    await tx`delete from app.bucket_styles`;
    const styleRows = Object.entries(BUCKET_LABELS).map(([bucket, label], i) => ({
      bucket, label, color: BUCKET_COLORS[bucket] ?? '#64748b', ordering: i,
    }));
    if (styleRows.length) {
      await tx`insert into app.bucket_styles ${tx(styleRows, 'bucket', 'label', 'color', 'ordering')}`;
    }

    // per_day
    await tx`delete from app.per_day where benchmark_slug = ${SLUG}`;
    const pdRows = Object.entries(perDay).map(([date, pd]) => ({
      benchmark_slug: SLUG, date,
      gate1_pass: pd.gate1Pass, solved: pd.solved, solved_pct: pd.solvedPct,
      resolved: pd.resolved, buckets: pd.buckets,
      chainlink: pd.chainlink ?? null, pyth: pd.pyth ?? null,
      direct_deep: pd.directDeep, direct_shallow: pd.directShallow,
      alt: pd.alt, unsolvable: pd.unsolvable,
    }));
    for (const batch of chunks(pdRows, 500)) {
      await tx`insert into app.per_day ${tx(batch, 'benchmark_slug', 'date', 'gate1_pass', 'solved', 'solved_pct', 'resolved', 'buckets', 'chainlink', 'pyth', 'direct_deep', 'direct_shallow', 'alt', 'unsolvable')}`;
    }

    // templates
    await tx`delete from app.templates where benchmark_slug = ${SLUG}`;
    const tplRows = templates.map((t) => ({
      id: t.id, benchmark_slug: SLUG,
      l1: t.L1, l2: t.L2, l3: t.L3, template: t.template,
      count: t.count, buckets: t.buckets, dominant_bucket: t.dominantBucket,
      e_rs_hosts: t.eRSHosts, rebind_host: t.rebindHost, dates: t.dates, example: t.example,
    }));
    for (const batch of chunks(tplRows, 500)) {
      await tx`insert into app.templates ${tx(batch, 'id', 'benchmark_slug', 'l1', 'l2', 'l3', 'template', 'count', 'buckets', 'dominant_bucket', 'e_rs_hosts', 'rebind_host', 'dates', 'example')}`;
    }

    // domains
    await tx`delete from app.domains where benchmark_slug = ${SLUG}`;
    const domRows = domains.map((d) => ({
      benchmark_slug: SLUG, host: d.host, count: d.count, buckets: d.buckets,
      dominant_bucket: d.dominantBucket, rebind: d.rebind, category: d.category,
    }));
    for (const batch of chunks(domRows, 500)) {
      await tx`insert into app.domains ${tx(batch, 'benchmark_slug', 'host', 'count', 'buckets', 'dominant_bucket', 'rebind', 'category')}`;
    }

    // onchain_feed_stats
    const chainlinkPct = polledUniverse ? (100 * chainlink / polledUniverse) : 0;
    const pythPct = polledUniverse ? (100 * pyth / polledUniverse) : 0;
    const onchainFeedPct = polledUniverse ? (100 * (chainlink + pyth) / polledUniverse) : 0;
    const addressablePct = polledUniverse ? (100 * totalPass / polledUniverse) : 0;
    await tx`
      insert into app.onchain_feed_stats (benchmark_slug, chainlink, pyth, chainlink_plus_pyth, addressable, polled_universe, chainlink_pct, pyth_pct, onchain_feed_pct, addressable_pct)
      values (${SLUG}, ${chainlink}, ${pyth}, ${chainlink + pyth}, ${totalPass}, ${polledUniverse}, ${chainlinkPct}, ${pythPct}, ${onchainFeedPct}, ${addressablePct})
      on conflict (benchmark_slug) do update set
        chainlink = excluded.chainlink, pyth = excluded.pyth,
        chainlink_plus_pyth = excluded.chainlink_plus_pyth, addressable = excluded.addressable,
        polled_universe = excluded.polled_universe, chainlink_pct = excluded.chainlink_pct,
        pyth_pct = excluded.pyth_pct, onchain_feed_pct = excluded.onchain_feed_pct,
        addressable_pct = excluded.addressable_pct
    `;

    // markets
    await tx`delete from app.markets where benchmark_slug = ${SLUG}`;
    const keyToId = new Map(templates.map((t) => [`${t.L1}|${t.L2}|${t.L3}|${t.template}`, t.id]));
    const marketsBySlug = new Map();
    for (const r of allRows) {
      const slug = r.eventSlug || r.id;
      const tplId = keyToId.get(`${r.L1}|${r.L2}|${r.L3}|${r.template}`) ?? null;
      marketsBySlug.set(slug, {
        slug, benchmark_slug: SLUG, market_id: r.id, date: r.date,
        event_slug: r.eventSlug || '', question: r.question,
        bucket: r.bucket, winner: r.winner,
        named_source: r.eRSHost || null, verified_source: statusOf(r.bucket) === 'blocked' ? null : (r.rebindHost || null),
        e_rs_host: r.eRSHost || null, rebind_host: r.rebindHost || null,
        status: statusOf(r.bucket), circle: circleOf(r.bucket),
        l1: r.L1, l2: r.L2, l3: r.L3, template_id: tplId,
        in_explorer: false, in_unsolvables: UNSOLVED_BUCKETS.has(r.bucket),
        count: 1, synthetic: false, detail_available: true,
        polymarket_url: r.eventSlug ? `https://polymarket.com/event/${r.eventSlug}` : null,
      });
    }
    for (const r of onchainRowsById.values()) {
      const slug = r.slug;
      const existing = marketsBySlug.get(slug) ?? {};
      marketsBySlug.set(slug, {
        ...existing,
        slug, benchmark_slug: SLUG, market_id: r.id, date: r.date,
        event_slug: r.eventSlug || '', question: r.question,
        bucket: r.bucket, winner: r.winner,
        named_source: r.namedHost, verified_source: r.verifiedHost,
        l1: r.L1, l2: r.L2, l3: r.L3,
        status: 'blocked', circle: r.circle,
        in_explorer: true, in_unsolvables: false,
        count: r.count ?? 1, synthetic: false, detail_available: !!r.detailAvailable,
        polymarket_url: r.polymarketUrl ?? null,
      });
    }
    const marketRows = [...marketsBySlug.values()].map((m) => ({
      slug: m.slug, benchmark_slug: m.benchmark_slug ?? SLUG,
      market_id: m.market_id ?? null, date: m.date ?? dates[0] ?? '2026-01-01',
      event_slug: m.event_slug ?? '', question: m.question ?? '',
      bucket: m.bucket ?? null, winner: m.winner ?? null,
      named_source: m.named_source ?? null, verified_source: m.verified_source ?? null,
      e_rs_host: m.e_rs_host ?? null, rebind_host: m.rebind_host ?? null,
      status: m.status ?? null, circle: m.circle ?? null,
      l1: m.l1 ?? null, l2: m.l2 ?? null, l3: m.l3 ?? null, template_id: m.template_id ?? null,
      in_explorer: m.in_explorer ?? false, in_unsolvables: m.in_unsolvables ?? false,
      count: m.count ?? 1, synthetic: m.synthetic ?? false, detail_available: m.detail_available ?? true,
      polymarket_url: m.polymarket_url ?? null,
    }));
    for (const batch of chunks(marketRows, 500)) {
      await tx`insert into app.markets ${tx(batch, 'slug', 'benchmark_slug', 'market_id', 'date', 'event_slug', 'question', 'bucket', 'winner', 'named_source', 'verified_source', 'e_rs_host', 'rebind_host', 'status', 'circle', 'l1', 'l2', 'l3', 'template_id', 'in_explorer', 'in_unsolvables', 'count', 'synthetic', 'detail_available', 'polymarket_url')}`;
    }
  });

  // sources-bench coming-soon row (idempotent)
  await sql`
    insert into app.benchmark_meta (slug, display_name, description, status, link)
    values ('sources-bench', 'Sources benchmark', 'Catalog of web sources GenLayer validators can read end-to-end.', 'coming_soon', null)
    on conflict (slug) do update set
      display_name = excluded.display_name, description = excluded.description,
      status = excluded.status, link = excluded.link
  `;

  console.log(JSON.stringify({
    stage: 'rebuild-app',
    dates: dates.length,
    per_day: Object.keys(perDay).length,
    templates: templates.length,
    domains: domains.length,
    markets: allDayRows.length,
    unique_markets: allRows.length,
    onchain_markets: onchainRowsById.size,
    headline_pct: headlinePct.toFixed(2),
    elapsed_ms: Date.now() - startedAt,
  }));
}

rebuild().then(() => closeDb()).catch(async (err) => {
  console.error('rebuild-app failed:', err);
  await closeDb();
  process.exit(1);
});
