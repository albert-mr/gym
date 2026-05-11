import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { longDate } from '@/lib/format';

export default function HomePage() {
  const pm = loadBenchmark('pm-bench');
  const startLong = longDate(pm.meta.window.start);
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 space-y-20">

      <section>
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">GenLayer Gym</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
          Where we measure what GenLayer can do.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Open benchmarks for the GenLayer ecosystem. One question per benchmark. All pipelines, daily data, classifiers, and dashboards in one repo &mdash; so the result can be reproduced or challenged.
        </p>
      </section>

      <section className="border border-border rounded-2xl p-10 md:p-14">
        <div className="flex items-baseline justify-between mb-4">
          <Badge variant="secondary" className="font-mono text-xs">Polymarket benchmark · live</Badge>
          <span className="text-xs text-muted-foreground">since {startLong}</span>
        </div>
        <div className="hero-number text-7xl md:text-9xl font-semibold tracking-tighter tabular-nums my-4">
          {pm.meta.headlinePct.toFixed(1)}%<sup className="text-2xl text-muted-foreground align-super">*</sup>
        </div>
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-xl mt-6">
          of every Polymarket market that has ended since {startLong} is within GenLayer&rsquo;s resolution coverage. <span className="text-foreground tabular-nums">{pm.meta.totalPass.toLocaleString()}</span> markets and counting.
        </p>
        <p className="text-xs text-muted-foreground/80 mt-4 max-w-xl">
          *Polymarket&rsquo;s daily universe is roughly {pm.onchainFeedStats.onchainFeedPct.toFixed(0)}% on-chain price feeds (Chainlink {pm.onchainFeedStats.chainlinkPct.toFixed(0)}%, Pyth {pm.onchainFeedStats.pythPct.toFixed(1)}%) and {pm.onchainFeedStats.addressablePct.toFixed(0)}% markets that need human-style resolution. The headline measures GenLayer&rsquo;s coverage of the second group &mdash; the only one where an LLM oracle has a role.
        </p>
        <div className="mt-8">
          <Link href="/benchmarks/polymarket" className="text-sm underline underline-offset-4 hover:text-foreground text-foreground/80">Open the Polymarket benchmark &rarr;</Link>
        </div>
      </section>

      <section className="space-y-4 max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Every day since {startLong}, we poll Polymarket and add the markets ending that day to the cumulative dataset. Each market is routed through a classifier that maps it to a source family GenLayer has verified end-to-end. The headline is forward-looking inference: a model of what GenLayer can resolve, grounded in representative Studio runs across every source family. The <Link href="/benchmarks/polymarket/methodology" className="underline underline-offset-2 text-foreground/80 hover:text-foreground">methodology</Link> page documents the verification level behind every market.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The first benchmark is the <Link href="/benchmarks/polymarket" className="underline underline-offset-2 text-foreground/80 hover:text-foreground">Polymarket benchmark</Link>; the second is the <Link href="/benchmarks/sources-bench" className="underline underline-offset-2 text-foreground/80 hover:text-foreground">Sources benchmark</Link>. More land here as we run them.
        </p>
      </section>

      <section>
        <Link href="/benchmarks" className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition">
          Browse benchmarks
          <span aria-hidden>&rarr;</span>
        </Link>
      </section>

    </div>
  );
}
