'use client';
import Link from 'next/link';
import type { BenchmarkData } from '@/lib/types';
import { ExplorerFilters, useExplorerFilters } from '@/components/ExplorerFilters';
import { ExplorerSummary } from '@/components/ExplorerSummary';
import { DrilldownTree } from '@/components/DrilldownTree';
import { DomainTable } from '@/components/DomainTable';
import { PerDayTable } from '@/components/PerDayTable';
import { MarketsList } from '@/components/MarketsList';

type Props = { data: BenchmarkData };

export function ExplorerClient({ data }: Props) {
  const { filters, setFilters } = useExplorerFilters();

  return (
    <div className="space-y-12">
      <div className="sticky top-2 z-10 -mx-2 px-2">
        <ExplorerFilters data={data} value={filters} onChange={setFilters} />
      </div>

      <section id="summary" className="space-y-3 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">Summary</h2>
        <ExplorerSummary data={data} filters={filters} />
      </section>

      <section id="sources" className="space-y-3 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">By source host</h2>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">Every host the Intelligent Oracle has classified, with the bucket the host&rsquo;s markets land in and the host we actually fetch when we route to an alternate.</p>
        <DomainTable data={data} />
      </section>

      <section id="categories" className="space-y-3 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">By category</h2>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">Markets grouped by domain area, competition, and repeated question pattern. Each leaf links to a per-market detail page.</p>
        <DrilldownTree data={data} filters={filters} />
      </section>

      <section id="by-day" className="space-y-3 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">By day</h2>
        <PerDayTable data={data} />
      </section>

      <section id="markets" className="space-y-3 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">Markets</h2>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">Flat list of every market matching the current filters. Click <span className="text-foreground">details</span> to open the per-market breakdown.</p>
        <MarketsList data={data} filters={filters} />
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
