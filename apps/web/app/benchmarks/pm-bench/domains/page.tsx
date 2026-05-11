import { loadBenchmark } from '../../../../lib/data';
import { DomainTable } from '../../../../components/DomainTable';
import Link from 'next/link';

export default function DomainsPage() {
  const data = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="text-sm text-ink-500 mb-1"><Link href="/benchmarks/pm-bench" className="hover:text-ink-700">← pm-bench</Link></div>
      <h1 className="text-3xl font-bold text-ink-900 mb-2">Per-domain routing</h1>
      <p className="text-ink-500 mb-6">Every host seen in <code className="bg-ink-100 px-1 rounded text-sm">eventResolutionSource</code> across the window, with its dominant classifier bucket and rebind target. {data.domains.length} hosts total.</p>
      <DomainTable data={data} />
    </div>
  );
}
