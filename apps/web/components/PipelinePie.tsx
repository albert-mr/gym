import type { BenchmarkData } from '@/lib/types';
import { DIRECT_BUCKETS, ALT_BUCKETS } from '@/lib/types';

type Slice = {
  key: 'chainlink' | 'pyth' | 'direct' | 'alt' | 'held';
  label: string;
  count: number;
  color: string;
  legendNote?: string;
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
  const s = data.onchainFeedStats;
  const { direct, alt, held } = bucketSums(data);

  const slices: Slice[] = [
    { key: 'direct', label: 'Direct source', count: direct, color: '#10b981', legendNote: 'we fetch what Polymarket named' },
    { key: 'alt', label: 'Alternative source', count: alt, color: '#84cc16', legendNote: 'we route to a verified alternate' },
    { key: 'held', label: 'Held for later', count: held, color: '#f59e0b', legendNote: 'paywall / login / captcha / consensus' },
    { key: 'chainlink', label: 'Chainlink (handed back)', count: s.chainlink, color: '#7c3aed', legendNote: 'on-chain price feed' },
    { key: 'pyth', label: 'Pyth (handed back)', count: s.pyth, color: '#0ea5e9', legendNote: 'on-chain price feed' },
  ];

  const total = slices.reduce((sum, sl) => sum + sl.count, 0) || 1;
  const resolved = direct + alt;
  const resolvedPct = (resolved / Math.max(1, direct + alt + held)) * 100;

  const cx = 90;
  const cy = 90;
  const r = 78;
  let angle = -Math.PI / 2;

  return (
    <div className="border border-border rounded-lg p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Where every market lands</div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {total.toLocaleString()} markets &middot; <span className="text-foreground font-medium">{resolvedPct.toFixed(1)}%</span> of addressable resolved
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-8">
        <svg viewBox="0 0 180 180" width="180" height="180" aria-label="Market universe breakdown" className="shrink-0">
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
            // Special-case a full-circle slice to avoid the degenerate path.
            if (frac >= 0.9999) {
              return <circle key={slice.key} cx={cx} cy={cy} r={r} fill={slice.color} />;
            }
            return (
              <path
                key={slice.key}
                d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`}
                fill={slice.color}
                stroke="white"
                strokeWidth="1.5"
              />
            );
          })}
          <circle cx={cx} cy={cy} r={r * 0.5} fill="white" />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor" className="tabular-nums">
            {total.toLocaleString()}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.6" className="uppercase tracking-wider">
            polled markets
          </text>
        </svg>

        <ul className="space-y-1.5 flex-1 min-w-[260px] text-sm">
          {slices.map(slice => {
            const pct = (slice.count / total) * 100;
            return (
              <li key={slice.key} className="flex items-baseline gap-3">
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
      <p className="text-xs text-muted-foreground leading-relaxed pt-1">
        Chainlink and Pyth are handed back to their on-chain oracles. Direct + Alternative source = the Intelligent Oracle&rsquo;s resolved coverage. Held markets wait for the resolution mode they need.
      </p>
    </div>
  );
}
