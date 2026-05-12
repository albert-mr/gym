import { longDate } from '@/lib/format';
import type { BenchmarkData } from '@/lib/types';

type Props = {
  data: BenchmarkData;
};

export function HeadlineCard({ data }: Props) {
  const startLong = longDate(data.meta.window.start);
  const s = data.onchainFeedStats;
  return (
    <div className="border border-border rounded-2xl p-10 md:p-12">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Cumulative since {startLong}</div>
      <div className="hero-number text-7xl md:text-8xl font-semibold tabular-nums tracking-tighter">
        {data.meta.headlinePct.toFixed(1)}%<sup className="text-xl text-muted-foreground align-super">*</sup>
      </div>
      <p className="mt-6 text-base leading-relaxed text-muted-foreground max-w-xl">
        of every Polymarket market that has ended since {startLong} is within GenLayer&rsquo;s resolution coverage. <span className="text-foreground tabular-nums">{data.meta.totalPass.toLocaleString()}</span> markets and counting.
      </p>
      <p className="text-xs text-muted-foreground/80 mt-3 max-w-xl">
        *Polymarket&rsquo;s daily universe is roughly {s.onchainFeedPct.toFixed(0)}% on-chain price feeds (Chainlink {s.chainlinkPct.toFixed(0)}%, Pyth {s.pythPct.toFixed(1)}%) and {s.addressablePct.toFixed(0)}% markets that need human-style resolution. The headline measures GenLayer&rsquo;s coverage of the second group, the only one where an LLM oracle has a role.
      </p>
    </div>
  );
}
