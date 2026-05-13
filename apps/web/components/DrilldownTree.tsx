'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { BenchmarkData, Template, MarketRow } from '@/lib/types';
import { SOLVED_BUCKETS, UNSOLVABLE_BUCKETS } from '@/lib/types';
import { BucketBadge } from './BucketBadge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = { data: BenchmarkData };

type FamilyFilter = 'all' | 'no-chainlink' | 'no-pyth' | 'no-both';
type StatusFilter = 'all' | 'solved' | 'disagrees' | 'unresolvable';

const ALL_BUCKET_TOKEN = 'all';

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

export function DrilldownTree({ data }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [date, setDate] = useState<string>('all');
  const [buckets, setBuckets] = useState<string[]>([]);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [family, setFamily] = useState<FamilyFilter>('all');
  const [solvedOnly, setSolvedOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const hydratedFromUrl = useRef(false);

  // Hydrate state from URL on first mount only — subsequent URL writes are
  // driven by the state→URL effect below and should not loop back.
  useEffect(() => {
    if (hydratedFromUrl.current) return;
    hydratedFromUrl.current = true;
    const d = searchParams.get('date');
    if (d) setDate(d);
    const b = parseList(searchParams.get('bucket'));
    if (b.length) setBuckets(b);
    const s = searchParams.get('status');
    if (s === 'solved' || s === 'disagrees' || s === 'unresolvable') setStatus(s);
    const f = searchParams.get('family');
    if (f === 'no-chainlink' || f === 'no-pyth' || f === 'no-both') setFamily(f);
    if (searchParams.get('solved') === '1') setSolvedOnly(true);
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, [searchParams]);

  // Push the current filter set into the URL so the page is deep-linkable.
  // router.replace avoids polluting history while typing into the search box.
  useEffect(() => {
    if (!hydratedFromUrl.current) return;
    const params = new URLSearchParams();
    if (date !== 'all') params.set('date', date);
    if (buckets.length) params.set('bucket', buckets.join(','));
    if (status !== 'all') params.set('status', status);
    if (family !== 'all') params.set('family', family);
    if (solvedOnly) params.set('solved', '1');
    if (search.trim()) params.set('q', search.trim());
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [date, buckets, status, family, solvedOnly, search, router, pathname]);

  const disagreesCount = 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const bucketSet = buckets.length ? new Set(buckets) : null;
    return data.templates.filter(t => {
      if (date !== 'all' && !t.dates.includes(date)) return false;
      if (bucketSet && !bucketSet.has(t.dominantBucket)) return false;
      if (solvedOnly && !SOLVED_BUCKETS.has(t.dominantBucket)) return false;
      if (status === 'solved' && !SOLVED_BUCKETS.has(t.dominantBucket)) return false;
      if (status === 'unresolvable' && !UNSOLVABLE_BUCKETS.has(t.dominantBucket)) return false;
      if (status === 'disagrees') return false;
      // Chainlink/Pyth markets are dropped at gate 1, so they never appear in
      // data.templates — these family filters are surfaced to make the concept
      // visible to users, but they don't change row counts today.
      if (q) {
        const hay = `${t.template} ${t.example.question} ${t.example.eRSHost} ${t.example.rebindHost} ${t.L1} ${t.L2} ${t.L3}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data.templates, date, buckets, status, family, solvedOnly, search]);

  const nested = useMemo(() => nest(filtered), [filtered]);
  const allL1s = useMemo(() => [...nested.keys()], [nested]);
  const l1Signature = allL1s.join('|');
  const [openL1, setOpenL1] = useState<string[]>(allL1s);
  const prevSignature = useRef(l1Signature);
  if (prevSignature.current !== l1Signature) {
    prevSignature.current = l1Signature;
    setOpenL1(allL1s);
  }

  const toggleExpanded = (tplId: string) => {
    const next = new Set(expanded);
    if (next.has(tplId)) next.delete(tplId); else next.add(tplId);
    setExpanded(next);
  };

  const reset = useCallback(() => {
    setDate('all');
    setBuckets([]);
    setStatus('all');
    setFamily('all');
    setSolvedOnly(false);
    setSearch('');
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const bucketSelectValue = buckets.length === 0 ? ALL_BUCKET_TOKEN : buckets.length === 1 ? buckets[0] : '__multi__';

  return (
    <TooltipProvider>
      <div>
        <div className="flex flex-wrap gap-3 items-end mb-3 p-4 bg-muted/40 border border-border rounded-lg">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block">Date</label>
            <Select value={date} onValueChange={(v) => setDate(v ?? 'all')}>
              <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all dates</SelectItem>
                {data.meta.dates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block">Source category</label>
            <Select
              value={bucketSelectValue}
              onValueChange={(v) => {
                if (!v || v === ALL_BUCKET_TOKEN) setBuckets([]);
                else if (v !== '__multi__') setBuckets([v]);
              }}
            >
              <SelectTrigger className="w-56 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_BUCKET_TOKEN}>all categories</SelectItem>
                {Object.entries(data.bucketLabels).map(([b, l]) => <SelectItem key={b} value={b}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus((v ?? 'all') as StatusFilter)}>
              <SelectTrigger className="w-56 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="solved">Resolved correctly</SelectItem>
                <SelectItem value="disagrees">Disagrees with Polymarket</SelectItem>
                <SelectItem value="unresolvable">Currently unresolvable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block flex items-center gap-1">
              On-chain feed family
              <Tooltip>
                <TooltipTrigger
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-muted-foreground/40 text-[9px] text-muted-foreground cursor-help"
                  aria-label="About on-chain feed filter"
                >
                  ?
                </TooltipTrigger>
                <TooltipContent>
                  Chainlink and Pyth markets are excluded from this view — they&apos;re already filtered out before classification.
                </TooltipContent>
              </Tooltip>
            </label>
            <Select value={family} onValueChange={(v) => setFamily((v ?? 'all') as FamilyFilter)}>
              <SelectTrigger className="w-52 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="no-chainlink">Exclude Chainlink</SelectItem>
                <SelectItem value="no-pyth">Exclude Pyth</SelectItem>
                <SelectItem value="no-both">Exclude both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 h-8 pb-1">
            <Checkbox id="solved-only" checked={solvedOnly} onCheckedChange={(c) => setSolvedOnly(c === true)} />
            <label htmlFor="solved-only" className="text-sm text-muted-foreground cursor-pointer">Resolvable only</label>
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground block">Search</label>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="question, template, host…" className="h-8 text-sm" />
          </div>
          <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground">
            <span>Disagrees with Polymarket:</span>
            <span className="font-medium text-foreground/80 tabular-nums">{disagreesCount} today</span>
          </span>
        </div>

        {filtered.length === 0 && (
          <div className="text-muted-foreground italic py-12 text-center text-sm">No templates match these filters.</div>
        )}

        <div className="text-xs text-muted-foreground mb-4 tabular-nums">
          {filtered.length.toLocaleString()} templates · {filtered.reduce((s, t) => s + t.count, 0).toLocaleString()} markets
        </div>

        <Accordion multiple value={openL1} onValueChange={(v) => setOpenL1(v as string[])} className="w-full">
          {[...nested.entries()].sort((a, b) => sumMap(b[1]) - sumMap(a[1])).map(([L1, m1]) => (
            <AccordionItem key={L1} value={L1}>
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <span className="flex items-baseline gap-3">
                  {L1}
                  <span className="text-xs text-muted-foreground font-normal tabular-nums">{sumMap(m1).toLocaleString()} markets</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-2">
                  {[...m1.entries()].sort((a, b) => sumMap(b[1]) - sumMap(a[1])).map(([L2, m2]) => (
                    <details key={L2} className="group" open={m1.size <= 3}>
                      <summary className="cursor-pointer py-1.5 text-sm font-medium text-foreground/90 hover:text-foreground select-none flex items-baseline gap-2">
                        <span className="text-muted-foreground group-open:rotate-90 transition-transform inline-block">›</span>
                        {L2}
                        <span className="text-xs text-muted-foreground font-normal tabular-nums">{sumMap(m2).toLocaleString()}</span>
                      </summary>
                      <div className="ml-5 space-y-1.5">
                        {[...m2.entries()].sort((a, b) => sumArr(b[1]) - sumArr(a[1])).map(([L3, tpls]) => (
                          <details key={L3}>
                            <summary className="cursor-pointer py-1 text-sm text-muted-foreground hover:text-foreground select-none flex items-baseline gap-2">
                              <span className="text-muted-foreground">›</span>
                              {L3}
                              <span className="text-xs tabular-nums">{sumArr(tpls).toLocaleString()} · {tpls.length} templates</span>
                            </summary>
                            <div className="ml-5 space-y-2 mt-2 mb-3">
                              {tpls.map(t => (
                                <TemplateCard key={t.id} t={t} data={data} expanded={expanded.has(t.id)} onToggle={() => toggleExpanded(t.id)} />
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </TooltipProvider>
  );
}

function TemplateCard({ t, data, expanded, onToggle }: { t: Template; data: BenchmarkData; expanded: boolean; onToggle: () => void }) {
  const ex = t.example;
  const markets = data.marketsByTemplate[t.id] ?? [];
  return (
    <div className="border border-border rounded-lg p-3 bg-card">
      <div className="flex flex-wrap gap-2 items-center mb-2">
        <code className="font-mono text-[12.5px] flex-1 min-w-[280px] text-foreground/90">{t.template}</code>
        <BucketBadge bucket={t.dominantBucket} label={data.bucketLabels[t.dominantBucket] ?? t.dominantBucket} color={data.bucketColors[t.dominantBucket]} />
      </div>
      <div className="text-xs text-muted-foreground tabular-nums mb-2">
        {t.count.toLocaleString()} market{t.count===1?'':'s'} · {t.dates.length} day{t.dates.length===1?'':'s'} · hosts: <code className="text-foreground/70">{t.eRSHosts.slice(0,2).join(', ')}</code>{t.eRSHosts.length>2 ? ` +${t.eRSHosts.length-2}` : ''}
      </div>
      <div className="border-l-2 border-border pl-3 text-[13px] text-muted-foreground leading-relaxed">
        <div className="text-foreground/90">{ex.question}</div>
        <div className="mt-1 space-x-3 text-xs">
          <span><span className="text-muted-foreground">source:</span> <code className="text-foreground/80">{ex.eRSHost || '—'}</code></span>
          {ex.rebindHost && ex.rebindHost !== ex.eRSHost && (
            <span><span className="text-muted-foreground">→ fetched:</span> <code className="text-foreground/80">{ex.rebindHost}</code></span>
          )}
          <span><span className="text-muted-foreground">winner:</span> <Winner w={ex.winner} /></span>
          {ex.eventSlug && (
            <>
              <Link className="underline underline-offset-2 text-foreground/80 hover:text-foreground" href={`/benchmarks/polymarket/markets/${ex.eventSlug}`}>view details</Link>
              <a className="underline underline-offset-2 text-foreground/80 hover:text-foreground" href={`https://polymarket.com/event/${ex.eventSlug}`} target="_blank" rel="noopener noreferrer">verify on Polymarket ↗</a>
            </>
          )}
        </div>
      </div>
      <button className="mt-2 text-[11px] text-foreground/70 hover:text-foreground underline underline-offset-2" onClick={onToggle}>
        {expanded ? 'hide all' : `show all ${t.count} markets`}
      </button>
      {expanded && (
        <div className="mt-3 border-t border-border pt-2 max-h-72 overflow-y-auto">
          <table className="w-full text-[12px] tabular-nums">
            <tbody>
              {markets.map((m: MarketRow) => (
                <tr key={m.id} className="hover:bg-muted/40">
                  <td className="py-1 pr-2 text-muted-foreground text-xs">{m.date}</td>
                  <td className="py-1 pr-2 text-foreground/90">{m.question}</td>
                  <td className="py-1 pr-2"><code className="text-[11px] text-muted-foreground">{m.eRSHost}</code></td>
                  <td className="py-1 pr-2"><Winner w={m.winner} /></td>
                  <td className="py-1 pr-2 whitespace-nowrap">
                    {m.slug && (
                      <span className="inline-flex gap-2">
                        <Link className="text-xs underline underline-offset-2 hover:text-foreground" href={`/benchmarks/polymarket/markets/${m.slug}`}>details</Link>
                        <a className="text-xs underline underline-offset-2 hover:text-foreground" href={`https://polymarket.com/event/${m.slug}`} target="_blank" rel="noopener noreferrer">verify ↗</a>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Winner({ w }: { w: string }) {
  if (w === 'pending') return <span className="text-muted-foreground italic" title="Polymarket has not yet flipped this market to closed=true. Likely still in the UMA proposal/challenge window, or the underlying event hasn't happened yet.">pending</span>;
  if (w === 'no action') return <span className="text-muted-foreground italic" title="Polymarket settled this market to 50/50. The underlying event did not occur as the market assumed (cancelled match, BO series ended early, postponed game, etc.). Traders were refunded; no winner.">no action</span>;
  return <span className="text-foreground font-medium">{w}</span>;
}

function nest(templates: Template[]): Map<string, Map<string, Map<string, Template[]>>> {
  const root = new Map<string, Map<string, Map<string, Template[]>>>();
  for (const t of templates) {
    if (!root.has(t.L1)) root.set(t.L1, new Map());
    const m1 = root.get(t.L1)!;
    if (!m1.has(t.L2)) m1.set(t.L2, new Map());
    const m2 = m1.get(t.L2)!;
    if (!m2.has(t.L3)) m2.set(t.L3, []);
    m2.get(t.L3)!.push(t);
  }
  return root;
}

function sumMap(m: Map<string, unknown>): number {
  let n = 0;
  for (const v of m.values()) {
    if (v instanceof Map) n += sumMap(v as Map<string, unknown>);
    else if (Array.isArray(v)) n += sumArr(v as Template[]);
  }
  return n;
}
function sumArr(arr: Template[]): number { return arr.reduce((s, t) => s + t.count, 0); }
