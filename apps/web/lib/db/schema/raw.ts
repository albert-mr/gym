import {
  pgSchema,
  text,
  integer,
  bigserial,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';

export const raw = pgSchema('raw');

export const polls = raw.table('polls', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  pollDate: date('poll_date').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  marketsSeen: integer('markets_seen').default(0).notNull(),
  scriptVersion: text('script_version'),
  notes: jsonb('notes'),
}, (t) => ({
  pollDateIdx: index('polls_poll_date_idx').on(t.pollDate),
}));

export const markets = raw.table('markets', {
  id: text('id').primaryKey(),
  conditionId: text('condition_id'),
  eventSlug: text('event_slug'),
  slug: text('slug'),
  question: text('question').notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  volumeNum: numeric('volume_num'),
  rawPayload: jsonb('raw_payload').notNull(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugIdx: index('markets_slug_idx').on(t.slug),
  eventSlugIdx: index('markets_event_slug_idx').on(t.eventSlug),
  endDateIdx: index('markets_end_date_idx').on(t.endDate),
}));

export const marketObservations = raw.table('market_observations', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  pollId: integer('poll_id').references(() => polls.id, { onDelete: 'cascade' }),
  marketId: text('market_id').notNull().references(() => markets.id, { onDelete: 'cascade' }),
  observedAt: timestamp('observed_at', { withTimezone: true }).notNull().defaultNow(),
  status: text('status'),
  outcomePrices: jsonb('outcome_prices'),
  closed: boolean('closed').default(false).notNull(),
}, (t) => ({
  marketIdObservedAtIdx: index('market_obs_market_observed_idx').on(t.marketId, t.observedAt),
}));

export const marketOutcomes = raw.table('market_outcomes', {
  marketId: text('market_id').primaryKey().references(() => markets.id, { onDelete: 'cascade' }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  winnerOutcome: text('winner_outcome'),
  outcomePrices: jsonb('outcome_prices'),
  sourceUrl: text('source_url'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
});

export const gateEvaluations = raw.table('gate_evaluations', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  pollId: integer('poll_id').references(() => polls.id, { onDelete: 'set null' }),
  marketId: text('market_id').notNull().references(() => markets.id, { onDelete: 'cascade' }),
  evaluatedFor: date('evaluated_for').notNull(),
  passed: boolean('passed').notNull(),
  droppedAtGate: integer('dropped_at_gate'),
  dropReason: text('drop_reason'),
  bucket: text('bucket'),
  bindingDomain: text('binding_domain'),
  bindingUrl: text('binding_url'),
  notes: jsonb('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  marketIdEvalForIdx: index('gate_eval_market_evalfor_idx').on(t.marketId, t.evaluatedFor),
  evalForIdx: index('gate_eval_evalfor_idx').on(t.evaluatedFor),
  bucketIdx: index('gate_eval_bucket_idx').on(t.bucket),
}));

export const studioDeploys = raw.table('studio_deploys', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  marketId: text('market_id').notNull().references(() => markets.id, { onDelete: 'cascade' }),
  bindingDomain: text('binding_domain'),
  deployOk: boolean('deploy_ok'),
  resolveTx: text('resolve_tx'),
  rawOutcome: text('raw_outcome'),
  match: boolean('match'),
  elapsedMs: integer('elapsed_ms'),
  deployedAt: timestamp('deployed_at', { withTimezone: true }).notNull().defaultNow(),
  notes: jsonb('notes'),
}, (t) => ({
  marketIdIdx: index('studio_deploys_market_id_idx').on(t.marketId),
}));
