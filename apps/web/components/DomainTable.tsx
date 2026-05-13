'use client';
import { Fragment, useEffect, useMemo, useState } from 'react';
import type { BenchmarkData, ExplorerMarketRow } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buildSourceHostGroups, bucketColor, bucketLabel, CIRCLE_META } from '@/lib/explorer-data';
import { BucketBadge } from './BucketBadge';
import { Button } from './ui/button';
import { ExplorerRowsTable } from './ExplorerRowsTable';

export function DomainTable({ data, rows }: { data: BenchmarkData; rows: ExplorerMarketRow[] }) {
  const [openHost, setOpenHost] = useState<string | null>(null);
  const groups = useMemo(() => buildSourceHostGroups(rows), [rows]);

  useEffect(() => {
    if (openHost === null) return;
    if (!groups.some(group => group.host === openHost)) setOpenHost(null);
  }, [groups, openHost]);

  if (groups.length === 0) {
    return <div className="text-muted-foreground italic py-12 text-center text-sm">No source hosts match these filters.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground tabular-nums">
        {groups.length.toLocaleString()} named source hosts · {groups.reduce((sum, group) => sum + group.count, 0).toLocaleString()} markets
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source host</TableHead>
            <TableHead className="text-right">Markets</TableHead>
            <TableHead className="text-right">Direct</TableHead>
            <TableHead className="text-right">Alt</TableHead>
            <TableHead className="text-right">Held</TableHead>
            <TableHead className="text-right">On-chain</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Verified / fetched</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-sm">
          {groups.map(group => {
            const onchain = group.circles.chainlink + group.circles.pyth;
            const open = openHost === group.host;
            return (
              <Fragment key={group.host}>
                <TableRow>
                  <TableCell><code className="text-[12px]">{group.host}</code></TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{group.count.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums" style={{ color: CIRCLE_META.direct.color }}>{group.circles.direct.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums" style={{ color: CIRCLE_META.alternative.color }}>{group.circles.alternative.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums" style={{ color: CIRCLE_META.held.color }}>{group.circles.held.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums" style={{ color: CIRCLE_META.chainlink.color }}>{onchain.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{group.category}</TableCell>
                  <TableCell className="max-w-[260px]">
                    <div className="flex flex-col gap-1">
                      <BucketBadge bucket={group.dominantBucket} label={bucketLabel(data, group.dominantBucket)} color={bucketColor(data, group.dominantBucket)} />
                      <code className="text-[11px] text-muted-foreground truncate" title={group.verifiedHosts.join(', ')}>
                        {group.verifiedHosts.length ? group.verifiedHosts.join(', ') : '—'}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpenHost(open ? null : group.host)}>
                      {open ? 'Hide' : 'Expand'}
                    </Button>
                  </TableCell>
                </TableRow>
                {open && (
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={9} className="p-3">
                      <ExplorerRowsTable rows={group.rows} data={data} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
