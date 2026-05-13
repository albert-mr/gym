'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { BenchmarkData, ExplorerMarketRow } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { buildTemplateGroups, bucketColor, bucketLabel, rowCount, type TemplateGroup } from '@/lib/explorer-data';
import { BucketBadge } from './BucketBadge';
import { ExplorerRowsTable } from './ExplorerRowsTable';

type Props = { data: BenchmarkData; rows: ExplorerMarketRow[] };

export function DrilldownTree({ data, rows }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const groups = useMemo(() => buildTemplateGroups(rows), [rows]);
  const nested = useMemo(() => nest(groups), [groups]);
  const allL1s = useMemo(() => [...nested.keys()], [nested]);
  const l1Signature = allL1s.join('|');
  const [openL1, setOpenL1] = useState<string[]>([]);
  const prevSignature = useRef(l1Signature);

  useEffect(() => {
    if (prevSignature.current === l1Signature) return;
    prevSignature.current = l1Signature;
    setOpenL1(current => current.filter(id => allL1s.includes(id)));
  }, [allL1s, l1Signature]);

  useEffect(() => {
    const visibleIds = new Set(groups.map(group => group.id));
    setExpanded(current => {
      let changed = false;
      const next = new Set<string>();
      for (const id of current) {
        if (visibleIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : current;
    });
  }, [groups]);

  const toggleExpanded = (groupId: string) => {
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <div>
      {groups.length === 0 && (
        <div className="text-muted-foreground italic py-12 text-center text-sm">No templates match these filters.</div>
      )}

      <div className="text-xs text-muted-foreground mb-4 tabular-nums">
        {groups.length.toLocaleString()} templates · {rowCount(rows).toLocaleString()} markets
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
                  <ControlledDetails key={L2} className="group">
                    <summary className="cursor-pointer py-1.5 text-sm font-medium text-foreground/90 hover:text-foreground select-none flex items-baseline gap-2">
                      <span className="text-muted-foreground group-open:rotate-90 transition-transform inline-block">›</span>
                      {L2}
                      <span className="text-xs text-muted-foreground font-normal tabular-nums">{sumMap(m2).toLocaleString()}</span>
                    </summary>
                    <div className="ml-5 space-y-1.5">
                      {[...m2.entries()].sort((a, b) => sumArr(b[1]) - sumArr(a[1])).map(([L3, templateGroups]) => (
                        <ControlledDetails key={L3}>
                          <summary className="cursor-pointer py-1 text-sm text-muted-foreground hover:text-foreground select-none flex items-baseline gap-2">
                            <span className="text-muted-foreground">›</span>
                            {L3}
                            <span className="text-xs tabular-nums">{sumArr(templateGroups).toLocaleString()} · {templateGroups.length} templates</span>
                          </summary>
                          <div className="ml-5 space-y-2 mt-2 mb-3">
                            {templateGroups.map(group => (
                              <TemplateCard
                                key={group.id}
                                group={group}
                                data={data}
                                expanded={expanded.has(group.id)}
                                onToggle={() => toggleExpanded(group.id)}
                              />
                            ))}
                          </div>
                        </ControlledDetails>
                      ))}
                    </div>
                  </ControlledDetails>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function TemplateCard({ group, data, expanded, onToggle }: { group: TemplateGroup; data: BenchmarkData; expanded: boolean; onToggle: () => void }) {
  const ex = group.example;
  return (
    <div className="border border-border rounded-lg p-3 bg-card">
      <div className="flex flex-wrap gap-2 items-center mb-2">
        <code className="font-mono text-[12.5px] flex-1 min-w-[280px] text-foreground/90">{group.template}</code>
        <BucketBadge bucket={group.dominantBucket} label={bucketLabel(data, group.dominantBucket)} color={bucketColor(data, group.dominantBucket)} />
      </div>
      <div className="text-xs text-muted-foreground tabular-nums mb-2">
        {group.count.toLocaleString()} market{group.count === 1 ? '' : 's'} · {group.dates.length || 'all'} day{group.dates.length === 1 ? '' : 's'} · named hosts:{' '}
        <code className="text-foreground/70">{group.namedHosts.slice(0, 2).join(', ') || '—'}</code>{group.namedHosts.length > 2 ? ` +${group.namedHosts.length - 2}` : ''}
      </div>
      <div className="border-l-2 border-border pl-3 text-[13px] text-muted-foreground leading-relaxed">
        <div className="text-foreground/90">{ex.question}</div>
        <div className="mt-1 space-x-3 text-xs">
          <span><span className="text-muted-foreground">source:</span> <code className="text-foreground/80">{ex.namedHost || '—'}</code></span>
          {ex.verifiedHost && ex.verifiedHost !== ex.namedHost && (
            <span><span className="text-muted-foreground">→ fetched:</span> <code className="text-foreground/80">{ex.verifiedHost}</code></span>
          )}
          <span><span className="text-muted-foreground">outcome:</span> <Winner w={ex.winner} /></span>
        </div>
      </div>
      <button type="button" className="mt-2 text-[11px] text-foreground/70 hover:text-foreground underline underline-offset-2" aria-expanded={expanded} onClick={onToggle}>
        {expanded ? 'Hide' : `Expand ${group.count.toLocaleString()} markets`}
      </button>
      {expanded && (
        <div className="mt-3 border-t border-border pt-2">
          <ExplorerRowsTable rows={group.rows} data={data} />
        </div>
      )}
    </div>
  );
}

function Winner({ w }: { w: string }) {
  if (w === 'pending') return <span className="text-muted-foreground italic">pending</span>;
  if (w === 'no action') return <span className="text-muted-foreground italic">no action</span>;
  return <span className="text-foreground font-medium">{w}</span>;
}

function ControlledDetails({ className, defaultOpen = false, children }: { className?: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details className={className} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      {children}
    </details>
  );
}

function nest(groups: TemplateGroup[]): Map<string, Map<string, Map<string, TemplateGroup[]>>> {
  const root = new Map<string, Map<string, Map<string, TemplateGroup[]>>>();
  for (const group of groups) {
    if (!root.has(group.L1)) root.set(group.L1, new Map());
    const m1 = root.get(group.L1)!;
    if (!m1.has(group.L2)) m1.set(group.L2, new Map());
    const m2 = m1.get(group.L2)!;
    if (!m2.has(group.L3)) m2.set(group.L3, []);
    m2.get(group.L3)!.push(group);
  }
  return root;
}

function sumMap(m: Map<string, unknown>): number {
  let n = 0;
  for (const v of m.values()) {
    if (v instanceof Map) n += sumMap(v as Map<string, unknown>);
    else if (Array.isArray(v)) n += sumArr(v as TemplateGroup[]);
  }
  return n;
}

function sumArr(arr: TemplateGroup[]): number {
  return arr.reduce((sum, group) => sum + group.count, 0);
}
