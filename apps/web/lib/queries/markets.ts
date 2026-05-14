import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema/app';
import type { MarketDetail, MarketsDoc } from '../types';

function statusFromBucket(bucket: string | null): MarketDetail['status'] {
  if (!bucket) return 'blocked';
  if (['render', 'api'].includes(bucket)) return 'accessible';
  if (['alt', 'liquipedia_recover', 'bo3_recover', 'frmf_via_flashscore', 'eurovision_via_wiki', 'cricinfo_via_espn'].includes(bucket)) return 'alternative';
  return 'blocked';
}

function toMarketDetail(row: typeof schema.markets.$inferSelect): MarketDetail {
  const status = (row.status as MarketDetail['status'] | null) ?? statusFromBucket(row.bucket);
  return {
    id: row.marketId ?? row.slug,
    date: row.date,
    slug: row.slug,
    eventSlug: row.eventSlug,
    question: row.question,
    namedSource: row.namedSource ?? row.eRSHost ?? null,
    verifiedSource: status === 'blocked' ? null : (row.verifiedSource ?? row.rebindHost ?? null),
    status,
    bucket: row.bucket ?? '',
    winner: row.winner ?? 'pending',
  };
}

async function fetchMarkets(slug: string): Promise<MarketsDoc> {
  const [rows, metaRow] = await Promise.all([
    db.select().from(schema.markets).where(eq(schema.markets.benchmarkSlug, slug)),
    db.select().from(schema.benchmarkMeta).where(eq(schema.benchmarkMeta.slug, slug)),
  ]);
  const meta = metaRow[0];

  const markets: MarketDetail[] = rows.map(toMarketDetail);
  const counts = { accessible: 0, alternative: 0, blocked: 0 } as MarketsDoc['meta']['counts'];
  for (const m of markets) counts[m.status] = (counts[m.status] ?? 0) + 1;

  return {
    markets,
    meta: {
      generatedAt: meta?.generatedAt?.toISOString() ?? new Date().toISOString(),
      window: { start: meta?.windowStart ?? '', end: meta?.windowEnd ?? '' },
      counts: { ...counts, total: markets.length },
      headlinePct: Number(meta?.headlinePct ?? 0),
      resolvedCorrectlyPct: Number(meta?.resolvedCorrectlyPct ?? 0),
      schema: 'https://gym.genlayer.foundation/schema/polymarket-markets-v3',
      notes: 'Backed by Vercel Postgres / Neon (app.markets). One row per unique market in the dashboard window.',
    },
  };
}

export const getMarkets = cache(fetchMarkets);

async function fetchMarketBySlug(slug: string): Promise<MarketDetail | null> {
  const rows = await db.select().from(schema.markets).where(eq(schema.markets.slug, slug)).limit(1);
  return rows[0] ? toMarketDetail(rows[0]) : null;
}

export const getMarketBySlug = cache(fetchMarketBySlug);
