import type { PolledMarket } from "../schemas/polled-market.js";
import {
  GATE1_PREFIXES,
  domainOf,
  eventTitlePrefix,
  hasAnyUrl,
  isGate1Match,
  outcomeShape,
} from "./buckets.js";
import {
  KIND_LABELS,
  categorize,
  isDeterministicFeed,
  type MarketKind,
} from "./categorize.js";

export interface FunnelRow {
  step: string;
  delta: number;
  remaining: number;
  pctOfTotal: number;
}

export interface CoverageScenario {
  name: string;
  description: string;
  markets: number;
  pctOfTotal: number;
}

export interface KindBreakdown {
  kind: MarketKind;
  label: string;
  isDeterministicFeed: boolean;
  markets: number;
  uniqueTemplates: number;
  uniqueEvents: number;
  recurring: number;
  topTemplates: { template: string; count: number }[];
}

export interface TopFamily {
  template: string;
  kind: MarketKind;
  kindLabel: string;
  markets: number;
  recurring: boolean;
  domain: string;
}

export interface AnalyzeResult {
  totalRows: number;
  uniqueMarkets: number;
  uniqueEvents: number;
  uniqueTemplates: number;
  uniqueDomains: number;
  polledAtMin: string | null;
  polledAtMax: string | null;
  endDateMin: string | null;
  endDateMax: string | null;
  resolutionSourceBuckets: { domain: string; count: number; pct: number }[];
  ioResolutionSourceBuckets: { domain: string; count: number; pct: number }[];
  ioUniqueDomains: number;
  topFamilies: TopFamily[];
  gate1Chainlink: { matched: number; total: number; pct: number; prefixes: readonly string[] };
  gate1NoUrl: { matched: number; total: number; pct: number };
  gate1Dropped: number;

  funnel: FunnelRow[];
  coverageScenarios: CoverageScenario[];
  ioAddressableMarkets: number;
  ioAddressableTemplates: number;
  ioAddressableEvents: number;
  ioAddressableRecurring: number;
  ioAddressableNonRecurring: number;
  trulyIoShapedMarkets: number;
  trulyIoShapedTemplates: number;
  kindBreakdown: KindBreakdown[];

  topTags: { tag: string; count: number; pct: number }[];
  topEventTitlePrefixes: { prefix: string; count: number; pct: number }[];
  endTimeHistogram: { hour: number; count: number }[];
  outcomeShapes: { shape: string; count: number; pct: number }[];
}

const RECURRING_TAG = "recurring";

function pct(n: number, total: number): number {
  if (total === 0) return 0;
  return (n / total) * 100;
}

function topByCount<K>(
  counts: Map<K, number>,
  total: number,
  topN: number,
): { key: K; count: number; pct: number }[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([key, count]) => ({ key, count, pct: pct(count, total) }));
}

const isRecurring = (m: PolledMarket): boolean =>
  (m.tags ?? []).some((t) => t.toLowerCase() === RECURRING_TAG);

const ioAddressable = (m: PolledMarket): boolean =>
  !isGate1Match(m.eventResolutionSource) && hasAnyUrl(m);

function buildKindBreakdown(io: PolledMarket[]): KindBreakdown[] {
  const grouped = new Map<MarketKind, PolledMarket[]>();
  for (const m of io) {
    const k = categorize(m);
    let arr = grouped.get(k);
    if (!arr) {
      arr = [];
      grouped.set(k, arr);
    }
    arr.push(m);
  }

  const breakdown: KindBreakdown[] = [];
  for (const [kind, markets] of grouped.entries()) {
    const templates = new Set(markets.map((m) => eventTitlePrefix(m.eventTitle)));
    const events = new Set(
      markets.map((m) => m.eventId).filter((x): x is string => Boolean(x)),
    );
    const recurring = markets.filter(isRecurring).length;

    const tplCounts = new Map<string, number>();
    for (const m of markets) {
      const t = eventTitlePrefix(m.eventTitle);
      tplCounts.set(t, (tplCounts.get(t) ?? 0) + 1);
    }
    const topTemplates = [...tplCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([template, count]) => ({ template, count }));

    breakdown.push({
      kind,
      label: KIND_LABELS[kind],
      isDeterministicFeed: isDeterministicFeed(kind),
      markets: markets.length,
      uniqueTemplates: templates.size,
      uniqueEvents: events.size,
      recurring,
      topTemplates,
    });
  }

  return breakdown.sort((a, b) => b.markets - a.markets);
}

export function analyze(rows: PolledMarket[]): AnalyzeResult {
  const total = rows.length;
  const uniqueMarkets = new Set(rows.map((r) => r.id)).size;
  const uniqueEvents = new Set(
    rows.map((r) => r.eventId).filter((x): x is string => Boolean(x)),
  ).size;
  const uniqueTemplates = new Set(rows.map((r) => eventTitlePrefix(r.eventTitle))).size;

  const polledAt = rows.map((r) => r.polled_at).sort();
  const endDates = rows.map((r) => r.endDate).sort();

  const domainCounts = new Map<string, number>();
  for (const r of rows) {
    const d = domainOf(r.eventResolutionSource);
    domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
  }
  const resolutionSourceBuckets = topByCount(domainCounts, total, 20).map(
    ({ key, count, pct }) => ({ domain: key, count, pct }),
  );
  const uniqueDomains = domainCounts.size;

  const gate1Chainlink = rows.filter((r) => isGate1Match(r.eventResolutionSource)).length;
  const afterChainlink = total - gate1Chainlink;
  const gate1NoUrl = rows.filter(
    (r) => !isGate1Match(r.eventResolutionSource) && !hasAnyUrl(r),
  ).length;
  const ioStrict = afterChainlink - gate1NoUrl;
  const gate1Dropped = gate1Chainlink + gate1NoUrl;

  const funnel: FunnelRow[] = [
    { step: "Total polled", delta: total, remaining: total, pctOfTotal: 100 },
    {
      step: "Drop: Chainlink-fed (Gate 1a)",
      delta: -gate1Chainlink,
      remaining: afterChainlink,
      pctOfTotal: pct(afterChainlink, total),
    },
    {
      step: "Drop: no URL anywhere (Gate 1b)",
      delta: -gate1NoUrl,
      remaining: ioStrict,
      pctOfTotal: pct(ioStrict, total),
    },
  ];

  const ioRows = rows.filter(ioAddressable);
  const ioRecurring = ioRows.filter(isRecurring).length;
  const ioNonRecurring = ioRows.length - ioRecurring;
  const ioOneOff = ioNonRecurring;

  const coverageScenarios: CoverageScenario[] = [
    {
      name: "One-off only",
      description: "IO-addressable AND not tagged `recurring` (true novelty)",
      markets: ioOneOff,
      pctOfTotal: pct(ioOneOff, total),
    },
    {
      name: "Post-Gate-1 (deterministic exclusion)",
      description: "Drop Chainlink-fed AND drop markets with no URL anywhere",
      markets: ioStrict,
      pctOfTotal: pct(ioStrict, total),
    },
  ];

  const kindBreakdown = buildKindBreakdown(ioRows);
  const ioAddressableTemplates = new Set(
    ioRows.map((m) => eventTitlePrefix(m.eventTitle)),
  ).size;
  const ioAddressableEvents = new Set(
    ioRows.map((m) => m.eventId).filter((x): x is string => Boolean(x)),
  ).size;

  const trulyIoShaped = ioRows.filter((m) => !isDeterministicFeed(categorize(m)));
  const trulyIoShapedTemplates = new Set(
    trulyIoShaped.map((m) => eventTitlePrefix(m.eventTitle)),
  ).size;

  const ioDomainCounts = new Map<string, number>();
  for (const r of ioRows) {
    const d = domainOf(r.eventResolutionSource);
    ioDomainCounts.set(d, (ioDomainCounts.get(d) ?? 0) + 1);
  }
  const ioResolutionSourceBuckets = topByCount(ioDomainCounts, ioRows.length, 20).map(
    ({ key, count, pct }) => ({ domain: key, count, pct }),
  );
  const ioUniqueDomains = ioDomainCounts.size;

  const familyMarkets = new Map<string, PolledMarket[]>();
  for (const r of ioRows) {
    const t = eventTitlePrefix(r.eventTitle);
    let arr = familyMarkets.get(t);
    if (!arr) {
      arr = [];
      familyMarkets.set(t, arr);
    }
    arr.push(r);
  }
  const topFamilies: TopFamily[] = [...familyMarkets.entries()]
    .map(([template, markets]) => {
      const sample = markets[0]!;
      const k = categorize(sample);
      return {
        template,
        kind: k,
        kindLabel: KIND_LABELS[k],
        markets: markets.length,
        recurring: markets.some(isRecurring),
        domain: domainOf(sample.eventResolutionSource),
      };
    })
    .sort((a, b) => b.markets - a.markets)
    .slice(0, 15);

  const tagCounts = new Map<string, number>();
  for (const r of rows) {
    for (const t of r.tags ?? []) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const topTags = topByCount(tagCounts, total, 20).map(({ key, count, pct }) => ({
    tag: key,
    count,
    pct,
  }));

  const titleCounts = new Map<string, number>();
  for (const r of rows) {
    const p = eventTitlePrefix(r.eventTitle);
    titleCounts.set(p, (titleCounts.get(p) ?? 0) + 1);
  }
  const topEventTitlePrefixes = topByCount(titleCounts, total, 20).map(
    ({ key, count, pct }) => ({ prefix: key, count, pct }),
  );

  const endTimeHistogram: { hour: number; count: number }[] = [];
  if (polledAt.length > 0) {
    const polledMin = new Date(polledAt[0]!).getTime();
    const hourCounts = new Map<number, number>();
    for (const r of rows) {
      const endMs = new Date(r.endDate).getTime();
      const hour = Math.floor((endMs - polledMin) / 3_600_000);
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    }
    for (const [hour, count] of [...hourCounts.entries()].sort((a, b) => a[0] - b[0])) {
      endTimeHistogram.push({ hour, count });
    }
  }

  const shapeCounts = new Map<string, number>();
  for (const r of rows) {
    shapeCounts.set(
      outcomeShape(r.outcomes.length),
      (shapeCounts.get(outcomeShape(r.outcomes.length)) ?? 0) + 1,
    );
  }
  const outcomeShapes = topByCount(shapeCounts, total, 10).map(({ key, count, pct }) => ({
    shape: key,
    count,
    pct,
  }));

  return {
    totalRows: total,
    uniqueMarkets,
    uniqueEvents,
    uniqueTemplates,
    uniqueDomains,
    polledAtMin: polledAt[0] ?? null,
    polledAtMax: polledAt[polledAt.length - 1] ?? null,
    endDateMin: endDates[0] ?? null,
    endDateMax: endDates[endDates.length - 1] ?? null,
    resolutionSourceBuckets,
    ioResolutionSourceBuckets,
    ioUniqueDomains,
    topFamilies,
    gate1Chainlink: {
      matched: gate1Chainlink,
      total,
      pct: pct(gate1Chainlink, total),
      prefixes: GATE1_PREFIXES,
    },
    gate1NoUrl: { matched: gate1NoUrl, total, pct: pct(gate1NoUrl, total) },
    gate1Dropped,
    funnel,
    coverageScenarios,
    ioAddressableMarkets: ioRows.length,
    ioAddressableTemplates,
    ioAddressableEvents,
    ioAddressableRecurring: ioRecurring,
    ioAddressableNonRecurring: ioNonRecurring,
    trulyIoShapedMarkets: trulyIoShaped.length,
    trulyIoShapedTemplates,
    kindBreakdown,
    topTags,
    topEventTitlePrefixes,
    endTimeHistogram,
    outcomeShapes,
  };
}
