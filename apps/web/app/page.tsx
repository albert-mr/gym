import Link from 'next/link';
import { loadBenchmark, loadComingSoon } from '@/lib/data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { longDate } from '@/lib/format';
import { buildSourcesTable } from '@/lib/sources-bench';
import { DIRECT_BUCKETS, ALT_BUCKETS } from '@/lib/types';

export default function HomePage() {
  const pm = loadBenchmark('pm-bench');
  const _sources = loadComingSoon('sources-bench'); // placeholder data, kept for future shape parity
  const sourcesTable = buildSourcesTable(pm.domains, pm.meta.generatedAt);
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 space-y-14">

      {/* Top intro */}
      <section>
        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">GenLayer Gym</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15] mb-4">
          Where we measure what GenLayer can do.
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          Open benchmarks for the GenLayer ecosystem. One question per benchmark. All pipelines, daily data, classifiers, and dashboards in one repo, so any result can be reproduced or challenged.
        </p>
      </section>

      {/* Benchmark cards. Each is its own self-contained headline. */}
      <section className="space-y-4">
        <PolymarketCard pm={pm} />
        <SourcesCard accessibleCount={sourcesTable.accessibleCount} total={sourcesTable.total} />
      </section>

      {/* Repo / contributing pointer */}
      <section className="space-y-2 text-sm text-muted-foreground border-t border-border pt-8">
        <p>
          Each benchmark is self-contained. <Link href="/about" className="underline underline-offset-2 hover:text-foreground">How it&rsquo;s built</Link>.
        </p>
      </section>

    </div>
  );
}

function PolymarketCard({ pm }: { pm: ReturnType<typeof loadBenchmark> }) {
  const startLong = longDate(pm.meta.window.start);
  let direct = 0, alt = 0, held = 0;
  for (const t of pm.templates) {
    for (const [bucket, n] of Object.entries(t.buckets)) {
      if (DIRECT_BUCKETS.has(bucket)) direct += n;
      else if (ALT_BUCKETS.has(bucket)) alt += n;
      else held += n;
    }
  }
  const resolved = direct + alt;
  return (
    <Link href="/benchmarks/polymarket" className="block group">
      <Card className="transition-colors group-hover:border-foreground/40">
        <CardHeader className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xs text-muted-foreground">Polymarket benchmark</span>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-widest">Live &middot; cumulative since {startLong}</Badge>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">GenLayer&rsquo;s Intelligent Oracle on Polymarket</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every Polymarket market that ends in the next 24 hours runs through a six-step pipeline of deliberate filtering decisions, public sources, and verified gates.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
            <span><span className="text-foreground font-medium tabular-nums">{resolved.toLocaleString()}</span> <span className="text-muted-foreground">resolved</span></span>
            <span><span className="text-foreground font-medium tabular-nums">{held.toLocaleString()}</span> <span className="text-muted-foreground">deliberately held</span></span>
            <span><span className="text-foreground font-medium tabular-nums">0</span> <span className="text-muted-foreground">disagreements so far</span></span>
          </div>
          <div className="pt-1">
            <span className="text-sm text-foreground/80 group-hover:text-foreground underline underline-offset-4">Open the benchmark &rarr;</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SourcesCard({ accessibleCount, total }: { accessibleCount: number; total: number }) {
  return (
    <Link href="/benchmarks/sources-bench" className="block group">
      <Card className="transition-colors group-hover:border-foreground/40">
        <CardHeader className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xs text-muted-foreground">Sources benchmark</span>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-widest">Live</Badge>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Source accessibility</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every web source GenLayer has classified, with reachability status and known alternatives. Copy as a prompt or download as JSON for AI wizards building intelligent contracts.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline gap-3 mt-2">
            <div className="hero-number text-6xl md:text-7xl font-semibold tabular-nums tracking-tighter">
              {accessibleCount}
            </div>
            <div className="text-xs text-muted-foreground">
              <div>accessible sources</div>
              <div>of {total} classified</div>
            </div>
          </div>
          <div className="pt-1">
            <span className="text-sm text-foreground/80 group-hover:text-foreground underline underline-offset-4">Open the benchmark &rarr;</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
