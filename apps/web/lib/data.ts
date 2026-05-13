import fs from 'node:fs';
import path from 'node:path';
import type { BenchmarkData, ComingSoonData, MarketDetail, MarketsDoc } from './types';

// Resolve the monorepo data/ folder relative to this file. apps/web/lib -> apps/web -> apps -> root -> data
const DATA_ROOT = path.resolve(process.cwd(), '..', '..', 'data');

// markets.json lives under apps/web/public so it can also be served as a static download.
// We read it at build time via fs (same pattern as loadBenchmark) so per-market pages can be statically generated.
const PUBLIC_DATA_ROOT = path.resolve(process.cwd(), 'public', 'data');

export function loadBenchmark(name: string): BenchmarkData {
  const file = path.join(DATA_ROOT, name, 'latest.json');
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw) as BenchmarkData;
}

export function loadMarkets(): MarketsDoc {
  const file = path.join(PUBLIC_DATA_ROOT, 'pm-bench', 'markets.json');
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw) as MarketsDoc;
}

export function loadMarketBySlug(slug: string): MarketDetail | null {
  const doc = loadMarkets();
  return doc.markets.find(m => m.slug === slug) ?? null;
}

export function loadComingSoon(name: string): ComingSoonData | null {
  const file = path.join(DATA_ROOT, name, 'placeholder.json');
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw) as ComingSoonData;
}

export function listBenchmarks(): Array<{ name: string; kind: 'live' | 'coming-soon' }> {
  if (!fs.existsSync(DATA_ROOT)) return [];
  const dirs = fs.readdirSync(DATA_ROOT, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  return dirs.map(name => {
    const hasLatest = fs.existsSync(path.join(DATA_ROOT, name, 'latest.json'));
    return { name, kind: hasLatest ? 'live' : 'coming-soon' };
  });
}
