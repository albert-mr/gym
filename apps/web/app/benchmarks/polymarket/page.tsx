import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { HeadlineViz } from '@/components/HeadlineViz';
import { PerDayTable } from '@/components/PerDayTable';
import { longDate } from '@/lib/format';
import { DIRECT_BUCKETS, ALT_BUCKETS } from '@/lib/types';

export default function PolymarketBenchmarkPage() {
  const data = loadBenchmark('pm-bench');
  const startLong = longDate(data.meta.window.start);

  // Three-category counts for the bulleted summary below the headline.
  const counts = data.templates.reduce(
    (acc, t) => {
      for (const [bucket, n] of Object.entries(t.buckets)) {
        if (DIRECT_BUCKETS.has(bucket)) acc.direct += n;
        else if (ALT_BUCKETS.has(bucket)) acc.alt += n;
        else acc.unresolvable += n;
      }
      return acc;
    },
    { direct: 0, alt: 0, unresolvable: 0 },
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 space-y-14">

      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Polymarket benchmark</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">GenLayer&rsquo;s Intelligent Oracle on Polymarket</h1>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          Cumulative since {startLong}: every Polymarket market that has ended is added to the dataset, classified, and counted. Markets resolved by deterministic on-chain oracles (Chainlink, Pyth) are excluded, because the Intelligent Oracle is not the substitute for those. One question: can the Intelligent Oracle resolve this market? See <Link href="/benchmarks/polymarket/methodology" className="underline underline-offset-2 hover:text-foreground">methodology</Link> for the verification level behind that claim.
        </p>
      </header>

      <HeadlineViz data={data} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The three categories</h2>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li>
            <span className="text-foreground font-medium">Direct source &mdash; {counts.direct.toLocaleString()}.</span>{' '}
            The Intelligent Oracle fetches the host Polymarket named.
          </li>
          <li>
            <span className="text-foreground font-medium">
              Alternative source &mdash; {counts.alt.toLocaleString()}
              <sup><Link href="/benchmarks/polymarket/methodology#alt-source-disclaimer" className="underline underline-offset-2 hover:text-foreground">*</Link></sup>.
            </span>{' '}
            Named host is unreachable; the Intelligent Oracle routes to a verified alternate.
          </li>
          <li>
            <span className="text-foreground font-medium">Currently unresolvable &mdash; {counts.unresolvable.toLocaleString()}.</span>{' '}
            Paywall, login, captcha, or pure-consensus subjective markets.
          </li>
        </ul>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/benchmarks/polymarket/drilldown"
          className="group block border border-border rounded-xl p-6 md:p-7 transition-colors hover:border-foreground/40 hover:bg-muted/30"
        >
          <h3 className="text-lg font-semibold tracking-tight">Per-market audit trail</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Every classified market with its routing decision. Filterable, with deep-links into the methodology.</p>
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
          Each row is one day&rsquo;s contribution to the cumulative dataset, split into three routes. Cells deep-link into the audit trail.
        </p>
        <PerDayTable data={data} />
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="/data/pm-bench/markets.json"
            download="polymarket-markets.json"
            className="inline-flex items-center gap-2 text-sm border border-border rounded-md px-3 py-1.5 transition-colors hover:border-foreground/40 hover:bg-muted/30"
          >
            Download dataset (JSON)
          </a>
          <p className="text-xs text-muted-foreground">
            One row per market: ID, slug, question, the source Polymarket named, the source the Intelligent Oracle verified works, status, bucket, settlement winner.
          </p>
        </div>
      </section>

      <section className="pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Behind every number on this page: classifier rules, verification levels, source-by-source decisions, and the gates the Intelligent Oracle runs.{' '}
          <Link href="/benchmarks/polymarket/methodology" className="underline underline-offset-2 hover:text-foreground">Read the methodology &rarr;</Link>
        </p>
      </section>
    </div>
  );
}
