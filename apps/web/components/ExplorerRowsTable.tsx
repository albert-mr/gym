'use client';
import Link from 'next/link';
import type { BenchmarkData, ExplorerMarketRow } from '@/lib/types';
import { bucketColor, bucketLabel, rowCount } from '@/lib/explorer-data';
import { BucketBadge } from './BucketBadge';

type Props = {
  rows: ExplorerMarketRow[];
  data: BenchmarkData;
  limit?: number;
};

export function ExplorerRowsTable({ rows, data, limit = 75 }: Props) {
  const visible = rows.slice(0, limit);
  const visibleCount = rowCount(visible);
  const totalCount = rowCount(rows);

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="bg-muted/30 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Date</th>
              <th className="text-left font-medium px-3 py-2">Market</th>
              <th className="text-left font-medium px-3 py-2">Named source</th>
              <th className="text-left font-medium px-3 py-2">Verified / fetched</th>
              <th className="text-left font-medium px-3 py-2">Bucket</th>
              <th className="text-left font-medium px-3 py-2">Outcome</th>
              <th className="text-right font-medium px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {visible.map(row => (
              <tr key={`${row.id}-${row.circle}-${row.bucket}`} className="border-t border-border hover:bg-muted/40">
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {row.synthetic ? (row.date || 'aggregate') : row.date || '—'}
                </td>
                <td className="px-3 py-2 text-foreground/90 min-w-[260px] max-w-xl">
                  <div className="line-clamp-2">{row.question}</div>
                  {row.synthetic && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {row.count.toLocaleString()} markets represented by this aggregate row
                    </div>
                  )}
                </td>
                <td className="px-3 py-2"><code className="text-[11px] text-muted-foreground">{row.namedHost || '—'}</code></td>
                <td className="px-3 py-2"><code className="text-[11px] text-muted-foreground">{row.verifiedHost || '—'}</code></td>
                <td className="px-3 py-2">
                  <BucketBadge bucket={row.bucket} label={bucketLabel(data, row.bucket)} color={bucketColor(data, row.bucket)} />
                </td>
                <td className="px-3 py-2 text-xs">{formatWinner(row.winner)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <span className="inline-flex gap-2">
                    {row.detailAvailable && (
                      <Link href={`/benchmarks/polymarket/markets/${row.slug || row.id}`} className="underline underline-offset-2 hover:text-foreground">details</Link>
                    )}
                    {(row.eventSlug || row.polymarketUrl) && (
                      <a
                        href={row.polymarketUrl || `https://polymarket.com/event/${row.eventSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        verify ↗
                      </a>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalCount > visibleCount && (
        <div className="text-xs text-muted-foreground tabular-nums">
          Showing {visibleCount.toLocaleString()} of {totalCount.toLocaleString()} markets in this group.
        </div>
      )}
    </div>
  );
}

function formatWinner(winner: string) {
  if (winner === 'pending') return <span className="italic text-muted-foreground">pending</span>;
  if (winner === 'no action') return <span className="italic text-muted-foreground">no action</span>;
  return <span className="text-foreground font-medium">{winner}</span>;
}
