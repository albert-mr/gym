// Shape of data/<benchmark>/latest.json produced by build-data-json.mjs in pm-bench.
// Future benchmarks should conform to this shape so the dashboard renders them.

export type Winner = string; // 'Yes' | 'No' | 'Up' | 'Down' | 'Over' | 'Under' | team name | 'pending'

export type MarketExample = {
  id: string;
  date: string;
  question: string;
  eventTitle: string;
  eventSlug: string;
  eRS: string;
  eRSHost: string;
  rebindHost: string;
  bucket: string;
  winner: Winner;
  outcomes: string[];
};

export type Template = {
  id: string;
  L1: string;
  L2: string;
  L3: string;
  template: string;
  count: number;
  buckets: Record<string, number>;
  dominantBucket: string;
  eRSHosts: string[];
  rebindHost: string;
  dates: string[];
  example: MarketExample;
};

export type PerDay = {
  gate1Pass: number;
  solved: number;
  solvedPct: number;
  resolved: number;
  buckets: Record<string, number>;
  directDeep: number;
  directShallow: number;
  alt: number;
  unsolvable: number;
};

export type DomainRow = {
  host: string;
  count: number;
  buckets: Record<string, number>;
  dominantBucket: string;
  rebind: string;
  category: string; // dominant L1 across markets bound to this host
};

export type Unsolvable = {
  id: string;
  date: string;
  question: string;
  bucket: string;
  eRS: string;
  eRSHost: string;
  slug: string;
  winner: Winner;
};

export type MarketRow = {
  id: string;
  date: string;
  question: string;
  eRSHost: string;
  rebindHost: string;
  bucket: string;
  winner: Winner;
  slug: string;
};

export type BenchmarkData = {
  meta: {
    dates: string[];
    generatedAt: string;
    totalPass: number;
    totalSolved: number;
    headlinePct: number;
    resolvedCorrectlyPct: number;
    window: { start: string; end: string };
  };
  perDay: Record<string, PerDay>;
  templates: Template[];
  domains: DomainRow[];
  unsolvables: Unsolvable[];
  marketsByTemplate: Record<string, MarketRow[]>;
  onchainFeedStats: {
    chainlink: number;
    pyth: number;
    chainlinkPlusPyth: number;
    addressable: number;
    polledUniverse: number;
    chainlinkPct: number;
    pythPct: number;
    onchainFeedPct: number;
    addressablePct: number;
  };
  bucketLabels: Record<string, string>;
  bucketColors: Record<string, string>;
};

export type ComingSoonData = {
  name: string;
  description: string;
  status: 'planned' | 'in-progress';
  link?: string;
};

// Per-market detail row from apps/web/public/data/pm-bench/markets.json.
// Used by the per-market detail page at /benchmarks/polymarket/markets/[slug]
// and by the downloadable dataset for API consumers.
export type MarketDetail = {
  id: string;
  date: string;
  slug: string;
  question: string;
  namedSource: string | null;
  verifiedSource: string | null;
  status: 'accessible' | 'alternative' | 'blocked';
  bucket: string;
  winner: Winner;
};

export type MarketsDoc = {
  markets: MarketDetail[];
  meta: {
    generatedAt: string;
    window: { start: string; end: string };
    counts: { accessible: number; alternative: number; blocked: number; total: number };
    headlinePct: number;
    resolvedCorrectlyPct: number;
    schema: string;
    notes: string;
  };
};

export const DIRECT_BUCKETS = new Set(['render', 'api']);
export const ALT_BUCKETS = new Set(['alt', 'liquipedia_recover', 'bo3_recover', 'frmf_via_flashscore', 'eurovision_via_wiki']);
export const UNSOLVABLE_BUCKETS = new Set(['hard', 'yahoo', 'subjective', 'misc', 'no_source', 'studio_blocked', 'hltv_lost']);
export const SOLVED_BUCKETS = new Set(['render', 'alt', 'api', 'liquipedia_recover', 'bo3_recover', 'frmf_via_flashscore', 'eurovision_via_wiki']);
