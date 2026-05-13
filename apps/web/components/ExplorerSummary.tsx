'use client';
import { useMemo } from 'react';
import type { BenchmarkData, ExplorerMarketRow } from '@/lib/types';
import { CIRCLE_META, CIRCLE_ORDER, summarizeRows } from '@/lib/explorer-data';

type Props = { data: BenchmarkData; rows: ExplorerMarketRow[] };

export function ExplorerSummary({ data: _data, rows }: Props) {
  const summary = useMemo(() => summarizeRows(rows), [rows]);

  const total = Math.max(1, summary.markets);

  return (
    <div className="border border-border rounded-lg p-5 space-y-3">
      <div className="text-sm text-foreground">
        <span className="font-medium tabular-nums">{summary.templates.toLocaleString()}</span> templates
        <span className="text-muted-foreground/60 px-2">·</span>
        <span className="font-medium tabular-nums">{summary.markets.toLocaleString()}</span> markets match these filters
      </div>
      {summary.markets > 0 && (
        <>
          <div className="h-3 rounded-sm bg-muted overflow-hidden flex">
            {CIRCLE_ORDER.map(circle => {
              const count = summary.circles[circle];
              if (!count) return null;
              return (
                <div
                  key={circle}
                  className="h-full"
                  style={{ width: `${(count / total) * 100}%`, backgroundColor: CIRCLE_META[circle].color }}
                  title={`${CIRCLE_META[circle].label}: ${count.toLocaleString()}`}
                />
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums flex flex-wrap gap-x-4 gap-y-1">
            {CIRCLE_ORDER.map(circle => {
              const count = summary.circles[circle];
              if (!count) return null;
              return (
                <span key={circle}>
                  <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ backgroundColor: CIRCLE_META[circle].color }} />
                  {CIRCLE_META[circle].label}
                  {' '}{count.toLocaleString()}
                </span>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
