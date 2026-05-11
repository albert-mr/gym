import Link from 'next/link';
import { loadBenchmark } from '../lib/data';

export default function HomePage() {
  const pm = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-12">
      <section>
        <h1 className="text-4xl font-bold tracking-tight text-ink-900 mb-3">
          GenLayer intelligent oracle benchmarks
        </h1>
        <p className="text-lg text-ink-500 leading-relaxed">
          How much of the real world can a decentralized LLM oracle actually resolve?
          gym is the public, reproducible answer — one benchmark per question, all data committed,
          every number traceable to a Polymarket event or a web source.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">What we measure</h2>
        <p className="text-ink-700 leading-relaxed mb-3">
          Polymarket settles prediction markets through three oracles: <strong>UMA Optimistic Oracle</strong> (~98% of markets, human-in-the-loop — GenLayer&apos;s domain),
          {' '}<strong>Chainlink Data Feeds</strong> (deterministic on-chain), and <strong>Pyth Network</strong> (deterministic on-chain).
          The Chainlink and Pyth resolutions are already automated; we exclude them.
          gym&apos;s pm-bench measures the routability of the <em>UMA</em> universe — the markets a human proposer reads, and that GenLayer&apos;s intelligent oracle could substitute for.
        </p>
        <p className="text-ink-700 leading-relaxed">
          Each market goes through a 3-gate funnel: drop on-chain oracles, drop markets with no source URL, then classify the remaining universe by where the resolution data lives.
          The classifier maps to a Studio-verified source family for ~97% of the addressable universe; the remaining ~3% is paywalled or genuinely subjective.
        </p>
      </section>

      <section className="rounded-lg p-6 bg-gradient-to-br from-ink-700 to-ink-900 text-white">
        <div className="text-sm uppercase tracking-widest text-ink-200 mb-1">pm-bench · {pm.meta.window.start} → {pm.meta.window.end}</div>
        <div className="flex items-baseline gap-6">
          <div className="text-6xl font-extrabold tabular-nums">{pm.meta.headlinePct.toFixed(1)}%</div>
          <div className="text-sm leading-relaxed">
            of {pm.meta.totalPass.toLocaleString()} UMA-resolved 24h-horizon markets are routable to a Studio-verified source family.{' '}
            <Link href="/benchmarks/pm-bench" className="text-white underline underline-offset-2">Drill in →</Link>
          </div>
        </div>
      </section>

      <section className="rounded border-l-4 border-orange-500 bg-orange-50 p-4 text-sm leading-relaxed">
        <strong className="text-ink-900">Honest qualifier.</strong> &quot;Routable&quot; means we know which source family to look at — not that an LLM has been individually proven to resolve every market.
        About <strong>{pm.verificationLevels.directVerified} markets were Studio-deployed end-to-end with outcome match</strong>; the rest are inferred per-source-family.
        See the verification levels table on the pm-bench page before quoting the headline.
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Browse the benchmarks</h2>
        <p className="text-ink-700 mb-3">More benchmarks land here as we run them. The pipeline, raw data, and classifier are all in the repo.</p>
        <Link href="/benchmarks" className="inline-block bg-ink-900 text-white px-5 py-2 rounded hover:bg-ink-700 transition">View benchmarks →</Link>
      </section>
    </div>
  );
}
