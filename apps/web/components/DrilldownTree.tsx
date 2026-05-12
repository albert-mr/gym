'use client';
import { useMemo, useRef, useState } from 'react';
import type { BenchmarkData, Template, MarketRow } from '@/lib/types';
import { SOLVED_BUCKETS } from '@/lib/types';
import { BucketBadge } from './BucketBadge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Props = { data: BenchmarkData };

export function DrilldownTree({ data }: Props) {
  const [date, setDate] = useState<string>('all');
  const [bucket, setBucket] = useState<string>('all');
  const [solvedOnly, setSolvedOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.templates.filter(t => {
      if (date !== 'all' && !t.dates.includes(date)) return false;
      if (bucket !== 'all' && t.dominantBucket !== bucket) return false;
      if (solvedOnly && !SOLVED_BUCKETS.has(t.dominantBucket)) return false;
      if (q) {
        const hay = `${t.template} ${t.example.question} ${t.example.eRSHost} ${t.example.rebindHost} ${t.L1} ${t.L2} ${t.L3}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data.templates, date, bucket, solvedOnly, search]);

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

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end mb-6 p-4 bg-muted/40 border border-border rounded-lg">
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
          <Select value={bucket} onValueChange={(v) => setBucket(v ?? 'all')}>
            <SelectTrigger className="w-56 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all categories</SelectItem>
              {Object.entries(data.bucketLabels).map(([b, l]) => <SelectItem key={b} value={b}>{l}</SelectItem>)}
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
        <Button variant="ghost" size="sm" onClick={() => { setDate('all'); setBucket('all'); setSolvedOnly(false); setSearch(''); }}>Reset</Button>
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
            <a className="underline underline-offset-2 text-foreground/80 hover:text-foreground" href={`https://polymarket.com/event/${ex.eventSlug}`} target="_blank" rel="noopener noreferrer">verify on Polymarket ↗</a>
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
                  <td className="py-1 pr-2">
                    {m.slug && <a className="text-xs underline underline-offset-2 hover:text-foreground" href={`https://polymarket.com/event/${m.slug}`} target="_blank" rel="noopener noreferrer">verify ↗</a>}
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
