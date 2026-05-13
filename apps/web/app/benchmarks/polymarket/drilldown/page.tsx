import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { DrilldownTree } from '@/components/DrilldownTree';

export default function DrilldownPage() {
  // Server-side load is kept for the headline count only. The full BenchmarkData
  // (incl. ~10MB of marketsByTemplate) is NOT passed to DrilldownTree — that
  // component fetches /data/pm-bench/latest.json client-side, which keeps the
  // prerendered HTML small. Inlining the full dataset as RSC props previously
  // bloated drilldown.html past Vercel's deploy limits.
  const { meta } = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-3">
        <Link href="/benchmarks/polymarket" className="text-sm text-muted-foreground hover:text-foreground">← Polymarket benchmark</Link>
      </div>
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Audit trail</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Market-level audit trail</h1>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          {meta.totalPass.toLocaleString()} addressable markets, grouped by source category → domain area → competition or asset → repeated question pattern. Each leaf shows one representative example you can verify on Polymarket. Filter by date, source category, or text.
        </p>
      </header>
      <DrilldownTree />
    </div>
  );
}
