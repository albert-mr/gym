'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BenchmarkData } from '@/lib/types';
import { DIRECT_BUCKETS, ALT_BUCKETS } from '@/lib/types';

type SliceKey = 'chainlink' | 'pyth' | 'direct' | 'alt' | 'held';

type Slice = {
  key: SliceKey;
  label: string;
  shortLabel: string;
  count: number;
  color: string;
  buckets?: string;
  note: string;
};

function bucketSums(data: BenchmarkData) {
  let direct = 0;
  let alt = 0;
  let held = 0;
  for (const t of data.templates) {
    for (const [bucket, n] of Object.entries(t.buckets)) {
      if (DIRECT_BUCKETS.has(bucket)) direct += n;
      else if (ALT_BUCKETS.has(bucket)) alt += n;
      else held += n;
    }
  }
  return { direct, alt, held };
}

export function PipelinePie({ data }: { data: BenchmarkData }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<SliceKey | null>(null);

  const s = data.onchainFeedStats;
  const { direct, alt, held } = bucketSums(data);

  const slices: Slice[] = [
    {
      key: 'direct',
      label: 'Direct source',
      shortLabel: 'direct',
      count: direct,
      color: '#10b981',
      buckets: 'render,api',
      note: 'We fetch the host Polymarket named.',
    },
    {
      key: 'alt',
      label: 'Alternative source',
      shortLabel: 'alternate',
      count: alt,
      color: '#84cc16',
      buckets: 'alt,liquipedia_recover,bo3_recover,frmf_via_flashscore,eurovision_via_wiki',
      note: 'We route to a verified alternate that contains the same fact.',
    },
    {
      key: 'held',
      label: 'Held for later',
      shortLabel: 'held',
      count: held,
      color: '#f59e0b',
      buckets: 'hard,yahoo,subjective,misc,no_source,studio_blocked,hltv_lost',
      note: 'Paywall, login wall, captcha, or pure-consensus markets.',
    },
    {
      key: 'chainlink',
      label: 'Chainlink (handed back)',
      shortLabel: 'chainlink',
      count: s.chainlink,
      color: '#7c3aed',
      note: 'Resolved by on-chain price feed. The Intelligent Oracle has no role.',
    },
    {
      key: 'pyth',
      label: 'Pyth (handed back)',
      shortLabel: 'pyth',
      count: s.pyth,
      color: '#0ea5e9',
      note: 'Resolved by on-chain price feed. The Intelligent Oracle has no role.',
    },
  ];

  const total = slices.reduce((sum, sl) => sum + sl.count, 0) || 1;
  const resolved = direct + alt;
  const addressable = direct + alt + held;
  const resolvedPct = (resolved / Math.max(1, addressable)) * 100;

  const cx = 100;
  const cy = 100;
  const r = 86;
  let angle = -Math.PI / 2;

  const goToExplorer = (slice: Slice) => {
    if (!slice.buckets) return;
    router.push(`/benchmarks/polymarket/explorer?bucket=${slice.buckets}`);
  };

  const focusSlice = hovered ? slices.find(sl => sl.key === hovered) : null;
  const centerCount = focusSlice ? focusSlice.count : total;
  const centerLabel = focusSlice ? focusSlice.shortLabel : 'polled markets';

  return (
    <div className="border border-border rounded-lg p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Where every market lands</div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {total.toLocaleString()} markets &middot; <span className="text-foreground font-medium">{resolvedPct.toFixed(1)}%</span> of addressable resolved
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-8">
        <div className="relative shrink-0">
          <svg viewBox="0 0 200 200" width="200" height="200" aria-label="Market universe breakdown" className="overflow-visible">
            {slices.map(slice => {
              const frac = slice.count / total;
              if (frac === 0) return null;
              const a0 = angle;
              const a1 = angle + frac * Math.PI * 2;
              angle = a1;
              const x0 = cx + r * Math.cos(a0);
              const y0 = cy + r * Math.sin(a0);
              const x1 = cx + r * Math.cos(a1);
              const y1 = cy + r * Math.sin(a1);
              const large = frac > 0.5 ? 1 : 0;

              const aMid = (a0 + a1) / 2;
              const isHovered = hovered === slice.key;
              const isDim = hovered !== null && !isHovered;
              const lift = isHovered ? 6 : 0;
              const tx = lift * Math.cos(aMid);
              const ty = lift * Math.sin(aMid);
              const fillOpacity = isDim ? 0.35 : 1;

              const interactive = !!slice.buckets;

              if (frac >= 0.9999) {
                return (
                  <circle
                    key={slice.key}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={slice.color}
                    fillOpacity={fillOpacity}
                    onMouseEnter={() => setHovered(slice.key)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => goToExplorer(slice)}
                    style={{ cursor: interactive ? 'pointer' : 'default' }}
                  />
                );
              }

              return (
                <path
                  key={slice.key}
                  d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`}
                  fill={slice.color}
                  fillOpacity={fillOpacity}
                  stroke="white"
                  strokeWidth="2"
                  transform={`translate(${tx}, ${ty})`}
                  onMouseEnter={() => setHovered(slice.key)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => goToExplorer(slice)}
                  style={{ cursor: interactive ? 'pointer' : 'default', transition: 'transform 120ms ease, fill-opacity 120ms ease' }}
                />
              );
            })}
            <circle cx={cx} cy={cy} r={r * 0.58} fill="white" pointerEvents="none" />
            <text x={cx} y={cy - 2} textAnchor="middle" fontSize="17" fontWeight="600" fill="currentColor" className="tabular-nums" pointerEvents="none">
              {centerCount.toLocaleString()}
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.6" className="uppercase tracking-wider" pointerEvents="none">
              {centerLabel}
            </text>
          </svg>
        </div>

        <ul className="space-y-1 flex-1 min-w-[260px] text-sm">
          {slices.map(slice => {
            const pct = (slice.count / total) * 100;
            const isHovered = hovered === slice.key;
            const isDim = hovered !== null && !isHovered;
            const interactive = !!slice.buckets;
            return (
              <li
                key={slice.key}
                onMouseEnter={() => setHovered(slice.key)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => goToExplorer(slice)}
                className={`flex items-baseline gap-3 rounded-md px-2 py-1 transition-colors ${isHovered ? 'bg-muted/60' : ''} ${isDim ? 'opacity-50' : ''} ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
                title={interactive ? 'Open this slice in the explorer' : undefined}
              >
                <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="text-foreground/90 truncate">{slice.label}</span>
                <span className="text-muted-foreground tabular-nums ml-auto">
                  {slice.count.toLocaleString()}
                  <span className="text-muted-foreground/70 ml-1.5">({pct.toFixed(pct < 1 ? 1 : 0)}%)</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed pt-1 min-h-[1.5em]">
        {focusSlice
          ? focusSlice.note + (focusSlice.buckets ? ' Click to open in the explorer.' : '')
          : 'Hover a slice for the focus details. Click a slice to open that bucket in the explorer.'}
      </p>
    </div>
  );
}
