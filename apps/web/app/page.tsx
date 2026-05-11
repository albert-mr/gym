import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const pm = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 space-y-20">

      <section>
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">Benchmarks for LLM-based oracles</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
          How much of Polymarket&apos;s near-term resolution work is routable to an LLM oracle?
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          One benchmark per question. Polling pipeline, daily snapshots, classifier output, and dashboard all in one repo — so the result can be reproduced or challenged.
        </p>
      </section>

      <section className="border border-border rounded-2xl p-10 md:p-14">
        <div className="flex items-baseline justify-between mb-4">
          <Badge variant="secondary" className="font-mono text-xs">pm-bench · live</Badge>
          <span className="text-xs text-muted-foreground tabular-nums">{pm.meta.window.start} → {pm.meta.window.end}</span>
        </div>
        <div className="hero-number text-7xl md:text-9xl font-semibold tracking-tighter tabular-nums my-4">
          {pm.meta.headlinePct.toFixed(1)}%
        </div>
        <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-xl mt-6">
          of the {pm.meta.totalPass.toLocaleString()} Polymarket markets resolving in the next 24 hours route to a source family with representative GenLayer Studio verification. This is a routability measure — not per-market accuracy, not production-network proof.
        </p>
        <div className="mt-8">
          <Link href="/benchmarks/pm-bench" className="text-sm underline underline-offset-4 hover:text-foreground text-foreground/80">Open pm-bench →</Link>
        </div>
      </section>

      <section className="space-y-4 max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight">What this is</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Each benchmark holds the polling pipeline, the daily JSONL snapshots, the classifier, and the dashboard code that produces the numbers on this site. Every figure traces to a committed file. The first benchmark is <Link href="/benchmarks/pm-bench" className="underline underline-offset-2 text-foreground/80 hover:text-foreground">pm-bench</Link>; more land here as we run them.
        </p>
      </section>

      <section>
        <Link href="/benchmarks" className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition">
          Browse benchmarks
          <span aria-hidden>→</span>
        </Link>
      </section>

    </div>
  );
}
