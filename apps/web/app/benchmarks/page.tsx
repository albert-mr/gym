import Link from 'next/link';
import { loadBenchmark, loadComingSoon } from '@/lib/data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { longDate } from '@/lib/format';

export default function BenchmarksIndex() {
  const pm = loadBenchmark('pm-bench');
  const sources = loadComingSoon('sources-bench');
  const startLong = longDate(pm.meta.window.start);
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Benchmarks</p>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">One question per benchmark</h1>
      <p className="text-base text-muted-foreground mb-12 max-w-2xl">Each benchmark answers one specific question about GenLayer, with all data and methodology in the open.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/benchmarks/polymarket" className="group">
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs text-muted-foreground">Polymarket benchmark</span>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-widest">Live</Badge>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Polymarket resolution coverage</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Of every Polymarket market that has ended since {startLong}, what fraction is within GenLayer&apos;s resolution coverage?
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-3 mt-2">
                <div className="text-4xl font-semibold tracking-tight tabular-nums">{pm.meta.headlinePct.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">{pm.meta.totalPass.toLocaleString()} markets &middot; {pm.meta.dates[0]} &rarr; {pm.meta.dates[pm.meta.dates.length-1]}</div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/benchmarks/sources-bench" className="group">
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs text-muted-foreground">Sources benchmark</span>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-widest">Live</Badge>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Source accessibility</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Which web sources are reachable from validator-equivalent infrastructure, by category &mdash; and which ones aren&apos;t (with the failure reason).
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-3 mt-2">
                <div className="text-4xl font-semibold tracking-tight tabular-nums">{pm.domains.length}</div>
                <div className="text-xs text-muted-foreground">unique sources tracked</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
