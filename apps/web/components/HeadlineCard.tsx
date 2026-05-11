type Props = {
  headlinePct: number;
  totalPass: number;
  dates: string[];
};

export function HeadlineCard({ headlinePct, totalPass, dates }: Props) {
  return (
    <div className="border border-border rounded-2xl p-10 md:p-12">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Resolution coverage · {dates[0]} → {dates[dates.length-1]}</div>
      <div className="hero-number text-7xl md:text-8xl font-semibold tabular-nums tracking-tighter">
        {headlinePct.toFixed(1)}%
      </div>
      <p className="mt-6 text-base leading-relaxed text-muted-foreground max-w-xl">
        of the <span className="text-foreground font-medium tabular-nums">{totalPass.toLocaleString()}</span> Polymarket markets resolving in the next 24 hours route to a source family with representative GenLayer Studio verification. This is a routability measure — not per-market accuracy, not production-network proof.
      </p>
    </div>
  );
}
