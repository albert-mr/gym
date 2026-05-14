import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema/app';
import type { ComingSoonData } from '../types';

async function fetchComingSoon(slug: string): Promise<ComingSoonData | null> {
  const rows = await db.select().from(schema.benchmarkMeta).where(eq(schema.benchmarkMeta.slug, slug)).limit(1);
  const meta = rows[0];
  if (!meta) return null;
  if (meta.status !== 'coming_soon') return null;
  return {
    name: meta.displayName,
    description: meta.description ?? '',
    status: 'planned',
    link: meta.link ?? undefined,
  };
}

export const getComingSoon = cache(fetchComingSoon);

async function fetchAllBenchmarks(): Promise<Array<{ name: string; kind: 'live' | 'coming-soon' }>> {
  const rows = await db.select().from(schema.benchmarkMeta);
  return rows.map((r) => ({ name: r.slug, kind: r.status === 'live' ? 'live' : 'coming-soon' }));
}

export const listBenchmarks = cache(fetchAllBenchmarks);
