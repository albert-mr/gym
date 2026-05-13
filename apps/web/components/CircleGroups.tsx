'use client';
import { useEffect, useMemo, useState } from 'react';
import type { BenchmarkData, ExplorerCircle, ExplorerMarketRow } from '@/lib/types';
import { CIRCLE_META, CIRCLE_ORDER, rowCount } from '@/lib/explorer-data';
import { Button } from './ui/button';
import { ExplorerRowsTable } from './ExplorerRowsTable';

export function CircleGroups({ data, rows }: { data: BenchmarkData; rows: ExplorerMarketRow[] }) {
  const [openCircle, setOpenCircle] = useState<ExplorerCircle | null>(null);
  const groups = useMemo(() => {
    return CIRCLE_ORDER.map(circle => {
      const circleRows = rows.filter(row => row.circle === circle);
      return { circle, rows: circleRows, count: rowCount(circleRows) };
    }).filter(group => group.count > 0);
  }, [rows]);

  useEffect(() => {
    if (openCircle === null) return;
    if (!groups.some(group => group.circle === openCircle)) {
      setOpenCircle(groups[0]?.circle ?? null);
    }
  }, [groups, openCircle]);

  if (groups.length === 0) {
    return <div className="text-muted-foreground italic py-12 text-center text-sm">No resolution paths match these filters.</div>;
  }

  const total = Math.max(1, groups.reduce((sum, group) => sum + group.count, 0));

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground tabular-nums">
        {groups.reduce((sum, group) => sum + group.count, 0).toLocaleString()} markets across {groups.length} resolution path{groups.length === 1 ? '' : 's'}
      </div>
      <div className="space-y-2">
        {groups.map(group => {
          const meta = CIRCLE_META[group.circle];
          const open = openCircle === group.circle;
          return (
            <section key={group.circle} className="border border-border rounded-lg overflow-hidden">
              <div className="p-4 flex items-start gap-4 justify-between bg-card">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: meta.color }} />
                    <h3 className="font-semibold text-foreground">{meta.label}</h3>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {group.count.toLocaleString()} markets · {((group.count / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{meta.description}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpenCircle(open ? null : group.circle)}>
                  {open ? 'Hide' : 'Expand'}
                </Button>
              </div>
              {open && (
                <div className="border-t border-border p-3 bg-muted/10">
                  <ExplorerRowsTable rows={group.rows} data={data} />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
