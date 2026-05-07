export interface SummaryKind {
  kind: string;
  label: string;
  markets: number;
  unique_templates: number;
  unique_events: number;
  recurring: number;
  deterministic_feed: boolean;
}

export interface SummaryDomain {
  domain: string;
  count: number;
  pct: number;
}

export interface SummaryFamily {
  template: string;
  kind: string;
  kindLabel: string;
  markets: number;
  recurring: boolean;
  domain: string;
}

export interface DaySummary {
  date: string;
  total_rows: number;
  unique_markets: number;
  unique_events: number;
  unique_templates: number;
  unique_domains: number;
  polled_at_min: string | null;
  polled_at_max: string | null;
  gate1_chainlink: { matched: number; pct: number };
  gate1_no_url: { matched: number; pct: number };
  gate1_dropped: number;
  io_addressable_markets: number;
  io_addressable_templates: number;
  io_addressable_events: number;
  io_addressable_recurring: number;
  io_addressable_non_recurring: number;
  io_unique_domains: number;
  truly_io_shaped_markets: number;
  truly_io_shaped_templates: number;
  kinds: SummaryKind[];
  resolution_source_buckets: SummaryDomain[];
  io_resolution_source_buckets: SummaryDomain[];
  top_families: SummaryFamily[];
}

export interface MetricDelta {
  key: string;
  label: string;
  today: number;
  prev: number | null;
  delta: number | null;
  deltaPct: number | null;
  unit: "count" | "pct";
}

export interface KindShift {
  kind: string;
  label: string;
  todayTemplates: number;
  prevTemplates: number;
  templatesDelta: number;
  todayMarkets: number;
  prevMarkets: number;
  marketsDelta: number;
  deterministic_feed: boolean;
  is_new: boolean;
  is_dropped: boolean;
}

export interface DomainShift {
  domain: string;
  todayCount: number | null;
  todayPct: number | null;
  prevCount: number | null;
  prevPct: number | null;
  delta: number | null;
  deltaPct: number | null;
  status: "new" | "dropped" | "shifted" | "stable";
}

export interface FamilyEntry {
  template: string;
  kindLabel: string;
  domain: string;
  markets: number;
  recurring: boolean;
}

export interface FilteredCallout {
  chainlink: { markets: number; pct: number };
  noUrl: { markets: number; pct: number };
  totalFiltered: { markets: number; pct: number };
  ioAddressableMarkets: number;
  ioAddressablePct: number;
}

export interface DailyReport {
  date: string;
  prevDate: string | null;
  filtered: FilteredCallout;
  prevFiltered: FilteredCallout | null;
  metrics: MetricDelta[];
  kindShifts: KindShift[];
  topDomainShifts: DomainShift[];
  newDomains: DomainShift[];
  droppedDomains: DomainShift[];
  topFamilies: FamilyEntry[];
}

const SIGNIFICANT_DOMAIN_PCT = 1.0;
const TOP_DOMAINS_TO_COMPARE = 10;
const TOP_FAMILIES_TO_SHOW = 12;

function metric(
  key: string,
  label: string,
  today: number,
  prev: number | null,
  unit: MetricDelta["unit"],
): MetricDelta {
  if (prev === null) {
    return { key, label, today, prev: null, delta: null, deltaPct: null, unit };
  }
  const delta = today - prev;
  const deltaPct = prev === 0 ? null : (delta / prev) * 100;
  return { key, label, today, prev, delta, deltaPct, unit };
}

function pctOf(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

function buildFiltered(s: DaySummary): FilteredCallout {
  const totalFilteredMarkets = s.gate1_dropped;
  return {
    chainlink: { markets: s.gate1_chainlink.matched, pct: s.gate1_chainlink.pct },
    noUrl: { markets: s.gate1_no_url.matched, pct: s.gate1_no_url.pct },
    totalFiltered: { markets: totalFilteredMarkets, pct: pctOf(totalFilteredMarkets, s.total_rows) },
    ioAddressableMarkets: s.io_addressable_markets,
    ioAddressablePct: pctOf(s.io_addressable_markets, s.total_rows),
  };
}

export function computeDailyReport(today: DaySummary, prev: DaySummary | null): DailyReport {
  const metrics: MetricDelta[] = [
    metric("io_addressable_templates", "IO-addressable: unique templates", today.io_addressable_templates, prev?.io_addressable_templates ?? null, "count"),
    metric("io_addressable_events", "IO-addressable: unique events", today.io_addressable_events, prev?.io_addressable_events ?? null, "count"),
    metric("io_unique_domains", "IO-addressable: unique domains", today.io_unique_domains, prev?.io_unique_domains ?? null, "count"),
    metric("io_addressable_markets", "IO-addressable: markets (total)", today.io_addressable_markets, prev?.io_addressable_markets ?? null, "count"),
    metric("io_addressable_recurring", "IO-addressable: recurring markets", today.io_addressable_recurring, prev?.io_addressable_recurring ?? null, "count"),
    metric("io_addressable_non_recurring", "IO-addressable: one-off markets", today.io_addressable_non_recurring, prev?.io_addressable_non_recurring ?? null, "count"),
    metric("truly_io_shaped_templates", "Truly-IO-shaped templates", today.truly_io_shaped_templates, prev?.truly_io_shaped_templates ?? null, "count"),
  ];

  const kindShifts = buildKindShifts(today, prev);
  const { topDomainShifts, newDomains, droppedDomains } = buildDomainShifts(today, prev);

  const topFamilies = today.top_families.slice(0, TOP_FAMILIES_TO_SHOW).map((f) => ({
    template: f.template,
    kindLabel: f.kindLabel,
    domain: f.domain,
    markets: f.markets,
    recurring: f.recurring,
  }));

  return {
    date: today.date,
    prevDate: prev?.date ?? null,
    filtered: buildFiltered(today),
    prevFiltered: prev ? buildFiltered(prev) : null,
    metrics,
    kindShifts,
    topDomainShifts,
    newDomains,
    droppedDomains,
    topFamilies,
  };
}

function buildKindShifts(today: DaySummary, prev: DaySummary | null): KindShift[] {
  const prevByKind = new Map<string, SummaryKind>();
  for (const k of prev?.kinds ?? []) prevByKind.set(k.kind, k);

  const shifts: KindShift[] = [];
  for (const k of today.kinds) {
    const p = prevByKind.get(k.kind);
    shifts.push({
      kind: k.kind,
      label: k.label,
      todayTemplates: k.unique_templates,
      prevTemplates: p?.unique_templates ?? 0,
      templatesDelta: k.unique_templates - (p?.unique_templates ?? 0),
      todayMarkets: k.markets,
      prevMarkets: p?.markets ?? 0,
      marketsDelta: k.markets - (p?.markets ?? 0),
      deterministic_feed: k.deterministic_feed,
      is_new: !p,
      is_dropped: false,
    });
    if (p) prevByKind.delete(k.kind);
  }
  for (const p of prevByKind.values()) {
    shifts.push({
      kind: p.kind,
      label: p.label,
      todayTemplates: 0,
      prevTemplates: p.unique_templates,
      templatesDelta: -p.unique_templates,
      todayMarkets: 0,
      prevMarkets: p.markets,
      marketsDelta: -p.markets,
      deterministic_feed: p.deterministic_feed,
      is_new: false,
      is_dropped: true,
    });
  }
  return shifts.sort(
    (a, b) => b.todayTemplates - a.todayTemplates || b.prevTemplates - a.prevTemplates,
  );
}

function buildDomainShifts(
  today: DaySummary,
  prev: DaySummary | null,
): { topDomainShifts: DomainShift[]; newDomains: DomainShift[]; droppedDomains: DomainShift[] } {
  const prevByDomain = new Map<string, SummaryDomain>();
  for (const d of prev?.io_resolution_source_buckets ?? []) prevByDomain.set(d.domain, d);

  const todayByDomain = new Map<string, SummaryDomain>();
  for (const d of today.io_resolution_source_buckets) todayByDomain.set(d.domain, d);

  const all = new Set<string>([...todayByDomain.keys(), ...prevByDomain.keys()]);
  const shifts: DomainShift[] = [];

  for (const dom of all) {
    const t = todayByDomain.get(dom) ?? null;
    const p = prevByDomain.get(dom) ?? null;
    const todayCount = t?.count ?? null;
    const todayPct = t?.pct ?? null;
    const prevCount = p?.count ?? null;
    const prevPct = p?.pct ?? null;
    let status: DomainShift["status"] = "stable";
    let delta: number | null = null;
    let deltaPct: number | null = null;

    if (t && !p) status = "new";
    else if (!t && p) status = "dropped";
    else if (t && p) {
      delta = t.count - p.count;
      deltaPct = (t.pct ?? 0) - (p.pct ?? 0);
      if (Math.abs(deltaPct) >= SIGNIFICANT_DOMAIN_PCT) status = "shifted";
    }

    shifts.push({ domain: dom, todayCount, todayPct, prevCount, prevPct, delta, deltaPct, status });
  }

  const topDomainShifts = shifts
    .filter((s) => s.todayCount !== null)
    .sort((a, b) => (b.todayCount ?? 0) - (a.todayCount ?? 0))
    .slice(0, TOP_DOMAINS_TO_COMPARE);

  const newDomains = shifts
    .filter((s) => s.status === "new" && (s.todayPct ?? 0) >= SIGNIFICANT_DOMAIN_PCT)
    .sort((a, b) => (b.todayCount ?? 0) - (a.todayCount ?? 0));

  const droppedDomains = shifts
    .filter((s) => s.status === "dropped" && (s.prevPct ?? 0) >= SIGNIFICANT_DOMAIN_PCT)
    .sort((a, b) => (b.prevCount ?? 0) - (a.prevCount ?? 0));

  return { topDomainShifts, newDomains, droppedDomains };
}

const fmtNum = (n: number): string => n.toLocaleString("en-US");
const fmtPct = (n: number): string => `${n.toFixed(1)}%`;
const fmtSigned = (n: number): string => (n > 0 ? `+${fmtNum(n)}` : fmtNum(n));
const fmtSignedPct = (n: number): string => (n > 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%`);

function fmtMetricValue(v: number, unit: MetricDelta["unit"]): string {
  if (unit === "pct") return fmtPct(v);
  return fmtNum(v);
}
function fmtMetricDelta(m: MetricDelta): string {
  if (m.delta === null) return "—";
  if (m.unit === "pct") return fmtSignedPct(m.delta);
  const base = fmtSigned(m.delta);
  return m.deltaPct === null ? base : `${base} (${fmtSignedPct(m.deltaPct)})`;
}

export function renderDailyReportMarkdown(report: DailyReport): string {
  const lines: string[] = [];
  lines.push(`# pm-bench daily report — ${report.date}`);
  lines.push("");
  if (report.prevDate) {
    lines.push(`Comparing **${report.date}** against **${report.prevDate}**.`);
  } else {
    lines.push(`No prior snapshot found — this is the baseline.`);
  }
  lines.push("");

  // Filtered-out callout: small, deterministic exclusions surfaced once at the top.
  lines.push(`## Filtered out (deterministic excludes)`);
  lines.push("");
  const f = report.filtered;
  lines.push(
    `- Chainlink-fed: **${fmtNum(f.chainlink.markets)}** markets (${fmtPct(f.chainlink.pct)})`,
  );
  lines.push(
    `- No URL anywhere: **${fmtNum(f.noUrl.markets)}** markets (${fmtPct(f.noUrl.pct)})`,
  );
  lines.push(
    `- → **IO-addressable:** ${fmtNum(f.ioAddressableMarkets)} markets (${fmtPct(f.ioAddressablePct)})`,
  );
  if (report.prevFiltered) {
    const p = report.prevFiltered;
    const dChain = f.chainlink.pct - p.chainlink.pct;
    const dNoUrl = f.noUrl.pct - p.noUrl.pct;
    const dIo = f.ioAddressablePct - p.ioAddressablePct;
    lines.push(
      `- vs ${report.prevDate}: chainlink ${fmtSignedPct(dChain)}, no-URL ${fmtSignedPct(dNoUrl)}, IO-addressable ${fmtSignedPct(dIo)}`,
    );
  }
  lines.push("");
  lines.push(`Everything below is the IO-addressable subset only.`);
  lines.push("");

  lines.push(`## Headline (IO-addressable)`);
  lines.push("");
  lines.push(`| Metric | Today | ${report.prevDate ?? "Prev"} | Δ |`);
  lines.push(`| --- | ---: | ---: | ---: |`);
  for (const m of report.metrics) {
    const todayStr = fmtMetricValue(m.today, m.unit);
    const prevStr = m.prev === null ? "—" : fmtMetricValue(m.prev, m.unit);
    lines.push(`| ${m.label} | ${todayStr} | ${prevStr} | ${fmtMetricDelta(m)} |`);
  }
  lines.push("");

  lines.push(`## Kinds shift (templates, with markets in parentheses)`);
  lines.push("");
  lines.push(`| Kind | Templates today | Prev | Δ templates | Markets today | Note |`);
  lines.push(`| --- | ---: | ---: | ---: | ---: | --- |`);
  for (const k of report.kindShifts) {
    const note: string[] = [];
    if (k.is_new) note.push("new today");
    if (k.is_dropped) note.push("absent today");
    if (k.deterministic_feed) note.push("deterministic feed");
    lines.push(
      `| ${k.label} | ${fmtNum(k.todayTemplates)} | ${fmtNum(k.prevTemplates)} | ${fmtSigned(k.templatesDelta)} | ${fmtNum(k.todayMarkets)} (${fmtSigned(k.marketsDelta)}) | ${note.join(", ") || "—"} |`,
    );
  }
  lines.push("");

  lines.push(`## Top resolution-source domains in IO-addressable`);
  lines.push("");
  lines.push(`| Domain | Today | Prev | Δ count | Δ share |`);
  lines.push(`| --- | ---: | ---: | ---: | ---: |`);
  for (const d of report.topDomainShifts) {
    const today = d.todayCount === null ? "—" : `${fmtNum(d.todayCount)} (${fmtPct(d.todayPct ?? 0)})`;
    const prev = d.prevCount === null ? "—" : `${fmtNum(d.prevCount)} (${fmtPct(d.prevPct ?? 0)})`;
    const dCount = d.delta === null ? "—" : fmtSigned(d.delta);
    const dShare = d.deltaPct === null ? "—" : fmtSignedPct(d.deltaPct);
    lines.push(`| \`${d.domain}\` | ${today} | ${prev} | ${dCount} | ${dShare} |`);
  }
  lines.push("");

  if (report.newDomains.length > 0) {
    lines.push(`### New domains (≥ ${SIGNIFICANT_DOMAIN_PCT}% of IO-addressable)`);
    lines.push("");
    for (const d of report.newDomains) {
      lines.push(
        `- \`${d.domain}\` — ${fmtNum(d.todayCount ?? 0)} markets (${fmtPct(d.todayPct ?? 0)})`,
      );
    }
    lines.push("");
  }
  if (report.droppedDomains.length > 0) {
    lines.push(`### Domains that dropped out (≥ ${SIGNIFICANT_DOMAIN_PCT}% yesterday)`);
    lines.push("");
    for (const d of report.droppedDomains) {
      lines.push(
        `- \`${d.domain}\` — was ${fmtNum(d.prevCount ?? 0)} markets (${fmtPct(d.prevPct ?? 0)})`,
      );
    }
    lines.push("");
  }

  lines.push(`## Top recurring families`);
  lines.push("");
  lines.push(
    `Markets that share an event-title template (digits stripped, trimmed at \` - \`). One row = one family, regardless of how many markets fan out from it.`,
  );
  lines.push("");
  lines.push(`| Template | Kind | Domain | Markets | Recurring tag |`);
  lines.push(`| --- | --- | --- | ---: | :---: |`);
  for (const fam of report.topFamilies) {
    const tpl = fam.template.replace(/\|/g, "\\|");
    lines.push(
      `| ${tpl} | ${fam.kindLabel} | \`${fam.domain}\` | ${fmtNum(fam.markets)} | ${fam.recurring ? "✓" : "—"} |`,
    );
  }
  lines.push("");

  lines.push(`---`);
  lines.push(`Generated by \`@gym/pm-bench\` daily-report.`);
  lines.push("");
  return lines.join("\n");
}
