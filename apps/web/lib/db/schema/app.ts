import {
  pgSchema,
  text,
  integer,
  numeric,
  jsonb,
  timestamp,
  date,
  boolean,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';

export const app = pgSchema('app');

export const benchmarkMeta = app.table('benchmark_meta', {
  slug: text('slug').primaryKey(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  tagline: text('tagline'),
  status: text('status').notNull().default('live'),
  link: text('link'),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  windowStart: date('window_start'),
  windowEnd: date('window_end'),
  totalPass: integer('total_pass'),
  totalSolved: integer('total_solved'),
  headlinePct: numeric('headline_pct'),
  resolvedCorrectlyPct: numeric('resolved_correctly_pct'),
});

export const perDay = app.table('per_day', {
  benchmarkSlug: text('benchmark_slug').notNull().references(() => benchmarkMeta.slug, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  gate1Pass: integer('gate1_pass').notNull().default(0),
  solved: integer('solved').notNull().default(0),
  solvedPct: numeric('solved_pct'),
  resolved: integer('resolved').notNull().default(0),
  buckets: jsonb('buckets').notNull().default({}),
  chainlink: integer('chainlink'),
  pyth: integer('pyth'),
  directDeep: integer('direct_deep').notNull().default(0),
  directShallow: integer('direct_shallow').notNull().default(0),
  alt: integer('alt').notNull().default(0),
  unsolvable: integer('unsolvable').notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.benchmarkSlug, t.date] }),
  dateIdx: index('per_day_date_idx').on(t.date),
}));

export const markets = app.table('markets', {
  slug: text('slug').primaryKey(),
  benchmarkSlug: text('benchmark_slug').notNull().references(() => benchmarkMeta.slug, { onDelete: 'cascade' }),
  marketId: text('market_id'),
  date: date('date').notNull(),
  eventSlug: text('event_slug').notNull().default(''),
  question: text('question').notNull(),
  bucket: text('bucket'),
  winner: text('winner'),
  namedSource: text('named_source'),
  verifiedSource: text('verified_source'),
  eRSHost: text('e_rs_host'),
  rebindHost: text('rebind_host'),
  status: text('status'),
  circle: text('circle'),
  l1: text('l1'),
  l2: text('l2'),
  l3: text('l3'),
  templateId: text('template_id'),
  inExplorer: boolean('in_explorer').notNull().default(false),
  inUnsolvables: boolean('in_unsolvables').notNull().default(false),
  count: integer('count').notNull().default(1),
  synthetic: boolean('synthetic').notNull().default(false),
  detailAvailable: boolean('detail_available').notNull().default(true),
  polymarketUrl: text('polymarket_url'),
}, (t) => ({
  benchmarkDateIdx: index('app_markets_benchmark_date_idx').on(t.benchmarkSlug, t.date),
  bucketIdx: index('app_markets_bucket_idx').on(t.bucket),
  templateIdx: index('app_markets_template_idx').on(t.templateId),
  explorerIdx: index('app_markets_explorer_idx').on(t.inExplorer),
}));

export const templates = app.table('templates', {
  id: text('id').primaryKey(),
  benchmarkSlug: text('benchmark_slug').notNull().references(() => benchmarkMeta.slug, { onDelete: 'cascade' }),
  l1: text('l1').notNull(),
  l2: text('l2').notNull(),
  l3: text('l3').notNull(),
  template: text('template').notNull(),
  count: integer('count').notNull().default(0),
  buckets: jsonb('buckets').notNull().default({}),
  dominantBucket: text('dominant_bucket'),
  eRSHosts: jsonb('e_rs_hosts').notNull().default([]),
  rebindHost: text('rebind_host'),
  dates: jsonb('dates').notNull().default([]),
  example: jsonb('example'),
}, (t) => ({
  benchmarkIdx: index('app_templates_benchmark_idx').on(t.benchmarkSlug),
}));

export const domains = app.table('domains', {
  host: text('host').notNull(),
  benchmarkSlug: text('benchmark_slug').notNull().references(() => benchmarkMeta.slug, { onDelete: 'cascade' }),
  count: integer('count').notNull().default(0),
  buckets: jsonb('buckets').notNull().default({}),
  dominantBucket: text('dominant_bucket'),
  rebind: text('rebind'),
  category: text('category'),
}, (t) => ({
  pk: primaryKey({ columns: [t.benchmarkSlug, t.host] }),
}));

export const bucketStyles = app.table('bucket_styles', {
  bucket: text('bucket').primaryKey(),
  label: text('label').notNull(),
  color: text('color').notNull(),
  ordering: integer('ordering').notNull().default(0),
});

export const onchainFeedStats = app.table('onchain_feed_stats', {
  benchmarkSlug: text('benchmark_slug').primaryKey().references(() => benchmarkMeta.slug, { onDelete: 'cascade' }),
  chainlink: integer('chainlink').notNull().default(0),
  pyth: integer('pyth').notNull().default(0),
  chainlinkPlusPyth: integer('chainlink_plus_pyth').notNull().default(0),
  addressable: integer('addressable').notNull().default(0),
  polledUniverse: integer('polled_universe').notNull().default(0),
  chainlinkPct: numeric('chainlink_pct').notNull().default('0'),
  pythPct: numeric('pyth_pct').notNull().default('0'),
  onchainFeedPct: numeric('onchain_feed_pct').notNull().default('0'),
  addressablePct: numeric('addressable_pct').notNull().default('0'),
});
