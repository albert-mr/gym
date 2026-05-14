import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBenchmark } from '@/lib/queries/benchmark';
import { getMarketBySlug } from '@/lib/queries/markets';
import { MarketDetailCard } from '@/components/MarketDetailCard';

type Props = { params: Promise<{ slug: string }> };

export default async function MarketDetailPage({ params }: Props) {
  const { slug } = await params;
  const [market, data] = await Promise.all([
    getMarketBySlug(slug),
    getBenchmark('pm-bench'),
  ]);
  if (!market || !data) notFound();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-10">
      <div>
        <Link href="/benchmarks/polymarket/explorer" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to explorer</Link>
      </div>
      <MarketDetailCard market={market} bucketLabels={data.bucketLabels} bucketColors={data.bucketColors} />
    </div>
  );
}
