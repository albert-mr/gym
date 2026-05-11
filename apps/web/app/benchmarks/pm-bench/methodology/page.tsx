import { loadBenchmark } from '../../../../lib/data';
import { VerificationLevelsTable, DefensiblePhrasing } from '../../../../components/VerificationLevels';
import Link from 'next/link';

export default function MethodologyPage() {
  const data = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <div className="text-sm text-ink-500 mb-1"><Link href="/benchmarks/pm-bench" className="hover:text-ink-700">← pm-bench</Link></div>
      <h1 className="text-3xl font-bold text-ink-900">Methodology</h1>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Universe</h2>
        <p className="text-ink-700 leading-relaxed">
          24-hour horizon only: markets with <code className="bg-ink-100 px-1 rounded text-sm">endDate</code> in the next 24 hours from the daily poll moment. We don&apos;t benchmark long-tail markets (elections ending in November, &quot;X happens by EOY&quot;) because we have no operational rights to substitute their resolution yet.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Gate funnel</h2>
        <pre className="bg-ink-100 p-3 rounded text-xs overflow-x-auto leading-relaxed">{`Polled markets (gamma-api.polymarket.com/events?closed=false)
  ↓ Gate 1a — drop Chainlink (data.chain.link, reference.chainlink.com)
  ↓ Gate 1c — drop Pyth (pythdata.app, hermes.pyth.network)
  ↓ Gate 1b — drop markets with no URL in eventResolutionSource or description
gate1-pass — the addressable universe
  ↓ Bucket classifier (per-domain heuristic; stand-in for the LLM source-adequacy rubric)
solvable estimate`}</pre>
        <p className="text-sm text-ink-500 leading-relaxed mt-3">
          Polymarket integrates three on-chain oracles. UMA Optimistic Oracle (~98% of markets) is human-in-the-loop — that&apos;s the resolution GenLayer&apos;s intelligent oracle can substitute for.
          Chainlink Data Feeds and Pyth Network are deterministic on-chain — GenLayer has no role. We exclude them at Gate 1 so the headline measures only the addressable universe.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Bucket taxonomy</h2>
        <ul className="space-y-1 text-sm text-ink-700 leading-relaxed">
          <li><strong>render</strong> — direct fetch of the binding URL host via <code className="bg-ink-100 px-1 rounded text-xs">gl.nondet.web.render(mode=text, wait=10s)</code></li>
          <li><strong>alt</strong> — binding host isn&apos;t fetchable directly; route to a Studio-verified alternate (LaLiga → ESPN esp.1, Bundesliga → ESPN ger.1, etc.)</li>
          <li><strong>api</strong> — JSON endpoint via <code className="bg-ink-100 px-1 rounded text-xs">gl.nondet.web.get</code> (Binance, dotabuff)</li>
          <li><strong>liquipedia_recover</strong> — HLTV (Cloudflare-walled) → Liquipedia</li>
          <li><strong>bo3_recover</strong> — per-map total kills → bo3.gg</li>
          <li><strong>frmf_via_flashscore</strong> — Moroccan football → Flashscore Botola</li>
          <li><strong>eurovision_via_wiki</strong> — eurovision.tv (Cloudflare-walled) → Wikipedia</li>
          <li><strong>subjective</strong> — requires consensus of credible reporting; no canonical source</li>
          <li><strong>hard</strong> — paywall / login / captcha with no recovery (x.com, Yahoo Finance, sooplive)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Studio caveat</h2>
        <p className="text-ink-700 leading-relaxed">
          GenLayer Studio is a centralized testbed, not a real testnet. Studio dry-runs verify that a contract+source combination produces a deterministic outcome under our prompt — they don&apos;t prove production credibility. That requires deployment on a real network. The Studio-verification work covered in this benchmark is a sanity check, not a credibility claim.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Verification levels — read before quoting the headline</h2>
        <p className="text-ink-700 leading-relaxed mb-3">
          The headline &quot;X% routable&quot; counts markets whose classifier bucket matches a Studio-verified source family. That is <em>not</em> the same as &quot;X% of markets individually proven end-to-end&quot;.
        </p>
        <VerificationLevelsTable data={data} />
        <DefensiblePhrasing data={data} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Known limitations</h2>
        <ul className="space-y-2 text-sm text-ink-700 leading-relaxed list-disc pl-5">
          <li><strong>Studio centralization</strong>: Studio dry-runs validate determinism + source under our exact prompt — they don&apos;t prove production credibility (that requires a real network).</li>
          <li><strong>Gate 2 LLM rubric stubbed</strong>: in the production-target pipeline, Gate 2 is an LLM source-adequacy rubric applied per market. Currently approximated by the per-domain bucket classifier.</li>
          <li><strong>Gate 3 IP probe stubbed</strong>: production should verify each binding URL is accessible from validator-equivalent infrastructure (SofaScore returns 403 to Studio&apos;s web.render IPs, etc.). Today we discover this case-by-case via Studio failures.</li>
          <li><strong>No accuracy backtest yet</strong>: we measure <em>routability</em>, not <em>accuracy</em>. The next milestone is replaying closed markets with a local LLM and comparing the output to Polymarket&apos;s outcome.</li>
          <li><strong>Pending Polymarket resolutions</strong>: a few percent of markets in the window haven&apos;t yet flipped to <code className="bg-ink-100 px-1 rounded text-xs">closed=true</code> (still in UMA challenge window). These show <code className="bg-ink-100 px-1 rounded text-xs">winner=pending</code>.</li>
        </ul>
      </section>
    </div>
  );
}
