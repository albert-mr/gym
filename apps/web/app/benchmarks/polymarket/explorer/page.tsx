import { Suspense } from 'react';
import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { ExplorerClient } from './ExplorerClient';

export default function ExplorerPage() {
  const data = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-3">
        <Link href="/benchmarks/polymarket" className="text-sm text-muted-foreground hover:text-foreground">&larr; Polymarket benchmark</Link>
      </div>
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Explorer</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Every market, every source, every cut</h1>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          One filter bar drives every section below: the summary, the source-host matrix, the category tree, the daily breakdown, and the flat markets list. Set a filter once; everything filters together.
        </p>
        <nav className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 pt-2">
          <a href="#summary" className="hover:text-foreground">Summary</a>
          <a href="#sources" className="hover:text-foreground">By source host</a>
          <a href="#categories" className="hover:text-foreground">By category</a>
          <a href="#by-day" className="hover:text-foreground">By day</a>
          <a href="#markets" className="hover:text-foreground">Markets</a>
        </nav>
      </header>
      <Suspense fallback={<div className="text-muted-foreground text-sm italic py-12 text-center">Loading filters…</div>}>
        <ExplorerClient data={data} />
      </Suspense>
    </div>
  );
}
