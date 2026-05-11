import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { VerificationLevelsTable, DefensiblePhrasing } from '@/components/VerificationLevels';

export default function MethodologyPage() {
  const data = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-12">

      <div>
        <Link href="/benchmarks/polymarket" className="text-sm text-muted-foreground hover:text-foreground">← Polymarket benchmark</Link>
      </div>

      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Methodology</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">How we count what&apos;s resolvable</h1>
        <p className="text-base text-muted-foreground leading-relaxed">The pipeline, the definitions, and the verification we&apos;ve actually done.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Universe</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          We poll Polymarket&apos;s public API once per day and keep only the markets resolving in the next 24 hours. We don&apos;t score long-horizon markets here — they have a different risk profile.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Polymarket has three oracles. We measure one.</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Polymarket resolves markets through three on-chain oracles:
        </p>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li><span className="text-foreground font-medium">UMA Optimistic Oracle</span> — ~98% of markets. A human proposer reads the source, the answer is challengeable for 2 hours. This is the resolution GenLayer&apos;s intelligent oracle can substitute for.</li>
          <li><span className="text-foreground font-medium">Chainlink Data Feeds</span> — deterministic on-chain price feeds. No human in the loop. GenLayer has no role.</li>
          <li><span className="text-foreground font-medium">Pyth Network</span> — deterministic high-frequency price oracle for stocks and commodities. No human in the loop. GenLayer has no role.</li>
        </ul>
        <p className="text-base text-muted-foreground leading-relaxed">
          We drop the Chainlink and Pyth markets at the first gate. The headline measures only the UMA universe — the markets whose resolution requires interpreting an external source.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The pipeline</h2>
        <pre className="bg-muted rounded-md p-4 text-xs font-mono leading-relaxed overflow-x-auto">{`Polled markets  (gamma-api.polymarket.com/events?closed=false)
  ↓  drop Chainlink (data.chain.link, reference.chainlink.com)
  ↓  drop Pyth (pythdata.app, hermes.pyth.network)
  ↓  drop markets with no source URL in description
addressable universe
  ↓  classifier maps each market to a source family
Direct source  ·  Alternative source  ·  Currently unresolvable`}</pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Three categories</h2>
        <dl className="space-y-4 text-base text-muted-foreground leading-relaxed">
          <div>
            <dt className="font-medium text-foreground">Direct source</dt>
            <dd>The source named in Polymarket&apos;s resolution criteria is the source we use. Sometimes that&apos;s the exact URL Polymarket provides; sometimes we navigate to a deeper page on the same host. Studio-verified per source family.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Alternative source</dt>
            <dd>The named source isn&apos;t reachable from validator infrastructure (Cloudflare-walled, JS-only, geo-blocked, anti-bot). We route to a Studio-verified alternate that contains the same fact. LaLiga → ESPN, HLTV → Liquipedia, Eurovision.tv → Wikipedia.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Currently unresolvable</dt>
            <dd>Paywall, login wall, captcha, or pure-consensus subjective markets with no canonical source. We mark these honestly and revisit when the infrastructure or methodology improves.</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">How verified is the headline?</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          The number on the home page counts every market whose classifier bucket matches a Studio-verified source family. That is not the same as &quot;every market individually proven end-to-end.&quot; Three distinct levels:
        </p>
        <VerificationLevelsTable data={data} />
        <p className="text-sm text-muted-foreground mt-4">If you cite the number in a paper or post, here is the defensible phrasing:</p>
        <DefensiblePhrasing data={data} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Studio is not a real testnet</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          GenLayer Studio is a centralized testbed. Studio dry-runs verify that a contract + source produces a deterministic outcome under our prompt — they do not prove production credibility under validator consensus. That requires deployment on a real network. We&apos;re explicit about this so the numbers above are read for what they are.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Open questions</h2>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li><span className="text-foreground font-medium">Accuracy backtest.</span> We measure routability, not accuracy. The next milestone is replaying closed markets through a local LLM and comparing the output to Polymarket&apos;s outcome.</li>
          <li><span className="text-foreground font-medium">Validator-equivalent infrastructure.</span> Studio&apos;s web.render IPs get 403&apos;d by some hosts (SofaScore). The production answer should test against the same IPs validators would use.</li>
          <li><span className="text-foreground font-medium">Currently-pending markets.</span> A few percent of recent markets haven&apos;t finished UMA&apos;s 2-hour challenge window. We label them <code className="bg-muted px-1 rounded text-sm">pending</code> and refresh daily.</li>
        </ul>
      </section>
    </div>
  );
}
