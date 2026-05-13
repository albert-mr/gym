import type { BenchmarkData, ExplorerCircle, ExplorerMarketRow } from './types';
import { ALT_BUCKETS, DIRECT_BUCKETS, SOLVED_BUCKETS, UNSOLVABLE_BUCKETS } from './types';
import type { ExplorerFilterState } from './explorer-filters';

export const CIRCLE_META: Record<ExplorerCircle, { label: string; shortLabel: string; color: string; description: string }> = {
  chainlink: {
    label: 'Chainlink',
    shortLabel: 'chainlink',
    color: '#7c3aed',
    description: 'Deterministic on-chain price-feed markets. The Intelligent Oracle has no role.',
  },
  pyth: {
    label: 'Pyth',
    shortLabel: 'pyth',
    color: '#0ea5e9',
    description: 'Deterministic Pyth price-feed markets. The Intelligent Oracle has no role.',
  },
  direct: {
    label: 'Direct source',
    shortLabel: 'direct',
    color: '#10b981',
    description: 'The Intelligent Oracle can use the source host Polymarket named.',
  },
  alternative: {
    label: 'Alternative source',
    shortLabel: 'alternative',
    color: '#84cc16',
    description: 'The named source is not reachable, so the route uses a verified alternative source.',
  },
  held: {
    label: 'Held / unresolvable',
    shortLabel: 'held',
    color: '#f59e0b',
    description: 'Paywall, login, captcha, no source URL, or markets needing a different resolution mode.',
  },
};

export const CIRCLE_ORDER: ExplorerCircle[] = ['chainlink', 'pyth', 'direct', 'alternative', 'held'];

export type TemplateGroup = {
  id: string;
  L1: string;
  L2: string;
  L3: string;
  template: string;
  count: number;
  buckets: Record<string, number>;
  circles: Record<ExplorerCircle, number>;
  dominantBucket: string;
  namedHosts: string[];
  verifiedHosts: string[];
  dates: string[];
  rows: ExplorerMarketRow[];
  example: ExplorerMarketRow;
};

export type SourceHostGroup = {
  host: string;
  count: number;
  buckets: Record<string, number>;
  circles: Record<ExplorerCircle, number>;
  dominantBucket: string;
  category: string;
  verifiedHosts: string[];
  rows: ExplorerMarketRow[];
};

export function rowCount(rows: ExplorerMarketRow[]): number {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

export function circleForBucket(bucket: string): ExplorerCircle {
  if (bucket === 'chainlink') return 'chainlink';
  if (bucket === 'pyth') return 'pyth';
  if (DIRECT_BUCKETS.has(bucket)) return 'direct';
  if (ALT_BUCKETS.has(bucket)) return 'alternative';
  return 'held';
}

export function bucketLabel(data: BenchmarkData, bucket: string): string {
  if (bucket === 'chainlink') return 'Chainlink';
  if (bucket === 'pyth') return 'Pyth';
  return data.bucketLabels[bucket] ?? bucket;
}

export function bucketColor(data: BenchmarkData, bucket: string): string {
  if (bucket === 'chainlink') return CIRCLE_META.chainlink.color;
  if (bucket === 'pyth') return CIRCLE_META.pyth.color;
  return data.bucketColors[bucket] ?? '#64748b';
}

export function buildExplorerRows(data: BenchmarkData): ExplorerMarketRow[] {
  const rows: ExplorerMarketRow[] = [];

  for (const template of data.templates) {
    const markets = data.marketsByTemplate[template.id] ?? [];
    for (const market of markets) {
      const circle = circleForBucket(market.bucket);
      rows.push({
        id: market.id,
        date: market.date,
        question: market.question,
        circle,
        bucket: market.bucket,
        namedHost: market.eRSHost || '(none)',
        verifiedHost: market.rebindHost || '',
        L1: template.L1,
        L2: template.L2,
        L3: template.L3,
        template: template.template,
        winner: market.winner,
        slug: market.slug || market.id,
        eventSlug: market.eventSlug || '',
        count: 1,
        detailAvailable: true,
      });
    }
    if (markets.length < template.count) {
      const missing = template.count - markets.length;
      const example = template.example;
      const circle = circleForBucket(example.bucket);
      rows.push({
        id: `${template.id}-missing-${missing}`,
        date: example.date || template.dates[0] || '',
        question: example.question || `${missing.toLocaleString()} markets matching: ${template.template}`,
        circle,
        bucket: example.bucket,
        namedHost: example.eRSHost || '(none)',
        verifiedHost: example.rebindHost || '',
        L1: template.L1,
        L2: template.L2,
        L3: template.L3,
        template: template.template,
        winner: example.winner,
        slug: example.eventSlug || example.id,
        eventSlug: example.eventSlug || '',
        count: missing,
        synthetic: true,
        detailAvailable: false,
      });
    }
  }

  for (const row of data.onchainMarkets ?? []) {
    rows.push({
      ...row,
      namedHost: row.namedHost || '(none)',
      verifiedHost: row.verifiedHost || row.namedHost || '',
      count: row.count || 1,
      detailAvailable: row.detailAvailable ?? false,
    });
  }
  addOnchainAggregateFallbacks(data, rows);

  return sortRows(rows);
}

export function applyExplorerFilters(rows: ExplorerMarketRow[], filters: ExplorerFilterState): ExplorerMarketRow[] {
  const q = filters.search.trim().toLowerCase();
  const bucketSet = filters.buckets.length ? new Set(filters.buckets) : null;
  const circleSet = filters.circles.length ? new Set<ExplorerCircle>(filters.circles) : null;

  return rows.filter(row => {
    if (filters.date !== 'all' && row.date !== filters.date) return false;
    if (bucketSet && !bucketSet.has(row.bucket)) return false;
    if (circleSet && !circleSet.has(row.circle)) return false;
    if (filters.solvedOnly && !SOLVED_BUCKETS.has(row.bucket)) return false;
    if (filters.status === 'solved' && !SOLVED_BUCKETS.has(row.bucket)) return false;
    if (filters.status === 'unresolvable' && row.circle !== 'held') return false;
    if (filters.status === 'disagrees') return false;
    if (filters.host !== 'all' && row.namedHost !== filters.host) return false;
    if (filters.verifiedHost !== 'all' && row.verifiedHost !== filters.verifiedHost) return false;
    if (q) {
      const hay = `${row.question} ${row.template} ${row.namedHost} ${row.verifiedHost} ${row.L1} ${row.L2} ${row.L3} ${row.bucket} ${row.circle}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function buildTemplateGroups(rows: ExplorerMarketRow[]): TemplateGroup[] {
  const groups = new Map<string, TemplateGroup>();
  for (const row of rows) {
    const id = `${row.L1}|${row.L2}|${row.L3}|${row.template}`;
    let group = groups.get(id);
    if (!group) {
      group = {
        id,
        L1: row.L1,
        L2: row.L2,
        L3: row.L3,
        template: row.template,
        count: 0,
        buckets: {},
        circles: emptyCircleCounts(),
        dominantBucket: row.bucket,
        namedHosts: [],
        verifiedHosts: [],
        dates: [],
        rows: [],
        example: row,
      };
      groups.set(id, group);
    }
    addRowToGroup(group, row);
  }

  return [...groups.values()].map(group => finalizeTemplateGroup(group)).sort((a, b) => b.count - a.count);
}

export function buildSourceHostGroups(rows: ExplorerMarketRow[]): SourceHostGroup[] {
  const groups = new Map<string, SourceHostGroup>();
  for (const row of rows) {
    const host = row.namedHost || '(none)';
    let group = groups.get(host);
    if (!group) {
      group = {
        host,
        count: 0,
        buckets: {},
        circles: emptyCircleCounts(),
        dominantBucket: row.bucket,
        category: row.L1,
        verifiedHosts: [],
        rows: [],
      };
      groups.set(host, group);
    }
    addRowToSourceGroup(group, row);
  }
  return [...groups.values()].map(finalizeSourceGroup).sort((a, b) => b.count - a.count);
}

export function summarizeRows(rows: ExplorerMarketRow[]) {
  const circles = emptyCircleCounts();
  const buckets: Record<string, number> = {};
  const templates = new Set<string>();
  for (const row of rows) {
    circles[row.circle] += row.count;
    buckets[row.bucket] = (buckets[row.bucket] ?? 0) + row.count;
    templates.add(`${row.L1}|${row.L2}|${row.L3}|${row.template}`);
  }
  return { markets: rowCount(rows), templates: templates.size, circles, buckets };
}

export function topCounts(values: Record<string, number>, limit = 3): string[] {
  return Object.entries(values)
    .filter(([name]) => !!name)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => `${name} (${count.toLocaleString()})`);
}

export function sortRows(rows: ExplorerMarketRow[]): ExplorerMarketRow[] {
  return [...rows].sort((a, b) => {
    if (a.synthetic !== b.synthetic) return a.synthetic ? 1 : -1;
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.count !== b.count) return b.count - a.count;
    return a.question.localeCompare(b.question);
  });
}

function emptyCircleCounts(): Record<ExplorerCircle, number> {
  return { chainlink: 0, pyth: 0, direct: 0, alternative: 0, held: 0 };
}

function addRowToGroup(group: TemplateGroup, row: ExplorerMarketRow) {
  group.count += row.count;
  group.buckets[row.bucket] = (group.buckets[row.bucket] ?? 0) + row.count;
  group.circles[row.circle] += row.count;
  group.rows.push(row);
  if (!row.synthetic && group.example.synthetic) group.example = row;
  if (row.count > group.example.count && !row.synthetic) group.example = row;
}

function addRowToSourceGroup(group: SourceHostGroup, row: ExplorerMarketRow) {
  group.count += row.count;
  group.buckets[row.bucket] = (group.buckets[row.bucket] ?? 0) + row.count;
  group.circles[row.circle] += row.count;
  group.rows.push(row);
}

function finalizeTemplateGroup(group: TemplateGroup): TemplateGroup {
  const namedHostCounts: Record<string, number> = {};
  const verifiedHostCounts: Record<string, number> = {};
  const dateSet = new Set<string>();
  for (const row of group.rows) {
    if (row.namedHost) namedHostCounts[row.namedHost] = (namedHostCounts[row.namedHost] ?? 0) + row.count;
    if (row.verifiedHost) verifiedHostCounts[row.verifiedHost] = (verifiedHostCounts[row.verifiedHost] ?? 0) + row.count;
    if (row.date) dateSet.add(row.date);
  }
  group.dominantBucket = dominantKey(group.buckets);
  group.namedHosts = topCounts(namedHostCounts, 4);
  group.verifiedHosts = topCounts(verifiedHostCounts, 4);
  group.dates = [...dateSet].sort();
  group.rows = sortRows(group.rows);
  return group;
}

function finalizeSourceGroup(group: SourceHostGroup): SourceHostGroup {
  const categoryCounts: Record<string, number> = {};
  const verifiedHostCounts: Record<string, number> = {};
  for (const row of group.rows) {
    categoryCounts[row.L1] = (categoryCounts[row.L1] ?? 0) + row.count;
    if (row.verifiedHost) verifiedHostCounts[row.verifiedHost] = (verifiedHostCounts[row.verifiedHost] ?? 0) + row.count;
  }
  group.dominantBucket = dominantKey(group.buckets);
  group.category = dominantKey(categoryCounts);
  group.verifiedHosts = topCounts(verifiedHostCounts, 4);
  group.rows = sortRows(group.rows);
  return group;
}

function dominantKey(values: Record<string, number>): string {
  let best = '';
  let bestValue = -1;
  for (const [key, value] of Object.entries(values)) {
    if (value > bestValue) {
      best = key;
      bestValue = value;
    }
  }
  return best;
}

function addOnchainAggregateFallbacks(data: BenchmarkData, rows: ExplorerMarketRow[]) {
  const expected = {
    chainlink: data.onchainFeedStats?.chainlink ?? 0,
    pyth: data.onchainFeedStats?.pyth ?? 0,
  };
  const observed = { chainlink: 0, pyth: 0 };
  for (const row of rows) {
    if (row.circle === 'chainlink') observed.chainlink += row.count;
    if (row.circle === 'pyth') observed.pyth += row.count;
  }

  addOnchainFallbackRows(data, rows, 'chainlink', Math.max(0, expected.chainlink - observed.chainlink));
  addOnchainFallbackRows(data, rows, 'pyth', Math.max(0, expected.pyth - observed.pyth));
}

function addOnchainFallbackRows(data: BenchmarkData, rows: ExplorerMarketRow[], circle: 'chainlink' | 'pyth', count: number) {
  if (!count) return;
  const daily = data.meta.dates
    .map(date => ({ date, count: Math.max(0, Math.floor(Number(data.perDay[date]?.[circle] ?? 0))) }))
    .filter(day => day.count > 0);

  if (daily.length > 0) {
    let remaining = count;
    for (const day of daily) {
      if (remaining <= 0) break;
      const dayCount = Math.min(day.count, remaining);
      addOnchainAggregateRow(rows, circle, dayCount, day.date);
      remaining -= dayCount;
    }
    if (remaining <= 0) return;
    count = remaining;
  }

  addOnchainAggregateRow(rows, circle, count, '');
}

function addOnchainAggregateRow(rows: ExplorerMarketRow[], circle: 'chainlink' | 'pyth', count: number, date: string) {
  if (!count) return;
  const meta = CIRCLE_META[circle];
  const host = circle === 'chainlink' ? 'data.chain.link' : 'pythdata.app';
  rows.push({
    id: `${circle}-aggregate-${date || 'undated'}`,
    date,
    question: `${count.toLocaleString()} ${meta.label} markets handed back to deterministic on-chain feeds${date ? ` on ${date}` : ''}`,
    circle,
    bucket: circle,
    namedHost: host,
    verifiedHost: host,
    L1: 'On-chain feeds',
    L2: meta.label,
    L3: 'Deterministic oracle',
    template: `${meta.label} on-chain feed market`,
    winner: 'pending',
    slug: '',
    eventSlug: '',
    count,
    synthetic: true,
    detailAvailable: false,
    polymarketUrl: '',
  });
}
