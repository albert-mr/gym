import type { BenchmarkData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BucketBadge } from './BucketBadge';

export function DomainTable({ data }: { data: BenchmarkData }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source host</TableHead>
            <TableHead className="text-right">Markets</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Fetched from</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-sm">
          {data.domains.map(d => (
            <TableRow key={d.host}>
              <TableCell><code className="text-[12px]">{d.host}</code></TableCell>
              <TableCell className="text-right tabular-nums">{d.count.toLocaleString()}</TableCell>
              <TableCell>
                <BucketBadge bucket={d.dominantBucket} label={data.bucketLabels[d.dominantBucket] ?? d.dominantBucket} color={data.bucketColors[d.dominantBucket]} />
              </TableCell>
              <TableCell>
                <code className="text-[12px] text-muted-foreground">{d.rebind && d.rebind !== d.host ? d.rebind : '(same host)'}</code>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
