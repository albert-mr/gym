'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { BenchmarkData } from '@/lib/types';
import { ExplorerFilters, useExplorerFilters } from '@/components/ExplorerFilters';
import { ExplorerSummary } from '@/components/ExplorerSummary';
import { DrilldownTree } from '@/components/DrilldownTree';
import { DomainTable } from '@/components/DomainTable';
import { PerDayTable } from '@/components/PerDayTable';
import { MarketsList } from '@/components/MarketsList';

type Props = { data: BenchmarkData };
type GroupBy = 'category' | 'source' | 'day' | 'list';

const TABS: { key: GroupBy; label: string; subtitle: string }[] = [
  { key: 'category', label: 'By category', subtitle: 'Sports, esports, weather, crypto, politics, etc.' },
  { key: 'source', label: 'By source host', subtitle: 'Every host the Intelligent Oracle has classified.' },
  { key: 'day', label: 'By day', subtitle: 'Cumulative day-by-day breakdown.' },
  { key: 'list', label: 'Flat list', subtitle: 'Every market matching filters, 25 per page.' },
];

export function ExplorerClient({ data }: Props) {
  const { filters, setFilters } = useExplorerFilters();
  const [groupBy, setGroupBy] = useState<GroupBy>('category');
  const current = TABS.find(t => t.key === groupBy)!;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-6 px-6 py-3 bg-background/95 backdrop-blur border-b border-border">
        <ExplorerFilters data={data} value={filters} onChange={setFilters} />
      </div>

      <ExplorerSummary data={data} filters={filters} />

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1 border border-border rounded-lg p-1 bg-muted/30">
          {TABS.map(tab => {
            const active = tab.key === groupBy;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setGroupBy(tab.key)}
                className={`flex-1 min-w-[140px] text-sm px-3 py-2 rounded-md transition-colors ${active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{current.subtitle}</p>
      </div>

      <section className="min-h-[200px]">
        {groupBy === 'category' && <DrilldownTree data={data} filters={filters} />}
        {groupBy === 'source' && <DomainTable data={data} />}
        {groupBy === 'day' && <PerDayTable data={data} />}
        {groupBy === 'list' && <MarketsList data={data} filters={filters} />}
      </section>

      <section className="pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Want the full data? <a href="/data/pm-bench/markets.json" download className="underline underline-offset-2 hover:text-foreground">Download the dataset (JSON)</a>.{' '}
          Or read the methodology behind every number: <Link href="/benchmarks/polymarket/methodology" className="underline underline-offset-2 hover:text-foreground">methodology &rarr;</Link>.
        </p>
      </section>
    </div>
  );
}
