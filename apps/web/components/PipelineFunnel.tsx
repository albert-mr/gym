import Link from 'next/link';
import type { BenchmarkData } from '@/lib/types';
import { DIRECT_BUCKETS, ALT_BUCKETS } from '@/lib/types';

type Row = {
  kind: 'start' | 'drop' | 'result' | 'held';
  count: number;
  delta?: number;
  label: string;
  detail: string;
  altLink?: boolean;
};

function bucketSums(data: BenchmarkData) {
  let direct = 0;
  let alt = 0;
  let held = 0;
  for (const t of data.templates) {
    for (const [bucket, n] of Object.entries(t.buckets)) {
      if (DIRECT_BUCKETS.has(bucket)) direct += n;
      else if (ALT_BUCKETS.has(bucket)) alt += n;
      else held += n;
    }
  }
  return { direct, alt, held };
}

export function PipelineFunnel({ data }: { data: BenchmarkData }) {
  const s = data.onchainFeedStats;
  const { direct, alt, held } = bucketSums(data);
  const universe = s.polledUniverse;
  const afterOnchain = universe - s.chainlink - s.pyth;
  const addressable = direct + alt + held;
  const noSource = Math.max(0, afterOnchain - addressable);
  const resolved = direct + alt;
  const onchainDrop = s.chainlink + s.pyth;

  const rows: Row[] = [
    {
      kind: 'start',
      count: universe,
      label: 'Polymarket universe',
      detail: 'Every market ending in the cumulative window. The starting set the Intelligent Oracle runs against.',
    },
    {
      kind: 'drop',
      count: afterOnchain,
      delta: onchainDrop,
      label: 'We hand on-chain oracles back',
      detail: `Chainlink (${s.chainlink.toLocaleString()}) and Pyth (${s.pyth.toLocaleString()}) resolve their own markets via on-chain price feeds. We hand these back — the chain already has the answer.`,
    },
    {
      kind: 'drop',
      count: addressable,
      delta: noSource,
      label: 'We set aside markets with no source URL',
      detail: 'Markets without an explicit source URL go to a future agentic-search release. We do not ship best-effort scraping.',
    },
    {
      kind: 'result',
      count: direct,
      label: 'Direct source',
      detail: 'The Intelligent Oracle fetches the host Polymarket named.',
    },
    {
      kind: 'result',
      count: alt,
      label: 'Alternative source',
      detail: 'Named host blocks validator infrastructure; we route to a verified alternate that contains the same fact.',
      altLink: true,
    },
    {
      kind: 'held',
      count: held,
      label: 'Held for later',
      detail: 'Paywall, login wall, captcha, or pure-consensus markets we surface honestly. They wait for the resolution mode they need.',
    },
  ];

  const maxCount = universe || 1;

  return (
    <div className="border border-border rounded-2xl p-6 md:p-8 space-y-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">The pipeline</div>
      <ul className="space-y-3">
        {rows.map((row, i) => {
          const widthPct = (row.count / maxCount) * 100;
          const isStart = row.kind === 'start';
          const isResult = row.kind === 'result';
          const isHeld = row.kind === 'held';
          const barColor = isStart
            ? 'bg-foreground/70'
            : isResult
              ? 'bg-emerald-500/80'
              : isHeld
                ? 'bg-amber-500/70'
                : 'bg-foreground/60';
          return (
            <li key={i} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3 flex-1 min-w-0">
                  <span className="font-semibold tabular-nums text-lg md:text-xl text-foreground">
                    {row.count.toLocaleString()}
                  </span>
                  {row.delta !== undefined && (
                    <span className="text-xs tabular-nums text-muted-foreground">−{row.delta.toLocaleString()}</span>
                  )}
                  <span className="text-sm md:text-base text-foreground/90 truncate">
                    {row.label}
                    {row.altLink && (
                      <sup><Link href="/benchmarks/polymarket/methodology#alt-source-disclaimer" className="underline underline-offset-2 hover:text-foreground">*</Link></sup>
                    )}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-sm bg-muted overflow-hidden">
                <div className={`h-full ${barColor}`} style={{ width: `${widthPct}%` }} />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{row.detail}</p>
            </li>
          );
        })}
      </ul>
      <div className="pt-3 border-t border-border text-sm text-muted-foreground tabular-nums">
        <span className="text-foreground font-medium">{resolved.toLocaleString()} resolved</span>
        <span className="px-2 text-muted-foreground/60">·</span>
        <span className="text-foreground font-medium">{held.toLocaleString()} deliberately held</span>
        <span className="px-2 text-muted-foreground/60">·</span>
        <span className="text-foreground font-medium">0 disagreements</span>
        <span className="text-muted-foreground"> with Polymarket so far.</span>
      </div>
    </div>
  );
}
