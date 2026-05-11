import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { HeadlineCard } from '@/components/HeadlineCard';
import { PerDayTable } from '@/components/PerDayTable';
import { buttonVariants } from '@/components/ui/button';

export default function PmBenchPage() {
  const data = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 space-y-14">

      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">pm-bench</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Polymarket resolution coverage</h1>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          Daily classification of every Polymarket market resolving in the next 24 hours. One question: can the market be routed to a source family GenLayer has tested in Studio? See <Link href="/benchmarks/pm-bench/methodology" className="underline underline-offset-2 hover:text-foreground">methodology</Link> for the verification levels behind that claim.
        </p>
      </header>

      <HeadlineCard headlinePct={data.meta.headlinePct} totalPass={data.meta.totalPass} dates={data.meta.dates} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">By day</h2>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Each row splits one day&apos;s addressable universe into three routes: <span className="text-foreground">Direct source</span> (the host named in Polymarket&apos;s resolution criteria), <span className="text-foreground">Alternative source</span> (we route to a verified alternate when the named host isn&apos;t reachable), and <span className="text-foreground">Currently unresolvable</span> (paywall, login, captcha, or pure-consensus). Percentages use the per-day addressable count as denominator. Column headers carry the precise definitions on hover.
        </p>
        <PerDayTable data={data} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Why the 24-hour horizon</h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          This is the horizon where GenLayer could act in the same role as the human UMA proposer: read the stated source and submit a proposed outcome. Markets resolving further out (election forecasts in November, &quot;X happens by end of year&quot;) have a different risk profile and need different treatment. We measure step-by-step, day-by-day.
        </p>
      </section>

      <section className="flex flex-wrap gap-3 pt-4">
        <Link href="/benchmarks/pm-bench/drilldown" className={buttonVariants({ size: 'lg' })}>View market-level audit trail</Link>
        <Link href="/benchmarks/pm-bench/methodology" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Methodology</Link>
        <Link href="/benchmarks/pm-bench/domains" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Per-source routing</Link>
      </section>
    </div>
  );
}
