import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBenchmark } from '@/lib/queries/benchmark';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CopyForAgentsButton } from '@/components/CopyForAgentsButton';
import { DownloadJsonButton } from '@/components/DownloadJsonButton';
import {
  buildSourcesTable,
  buildAgentPromptMarkdown,
  buildJsonExport,
} from '@/lib/sources-bench';

export default async function SourcesBenchPage() {
  const pm = await getBenchmark('pm-bench');
  if (!pm) notFound();
  const table = buildSourcesTable(pm.domains, pm.meta.generatedAt);
  const markdown = buildAgentPromptMarkdown(table);
  const json = buildJsonExport(table);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 space-y-10">

      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Sources benchmark</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Source accessibility</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyForAgentsButton markdown={markdown} />
            <DownloadJsonButton json={json} />
          </div>
        </div>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          Every web source GenLayer has classified, with reachability status against validator-equivalent infrastructure and known alternatives. Use this as a reference when designing intelligent contracts that fetch web data via <code className="text-[12.5px] text-foreground/80">web.render</code>.
        </p>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="secondary" className="font-mono">{table.accessibleCount} accessible</Badge>
          <Badge variant="outline" className="font-mono">{table.inaccessibleCount} not accessible</Badge>
          <span className="text-muted-foreground">· {table.total} total</span>
        </div>
      </header>

      <section className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Accessible</TableHead>
              <TableHead>Alternative</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.map((r) => (
              <TableRow key={r.source}>
                <TableCell>
                  <code className="text-foreground/90 text-[12.5px]">{r.source}</code>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {r.accessible ? (
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px] uppercase tracking-widest"
                      style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                    >
                      Yes
                    </Badge>
                  ) : (
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] uppercase tracking-widest"
                        style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2', color: '#991b1b' }}
                      >
                        No
                      </Badge>
                      {r.reason && (
                        <span className="text-xs text-muted-foreground">{r.reason}</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {r.alternative ? (
                    <code className="text-foreground/80 text-[12.5px]">{r.alternative}</code>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="border-t border-border pt-6">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
          Accessibility is binary by design. A source is marked <strong className="text-foreground/80">Yes</strong> when it is on GenLayer&rsquo;s curated render or API list (the cumulative output of every Studio run, audit, and probe we&rsquo;ve done), <strong className="text-foreground/80">No</strong> when validators cannot reach it. Where we have found a working alternative, it is listed in the third column. The contract for adding a source is documented in <Link href="/about" className="underline underline-offset-2 hover:text-foreground">About</Link>.
        </p>
      </section>

    </div>
  );
}
