import { NextResponse } from 'next/server';
import { getMarkets } from '@/lib/queries/markets';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getMarkets(slug);
  return NextResponse.json(doc, {
    headers: {
      'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      'Content-Disposition': `attachment; filename="${slug}-markets.json"`,
    },
  });
}
