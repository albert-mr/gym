// Shared filter state for the explorer page. ExplorerFilters owns the state
// and writes to URL params; DrilldownTree, DomainTable, ExplorerSummary,
// MarketsList all consume the resolved filters via props. One source of truth.

export type StatusFilter = 'all' | 'solved' | 'disagrees' | 'unresolvable';

export type ExplorerFilterState = {
  date: string;
  buckets: string[];
  status: StatusFilter;
  solvedOnly: boolean;
  search: string;
  host: string;
};

export const defaultExplorerFilters: ExplorerFilterState = {
  date: 'all',
  buckets: [],
  status: 'all',
  solvedOnly: false,
  search: '',
  host: 'all',
};

// Umbrella categories shown in the explorer filter dropdown. Each one expands
// to a set of internal bucket keys; badges elsewhere still render the precise
// per-bucket label.
export const BUCKET_GROUPS: { id: string; label: string; buckets: string[] }[] = [
  { id: 'direct', label: 'Direct Source', buckets: ['render', 'api'] },
  { id: 'alt', label: 'Alternative Source', buckets: ['alt', 'liquipedia_recover', 'bo3_recover', 'frmf_via_flashscore', 'eurovision_via_wiki'] },
  { id: 'no_alt', label: 'No alternative available', buckets: ['hltv_lost', 'hard', 'yahoo', 'subjective'] },
  { id: 'unclassified', label: 'Unclassified', buckets: ['misc'] },
  { id: 'no_source', label: 'No Source', buckets: ['no_source'] },
  { id: 'errors', label: 'Errors', buckets: ['studio_blocked'] },
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

export function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

export function filtersToParams(f: ExplorerFilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.date !== 'all') p.set('date', f.date);
  if (f.buckets.length) p.set('bucket', f.buckets.join(','));
  if (f.status !== 'all') p.set('status', f.status);
  if (f.solvedOnly) p.set('solved', '1');
  if (f.search.trim()) p.set('q', f.search.trim());
  if (f.host !== 'all') p.set('host', f.host);
  return p;
}

export function paramsToFilters(p: URLSearchParams): ExplorerFilterState {
  const status = p.get('status');
  return {
    date: p.get('date') ?? 'all',
    buckets: parseList(p.get('bucket')),
    status: status === 'solved' || status === 'disagrees' || status === 'unresolvable' ? status : 'all',
    solvedOnly: p.get('solved') === '1',
    search: p.get('q') ?? '',
    host: p.get('host') ?? 'all',
  };
}
