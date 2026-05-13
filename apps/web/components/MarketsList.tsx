'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { BenchmarkData, MarketRow } from '@/lib/types';
import { ALT_BUCKETS, UNSOLVABLE_BUCKETS, SOLVED_BUCKETS } from '@/lib/types';
import { BucketBadge } from './BucketBadge';
import { Button } from '@/components/ui/button';
import type { ExplorerFilterState } from '@/lib/explorer-filters';
import { filterTemplates } from './DrilldownTree';

type Props = { data: BenchmarkData; filters: ExplorerFilterState };

const PAGE_SIZE = 25;

export function MarketsList({ data, filters }: Props) {
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const templates = filterTemplates(data, filters);
    const tplIds = new Set(templates.map(t => t.id));
    const rows: MarketRow[] = [];
    for (const [tplId, markets] of Object.entries(data.marketsByTemplate)) {
      if (!tplIds.has(tplId)) continue;
      for (const m of markets) {
        if (filters.date !== 'all' && m.date !== filters.date) continue;
        if (filters.buckets.length && !filters.buckets.includes(m.bucket)) continue;
        if (filters.status === 'solved' && !SOLVED_BUCKETS.has(m.bucket)) continue;
        if (filters.status === 'unresolvable' && !UNSOLVABLE_BUCKETS.has(m.bucket)) continue;
        if (filters.status === 'disagrees') continue;
        if (filters.host !== 'all') {
          const hostMatch = m.eRSHost === filters.host || m.rebindHost === filters.host;
          if (!hostMatch) continue;
        }
        if (filters.solvedOnly && !SOLVED_BUCKETS.has(m.bucket)) continue;
        if (filters.search.trim()) {
          const q = filters.search.trim().toLowerCase();
          const hay = `${m.question} ${m.eRSHost} ${m.rebindHost}`.toLowerCase();
          if (!hay.includes(q)) continue;
        }
        rows.push(m);
      }
    }
    rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return rows;
  }, [data, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages - 1);
  const start = current * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground tabular-nums">
        {filtered.length.toLocaleString()} markets · page {current + 1} of {totalPages}
      </div>
      {visible.length === 0 ? (
        <div className="text-muted-foreground italic py-8 text-center text-sm">No markets match these filters.</div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/30">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Date</th>
                <th className="text-left px-3 py-2 font-medium">Market</th>
                <th className="text-left px-3 py-2 font-medium">Source</th>
                <th className="text-left px-3 py-2 font-medium">Bucket</th>
                <th className="text-left px-3 py-2 font-medium">Outcome</th>
                <th className="text-right px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {visible.map(m => (
                <tr key={m.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-3 py-2 text-xs text-muted-foreground">{m.date}</td>
                  <td className="px-3 py-2 text-foreground/90 max-w-md truncate" title={m.question}>{m.question}</td>
                  <td className="px-3 py-2"><code className="text-[11px] text-muted-foreground">{m.eRSHost || '—'}</code></td>
                  <td className="px-3 py-2">
                    <BucketBadge bucket={m.bucket} label={data.bucketLabels[m.bucket] ?? m.bucket} color={data.bucketColors[m.bucket]} />
                    {ALT_BUCKETS.has(m.bucket) && <sup><Link href="/benchmarks/polymarket/methodology#alt-source-disclaimer" className="underline underline-offset-2 hover:text-foreground">*</Link></sup>}
                  </td>
                  <td className="px-3 py-2 text-xs">{m.winner === 'pending' ? <span className="italic text-muted-foreground">pending</span> : m.winner}</td>
                  <td className="px-3 py-2 text-right">
                    {m.slug && (
                      <Link href={`/benchmarks/polymarket/markets/${m.slug}`} className="text-xs underline underline-offset-2 hover:text-foreground">details &rarr;</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <Button variant="ghost" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>&larr; Previous</Button>
          <span className="text-muted-foreground tabular-nums">{(start + 1).toLocaleString()}–{Math.min(start + PAGE_SIZE, filtered.length).toLocaleString()} of {filtered.length.toLocaleString()}</span>
          <Button variant="ghost" size="sm" disabled={current >= totalPages - 1} onClick={() => setPage(current + 1)}>Next &rarr;</Button>
        </div>
      )}
    </div>
  );
}
