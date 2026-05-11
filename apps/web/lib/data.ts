import fs from 'node:fs';
import path from 'node:path';
import type { BenchmarkData, ComingSoonData } from './types';

// Resolve the monorepo data/ folder relative to this file. apps/web/lib -> apps/web -> apps -> root -> data
const DATA_ROOT = path.resolve(process.cwd(), '..', '..', 'data');

export function loadBenchmark(name: string): BenchmarkData {
  const file = path.join(DATA_ROOT, name, 'latest.json');
  const raw = fs.readFileSync(file, 'utf-8');
  return JSON.parse(raw) as BenchmarkData;
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
