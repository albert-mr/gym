import type { BenchmarkData } from '../lib/types';

export function VerificationCallout({ data }: { data: BenchmarkData }) {
  return (
    <div className="rounded border-l-4 border-orange-500 bg-orange-50 p-4 my-4 text-sm leading-relaxed">
      <strong className="text-ink-900">Read this number carefully.</strong> &quot;Routable&quot; means our classifier maps the market to a source family that was Studio-verified end-to-end on at least 1 representative market.
      {' '}<strong>~{data.verificationLevels.directVerified} markets total ({((100 * data.verificationLevels.directVerified) / data.meta.totalPass).toFixed(2)}%) were directly Studio-deployed and outcome-matched</strong>;
      the remaining ~99% are inferred from per-source-family probes (same host, same fetch pattern, same prompt shape). See the verification levels table below.
    </div>
  );
}

export function VerificationLevelsTable({ data }: { data: BenchmarkData }) {
  const rows = [
    {
      level: 'End-to-end Studio-verified, outcome-matched',
      coverage: `~${data.verificationLevels.directVerified} markets`,
      def: 'Deployed IntelligentOracle contract to GenLayer Studio (chainId 61999), called resolve(), compared output against known ground truth. 100/108 matched.',
    },
    {
      level: 'Per-source-family inferred',
      coverage: `~${data.verificationLevels.inferred.toLocaleString()} markets`,
      def: 'For each unique source family (wunderground, NHL, ESPN scoreboard, Liquipedia, Binance API, etc.) we Studio-deployed 1–10 representatives and inferred all markets on that family behave the same way.',
    },
    {
      level: 'Heuristic-only (no Studio probe)',
      coverage: `${data.verificationLevels.heuristic.toLocaleString()} markets`,
      def: 'Subjective + misc residual. Classified by description regex (consensus phrasing, asset-URL detection). Never deployed to Studio.',
    },
  ];
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-ink-100">
          <th className="text-left p-2 border-b border-ink-200 font-semibold">Level</th>
          <th className="text-left p-2 border-b border-ink-200 font-semibold w-44">Coverage</th>
          <th className="text-left p-2 border-b border-ink-200 font-semibold">What &quot;verified&quot; means</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.level}>
            <td className="p-2 border-b border-ink-200 align-top font-medium">{r.level}</td>
            <td className="p-2 border-b border-ink-200 align-top text-ink-500">{r.coverage}</td>
            <td className="p-2 border-b border-ink-200 align-top">{r.def}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DefensiblePhrasing({ data }: { data: BenchmarkData }) {
  return (
    <div className="rounded border-l-4 border-green-600 bg-green-50 p-4 my-4 text-sm leading-relaxed">
      <strong className="text-ink-900">Defensible phrasing.</strong>{' '}
      &quot;Across {data.meta.totalPass.toLocaleString()} Polymarket UMA-resolved 24h-horizon markets between {data.meta.dates[0]} and {data.meta.dates[data.meta.dates.length-1]}, GenLayer&apos;s classifier routes {data.meta.headlinePct.toFixed(1)}% to a source family that was Studio-verified to be fetchable + resolvable end-to-end on at least 1 representative market. Per-market end-to-end verification was performed on {data.verificationLevels.directVerified} markets ({((100 * data.verificationLevels.directVerified) / data.meta.totalPass).toFixed(2)}%). Real-network credibility verification is pending real-testnet availability.&quot;
    </div>
  );
}
