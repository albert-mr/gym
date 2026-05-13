import type { BenchmarkData } from '@/lib/types';
import { DIRECT_BUCKETS, ALT_BUCKETS } from '@/lib/types';

type Props = {
  data: BenchmarkData;
  hovered: 'universe' | 'addressable' | 'direct' | 'alt' | 'unresolvable' | null;
  onHover: (step: 'universe' | 'addressable' | 'direct' | 'alt' | 'unresolvable' | null) => void;
};

type Step = {
  key: 'universe' | 'addressable' | 'direct' | 'alt' | 'unresolvable';
  label: string;
  why: string;
  count: number;
  color: string;
};

// Drop-by-drop funnel: Polymarket universe → on-chain feeds removed → addressable
// → Direct / Alternative / Currently unresolvable. Inline SVG bars with width
// proportional to count.
export function FunnelChart({ data, hovered, onHover }: Props) {
  const s = data.onchainFeedStats;
  const buckets = data.templates.reduce<Record<string, number>>((acc, t) => {
    for (const [b, n] of Object.entries(t.buckets)) acc[b] = (acc[b] ?? 0) + n;
    return acc;
  }, {});
  const directCount = Object.entries(buckets).filter(([b]) => DIRECT_BUCKETS.has(b)).reduce((sum, [, n]) => sum + n, 0);
  const altCount = Object.entries(buckets).filter(([b]) => ALT_BUCKETS.has(b)).reduce((sum, [, n]) => sum + n, 0);
  const unresCount = data.meta.totalPass - directCount - altCount;

  const steps: Step[] = [
    { key: 'universe', label: 'Polymarket universe', why: 'Every market resolving in the next 24 hours', count: s.polledUniverse, color: '#64748b' },
    { key: 'addressable', label: 'Addressable (UMA share)', why: 'Chainlink and Pyth markets removed — the Intelligent Oracle has no role there', count: s.addressable, color: '#10b981' },
    { key: 'direct', label: 'Direct source', why: 'The Intelligent Oracle fetched the source Polymarket named', count: directCount, color: '#16a34a' },
    { key: 'alt', label: 'Alternative source', why: 'Named host blocked — routed to a verified alternate', count: altCount, color: '#65a30d' },
    { key: 'unresolvable', label: 'Currently unresolvable', why: 'Paywall, captcha, login, or pure-consensus subjective', count: Math.max(0, unresCount), color: '#94a3b8' },
  ];

  const max = s.polledUniverse || 1;
  return (
    <div className="space-y-2">
      {steps.map(step => {
        const widthPct = (step.count / max) * 100;
        const isActive = hovered === null || hovered === step.key;
        return (
          <div
            key={step.key}
            onMouseEnter={() => onHover(step.key)}
            onMouseLeave={() => onHover(null)}
            className={`cursor-pointer transition-opacity ${isActive ? '' : 'opacity-40'}`}
          >
            <div className="flex items-baseline justify-between text-sm mb-1">
              <span className="text-foreground/90 font-medium">{step.label}</span>
              <span className="text-muted-foreground tabular-nums text-xs">{step.count.toLocaleString()}</span>
            </div>
            <div className="h-3 rounded-sm bg-muted overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${widthPct}%`, backgroundColor: step.color }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.why}</p>
          </div>
        );
      })}
    </div>
  );
}
