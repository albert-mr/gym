'use client';

import { useEffect, useRef, useState } from 'react';

// Static benchmark data — adapted from the reference funnel
// (Downloads/polymarket-chart/public/data/benchmark.json).
// Wire to live counts via lib/explorer-data.ts once exact-direct vs
// deep-search are exposed separately in pm-bench.

const META = {
  window: '2026-05-06 → 2026-05-13',
  totalPolled: 64_487,
  totalIntelligentOracleFit: 42_116,
  totalSourceResolvable: 39_695,
  accuracyMatchPct: 100,
};

type Branch = {
  kind: 'resolve' | 'exit' | 'held';
  value: number;
  label: string;
  narrative: string;
  resolveTone?: 'exact' | 'deep' | 'alt';
};

type Phase = {
  id: string;
  label: string;
  title: string;
  question: string;
  narrative: string;
  entering: number;
  branches: Branch[];
  futureWorkInline?: { title: string; note: string };
};

const PHASES: Phase[] = [
  {
    id: 'phase-1',
    label: 'Phase 1',
    title: 'Intelligent Oracle fit',
    question: 'Is this a market where the Intelligent Oracle has a role?',
    narrative:
      'Polymarket already routes price-feed and asset markets to deterministic on-chain oracles — Chainlink and Pyth. These are the right tool for that job, so the Intelligent Oracle steps aside. Everything else continues into the funnel.',
    entering: 64_487,
    branches: [
      {
        kind: 'exit',
        value: 22_371,
        label: 'On-chain feed — out of scope',
        narrative: 'Already resolved deterministically by Chainlink or Pyth.',
      },
    ],
  },
  {
    id: 'phase-2',
    label: 'Phase 2',
    title: 'Source URL exists',
    question: 'Does the market reference any source URL at all?',
    narrative:
      'The Intelligent Oracle reads the real world through URLs. If the market’s resolution criteria and description never reference one, there is nothing to read — we hold those for human review.',
    entering: 42_116,
    branches: [
      {
        kind: 'exit',
        value: 1_396,
        label: 'No URL anywhere',
        narrative: 'No source URL appears in resolution criteria or description.',
      },
    ],
    futureWorkInline: {
      title: 'Could become solvable',
      note: 'Some of these markets reference facts we could resolve without a URL — e.g., via off-chain agentic search or by inferring the canonical source from market context. Tracked as a research direction.',
    },
  },
  {
    id: 'phase-3',
    label: 'Phase 3',
    title: 'Exact direct source',
    question: 'Does the exact URL in the Polymarket criteria resolve the market directly?',
    narrative:
      'The cleanest case: the criteria links to a deep page that already contains the answer. The Intelligent Oracle fetches it and resolves — no rewriting, no search, no substitution.',
    entering: 40_720,
    branches: [
      {
        kind: 'resolve',
        resolveTone: 'exact',
        value: 8_321,
        label: 'Resolved by exact source',
        narrative: 'Direct fetch of the criteria URL produces the answer.',
      },
    ],
  },
  {
    id: 'phase-4',
    label: 'Phase 4',
    title: 'Deep search in same source',
    question: 'Can the Intelligent Oracle find the right page inside the same source family?',
    narrative:
      'Often the criteria points to a homepage or section root. An agent crawls the same source, finds the specific page that contains the resolution fact, and reads it.',
    entering: 32_399,
    branches: [
      {
        kind: 'resolve',
        resolveTone: 'deep',
        value: 14_480,
        label: 'Resolved by deep search',
        narrative: 'A deeper or more specific page inside the same named source family.',
      },
    ],
  },
  {
    id: 'phase-5',
    label: 'Phase 5',
    title: 'Alternative source',
    question: 'Can the same fact be resolved from a verified alternative source?',
    narrative:
      'When the named source is unusable, the Intelligent Oracle reaches for a verified alternative — Liquipedia, bo3.gg, Flashscore, ESPN Cricket, Wikipedia — and resolves from there. The remaining markets are held for human review.',
    entering: 17_919,
    branches: [
      {
        kind: 'resolve',
        resolveTone: 'alt',
        value: 16_894,
        label: 'Resolved by alternative',
        narrative: 'Verified alternative source such as Liquipedia, bo3.gg, Flashscore, ESPN Cricket, or Wikipedia.',
      },
    ],
  },
];

const PHASE6 = {
  label: 'Held for human review',
  title: 'Held for human review',
  question: 'What happens to the markets the Intelligent Oracle cannot resolve today?',
  value: 1_025,
  narrativeCurrent:
    'Today these 1,025 markets fall outside the Intelligent Oracle’s automated reach. They could be routed to UMA, settled by a Polymarket admin, or queued for a human reviewer. None of them have been resolved incorrectly — we simply do not assert an outcome.',
  breakdown: [
    { label: 'Paywalled / login-walled finance source', value: 504 },
    { label: 'Hard blocked / no known alternate', value: 160 },
    { label: 'Not yet classified / not routed', value: 327 },
    { label: 'URL exists but unusable source', value: 34 },
  ],
  futureWork: {
    title: 'Where the Intelligent Oracle goes next',
    intro: 'Most of this set is solvable with work we have not built yet. Each item below is an active research direction.',
    items: [
      { label: 'Off-chain agentic search', note: 'Bypass shallow URLs by reasoning across multiple verified sources.' },
      { label: 'Source reputation model', note: 'Score whether an unfamiliar URL is canonical for the claim being resolved.' },
      { label: 'TLS notary', note: 'Cryptographic receipts that prove specific bytes came from a specific HTTPS origin — unlocks paywalled, logged-in, rate-limited, or IP-locked pages.' },
      { label: 'Auto-routing to UMA', note: 'When the Intelligent Oracle abstains, fall through to the existing optimistic oracle.' },
    ],
  },
};

const GL_GRADIENT = 'linear-gradient(135deg, #E37DF7 0%, #9B6AF6 45%, #110FFF 100%)';

const RESOLVE_BORDER: Record<NonNullable<Branch['resolveTone']>, string> = {
  exact: '#047857',
  deep:  '#10B981',
  alt:   '#34D399',
};

function useInView(threshold = 0.25) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, seen]);
  return { ref, seen };
}

function useCountUp(target: number, active: boolean, duration = 1100, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.max(0, (now - start) / duration);
      if (t < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const eased = 1 - Math.pow(1 - Math.min(1, t), 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration, delay]);
  return value;
}

function MatchBadge({ short = false }: { short?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-[10.5px] font-bold uppercase tracking-[0.1em] text-white whitespace-nowrap"
      style={{ background: GL_GRADIENT }}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="w-[11px] h-[11px]" style={{ stroke: 'currentColor', fill: 'none', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
        <polyline points="3 8.5 6.5 12 13 4.5" />
      </svg>
      {short ? '100% match' : '100% match with Polymarket'}
    </span>
  );
}

function PctNum({ pct, active, className = '' }: { pct: number; active: boolean; className?: string }) {
  const v = useCountUp(pct, active);
  return <span className={className}>{v.toFixed(1)}%</span>;
}

function AbsNum({ value, active, className = '' }: { value: number; active: boolean; className?: string }) {
  const v = useCountUp(value, active);
  return <span className={className}>{Math.round(v).toLocaleString()} markets</span>;
}

function Spine({
  variant,
  label,
  title,
  question,
  value,
  counterLabel,
  active,
}: {
  variant: 'start' | 'phase' | 'residual';
  label: string;
  title: string;
  question: string;
  value: number;
  counterLabel: string;
  active: boolean;
}) {
  const pct = (value / META.totalPolled) * 100;
  const isStart = variant === 'start';
  const isResidual = variant === 'residual';

  return (
    <div
      className="relative rounded-xl px-5 py-5 md:px-6 md:py-6 text-center shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
      style={{
        background: isStart ? '#0F0F0F' : '#fff',
        color: isStart ? '#fff' : 'inherit',
        border: isResidual ? '1.6px solid #E00000' : '1.2px solid var(--border)',
        backgroundImage: isResidual ? 'linear-gradient(180deg, #fff, rgba(224,0,0,0.04))' : undefined,
      }}
    >
      <div className="flex items-center justify-center gap-2 mb-2.5">
        <span
          className="h-[6px] w-[6px] rounded-full"
          style={{ background: isStart ? '#E37DF7' : isResidual ? '#E00000' : '#110FFF' }}
        />
        <span
          className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
          style={{ color: isStart ? '#E37DF7' : isResidual ? '#E00000' : '#110FFF' }}
        >
          {label}
        </span>
      </div>

      <PctNum
        pct={pct}
        active={active}
        className="block text-[44px] md:text-[48px] font-medium leading-none tracking-[-0.05em] tabular-nums"
      />
      <AbsNum
        value={value}
        active={active}
        className="block mt-1.5 font-mono text-[13px] font-semibold tabular-nums"
      />
      <p
        className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.1em]"
        style={{ color: isStart ? 'rgba(255,255,255,0.5)' : 'var(--muted-foreground)' }}
      >
        {counterLabel}
      </p>

      <div className="mt-3.5 pt-3.5 border-t" style={{ borderColor: isStart ? 'rgba(255,255,255,0.18)' : 'var(--border)' }}>
        <h3 className="text-[19px] font-semibold tracking-[-0.025em] leading-snug">{title}</h3>
        <p
          className="mt-2 text-[12.5px] leading-snug"
          style={{ color: isStart ? 'rgba(255,255,255,0.7)' : 'var(--muted-foreground)' }}
        >
          {question}
        </p>
      </div>
    </div>
  );
}

function BranchCard({ branch, active }: { branch: Branch; active: boolean }) {
  const pct = (branch.value / META.totalPolled) * 100;
  const borderColor =
    branch.kind === 'resolve' && branch.resolveTone
      ? RESOLVE_BORDER[branch.resolveTone]
      : '#E00000';
  const kindText = branch.kind === 'resolve' ? 'Yes · resolves' : branch.kind === 'exit' ? 'No · exits' : 'No · held';

  return (
    <div
      className="rounded-xl bg-card px-4 py-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] grid gap-2.5"
      style={{ borderLeft: `4px solid ${borderColor}`, border: '1.2px solid var(--border)', borderLeftWidth: '4px', borderLeftColor: borderColor }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {kindText}
        </span>
        {branch.kind === 'resolve' && <MatchBadge />}
      </div>
      <PctNum
        pct={pct}
        active={active}
        className="text-[30px] md:text-[32px] font-medium tracking-[-0.035em] leading-none tabular-nums"
      />
      <AbsNum
        value={branch.value}
        active={active}
        className="mt-0.5 font-mono text-[12px] font-semibold text-muted-foreground tabular-nums"
      />
      <p className="text-[13px] font-semibold leading-snug text-muted-foreground">{branch.label}</p>
      <p className="text-[11.5px] leading-snug text-muted-foreground/80">{branch.narrative}</p>
    </div>
  );
}

function Narrative({ html }: { html: string }) {
  return (
    <p
      className="text-[13.5px] leading-[1.55] text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function FutureWorkInline({ title, note }: { title: string; note: string }) {
  return (
    <div
      className="rounded-xl px-3.5 py-3"
      style={{
        background: 'linear-gradient(135deg, rgba(17,15,255,0.05), rgba(155,106,246,0.05))',
        border: '1.2px solid rgba(17,15,255,0.18)',
      }}
    >
      <span className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.1em]" style={{ color: '#110FFF' }}>
        <span className="inline-block h-px w-[18px]" style={{ background: '#110FFF' }} />
        {title}
      </span>
      <p className="mt-1.5 text-[12.5px] leading-[1.5] text-muted-foreground">{note}</p>
    </div>
  );
}

function PhaseRow({ phase, index }: { phase: Phase; index: number }) {
  const { ref, seen } = useInView();
  const branchSide: 'left' | 'right' = index % 2 === 0 ? 'right' : 'left';

  const narrativeCol = <Narrative html={phase.narrative} />;
  const branchCol = (
    <div className="grid gap-3">
      {phase.branches.map((b, i) => (
        <BranchCard key={i} branch={b} active={seen} />
      ))}
      {phase.futureWorkInline && (
        <FutureWorkInline title={phase.futureWorkInline.title} note={phase.futureWorkInline.note} />
      )}
    </div>
  );

  const leftHtml = branchSide === 'left' ? branchCol : narrativeCol;
  const rightHtml = branchSide === 'right' ? branchCol : narrativeCol;

  return (
    <article
      ref={ref}
      className={`relative grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)] gap-6 items-center py-5 transition-all duration-500 ${
        seen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      <div className="md:order-1">{leftHtml}</div>
      <div className="md:order-2 relative">
        <SpineConnector />
        <Spine
          variant="phase"
          label={phase.label}
          title={phase.title}
          question={phase.question}
          value={phase.entering}
          counterLabel="Entering this phase"
          active={seen}
        />
      </div>
      <div className="md:order-3">{rightHtml}</div>
    </article>
  );
}

function Phase6Row() {
  const { ref, seen } = useInView();
  return (
    <article
      ref={ref}
      className={`relative grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)] gap-6 items-start pt-8 pb-5 transition-all duration-500 ${
        seen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      <div className="md:order-1">
        <div>
          <span className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2">
            <span className="inline-block h-px w-[18px] bg-muted-foreground/60" />
            Today
          </span>
          <Narrative html={PHASE6.narrativeCurrent} />
        </div>
      </div>

      <div className="md:order-2 relative">
        <SpineConnector />
        <Spine
          variant="residual"
          label={PHASE6.label}
          title={PHASE6.title}
          question={PHASE6.question}
          value={PHASE6.value}
          counterLabel="Held for human review"
          active={seen}
        />
        <ul className="mt-3 grid gap-1.5 list-none p-0">
          {PHASE6.breakdown.map((b) => (
            <li
              key={b.label}
              className="flex items-center justify-between gap-3.5 px-3 py-2 rounded-md text-[12.5px] text-muted-foreground border border-border bg-card"
            >
              <span>{b.label}</span>
              <b className="font-mono tabular-nums font-bold text-foreground">{b.value.toLocaleString()}</b>
            </li>
          ))}
        </ul>
      </div>

      <div className="md:order-3">
        <div
          className="rounded-xl bg-card px-4 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
          style={{ border: '1.2px solid var(--border)', borderLeft: '4px solid #110FFF' }}
        >
          <span className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: '#110FFF' }}>
            <span className="inline-block h-px w-[18px]" style={{ background: '#110FFF' }} />
            Where we go next
          </span>
          <h4 className="text-[18px] font-medium tracking-[-0.025em] mb-2">{PHASE6.futureWork.title}</h4>
          <p className="text-[13px] text-muted-foreground mb-3 leading-[1.5]">{PHASE6.futureWork.intro}</p>
          <ul className="grid gap-2.5 list-none p-0">
            {PHASE6.futureWork.items.map((it) => (
              <li
                key={it.label}
                className="grid gap-1 px-3 py-2.5 rounded-md border"
                style={{
                  background: 'linear-gradient(180deg, #fff, #F8F8F8)',
                  borderColor: 'var(--border)',
                }}
              >
                <b className="text-[12.5px] font-bold text-foreground">{it.label}</b>
                <span className="text-[12px] text-muted-foreground leading-snug">{it.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function SpineConnector() {
  // Vertical line above the spine card (drawn behind via a pseudo-positioned element)
  return (
    <span
      aria-hidden
      className="hidden md:block absolute left-1/2 -translate-x-1/2 -top-5 h-5 w-[2px]"
      style={{ background: 'rgba(56,56,56,0.32)' }}
    />
  );
}

export function UnderstandingFunnel() {
  return (
    <section id="understanding" className="scroll-mt-16 space-y-6">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          <span className="inline-block h-px w-[22px] bg-muted-foreground/60" />
          Benchmark window · {META.window}
        </span>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-[22ch]">
          Understanding the benchmark
        </h2>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          Polymarket today resolves prediction markets through three on-chain oracles: UMA, Chainlink, and Pyth. This benchmark walks every polled market through a five-step funnel to determine whether the Intelligent Oracle can independently resolve it from a source URL. On every market we can resolve, our outcome matches Polymarket&rsquo;s — 100% agreement on the resolvable set.
        </p>
      </header>

      <div className="relative">
        {PHASES.map((phase, i) => (
          <PhaseRow key={phase.id} phase={phase} index={i} />
        ))}
        <Phase6Row />
      </div>
    </section>
  );
}
