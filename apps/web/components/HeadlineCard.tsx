type Props = {
  headlinePct: number;
  totalPass: number;
  dates: string[];
};

export function HeadlineCard({ headlinePct, totalPass, dates }: Props) {
  return (
    <div className="rounded-lg p-6 bg-gradient-to-br from-ink-700 to-ink-900 text-white flex items-center gap-6">
      <div className="text-6xl font-extrabold leading-none tabular-nums">{headlinePct.toFixed(1)}%</div>
      <div className="text-sm leading-relaxed">
        of Polymarket&apos;s UMA-resolved 24h-horizon market universe is routable to a known canonical source family across the {dates.length}-day window ({totalPass.toLocaleString()} markets, {dates[0]} → {dates[dates.length-1]}).
      </div>
    </div>
  );
}
