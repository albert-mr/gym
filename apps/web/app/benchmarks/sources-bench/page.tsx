import Link from 'next/link';
import { loadComingSoon } from '../../../lib/data';

export default function ComingSoonPage() {
  const data = loadComingSoon('sources-bench');
  if (!data) {
    return <div className="mx-auto max-w-2xl px-6 py-12 text-ink-500">No upcoming benchmark data found.</div>;
  }
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
      <div className="text-sm text-ink-500 mb-1"><Link href="/benchmarks" className="hover:text-ink-700">← Benchmarks</Link></div>
      <div className="flex items-center gap-3">
        <div className="text-xs uppercase tracking-widest text-orange-700 bg-orange-50 px-2 py-0.5 rounded">Planned</div>
        <div className="font-mono text-sm text-ink-500">{data.name}</div>
      </div>
      <h1 className="text-3xl font-bold text-ink-900">{data.name === 'sources-bench' ? 'Source accessibility' : data.name}</h1>
      <p className="text-ink-700 leading-relaxed">{data.description}</p>
      <div className="border-l-4 border-ink-200 pl-4 py-2 text-sm text-ink-500 leading-relaxed">
        This benchmark is in the design / early-pipeline phase. The repo holds the plan and stub data; the dashboard will fill in here once data exists.
      </div>
      {data.link && (
        <div>
          <a className="inline-block bg-ink-900 text-white px-4 py-2 rounded hover:bg-ink-700 transition text-sm" href={data.link} target="_blank" rel="noopener noreferrer">View the plan on GitHub →</a>
        </div>
      )}
    </div>
  );
}
