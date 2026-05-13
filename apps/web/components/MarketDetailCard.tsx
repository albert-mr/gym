import Link from 'next/link';
import { BucketBadge } from './BucketBadge';
import type { MarketDetail, BenchmarkData } from '@/lib/types';
import { ALT_BUCKETS, UNSOLVABLE_BUCKETS } from '@/lib/types';

type Props = {
  market: MarketDetail;
  bucketLabels: BenchmarkData['bucketLabels'];
  bucketColors: BenchmarkData['bucketColors'];
};

function StatusBadge({ market }: { market: MarketDetail }) {
  if (UNSOLVABLE_BUCKETS.has(market.bucket)) {
    return <Badge color="amber">Currently unresolvable</Badge>;
  }
  if (market.winner === 'pending') {
    return <Badge color="gray">Settlement pending</Badge>;
  }
  if (market.winner === 'no action') {
    return <Badge color="gray">No action (cancelled)</Badge>;
  }
  return <Badge color="green">Resolved</Badge>;
}

function Badge({ color, children }: { color: 'green' | 'amber' | 'gray' | 'red'; children: React.ReactNode }) {
  const tone: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    gray: 'bg-muted text-muted-foreground border-border',
    red: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-3 py-1 text-sm font-medium ${tone[color]}`}>{children}</span>
  );
}

function GateMark({ passed, children }: { passed: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-baseline gap-2 text-sm leading-relaxed">
      <span className={`inline-block w-12 text-center text-[10px] font-mono uppercase tracking-wider rounded border px-1.5 py-0.5 ${passed ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : 'border-red-500/40 text-red-700 dark:text-red-300'}`}>
        {passed ? 'PASS' : 'FAIL'}
      </span>
      <span className="text-foreground/90">{children}</span>
    </li>
  );
}

export function MarketDetailCard({ market, bucketLabels, bucketColors }: Props) {
  const isAlt = ALT_BUCKETS.has(market.bucket);
  const isBlocked = UNSOLVABLE_BUCKETS.has(market.bucket);
  const gate2Pass = market.namedSource !== null;
  const gate3Pass = !isBlocked;
  const usedDeeperPage = market.status === 'alternative' || (market.namedSource !== market.verifiedSource && market.verifiedSource !== null);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Market detail</p>
          <StatusBadge market={market} />
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug">{market.question}</h1>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{market.id}</span>
          <span>·</span>
          <span>{market.date}</span>
          <span>·</span>
          <BucketBadge bucket={market.bucket} label={bucketLabels[market.bucket] ?? market.bucket} color={bucketColors[market.bucket]} />
          {isAlt && (
            <sup><Link href="/benchmarks/polymarket/methodology#alt-source-disclaimer" className="underline underline-offset-2 hover:text-foreground">*</Link></sup>
          )}
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">Outcome</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          <span className="text-muted-foreground">Polymarket:</span>{' '}
          {market.winner === 'pending' ? (
            <span className="italic">settlement pending</span>
          ) : market.winner === 'no action' ? (
            <span className="italic">no action — cancelled or postponed</span>
          ) : (
            <span className="text-foreground font-medium">{market.winner}</span>
          )}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">Source routing</h2>
        <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Polymarket named:</span>{' '}
            <code className="text-foreground/90">{market.namedSource ?? '—'}</code>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">GenLayer fetched:</span>{' '}
            <code className="text-foreground/90">{market.verifiedSource ?? '— (no source verified)'}</code>
            {market.verifiedSource && market.namedSource && market.verifiedSource !== market.namedSource && (
              <span className="ml-2 text-[11px] uppercase tracking-wider rounded border border-amber-500/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5">routed to alternate</span>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">Gates</h2>
        <ul className="space-y-2">
          <GateMark passed={true}>
            <span className="text-foreground font-medium">Gate 1</span> &middot; on-chain feed filter (not Chainlink, not Pyth)
          </GateMark>
          <GateMark passed={gate2Pass}>
            <span className="text-foreground font-medium">Gate 2</span> &middot; source URL present in resolution criteria
          </GateMark>
          <GateMark passed={gate3Pass}>
            <span className="text-foreground font-medium">Gate 3</span> &middot; source accessible from validator infrastructure
            {isAlt && <span className="ml-2 text-xs text-muted-foreground">(passed via alternate)</span>}
          </GateMark>
          {usedDeeperPage && (
            <li className="flex items-baseline gap-2 text-sm leading-relaxed">
              <span className="inline-block w-12 text-center text-[10px] font-mono uppercase tracking-wider rounded border border-sky-500/40 text-sky-700 dark:text-sky-300 px-1.5 py-0.5">off-chain</span>
              <span className="text-foreground/90"><span className="font-medium">Deeper-page agent</span> &middot; navigated to the specific page before the Intelligent Oracle ran</span>
            </li>
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">Receipts</h2>
        <ul className="space-y-2 text-sm">
          {market.eventSlug && (
            <li>
              <a
                href={`https://polymarket.com/event/${market.eventSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/90 underline underline-offset-2 hover:text-foreground"
              >
                Verify on Polymarket &uarr;
              </a>
            </li>
          )}
          <li className="text-muted-foreground leading-relaxed">
            <span className="text-foreground/90 font-medium">Intelligent Oracle on-chain transaction:</span>{' '}
            <Link href="/benchmarks/polymarket/methodology#bradbury" className="underline underline-offset-2 hover:text-foreground">Bradbury</Link>{' '}
            rollout in progress. Studio batches today; real validator IPs on Bradbury attach on-chain receipts here.
          </li>
        </ul>
      </section>
    </div>
  );
}
