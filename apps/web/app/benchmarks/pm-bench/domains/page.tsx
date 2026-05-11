import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { DomainTable } from '@/components/DomainTable';

export default function DomainsPage() {
  const data = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-3">
        <Link href="/benchmarks/pm-bench" className="text-sm text-muted-foreground hover:text-foreground">← pm-bench</Link>
      </div>
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Per-source routing</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Source hosts and fetch targets</h1>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          {data.domains.length} unique source hosts appear in Polymarket&apos;s resolution criteria across this window. For each, the classifier assigns a category and a target host the oracle would fetch.
        </p>
      </header>
      <DomainTable data={data} />
    </div>
  );
}
