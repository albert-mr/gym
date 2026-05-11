import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { HeadlineCard } from '@/components/HeadlineCard';
import { PerDayTable } from '@/components/PerDayTable';
import { buttonVariants } from '@/components/ui/button';
import { longDate } from '@/lib/format';

export default function PolymarketBenchmarkPage() {
  const data = loadBenchmark('pm-bench');
  const startLong = longDate(data.meta.window.start);
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 space-y-14">

      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Polymarket benchmark</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Polymarket resolution coverage</h1>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          Cumulative since {startLong}: every Polymarket market that has ended is added to the dataset, classified, and counted &mdash; excluding markets resolved by deterministic on-chain oracles (Chainlink, Pyth), which GenLayer is not the substitute for. One question: can GenLayer resolve this market? See <Link href="/benchmarks/polymarket/methodology" className="underline underline-offset-2 hover:text-foreground">methodology</Link> for the verification level behind that claim.
        </p>
      </header>

      <HeadlineCard data={data} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">By day</h2>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Each row is one day&rsquo;s contribution to the cumulative dataset, split into three routes: <span className="text-foreground">Direct source</span> (the host named in Polymarket&rsquo;s resolution criteria), <span className="text-foreground">Alternative source</span> (we route to a verified alternate when the named host isn&rsquo;t reachable), and <span className="text-foreground">Currently unresolvable</span> (paywall, login, captcha, or pure-consensus). Percentages use that day&rsquo;s addressable count as denominator. Column headers carry the precise definitions on hover.
        </p>
        <PerDayTable data={data} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">How we collect the dataset</h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          Each day we poll Polymarket and keep the markets ending in the next 24 hours &mdash; the horizon where GenLayer could act in the same role as the human UMA proposer (read the stated source, submit a proposed outcome). Those daily slices accumulate into the cumulative dataset shown above. Markets resolving further out (election forecasts in November, &ldquo;X happens by end of year&rdquo;) have a different risk profile and need different treatment; they&rsquo;re out of scope for this benchmark.
        </p>
      </section>

      <section className="flex flex-wrap gap-3 pt-4">
        <Link href="/benchmarks/polymarket/drilldown" className={buttonVariants({ size: 'lg' })}>View market-level audit trail</Link>
        <Link href="/benchmarks/polymarket/methodology" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Methodology</Link>
        <Link href="/benchmarks/polymarket/domains" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Per-source routing</Link>
      </section>
    </div>
  );
}
