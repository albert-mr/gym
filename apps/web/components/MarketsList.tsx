'use client';
import { useMemo, useState } from 'react';
import type { BenchmarkData, ExplorerMarketRow } from '@/lib/types';
import { rowCount, sortRows } from '@/lib/explorer-data';
import { Button } from '@/components/ui/button';
import { ExplorerRowsTable } from './ExplorerRowsTable';

type Props = { data: BenchmarkData; rows: ExplorerMarketRow[] };

const PAGE_SIZE = 25;

export function MarketsList({ data, rows }: Props) {
  const [page, setPage] = useState(0);
  const sorted = useMemo(() => sortRows(rows), [rows]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, totalPages - 1);
  const start = current * PAGE_SIZE;
  const visible = sorted.slice(start, start + PAGE_SIZE);
  const totalMarkets = rowCount(sorted);
  const visibleStart = sorted.length === 0 ? 0 : start + 1;
  const visibleEnd = Math.min(start + PAGE_SIZE, sorted.length);

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground tabular-nums">
        {totalMarkets.toLocaleString()} markets · {sorted.length.toLocaleString()} displayed row{sorted.length === 1 ? '' : 's'} · page {current + 1} of {totalPages}
      </div>
      {visible.length === 0 ? (
        <div className="text-muted-foreground italic py-8 text-center text-sm">No markets match these filters.</div>
      ) : (
        <ExplorerRowsTable rows={visible} data={data} limit={PAGE_SIZE} />
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <Button variant="ghost" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>&larr; Previous</Button>
          <span className="text-muted-foreground tabular-nums">{visibleStart.toLocaleString()}–{visibleEnd.toLocaleString()} of {sorted.length.toLocaleString()} rows</span>
          <Button variant="ghost" size="sm" disabled={current >= totalPages - 1} onClick={() => setPage(current + 1)}>Next &rarr;</Button>
        </div>
      )}
    </div>
  );
}
