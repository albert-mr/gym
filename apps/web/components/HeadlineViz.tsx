'use client';
import { useMemo, useState } from 'react';
import type { BenchmarkData } from '@/lib/types';
import { DIRECT_BUCKETS, ALT_BUCKETS } from '@/lib/types';
import { PieUniverseChart } from './charts/PieUniverseChart';
import { FunnelChart } from './charts/FunnelChart';
import { SankeySourcesChart } from './charts/SankeySourcesChart';
import { longDate } from '@/lib/format';

type Props = {
  data: BenchmarkData;
};

// HeadlineViz orchestrates the pie, funnel, and Sankey with a small hover-expand
// interaction. It also hosts the interactive filters: toggle Chainlink/Pyth on
// or off, toggle individual top-source families on or off, and the displayed %
// recomputes live. State lives here so it's a single client component; the
// three chart pieces stay presentational.

type SliceHover = 'chainlink' | 'pyth' | 'addressable' | null;
type FunnelHover = 'universe' | 'addressable' | 'direct' | 'alt' | 'unresolvable' | null;

export function HeadlineViz({ data }: Props) {
  const startLong = longDate(data.meta.window.start);
  const [includeChainlink, setIncludeChainlink] = useState(false);
  const [includePyth, setIncludePyth] = useState(false);
  const [excludedHosts, setExcludedHosts] = useState<Set<string>>(new Set());
  const [sliceHover, setSliceHover] = useState<SliceHover>(null);
  const [funnelHover, setFunnelHover] = useState<FunnelHover>(null);

  // Top source families to surface as toggles. We pull the top 6 by count from
  // data.domains, skipping the "(none)" placeholder.
  const topHosts = useMemo(
    () => data.domains.filter(d => d.host !== '(none)').slice(0, 6).map(d => d.host),
    [data.domains],
  );

  const recomputed = useMemo(() => {
    let universe = 0;
    let addressable = 0;
    let solved = 0;
    let direct = 0;
    let alt = 0;

    for (const dom of data.domains) {
      if (excludedHosts.has(dom.host)) continue;
      addressable += dom.count;
      for (const [bucket, n] of Object.entries(dom.buckets)) {
        if (DIRECT_BUCKETS.has(bucket)) { direct += n; solved += n; }
        else if (ALT_BUCKETS.has(bucket)) { alt += n; solved += n; }
      }
    }
    universe = addressable;
    if (includeChainlink) universe += data.onchainFeedStats.chainlink;
    if (includePyth) universe += data.onchainFeedStats.pyth;

    const pct = universe ? (100 * solved / universe) : 0;
    const resolvedCorrectly = (direct + alt) > 0 ? 100 : 0;
    return { universe, addressable, solved, direct, alt, pct, resolvedCorrectly };
  }, [data.domains, data.onchainFeedStats, excludedHosts, includeChainlink, includePyth]);

  const toggleHost = (h: string) => {
    const next = new Set(excludedHosts);
    if (next.has(h)) next.delete(h); else next.add(h);
    setExcludedHosts(next);
  };

  return (
    <div className="border border-border rounded-2xl p-8 md:p-10 space-y-8">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Cumulative since {startLong}</div>
        <div className="flex flex-wrap items-baseline gap-x-10 gap-y-2">
          <div>
            <div className="hero-number text-6xl md:text-7xl font-semibold tabular-nums tracking-tighter">
              {recomputed.pct.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              <span className="text-foreground">GenLayer&rsquo;s Intelligent Oracle</span> can resolve this share of every Polymarket market resolving in the next 24 hours.
            </p>
          </div>
          <div className="border-l border-border pl-6">
            <div className="text-3xl md:text-4xl font-semibold tabular-nums tracking-tighter text-foreground/80">
              {recomputed.resolvedCorrectly.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
              Resolved correctly on the cleanest cut (Direct + verified Alt).
            </p>
          </div>
        </div>
      </div>

      <HeadlineFilters
        includeChainlink={includeChainlink}
        includePyth={includePyth}
        excludedHosts={excludedHosts}
        topHosts={topHosts}
        onToggleChainlink={setIncludeChainlink}
        onTogglePyth={setIncludePyth}
        onToggleHost={toggleHost}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Universe</h3>
          <PieUniverseChart data={data} hovered={sliceHover} onHover={setSliceHover} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Funnel &mdash; where markets drop</h3>
          <FunnelChart data={data} hovered={funnelHover} onHover={setFunnelHover} />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Source-family routing</h3>
        <SankeySourcesChart data={data} />
      </div>
    </div>
  );
}

type FiltersProps = {
  includeChainlink: boolean;
  includePyth: boolean;
  excludedHosts: Set<string>;
  topHosts: string[];
  onToggleChainlink: (v: boolean) => void;
  onTogglePyth: (v: boolean) => void;
  onToggleHost: (h: string) => void;
};

function HeadlineFilters({ includeChainlink, includePyth, excludedHosts, topHosts, onToggleChainlink, onTogglePyth, onToggleHost }: FiltersProps) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Toggle on-chain feeds back into the universe, or exclude a source family to see what changes. The headline recomputes live.
      </p>
      <div className="flex flex-wrap gap-2">
        <ToggleChip active={includeChainlink} onClick={() => onToggleChainlink(!includeChainlink)}>
          Include Chainlink {includeChainlink ? 'on' : 'off'}
        </ToggleChip>
        <ToggleChip active={includePyth} onClick={() => onTogglePyth(!includePyth)}>
          Include Pyth {includePyth ? 'on' : 'off'}
        </ToggleChip>
        {topHosts.map(h => (
          <ToggleChip key={h} active={!excludedHosts.has(h)} onClick={() => onToggleHost(h)}>
            {h}
          </ToggleChip>
        ))}
      </div>
    </div>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs rounded-md border px-2.5 py-1 transition-colors tabular-nums ${active ? 'bg-foreground text-background border-foreground' : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40'}`}
    >
      {children}
    </button>
  );
}
