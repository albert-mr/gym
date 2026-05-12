import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { HeadlineCard } from '@/components/HeadlineCard';
import { PerDayTable } from '@/components/PerDayTable';
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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/benchmarks/polymarket/drilldown"
          className="group block border border-border rounded-xl p-6 md:p-7 transition-colors hover:border-foreground/40 hover:bg-muted/30"
        >
          <h3 className="text-lg font-semibold tracking-tight">Per-market audit trail</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Every classified market with its routing decision &mdash; spot-check the headline.</p>
          <span className="mt-4 inline-block text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            Open <span className="inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </span>
        </Link>

        <Link
          href="/benchmarks/polymarket/domains"
          className="group block border border-border rounded-xl p-6 md:p-7 transition-colors hover:border-foreground/40 hover:bg-muted/30"
        >
          <h3 className="text-lg font-semibold tracking-tight">Per-source routing</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">The matrix of which source resolves which market, by source family.</p>
          <span className="mt-4 inline-block text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            Open <span className="inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </span>
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">By day</h2>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Each row is one day&rsquo;s contribution to the cumulative dataset, split into three routes: <span className="text-foreground">Direct source</span> (the host named in Polymarket&rsquo;s resolution criteria), <span className="text-foreground">Alternative source</span> (we route to a verified alternate when the named host isn&rsquo;t reachable), and <span className="text-foreground">Currently unresolvable</span> (paywall, login, captcha, or pure-consensus). Percentages use that day&rsquo;s addressable count as denominator. Column headers carry the precise definitions on hover.
        </p>
        <PerDayTable data={data} />
      </section>

      <section className="pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Behind every number on this page: classifier rules, verification levels, and source-by-source decisions. <Link href="/benchmarks/polymarket/methodology" className="underline underline-offset-2 hover:text-foreground">Read the methodology &rarr;</Link>
        </p>
      </section>
    </div>
  );
}
