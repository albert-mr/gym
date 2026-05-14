// 05-rebuild-app.mjs
// Seed app.* tables from the existing data/pm-bench/latest.json so the dashboard
// is read-equivalent post-migration. Single source of truth for the historic
// 8-day window. Going forward, Stage 3 introduces a from-raw rebuild path that
// supersedes this (this script is the one-time backfill bridge).
//
// Tables filled:
//   app.benchmark_meta
//   app.per_day
//   app.markets               (from latest.json's marketsByTemplate + onchainMarkets + unsolvables)
//   app.templates
//   app.domains
//   app.bucket_styles
//   app.onchain_feed_stats

import fs from 'node:fs';
import { sql, chunks, DASHBOARD_LATEST_JSON, log } from './_shared.mjs';

const SLUG = 'pm-bench';

function isAccessible(bucket) {
  return ['render', 'api'].includes(bucket);
}
function isAlternative(bucket) {
  return ['alt', 'liquipedia_recover', 'bo3_recover', 'frmf_via_flashscore', 'eurovision_via_wiki', 'cricinfo_via_espn'].includes(bucket);
}
function statusOf(bucket) {
  if (isAccessible(bucket)) return 'accessible';
  if (isAlternative(bucket)) return 'alternative';
  return 'blocked';
}
function circleOf(bucket) {
  if (bucket === 'chainlink') return 'chainlink';
  if (bucket === 'pyth') return 'pyth';
  if (isAccessible(bucket)) return 'direct';
  if (isAlternative(bucket)) return 'alternative';
  return 'held';
}

async function run() {
  if (!fs.existsSync(DASHBOARD_LATEST_JSON)) {
    console.error(`Missing ${DASHBOARD_LATEST_JSON} — run build-data-json.mjs first.`);
    sql.end();
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DASHBOARD_LATEST_JSON, 'utf-8'));

  // benchmark_meta — upsert
  await sql`
    insert into app.benchmark_meta (slug, display_name, description, tagline, status, generated_at, window_start, window_end, total_pass, total_solved, headline_pct, resolved_correctly_pct)
    values (
      ${SLUG},
      'Polymarket benchmark',
      'Daily measurement of GenLayer resolution coverage for Polymarket markets closing in the next 24 hours.',
      'where we measure what GenLayer can do',
      'live',
      ${data.meta.generatedAt},
      ${data.meta.window.start},
      ${data.meta.window.end},
      ${data.meta.totalPass},
      ${data.meta.totalSolved},
      ${data.meta.headlinePct},
      ${data.meta.resolvedCorrectlyPct}
    )
    on conflict (slug) do update set
      display_name = excluded.display_name,
      description = excluded.description,
      tagline = excluded.tagline,
      status = excluded.status,
      generated_at = excluded.generated_at,
      window_start = excluded.window_start,
      window_end = excluded.window_end,
      total_pass = excluded.total_pass,
      total_solved = excluded.total_solved,
      headline_pct = excluded.headline_pct,
      resolved_correctly_pct = excluded.resolved_correctly_pct
  `;

  // bucket_styles — replace
  await sql`delete from app.bucket_styles`;
  const styleRows = Object.entries(data.bucketLabels).map(([bucket, label], i) => ({
    bucket,
    label,
    color: data.bucketColors[bucket] ?? '#64748b',
    ordering: i,
  }));
  if (styleRows.length) {
    await sql`insert into app.bucket_styles ${sql(styleRows, 'bucket', 'label', 'color', 'ordering')}`;
  }

  // per_day — replace for this slug
  await sql`delete from app.per_day where benchmark_slug = ${SLUG}`;
  const perDayRows = Object.entries(data.perDay).map(([date, pd]) => ({
    benchmark_slug: SLUG,
    date,
    gate1_pass: pd.gate1Pass ?? 0,
    solved: pd.solved ?? 0,
    solved_pct: pd.solvedPct ?? null,
    resolved: pd.resolved ?? 0,
    buckets: pd.buckets ?? {},
    chainlink: pd.chainlink ?? null,
    pyth: pd.pyth ?? null,
    direct_deep: pd.directDeep ?? 0,
    direct_shallow: pd.directShallow ?? 0,
    alt: pd.alt ?? 0,
    unsolvable: pd.unsolvable ?? 0,
  }));
  for (const batch of chunks(perDayRows, 500)) {
    await sql`insert into app.per_day ${sql(batch, 'benchmark_slug', 'date', 'gate1_pass', 'solved', 'solved_pct', 'resolved', 'buckets', 'chainlink', 'pyth', 'direct_deep', 'direct_shallow', 'alt', 'unsolvable')}`;
  }

  // templates — replace for this slug
  await sql`delete from app.templates where benchmark_slug = ${SLUG}`;
  const templateRows = data.templates.map((t) => ({
    id: t.id,
    benchmark_slug: SLUG,
    l1: t.L1,
    l2: t.L2,
    l3: t.L3,
    template: t.template,
    count: t.count,
    buckets: t.buckets,
    dominant_bucket: t.dominantBucket,
    e_rs_hosts: t.eRSHosts,
    rebind_host: t.rebindHost ?? null,
    dates: t.dates,
    example: t.example ?? null,
  }));
  for (const batch of chunks(templateRows, 500)) {
    await sql`insert into app.templates ${sql(batch, 'id', 'benchmark_slug', 'l1', 'l2', 'l3', 'template', 'count', 'buckets', 'dominant_bucket', 'e_rs_hosts', 'rebind_host', 'dates', 'example')}`;
  }

  // domains — replace for this slug
  await sql`delete from app.domains where benchmark_slug = ${SLUG}`;
  const domainRows = data.domains.map((d) => ({
    benchmark_slug: SLUG,
    host: d.host,
    count: d.count,
    buckets: d.buckets,
    dominant_bucket: d.dominantBucket,
    rebind: d.rebind ?? null,
    category: d.category ?? null,
  }));
  for (const batch of chunks(domainRows, 500)) {
    await sql`insert into app.domains ${sql(batch, 'benchmark_slug', 'host', 'count', 'buckets', 'dominant_bucket', 'rebind', 'category')}`;
  }

  // onchain_feed_stats — upsert
  const stats = data.onchainFeedStats;
  await sql`
    insert into app.onchain_feed_stats (benchmark_slug, chainlink, pyth, chainlink_plus_pyth, addressable, polled_universe, chainlink_pct, pyth_pct, onchain_feed_pct, addressable_pct)
    values (${SLUG}, ${stats.chainlink}, ${stats.pyth}, ${stats.chainlinkPlusPyth}, ${stats.addressable}, ${stats.polledUniverse}, ${stats.chainlinkPct}, ${stats.pythPct}, ${stats.onchainFeedPct}, ${stats.addressablePct})
    on conflict (benchmark_slug) do update set
      chainlink = excluded.chainlink,
      pyth = excluded.pyth,
      chainlink_plus_pyth = excluded.chainlink_plus_pyth,
      addressable = excluded.addressable,
      polled_universe = excluded.polled_universe,
      chainlink_pct = excluded.chainlink_pct,
      pyth_pct = excluded.pyth_pct,
      onchain_feed_pct = excluded.onchain_feed_pct,
      addressable_pct = excluded.addressable_pct
  `;

  // markets — flatten everything that has per-market info
  // Sources:
  //   marketsByTemplate (slim view, has template_id)
  //   onchainMarkets    (chainlink/pyth — has L1/L2/L3, template, named/verified host)
  //   unsolvables       (has slug + bucket)
  // Use slug as PK; fields are merged where multiple sources agree.
  await sql`delete from app.markets where benchmark_slug = ${SLUG}`;

  const marketsBySlug = new Map();
  function upsertMarket(slug, fields) {
    const existing = marketsBySlug.get(slug) ?? { slug };
    marketsBySlug.set(slug, { ...existing, ...fields, slug });
  }

  // marketsByTemplate — slim rows per template
  for (const [templateId, rows] of Object.entries(data.marketsByTemplate)) {
    for (const r of rows) {
      const slug = r.slug || r.id;
      upsertMarket(slug, {
        benchmark_slug: SLUG,
        market_id: r.id,
        date: r.date,
        event_slug: r.eventSlug || '',
        question: r.question || '',
        bucket: r.bucket || null,
        winner: r.winner || null,
        e_rs_host: r.eRSHost ?? null,
        rebind_host: r.rebindHost ?? null,
        status: statusOf(r.bucket),
        circle: circleOf(r.bucket),
        template_id: templateId,
      });
    }
  }

  // onchainMarkets — explorer rows including chainlink/pyth
  for (const r of (data.onchainMarkets ?? [])) {
    const slug = r.slug || r.id;
    upsertMarket(slug, {
      benchmark_slug: SLUG,
      market_id: r.id,
      date: r.date,
      event_slug: r.eventSlug || '',
      question: r.question || '',
      bucket: r.bucket || null,
      winner: r.winner || null,
      named_source: r.namedHost ?? null,
      verified_source: r.verifiedHost ?? null,
      l1: r.L1 ?? null,
      l2: r.L2 ?? null,
      l3: r.L3 ?? null,
      status: statusOf(r.bucket),
      circle: r.circle ?? circleOf(r.bucket),
      in_explorer: true,
      count: r.count ?? 1,
      synthetic: r.synthetic ?? false,
      detail_available: r.detailAvailable ?? false,
      polymarket_url: r.polymarketUrl ?? null,
    });
  }

  // unsolvables
  for (const r of data.unsolvables) {
    const slug = r.slug || r.id;
    upsertMarket(slug, {
      benchmark_slug: SLUG,
      market_id: r.id,
      date: r.date,
      event_slug: r.slug || '',
      question: r.question,
      bucket: r.bucket,
      winner: r.winner,
      e_rs_host: r.eRSHost ?? null,
      named_source: r.eRSHost ?? null,
      status: 'blocked',
      circle: 'held',
      in_unsolvables: true,
    });
  }

  // Fill defaults for any missing required columns.
  const marketRows = [...marketsBySlug.values()].map((m) => ({
    slug: m.slug,
    benchmark_slug: m.benchmark_slug ?? SLUG,
    market_id: m.market_id ?? null,
    date: m.date ?? '2026-01-01',
    event_slug: m.event_slug ?? '',
    question: m.question ?? '',
    bucket: m.bucket ?? null,
    winner: m.winner ?? null,
    named_source: m.named_source ?? null,
    verified_source: m.verified_source ?? null,
    e_rs_host: m.e_rs_host ?? null,
    rebind_host: m.rebind_host ?? null,
    status: m.status ?? null,
    circle: m.circle ?? null,
    l1: m.l1 ?? null,
    l2: m.l2 ?? null,
    l3: m.l3 ?? null,
    template_id: m.template_id ?? null,
    in_explorer: m.in_explorer ?? false,
    in_unsolvables: m.in_unsolvables ?? false,
    count: m.count ?? 1,
    synthetic: m.synthetic ?? false,
    detail_available: m.detail_available ?? true,
    polymarket_url: m.polymarket_url ?? null,
  }));

  for (const batch of chunks(marketRows, 500)) {
    await sql`insert into app.markets ${sql(batch, 'slug', 'benchmark_slug', 'market_id', 'date', 'event_slug', 'question', 'bucket', 'winner', 'named_source', 'verified_source', 'e_rs_host', 'rebind_host', 'status', 'circle', 'l1', 'l2', 'l3', 'template_id', 'in_explorer', 'in_unsolvables', 'count', 'synthetic', 'detail_available', 'polymarket_url')}`;
  }

  // sources-bench: coming-soon row so the dashboard can render its tile from DB.
  await sql`
    insert into app.benchmark_meta (slug, display_name, description, status, link)
    values ('sources-bench', 'Sources benchmark', 'Catalog of web sources GenLayer validators can read end-to-end. Coming soon.', 'coming_soon', null)
    on conflict (slug) do update set
      display_name = excluded.display_name,
      description = excluded.description,
      status = excluded.status,
      link = excluded.link
  `;

  log('05-rebuild-app', {
    perDay: perDayRows.length,
    templates: templateRows.length,
    domains: domainRows.length,
    markets: marketRows.length,
    bucketStyles: styleRows.length,
  });
  sql.end();
}

run().catch((err) => { console.error(err); process.exit(1); });
