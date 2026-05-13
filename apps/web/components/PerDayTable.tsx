import Link from 'next/link';
import type { BenchmarkData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { num, pct } from '@/lib/format';

const DIRECT_PARAM = 'render,api';
const ALT_PARAM = 'alt,liquipedia_recover,bo3_recover,frmf_via_flashscore,eurovision_via_wiki';
const UNRES_PARAM = 'hard,yahoo,subjective,misc,no_source,studio_blocked,hltv_lost';

function H({ label, tip, sup }: { label: string; tip: string; sup?: React.ReactNode }) {
  return (
    <span title={tip} className="cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-4">
      {label}{sup}
    </span>
  );
}

function DeepCell({ date, bucketParam, children }: { date: string; bucketParam: string; children: React.ReactNode }) {
  return (
    <Link href={`/benchmarks/polymarket/drilldown?date=${date}&bucket=${bucketParam}`} className="hover:text-foreground underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function PerDayTable({ data }: { data: BenchmarkData }) {
  const dates = data.meta.dates;
  let tPass = 0, tDeep = 0, tShlw = 0, tAlt = 0, tUns = 0, tRes = 0;
  for (const d of dates) {
    const p = data.perDay[d];
    if (!p) continue;
    tPass += p.gate1Pass; tDeep += p.directDeep; tShlw += p.directShallow;
    tAlt += p.alt; tUns += p.unsolvable; tRes += p.resolved;
  }
  return (
    <div className="border border-border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs text-right">Addressable</TableHead>
            <TableHead className="text-xs text-right">
              <H label="Direct source" tip="The source the resolution criteria names is the source we use: either the exact URL, or a deeper page on the same host. Studio-verified per source family." />
            </TableHead>
            <TableHead className="text-xs text-right">
              <H
                label="Alternative source"
                tip="Named source isn't reachable (Cloudflare, JS-only, geo-block); we route to a verified alternate. The alternate is currently agent-chosen, not a hardened whitelist."
                sup={<sup><Link href="/benchmarks/polymarket/methodology#alt-source-disclaimer" className="underline underline-offset-2 hover:text-foreground">*</Link></sup>}
              />
            </TableHead>
            <TableHead className="text-xs text-right">
              <H label="Currently unresolvable" tip="Paywall, login, captcha, or pure-consensus subjective markets. Marked honestly; revisited as infrastructure improves." />
            </TableHead>
            <TableHead className="text-xs text-right">
              <H label="Resolved on Polymarket" tip="Polymarket flipped the market to closed=true with outcomePrices=[1,0] or [0,1]. Orthogonal to whether we'd resolve correctly." />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {dates.map(d => {
            const p = data.perDay[d];
            if (!p) return null;
            const direct = p.directDeep + p.directShallow;
            return (
              <TableRow key={d}>
                <TableCell className="font-medium">
                  <Link href={`/benchmarks/polymarket/drilldown?date=${d}`} className="hover:text-foreground underline-offset-4 hover:underline">{d}</Link>
                </TableCell>
                <TableCell className="text-right">{num(p.gate1Pass)}</TableCell>
                <TableCell className="text-right">
                  <DeepCell date={d} bucketParam={DIRECT_PARAM}>
                    <span className="font-medium">{num(direct)}</span>{' '}
                    <span className="text-muted-foreground text-xs">({pct(direct, p.gate1Pass)})</span>
                  </DeepCell>
                </TableCell>
                <TableCell className="text-right">
                  <DeepCell date={d} bucketParam={ALT_PARAM}>
                    {num(p.alt)} <span className="text-muted-foreground text-xs">({pct(p.alt, p.gate1Pass)})</span>
                  </DeepCell>
                </TableCell>
                <TableCell className="text-right">
                  <DeepCell date={d} bucketParam={UNRES_PARAM}>
                    {num(p.unsolvable)} <span className="text-muted-foreground text-xs">({pct(p.unsolvable, p.gate1Pass)})</span>
                  </DeepCell>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{num(p.resolved)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-muted/40 font-medium border-t-2 border-foreground/20">
            <TableCell>Total</TableCell>
            <TableCell className="text-right">{num(tPass)}</TableCell>
            <TableCell className="text-right">
              {num(tDeep + tShlw)} <span className="text-muted-foreground text-xs">({pct(tDeep+tShlw, tPass)})</span>
            </TableCell>
            <TableCell className="text-right">
              {num(tAlt)} <span className="text-muted-foreground text-xs">({pct(tAlt, tPass)})</span>
            </TableCell>
            <TableCell className="text-right">
              {num(tUns)} <span className="text-muted-foreground text-xs">({pct(tUns, tPass)})</span>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">{num(tRes)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
