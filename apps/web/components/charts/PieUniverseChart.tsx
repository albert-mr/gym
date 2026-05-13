import type { BenchmarkData } from '@/lib/types';

type Props = {
  data: BenchmarkData;
  hovered: 'chainlink' | 'pyth' | 'addressable' | null;
  onHover: (slice: 'chainlink' | 'pyth' | 'addressable' | null) => void;
};

// Polymarket universe split: Chainlink + Pyth + Addressable. The 96.8% is the
// share of the addressable slice GenLayer can resolve. We draw the pie inline
// (no chart library) so the component is small and self-contained.
export function PieUniverseChart({ data, hovered, onHover }: Props) {
  const s = data.onchainFeedStats;
  const total = s.polledUniverse || 1;
  const slices = [
    { key: 'addressable' as const, label: 'Addressable (UMA share)', value: s.addressable, color: '#10b981', muted: '#10b98166' },
    { key: 'chainlink' as const, label: 'Chainlink feeds', value: s.chainlink, color: '#7c3aed', muted: '#7c3aed66' },
    { key: 'pyth' as const, label: 'Pyth feeds', value: s.pyth, color: '#0ea5e9', muted: '#0ea5e966' },
  ];

  const cx = 80;
  const cy = 80;
  const r = 70;
  let angle = -Math.PI / 2;

  return (
    <div className="flex flex-wrap items-center gap-8">
      <svg viewBox="0 0 160 160" width="160" height="160" aria-label="Polymarket universe pie chart">
        {slices.map(slice => {
          const frac = slice.value / total;
          const a0 = angle;
          const a1 = angle + frac * Math.PI * 2;
          angle = a1;
          const x0 = cx + r * Math.cos(a0);
          const y0 = cy + r * Math.sin(a0);
          const x1 = cx + r * Math.cos(a1);
          const y1 = cy + r * Math.sin(a1);
          const large = frac > 0.5 ? 1 : 0;
          const isActive = hovered === null || hovered === slice.key;
          return (
            <path
              key={slice.key}
              d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`}
              fill={isActive ? slice.color : slice.muted}
              stroke="white"
              strokeWidth="1"
              onMouseEnter={() => onHover(slice.key)}
              onMouseLeave={() => onHover(null)}
              className="cursor-pointer transition-opacity"
            />
          );
        })}
      </svg>
      <ul className="space-y-2 text-sm flex-1 min-w-[200px]">
        {slices.map(slice => {
          const pct = (slice.value / total) * 100;
          const isActive = hovered === null || hovered === slice.key;
          return (
            <li
              key={slice.key}
              onMouseEnter={() => onHover(slice.key)}
              onMouseLeave={() => onHover(null)}
              className={`flex items-baseline gap-2 cursor-pointer transition-opacity ${isActive ? '' : 'opacity-40'}`}
            >
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: slice.color }} />
              <span className="text-foreground/90">{slice.label}</span>
              <span className="text-muted-foreground tabular-nums ml-auto">{pct.toFixed(1)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
