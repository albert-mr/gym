import type { BenchmarkData } from '../lib/types';
import { BucketBadge } from './BucketBadge';

export function DomainTable({ data }: { data: BenchmarkData }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-ink-100">
          <th className="text-left p-2 border-b border-ink-200 font-semibold">Host</th>
          <th className="text-right p-2 border-b border-ink-200 font-semibold">Markets</th>
          <th className="text-left p-2 border-b border-ink-200 font-semibold">Bucket</th>
          <th className="text-left p-2 border-b border-ink-200 font-semibold">Rebind / fetch target</th>
        </tr>
      </thead>
      <tbody className="font-mono text-[12px]">
        {data.domains.map(d => (
          <tr key={d.host} className="hover:bg-ink-50">
            <td className="p-2 border-b border-ink-200"><code>{d.host}</code></td>
            <td className="p-2 border-b border-ink-200 text-right tabular-nums">{d.count.toLocaleString()}</td>
            <td className="p-2 border-b border-ink-200"><BucketBadge bucket={d.dominantBucket} label={data.bucketLabels[d.dominantBucket] ?? d.dominantBucket} color={data.bucketColors[d.dominantBucket]} /></td>
            <td className="p-2 border-b border-ink-200"><code>{d.rebind && d.rebind !== d.host ? d.rebind : '(direct)'}</code></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
