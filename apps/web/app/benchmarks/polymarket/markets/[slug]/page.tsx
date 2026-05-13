import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadBenchmark, loadMarkets, loadMarketBySlug } from '@/lib/data';
import { MarketDetailCard } from '@/components/MarketDetailCard';

export function generateStaticParams() {
  const doc = loadMarkets();
  const seen = new Set<string>();
  const params: Array<{ slug: string }> = [];
  for (const m of doc.markets) {
    if (!m.slug || seen.has(m.slug)) continue;
    seen.add(m.slug);
    params.push({ slug: m.slug });
  }
  return params;
}

type Props = { params: Promise<{ slug: string }> };

export default async function MarketDetailPage({ params }: Props) {
  const { slug } = await params;
  const market = loadMarketBySlug(slug);
  if (!market) notFound();
  const data = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-10">
      <div>
        <Link href="/benchmarks/polymarket/explorer" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to explorer</Link>
      </div>
      <MarketDetailCard market={market} bucketLabels={data.bucketLabels} bucketColors={data.bucketColors} />
    </div>
  );
}
