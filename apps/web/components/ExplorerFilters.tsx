'use client';
import { useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { BenchmarkData } from '@/lib/types';
import {
  type ExplorerFilterState,
  type StatusFilter,
  type FamilyFilter,
  defaultExplorerFilters,
  filtersToParams,
  paramsToFilters,
} from '@/lib/explorer-filters';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  data: BenchmarkData;
  value: ExplorerFilterState;
  onChange: (next: ExplorerFilterState) => void;
};

const ALL_BUCKET_TOKEN = 'all';

// Pure presentational filter bar driven by props. Parent owns state and the
// URL-sync side effect; this component only renders controls and emits diffs.
export function ExplorerFilters({ data, value, onChange }: Props) {
  const bucketSelectValue =
    value.buckets.length === 0 ? ALL_BUCKET_TOKEN : value.buckets.length === 1 ? value.buckets[0] : '__multi__';

  const hostOptions = [...data.domains]
    .filter(d => d.host && d.host !== '(none)')
    .sort((a, b) => b.count - a.count)
    .slice(0, 60)
    .map(d => d.host);

  const reset = () => onChange(defaultExplorerFilters);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/40 border border-border rounded-lg">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Date</label>
          <Select value={value.date} onValueChange={(v) => onChange({ ...value, date: v ?? 'all' })}>
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
              if (!v || v === ALL_BUCKET_TOKEN) onChange({ ...value, buckets: [] });
              else if (v !== '__multi__') onChange({ ...value, buckets: [v] });
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
          <Select value={value.status} onValueChange={(v) => onChange({ ...value, status: (v ?? 'all') as StatusFilter })}>
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
              >?</TooltipTrigger>
              <TooltipContent>
                Chainlink and Pyth markets are excluded from this view — they&apos;re already filtered out before classification.
              </TooltipContent>
            </Tooltip>
          </label>
          <Select value={value.family} onValueChange={(v) => onChange({ ...value, family: (v ?? 'all') as FamilyFilter })}>
            <SelectTrigger className="w-52 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="no-chainlink">Exclude Chainlink</SelectItem>
              <SelectItem value="no-pyth">Exclude Pyth</SelectItem>
              <SelectItem value="no-both">Exclude both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Source host</label>
          <Select value={value.host} onValueChange={(v) => onChange({ ...value, host: v ?? 'all' })}>
            <SelectTrigger className="w-52 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all hosts</SelectItem>
              {hostOptions.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 h-8 pb-1">
          <Checkbox id="solved-only" checked={value.solvedOnly} onCheckedChange={(c) => onChange({ ...value, solvedOnly: c === true })} />
          <label htmlFor="solved-only" className="text-sm text-muted-foreground cursor-pointer">Resolvable only</label>
        </div>

        <div className="space-y-1 flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground block">Search</label>
          <Input value={value.search} onChange={e => onChange({ ...value, search: e.target.value })} placeholder="question, template, host…" className="h-8 text-sm" />
        </div>

        <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
      </div>
    </TooltipProvider>
  );
}

// Hook: owns the filter state for the explorer page, hydrates from URL on
// mount, writes back on every change via router.replace.
export function useExplorerFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useRef(false);

  const [state, setState] = useStateOnce<ExplorerFilterState>(defaultExplorerFilters);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const next = paramsToFilters(searchParams as unknown as URLSearchParams);
    setState(next);
  }, [searchParams, setState]);

  const setFilters = useCallback((next: ExplorerFilterState) => {
    setState(next);
    const qs = filtersToParams(next).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, setState]);

  return { filters: state, setFilters };
}

// useState wrapper that React expects (kept separate so the hook ordering is
// stable across calls).
import { useState } from 'react';
function useStateOnce<T>(initial: T) {
  return useState<T>(initial);
}
