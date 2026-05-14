'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import type { BenchmarkData } from '@/lib/types';
import { ExplorerFilters, useExplorerFilters } from '@/components/ExplorerFilters';
import { ExplorerSummary } from '@/components/ExplorerSummary';
import { DrilldownTree } from '@/components/DrilldownTree';
import { DomainTable } from '@/components/DomainTable';
import { PerDayTable } from '@/components/PerDayTable';
import { MarketsList } from '@/components/MarketsList';
import { CircleGroups } from '@/components/CircleGroups';
import { applyExplorerFilters, buildExplorerRows } from '@/lib/explorer-data';
import type { ExplorerView } from '@/lib/explorer-filters';

const TABS: { key: ExplorerView; label: string; subtitle: string }[] = [
  { key: 'category', label: 'By category', subtitle: 'Sports, esports, weather, crypto, politics, etc.' },
  { key: 'circle', label: 'By resolution path', subtitle: 'Grouped by how the market resolves: on-chain feed, direct source, alternative source, or held.' },
  { key: 'source', label: 'By source host', subtitle: 'Every host the Intelligent Oracle has classified.' },
  { key: 'day', label: 'By day', subtitle: 'Cumulative day-by-day breakdown.' },
  { key: 'list', label: 'Flat list', subtitle: 'Every market matching filters, 25 per page.' },
];

export function ExplorerClient({ data }: { data: BenchmarkData }) {
  const { filters, setFilters } = useExplorerFilters();
  const allRows = useMemo(() => buildExplorerRows(data), [data]);
  const filteredRows = useMemo(() => applyExplorerFilters(allRows, filters), [allRows, filters]);
  const current = TABS.find(t => t.key === filters.view) ?? TABS[0];

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-6 px-6 py-3 bg-background/95 backdrop-blur border-b border-border">
        <ExplorerFilters data={data} rows={allRows} value={filters} onChange={setFilters} />
      </div>

      <ExplorerSummary data={data} rows={filteredRows} />

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1 border border-border rounded-lg p-1 bg-muted/30">
          {TABS.map(tab => {
            const active = tab.key === filters.view;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilters({ ...filters, view: tab.key })}
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
        {filters.view === 'category' && <DrilldownTree data={data} rows={filteredRows} />}
        {filters.view === 'circle' && <CircleGroups data={data} rows={filteredRows} />}
        {filters.view === 'source' && <DomainTable data={data} rows={filteredRows} />}
        {filters.view === 'day' && <PerDayTable data={data} rows={filteredRows} />}
        {filters.view === 'list' && <MarketsList data={data} rows={filteredRows} />}
      </section>

      <section className="pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Want the full data? <a href="/api/benchmarks/pm-bench/markets" download="polymarket-markets.json" className="underline underline-offset-2 hover:text-foreground">Download the dataset (JSON)</a>.{' '}
          Or read the methodology behind every number: <Link href="/benchmarks/polymarket/methodology" className="underline underline-offset-2 hover:text-foreground">methodology &rarr;</Link>.
        </p>
      </section>
    </div>
  );
}
