import Link from 'next/link';
import { loadBenchmark, loadComingSoon } from '../../lib/data';

export default function BenchmarksIndex() {
  const pm = loadBenchmark('pm-bench');
  const sources = loadComingSoon('sources-bench');
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 text-ink-900">Benchmarks</h1>
      <p className="text-ink-500 mb-8">Each benchmark answers one question about GenLayer&apos;s intelligent oracle. Click any card to drill in.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* pm-bench card */}
        <Link href="/benchmarks/pm-bench" className="block rounded-lg border border-ink-200 bg-white p-6 hover:border-ink-700 hover:shadow-sm transition">
          <div className="flex items-baseline justify-between mb-2">
            <div className="font-mono text-sm text-ink-500">pm-bench</div>
            <div className="text-[11px] uppercase tracking-widest text-green-700 bg-green-50 px-2 py-0.5 rounded">Live</div>
          </div>
          <h2 className="text-xl font-semibold text-ink-900 mb-2">Polymarket routability</h2>
          <p className="text-sm text-ink-700 leading-relaxed mb-4">
            What fraction of Polymarket&apos;s UMA-resolved 24h-horizon market universe can GenLayer&apos;s intelligent oracle route to a known canonical source family?
          </p>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-extrabold tabular-nums text-ink-900">{pm.meta.headlinePct.toFixed(1)}%</div>
            <div className="text-xs text-ink-500">routable · {pm.meta.totalPass.toLocaleString()} markets · {pm.meta.dates[0]} → {pm.meta.dates[pm.meta.dates.length-1]}</div>
          </div>
        </Link>

        {/* sources-bench placeholder card */}
        <Link href="/benchmarks/sources-bench" className="block rounded-lg border border-ink-200 bg-ink-50 p-6 hover:border-ink-700 hover:shadow-sm transition">
          <div className="flex items-baseline justify-between mb-2">
            <div className="font-mono text-sm text-ink-500">{sources?.name ?? 'sources-bench'}</div>
            <div className="text-[11px] uppercase tracking-widest text-orange-700 bg-orange-50 px-2 py-0.5 rounded">Planned</div>
          </div>
          <h2 className="text-xl font-semibold text-ink-700 mb-2">Source accessibility</h2>
          <p className="text-sm text-ink-700 leading-relaxed mb-4">
            {sources?.description ?? 'Versioned, queryable dataset of web sources — each labeled accessible / partial / blocked + reason. Starts with newspapers, expands to the sources Polymarket markets actually depend on.'}
          </p>
          <span className="text-xs text-ink-500 hover:text-ink-700 underline">Details →</span>
        </Link>
      </div>
    </div>
  );
}
