import type { BenchmarkData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Used in /methodology only — not on the headline pages. The "how we verify" detail
// for readers who want to interrogate the claim.

export function VerificationLevelsTable({ data }: { data: BenchmarkData }) {
  const rows = [
    {
      level: 'Studio-verified end-to-end',
      coverage: `~${data.verificationLevels.directVerified} markets`,
      def: 'IntelligentOracle contract deployed to GenLayer Studio, resolve() called, contract output compared against known ground truth. 100/108 matched on the May 7–10 dev sessions.',
    },
    {
      level: 'Per-source-family inferred',
      coverage: `~${data.verificationLevels.inferred.toLocaleString()} markets`,
      def: 'For each source family (wunderground, NHL gamecenter, ESPN scoreboard, Liquipedia, Binance API, etc.) we Studio-deployed 1–10 representatives and inferred all markets on that family behave the same way. The bulk of the headline is this kind.',
    },
    {
      level: 'Classifier heuristic only',
      coverage: `${data.verificationLevels.heuristic.toLocaleString()} markets`,
      def: 'Subjective / consensus markets and unclassified residual. Categorized by a description-text classifier. Never deployed to Studio.',
    },
  ];
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Verification level</TableHead>
            <TableHead className="w-44">Coverage</TableHead>
            <TableHead>What &quot;verified&quot; means</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.level}>
              <TableCell className="font-medium align-top">{r.level}</TableCell>
              <TableCell className="text-muted-foreground align-top tabular-nums text-sm">{r.coverage}</TableCell>
              <TableCell className="text-sm text-muted-foreground align-top leading-relaxed">{r.def}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DefensiblePhrasing({ data }: { data: BenchmarkData }) {
  return (
    <div className="border-l-2 border-foreground/30 pl-4 py-2 italic text-base text-muted-foreground leading-relaxed">
      &quot;Across {data.meta.totalPass.toLocaleString()} Polymarket markets resolving between {data.meta.dates[0]} and {data.meta.dates[data.meta.dates.length-1]}, GenLayer&apos;s classifier routes {data.meta.headlinePct.toFixed(1)}% to a source family that was Studio-verified end-to-end on at least one representative market. Per-market end-to-end verification was performed on {data.verificationLevels.directVerified} markets. Real-network credibility verification is pending real-testnet availability.&quot;
    </div>
  );
}
