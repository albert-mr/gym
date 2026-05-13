'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import type { BenchmarkData } from '@/lib/types';
import { DIRECT_BUCKETS, ALT_BUCKETS } from '@/lib/types';
import type { ExplorerFilterState } from '@/lib/explorer-filters';
import { filterTemplates } from './DrilldownTree';

type Props = { data: BenchmarkData; filters: ExplorerFilterState };

export function ExplorerSummary({ data, filters }: Props) {
  const summary = useMemo(() => {
    const templates = filterTemplates(data, filters);
    let direct = 0;
    let alt = 0;
    let held = 0;
    for (const t of templates) {
      for (const [bucket, n] of Object.entries(t.buckets)) {
        if (DIRECT_BUCKETS.has(bucket)) direct += n;
        else if (ALT_BUCKETS.has(bucket)) alt += n;
        else held += n;
      }
    }
    return { templates: templates.length, markets: direct + alt + held, direct, alt, held };
  }, [data, filters]);

  const total = Math.max(1, summary.markets);
  const directPct = (summary.direct / total) * 100;
  const altPct = (summary.alt / total) * 100;
  const heldPct = (summary.held / total) * 100;

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
            <div className="h-full bg-emerald-500/80" style={{ width: `${directPct}%` }} title={`Direct: ${summary.direct.toLocaleString()}`} />
            <div className="h-full bg-lime-500/80" style={{ width: `${altPct}%` }} title={`Alt: ${summary.alt.toLocaleString()}`} />
            <div className="h-full bg-amber-500/70" style={{ width: `${heldPct}%` }} title={`Held: ${summary.held.toLocaleString()}`} />
          </div>
          <div className="text-xs text-muted-foreground tabular-nums flex flex-wrap gap-x-4 gap-y-1">
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500/80 mr-1.5 align-middle" />Direct {summary.direct.toLocaleString()}</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-lime-500/80 mr-1.5 align-middle" />Alt<sup><Link href="/benchmarks/polymarket/methodology#alt-source-disclaimer" className="underline underline-offset-2 hover:text-foreground">*</Link></sup> {summary.alt.toLocaleString()}</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500/70 mr-1.5 align-middle" />Held {summary.held.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  );
}
