// Shared filter state for the explorer page. ExplorerFilters owns the state
// and writes to URL params; DrilldownTree, DomainTable, ExplorerSummary,
// MarketsList all consume the resolved filters via props. One source of truth.

export type StatusFilter = 'all' | 'solved' | 'disagrees' | 'unresolvable';
export type FamilyFilter = 'all' | 'no-chainlink' | 'no-pyth' | 'no-both';

export type ExplorerFilterState = {
  date: string;
  buckets: string[];
  status: StatusFilter;
  family: FamilyFilter;
  solvedOnly: boolean;
  search: string;
  host: string;
};

export const defaultExplorerFilters: ExplorerFilterState = {
  date: 'all',
  buckets: [],
  status: 'all',
  family: 'all',
  solvedOnly: false,
  search: '',
  host: 'all',
};

export function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

export function filtersToParams(f: ExplorerFilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.date !== 'all') p.set('date', f.date);
  if (f.buckets.length) p.set('bucket', f.buckets.join(','));
  if (f.status !== 'all') p.set('status', f.status);
  if (f.family !== 'all') p.set('family', f.family);
  if (f.solvedOnly) p.set('solved', '1');
  if (f.search.trim()) p.set('q', f.search.trim());
  if (f.host !== 'all') p.set('host', f.host);
  return p;
}

export function paramsToFilters(p: URLSearchParams): ExplorerFilterState {
  const status = p.get('status');
  const family = p.get('family');
  return {
    date: p.get('date') ?? 'all',
    buckets: parseList(p.get('bucket')),
    status: status === 'solved' || status === 'disagrees' || status === 'unresolvable' ? status : 'all',
    family: family === 'no-chainlink' || family === 'no-pyth' || family === 'no-both' ? family : 'all',
    solvedOnly: p.get('solved') === '1',
    search: p.get('q') ?? '',
    host: p.get('host') ?? 'all',
  };
}
