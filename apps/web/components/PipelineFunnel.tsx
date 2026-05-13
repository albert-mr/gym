'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PipelinePie, type PieHoverKey, type PipelineStats } from './PipelinePie';

type Row = {
  count: number;
  label: string;
  detail: string;
  altLink?: boolean;
  hoverKey?: PieHoverKey;
};

export function PipelineFunnel({ stats }: { stats: PipelineStats }) {
  const [hovered, setHovered] = useState<PieHoverKey | null>(null);

  const { direct, alt, held } = stats;
  const onchain = stats.chainlink + stats.pyth;
  const universe = onchain + direct + alt + held;
  const addressable = direct + alt + held;
  const resolved = direct + alt;

  const rows: Row[] = [
    {
      count: universe,
      label: 'Polymarket universe',
      detail: 'Every market ending in the cumulative window.',
    },
    {
      count: onchain,
      label: 'On-chain feeds handed back',
      detail: 'Chainlink and Pyth resolve via on-chain price feeds. The chain already has the answer.',
      hoverKey: 'onchain',
    },
    {
      count: addressable,
      label: 'IO-addressable URL markets',
      detail: 'Remaining markets with a usable source path after deterministic feed and no-source gates.',
    },
    {
      count: direct,
      label: 'Direct source',
      detail: 'The Intelligent Oracle fetches the host Polymarket named.',
      hoverKey: 'direct',
    },
    {
      count: alt,
      label: 'Alternative source',
      detail: 'Named host blocks validators. We route to a verified alternate.',
      altLink: true,
      hoverKey: 'alt',
    },
    {
      count: held,
      label: 'Held for later',
      detail: 'Paywall, login wall, captcha, or pure-consensus markets. They wait for the right resolution mode.',
      hoverKey: 'held',
    },
  ];

  return (
    <div className="border border-border rounded-2xl p-6 md:p-8 space-y-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">The pipeline</div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12">
        <ul className="space-y-3">
          {rows.map((row, i) => {
            const isHovered = !!row.hoverKey && hovered === row.hoverKey;
            const isDim = hovered !== null && row.hoverKey !== undefined && hovered !== row.hoverKey;
            const interactive = !!row.hoverKey;
            return (
              <li
                key={i}
                onMouseEnter={() => row.hoverKey && setHovered(row.hoverKey)}
                onMouseLeave={() => row.hoverKey && setHovered(null)}
                className={`rounded-md -mx-2 px-2 py-1.5 transition-colors ${interactive ? 'cursor-default' : ''} ${isHovered ? 'bg-muted/70' : ''} ${isDim ? 'opacity-50' : ''}`}
              >
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-semibold tabular-nums text-lg md:text-xl text-foreground">
                    {row.count.toLocaleString()}
                  </span>
                  <span className="text-sm md:text-base text-foreground/90">
                    {row.label}
                    {row.altLink && (
                      <sup><Link href="/benchmarks/polymarket/methodology#alt-source-disclaimer" className="underline underline-offset-2 hover:text-foreground">*</Link></sup>
                    )}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-0.5">{row.detail}</p>
              </li>
            );
          })}
        </ul>

        <div className="lg:pt-1">
          <PipelinePie stats={stats} embedded hovered={hovered} onHover={setHovered} />
        </div>
      </div>

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
