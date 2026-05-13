// Shared filter state for the explorer page. ExplorerFilters owns the state
// and writes to URL params; every explorer view consumes the resolved filters
// through one row-level data pipeline.

import type { ExplorerCircle } from './types';

export type ExplorerView = 'category' | 'circle' | 'source' | 'day' | 'list';

export type StatusFilter = 'all' | 'solved' | 'disagrees' | 'unresolvable';

export type ExplorerFilterState = {
  view: ExplorerView;
  date: string;
  circles: ExplorerCircle[];
  buckets: string[];
  status: StatusFilter;
  solvedOnly: boolean;
  search: string;
  host: string;
  verifiedHost: string;
};

export const defaultExplorerFilters: ExplorerFilterState = {
  view: 'category',
  date: 'all',
  circles: [],
  buckets: [],
  status: 'all',
  solvedOnly: false,
  search: '',
  host: 'all',
  verifiedHost: 'all',
};

// Umbrella categories shown in the explorer filter dropdown. Each one expands
// to a set of internal bucket keys; badges elsewhere still render the precise
// per-bucket label.
export const BUCKET_GROUPS: { id: string; label: string; buckets: string[] }[] = [
  { id: 'onchain', label: 'On-chain feeds', buckets: ['chainlink', 'pyth'] },
  { id: 'direct', label: 'Direct Source', buckets: ['render', 'api'] },
  { id: 'alt', label: 'Alternative Source', buckets: ['alt', 'liquipedia_recover', 'bo3_recover', 'frmf_via_flashscore', 'eurovision_via_wiki', 'cricinfo_via_espn'] },
  { id: 'no_alt', label: 'No alternative available', buckets: ['hltv_lost', 'hard', 'yahoo', 'subjective'] },
  { id: 'unclassified', label: 'Unclassified', buckets: ['misc'] },
  { id: 'no_source', label: 'No Source', buckets: ['no_source'] },
  { id: 'errors', label: 'Errors', buckets: ['studio_blocked'] },
];

export const CIRCLE_GROUPS: { id: string; label: string; circles: ExplorerCircle[] }[] = [
  { id: 'onchain', label: 'On-chain feeds', circles: ['chainlink', 'pyth'] },
  { id: 'chainlink', label: 'Chainlink', circles: ['chainlink'] },
  { id: 'pyth', label: 'Pyth', circles: ['pyth'] },
  { id: 'direct', label: 'Direct source', circles: ['direct'] },
  { id: 'alternative', label: 'Alternative source', circles: ['alternative'] },
  { id: 'held', label: 'Held / unresolvable', circles: ['held'] },
];

export function bucketsToUmbrellaId(buckets: string[]): string | null {
  if (buckets.length === 0) return null;
  const want = new Set(buckets);
  for (const g of BUCKET_GROUPS) {
    if (g.buckets.length !== want.size) continue;
    if (g.buckets.every(b => want.has(b))) return g.id;
  }
  return null;
}

export function circlesToGroupId(circles: ExplorerCircle[]): string | null {
  if (circles.length === 0) return null;
  const want = new Set(circles);
  for (const g of CIRCLE_GROUPS) {
    if (g.circles.length !== want.size) continue;
    if (g.circles.every(c => want.has(c))) return g.id;
  }
  return null;
}

export function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function parseView(raw: string | null): ExplorerView {
  return raw === 'category' || raw === 'circle' || raw === 'source' || raw === 'day' || raw === 'list'
    ? raw
    : 'category';
}

function parseCircles(raw: string | null): ExplorerCircle[] {
  return parseList(raw).filter((c): c is ExplorerCircle => (
    c === 'chainlink' || c === 'pyth' || c === 'direct' || c === 'alternative' || c === 'held'
  ));
}

export function filtersToParams(f: ExplorerFilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.view !== 'category') p.set('view', f.view);
  if (f.date !== 'all') p.set('date', f.date);
  if (f.circles.length) p.set('circle', f.circles.join(','));
  if (f.buckets.length) p.set('bucket', f.buckets.join(','));
  if (f.status !== 'all') p.set('status', f.status);
  if (f.solvedOnly) p.set('solved', '1');
  if (f.search.trim()) p.set('q', f.search.trim());
  if (f.host !== 'all') p.set('host', f.host);
  if (f.verifiedHost !== 'all') p.set('verifiedHost', f.verifiedHost);
  return p;
}

export function paramsToFilters(p: URLSearchParams): ExplorerFilterState {
  const status = p.get('status');
  return {
    view: parseView(p.get('view')),
    date: p.get('date') ?? 'all',
    circles: parseCircles(p.get('circle')),
    buckets: parseList(p.get('bucket')),
    status: status === 'solved' || status === 'disagrees' || status === 'unresolvable' ? status : 'all',
    solvedOnly: p.get('solved') === '1',
    search: p.get('q') ?? '',
    host: p.get('host') ?? 'all',
    verifiedHost: p.get('verifiedHost') ?? 'all',
  };
}
