import { Suspense } from 'react';
import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { DrilldownTree } from '@/components/DrilldownTree';

export default function DrilldownPage() {
  const data = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-3">
        <Link href="/benchmarks/polymarket" className="text-sm text-muted-foreground hover:text-foreground">← Polymarket benchmark</Link>
      </div>
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Audit trail</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Market-level audit trail</h1>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          {data.meta.totalPass.toLocaleString()} addressable markets, grouped by source category → domain area → competition or asset → repeated question pattern. Each leaf shows one representative example you can verify on Polymarket. Filter by date, source category, or text.
        </p>
      </header>
      <Suspense fallback={<div className="text-muted-foreground text-sm italic py-12 text-center">Loading filters…</div>}>
        <DrilldownTree data={data} />
      </Suspense>
    </div>
  );
}
