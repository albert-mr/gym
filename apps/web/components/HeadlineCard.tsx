import { longDate } from '@/lib/format';

type Props = {
  headlinePct: number;
  totalPass: number;
  dates: string[];
};

export function HeadlineCard({ headlinePct, totalPass, dates }: Props) {
  const startLong = longDate(dates[0] ?? '');
  return (
    <div className="border border-border rounded-2xl p-10 md:p-12">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Cumulative since {startLong}</div>
      <div className="hero-number text-7xl md:text-8xl font-semibold tabular-nums tracking-tighter">
        {headlinePct.toFixed(1)}%<sup className="text-xl text-muted-foreground align-super">*</sup>
      </div>
      <p className="mt-6 text-base leading-relaxed text-muted-foreground max-w-xl">
        of every Polymarket market that has ended since {startLong} is within GenLayer&rsquo;s resolution coverage. <span className="text-foreground tabular-nums">{totalPass.toLocaleString()}</span> markets and counting.
      </p>
      <p className="text-xs text-muted-foreground/80 mt-3 max-w-xl">
        *Excludes markets resolved by deterministic on-chain oracles (Chainlink, Pyth) &mdash; GenLayer is the substitute for human-resolved markets, not for already-automated price feeds.
      </p>
    </div>
  );
}
