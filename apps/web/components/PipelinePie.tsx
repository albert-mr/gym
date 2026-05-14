'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type SliceKey = 'direct' | 'alt' | 'held';
// Funnel rows can pair multiple slices under one hover label. The on-chain row
// has no slice in the pie (those markets are excluded from the addressable
// universe), so hovering it leaves the pie in its default state.
export type PieHoverKey = SliceKey | 'onchain';

type Slice = {
  key: SliceKey;
  label: string;
  shortLabel: string;
  count: number;
  color: string;
  circle: string;
  note: string;
};

export type PipelineStats = {
  chainlink: number;
  pyth: number;
  direct: number;
  alt: number;
  held: number;
};

function isSliceActive(slice: SliceKey, hovered: PieHoverKey | null): boolean {
  if (hovered === null || hovered === 'onchain') return false;
  return hovered === slice;
}

type Props = {
  stats: PipelineStats;
  embedded?: boolean;
  hovered?: PieHoverKey | null;
  onHover?: (next: PieHoverKey | null) => void;
};

export function PipelinePie({ stats, embedded = false, hovered: hoveredProp, onHover }: Props) {
  const router = useRouter();
  const [internalHovered, setInternalHovered] = useState<PieHoverKey | null>(null);
  const hovered = hoveredProp !== undefined ? hoveredProp : internalHovered;
  const setHovered = (next: PieHoverKey | null) => {
    if (onHover) onHover(next);
    else setInternalHovered(next);
  };

  const { direct, alt, held } = stats;

  const slices: Slice[] = [
    {
      key: 'direct',
      label: 'Direct source',
      shortLabel: 'direct',
      count: direct,
      color: '#10b981',
      circle: 'direct',
      note: 'We fetch the host Polymarket named.',
    },
    {
      key: 'alt',
      label: 'Alternative source',
      shortLabel: 'alternate',
      count: alt,
      color: '#84cc16',
      circle: 'alternative',
      note: 'We route to a verified alternate that contains the same fact.',
    },
    {
      key: 'held',
      label: 'Held for later',
      shortLabel: 'held',
      count: held,
      color: '#f59e0b',
      circle: 'held',
      note: 'Paywall, login wall, captcha, or pure-consensus markets.',
    },
  ];

  const addressable = direct + alt + held;
  const total = addressable || 1;
  const resolved = direct + alt;
  const resolvedPct = (resolved / total) * 100;

  const cx = 100;
  const cy = 100;
  const r = 86;
  let angle = -Math.PI / 2;

  const goToExplorer = (slice: Slice) => {
    router.push(`/benchmarks/polymarket/explorer?view=list&circle=${slice.circle}`);
  };

  const focusSlice = hovered && hovered !== 'onchain' ? slices.find(sl => sl.key === hovered) : null;
  const centerCount = focusSlice ? focusSlice.count : addressable;
  const centerLabel = focusSlice ? focusSlice.shortLabel : 'addressable';

  const wrapperClass = embedded
    ? 'space-y-4'
    : 'border border-border rounded-lg p-5 md:p-6 space-y-4';

  return (
    <div className={wrapperClass}>
      {!embedded && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Where every addressable market lands</div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {addressable.toLocaleString()} markets &middot; <span className="text-foreground font-medium">{resolvedPct.toFixed(1)}%</span> resolved
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <div className="relative shrink-0">
          <svg viewBox="0 0 200 200" width="200" height="200" aria-label="Addressable market breakdown" className="overflow-visible">
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
              const isActive = isSliceActive(slice.key, hovered);
              const isDim = hovered !== null && hovered !== 'onchain' && !isActive;
              const lift = isActive ? 6 : 0;
              const tx = lift * Math.cos(aMid);
              const ty = lift * Math.sin(aMid);
              const fillOpacity = isDim ? 0.35 : 1;

              const handleEnter = () => setHovered(slice.key);
              const handleLeave = () => setHovered(null);

              if (frac >= 0.9999) {
                return (
                  <circle
                    key={slice.key}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={slice.color}
                    fillOpacity={fillOpacity}
                    onMouseEnter={handleEnter}
                    onMouseLeave={handleLeave}
                    onClick={() => goToExplorer(slice)}
                    style={{ cursor: 'pointer' }}
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
                  onMouseEnter={handleEnter}
                  onMouseLeave={handleLeave}
                  onClick={() => goToExplorer(slice)}
                  style={{ cursor: 'pointer', transition: 'transform 120ms ease, fill-opacity 120ms ease' }}
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
      </div>
    </div>
  );
}
