import { loadBenchmark } from '../../../../lib/data';
import { DrilldownTree } from '../../../../components/DrilldownTree';
import Link from 'next/link';

export default function DrilldownPage() {
  const data = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="text-sm text-ink-500 mb-1"><Link href="/benchmarks/pm-bench" className="hover:text-ink-700">← pm-bench</Link></div>
      <h1 className="text-3xl font-bold text-ink-900 mb-2">Drill-down browser</h1>
      <p className="text-ink-500 mb-4 leading-relaxed">
        Tree of <code className="bg-ink-100 px-1 rounded text-sm">L1 → L2 → L3 → template</code>. Each template row collapses many markets into the question pattern + an example. Click &quot;show all N markets&quot; to enumerate. Click &quot;Verify on Polymarket&quot; to land on the actual event page.
      </p>
      <DrilldownTree data={data} />
    </div>
  );
}
