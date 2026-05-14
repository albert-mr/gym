import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBenchmark } from '@/lib/queries/benchmark';
import { PipelineFunnel } from '@/components/PipelineFunnel';
import { PerDayTable } from '@/components/PerDayTable';
import { UnderstandingFunnel } from '@/components/UnderstandingFunnel';
import { longDate } from '@/lib/format';
import { buildExplorerRows, summarizeRows } from '@/lib/explorer-data';

export default async function PolymarketBenchmarkPage() {
  const data = await getBenchmark('pm-bench');
  if (!data) notFound();
  const rows = buildExplorerRows(data);
  const summary = summarizeRows(rows);
  const pipelineStats = {
    chainlink: summary.circles.chainlink,
    pyth: summary.circles.pyth,
    direct: summary.circles.direct,
    alt: summary.circles.alternative,
    held: summary.circles.held,
  };
  const startLong = longDate(data.meta.window.start);

  return (
    <div className="py-16">

      <div className="mx-auto max-w-4xl px-6 space-y-12">
        <header className="space-y-3">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="space-y-3 flex-1 min-w-0">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Polymarket benchmark · live · cumulative since {startLong}
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">GenLayer&rsquo;s Intelligent Oracle on Polymarket</h1>
            </div>
            <Link
              href="#understanding"
              className="shrink-0 text-sm border border-border rounded-md px-3 py-1.5 transition-colors hover:border-foreground/40 hover:bg-muted/30"
            >
              Understanding the benchmark <span aria-hidden="true">&darr;</span>
            </Link>
          </div>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            We resolve prediction-market questions whose answer lives at a public URL. Polymarket is our live testbed. Every market runs through a six-step pipeline of deliberate filtering decisions, public sources, and verified gates.
          </p>
        </header>

        <PipelineFunnel stats={pipelineStats} />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">The three categories</h2>
          <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
            <li>
              <span className="text-foreground font-medium">Direct source.</span>{' '}
              The Intelligent Oracle fetches the host Polymarket named.
            </li>
            <li>
              <span className="text-foreground font-medium">Alternative source.</span>{' '}
              Named host blocks validator infrastructure; we route to a verified alternate that contains the same fact.
            </li>
            <li>
              <span className="text-foreground font-medium">Currently held.</span>{' '}
              Paywall, login wall, captcha, or pure-consensus markets we do not ship best-effort scraping for. They wait for the resolution mode they need (<Link href="/benchmarks/polymarket/methodology#tls-notary" className="underline underline-offset-2 hover:text-foreground">TLS notary</Link>, official APIs).
            </li>
          </ul>
        </section>
      </div>

      <div className="mx-auto max-w-6xl px-6 mt-16">
        <UnderstandingFunnel />
      </div>

      <div className="mx-auto max-w-4xl px-6 mt-16 space-y-12">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Daily activity</h2>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Each row is one day&rsquo;s contribution to the cumulative dataset. Cells deep-link into the{' '}
            <Link href="/benchmarks/polymarket/explorer" className="underline underline-offset-2 hover:text-foreground">explorer</Link>.
          </p>
          <PerDayTable data={data} rows={rows} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/benchmarks/polymarket/explorer"
            className="group block border border-border rounded-xl p-6 md:p-7 transition-colors hover:border-foreground/40 hover:bg-muted/30"
          >
            <h3 className="text-lg font-semibold tracking-tight">Open the explorer</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Every market, every source host, every cut. One filter bar drives every section.</p>
            <span className="mt-4 inline-block text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Explore <span className="inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </span>
          </Link>

          <Link
            href="/benchmarks/polymarket/methodology"
            className="group block border border-border rounded-xl p-6 md:p-7 transition-colors hover:border-foreground/40 hover:bg-muted/30"
          >
            <h3 className="text-lg font-semibold tracking-tight">Read the methodology</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">The pipeline, the gates, the open questions. Reference depth for the curious.</p>
            <span className="mt-4 inline-block text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Read <span className="inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </span>
          </Link>
        </section>

        <section className="pt-8 border-t border-border flex flex-wrap items-center gap-3">
          <a
            href="/api/benchmarks/pm-bench/markets"
            download="polymarket-markets.json"
            className="inline-flex items-center gap-2 text-sm border border-border rounded-md px-3 py-1.5 transition-colors hover:border-foreground/40 hover:bg-muted/30"
          >
            Download the dataset (JSON)
          </a>
          <p className="text-xs text-muted-foreground">
            One row per market: ID, slug, question, named source, verified source, status, bucket, settlement winner.
          </p>
        </section>
      </div>
    </div>
  );
}
