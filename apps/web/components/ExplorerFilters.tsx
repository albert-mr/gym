'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { BenchmarkData } from '@/lib/types';
import {
  type ExplorerFilterState,
  type StatusFilter,
  defaultExplorerFilters,
  filtersToParams,
  paramsToFilters,
  BUCKET_GROUPS,
  CIRCLE_GROUPS,
  bucketsToUmbrellaId,
  circlesToGroupId,
} from '@/lib/explorer-filters';
import type { ExplorerMarketRow } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

type Props = {
  data: BenchmarkData;
  rows: ExplorerMarketRow[];
  value: ExplorerFilterState;
  onChange: (next: ExplorerFilterState) => void;
};

const ALL_BUCKET_TOKEN = 'all';

// Pure presentational filter bar driven by props. Parent owns state and the
// URL-sync side effect; this component only renders controls and emits diffs.
export function ExplorerFilters({ data, rows, value, onChange }: Props) {
  const bucketSelectValue = value.buckets.length === 0
    ? ALL_BUCKET_TOKEN
    : (bucketsToUmbrellaId(value.buckets) ?? '__multi__');

  const circleSelectValue = value.circles.length === 0
    ? ALL_BUCKET_TOKEN
    : (circlesToGroupId(value.circles) ?? '__multi__');

  const hostCounts = new Map<string, number>();
  const verifiedCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.namedHost && row.namedHost !== '(none)') hostCounts.set(row.namedHost, (hostCounts.get(row.namedHost) ?? 0) + row.count);
    if (row.verifiedHost && row.verifiedHost !== '(none)') verifiedCounts.set(row.verifiedHost, (verifiedCounts.get(row.verifiedHost) ?? 0) + row.count);
  }

  const hostOptions = [...hostCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60)
    .map(([host]) => host);

  const verifiedHostOptions = [...verifiedCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60)
    .map(([host]) => host);

  const reset = () => onChange(defaultExplorerFilters);

  return (
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
          <label className="text-xs text-muted-foreground block">Resolution path</label>
          <Select
            value={circleSelectValue}
            onValueChange={(v) => {
              if (!v || v === ALL_BUCKET_TOKEN) { onChange({ ...value, circles: [] }); return; }
              if (v === '__multi__') return;
              const group = CIRCLE_GROUPS.find(g => g.id === v);
              if (group) onChange({ ...value, circles: [...group.circles] });
            }}
          >
            <SelectTrigger className="w-52 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BUCKET_TOKEN}>All paths</SelectItem>
              {CIRCLE_GROUPS.map(g => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Source category</label>
          <Select
            value={bucketSelectValue}
            onValueChange={(v) => {
              if (!v || v === ALL_BUCKET_TOKEN) { onChange({ ...value, buckets: [] }); return; }
              if (v === '__multi__') return;
              const group = BUCKET_GROUPS.find(g => g.id === v);
              if (group) onChange({ ...value, buckets: [...group.buckets] });
            }}
          >
            <SelectTrigger className="w-56 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BUCKET_TOKEN}>All Categories</SelectItem>
              {BUCKET_GROUPS.map(g => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Named source host</label>
          <Select value={value.host} onValueChange={(v) => onChange({ ...value, host: v ?? 'all' })}>
            <SelectTrigger className="w-52 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all hosts</SelectItem>
              {hostOptions.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Verified / fetched host</label>
          <Select value={value.verifiedHost} onValueChange={(v) => onChange({ ...value, verifiedHost: v ?? 'all' })}>
            <SelectTrigger className="w-52 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all hosts</SelectItem>
              {verifiedHostOptions.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
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
  );
}

// Hook: owns the filter state for the explorer page, hydrates from URL on
// mount, writes back on every change via router.replace.
export function useExplorerFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const lastWritten = useRef<string | null>(null);

  const [state, setState] = useState<ExplorerFilterState>(() => paramsToFilters(new URLSearchParams(searchParams.toString())));

  useEffect(() => {
    const raw = searchParams.toString();
    if (raw === lastWritten.current) return;
    setState(paramsToFilters(new URLSearchParams(raw)));
  }, [searchParams]);

  const setFilters = useCallback((next: ExplorerFilterState) => {
    setState(next);
    const qs = filtersToParams(next).toString();
    lastWritten.current = qs;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, setState]);

  return { filters: state, setFilters };
}
