import { cache } from 'react';
import { eq, asc, desc } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema/app';
import type {
  BenchmarkData,
  PerDay,
  Template,
  DomainRow,
  ExplorerMarketRow,
  Unsolvable,
  MarketRow,
} from '../types';

function num(v: unknown, fallback = 0): number {
  if (v == null) return fallback;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function fetchBenchmark(slug: string): Promise<BenchmarkData | null> {
  const meta = (await db.select().from(schema.benchmarkMeta).where(eq(schema.benchmarkMeta.slug, slug)))[0];
  if (!meta) return null;

  const [perDayRows, templateRows, domainRows, marketRows, onchainStatsRow, bucketStyleRows] = await Promise.all([
    db.select().from(schema.perDay).where(eq(schema.perDay.benchmarkSlug, slug)).orderBy(asc(schema.perDay.date)),
    db.select().from(schema.templates).where(eq(schema.templates.benchmarkSlug, slug)).orderBy(desc(schema.templates.count)),
    db.select().from(schema.domains).where(eq(schema.domains.benchmarkSlug, slug)).orderBy(desc(schema.domains.count)),
    db.select().from(schema.markets).where(eq(schema.markets.benchmarkSlug, slug)),
    db.select().from(schema.onchainFeedStats).where(eq(schema.onchainFeedStats.benchmarkSlug, slug)),
    db.select().from(schema.bucketStyles).orderBy(asc(schema.bucketStyles.ordering)),
  ]);

  const dates: string[] = perDayRows.map((r) => r.date);
  const perDay: Record<string, PerDay> = {};
  for (const r of perDayRows) {
    perDay[r.date] = {
      gate1Pass: r.gate1Pass,
      solved: r.solved,
      solvedPct: num(r.solvedPct),
      resolved: r.resolved,
      buckets: (r.buckets ?? {}) as Record<string, number>,
      chainlink: r.chainlink ?? undefined,
      pyth: r.pyth ?? undefined,
      directDeep: r.directDeep,
      directShallow: r.directShallow,
      alt: r.alt,
      unsolvable: r.unsolvable,
    };
  }

  const templates: Template[] = templateRows.map((t) => ({
    id: t.id,
    L1: t.l1,
    L2: t.l2,
    L3: t.l3,
    template: t.template,
    count: t.count,
    buckets: (t.buckets ?? {}) as Record<string, number>,
    dominantBucket: t.dominantBucket ?? '',
    eRSHosts: (t.eRSHosts ?? []) as string[],
    rebindHost: t.rebindHost ?? '',
    dates: (t.dates ?? []) as string[],
    example: t.example as Template['example'],
  }));

  const domains: DomainRow[] = domainRows.map((d) => ({
    host: d.host,
    count: d.count,
    buckets: (d.buckets ?? {}) as Record<string, number>,
    dominantBucket: d.dominantBucket ?? '',
    rebind: d.rebind ?? '',
    category: d.category ?? 'Other',
  }));

  const onchainMarkets: ExplorerMarketRow[] = marketRows
    .filter((m) => m.inExplorer)
    .map((m) => ({
      id: m.marketId ?? m.slug,
      date: m.date,
      question: m.question,
      circle: (m.circle ?? 'held') as ExplorerMarketRow['circle'],
      bucket: m.bucket ?? '',
      namedHost: m.namedSource ?? '',
      verifiedHost: m.verifiedSource ?? '',
      L1: m.l1 ?? '',
      L2: m.l2 ?? '',
      L3: m.l3 ?? '',
      template: '',
      winner: m.winner ?? 'pending',
      slug: m.slug,
      eventSlug: m.eventSlug,
      count: m.count,
      synthetic: m.synthetic,
      detailAvailable: m.detailAvailable,
      polymarketUrl: m.polymarketUrl ?? undefined,
    }));

  const unsolvables: Unsolvable[] = marketRows
    .filter((m) => m.inUnsolvables)
    .map((m) => ({
      id: m.marketId ?? m.slug,
      date: m.date,
      question: m.question,
      bucket: m.bucket ?? '',
      eRS: '',
      eRSHost: m.eRSHost ?? '',
      slug: m.slug,
      winner: m.winner ?? 'pending',
    }));

  const marketsByTemplate: Record<string, MarketRow[]> = {};
  for (const t of templateRows) marketsByTemplate[t.id] = [];
  for (const m of marketRows) {
    if (!m.templateId || !(m.templateId in marketsByTemplate)) continue;
    marketsByTemplate[m.templateId].push({
      id: m.marketId ?? m.slug,
      date: m.date,
      question: m.question,
      eRSHost: m.eRSHost ?? '',
      rebindHost: m.rebindHost ?? '',
      bucket: m.bucket ?? '',
      winner: m.winner ?? 'pending',
      slug: m.slug,
      eventSlug: m.eventSlug,
    });
  }

  const ofs = onchainStatsRow[0];
  const onchainFeedStats: BenchmarkData['onchainFeedStats'] = ofs
    ? {
        chainlink: ofs.chainlink,
        pyth: ofs.pyth,
        chainlinkPlusPyth: ofs.chainlinkPlusPyth,
        addressable: ofs.addressable,
        polledUniverse: ofs.polledUniverse,
        chainlinkPct: num(ofs.chainlinkPct),
        pythPct: num(ofs.pythPct),
        onchainFeedPct: num(ofs.onchainFeedPct),
        addressablePct: num(ofs.addressablePct),
      }
    : {
        chainlink: 0, pyth: 0, chainlinkPlusPyth: 0, addressable: 0, polledUniverse: 0,
        chainlinkPct: 0, pythPct: 0, onchainFeedPct: 0, addressablePct: 0,
      };

  const bucketLabels: Record<string, string> = {};
  const bucketColors: Record<string, string> = {};
  for (const b of bucketStyleRows) {
    bucketLabels[b.bucket] = b.label;
    bucketColors[b.bucket] = b.color;
  }

  return {
    meta: {
      dates,
      generatedAt: meta.generatedAt?.toISOString() ?? new Date().toISOString(),
      totalPass: meta.totalPass ?? 0,
      totalSolved: meta.totalSolved ?? 0,
      headlinePct: num(meta.headlinePct),
      resolvedCorrectlyPct: num(meta.resolvedCorrectlyPct),
      window: {
        start: meta.windowStart ?? '',
        end: meta.windowEnd ?? '',
      },
    },
    perDay,
    templates,
    domains,
    onchainMarkets,
    unsolvables,
    marketsByTemplate,
    onchainFeedStats,
    bucketLabels,
    bucketColors,
  };
}

export const getBenchmark = cache(fetchBenchmark);
