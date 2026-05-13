import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { longDate } from '@/lib/format';

export default function MethodologyPage() {
  const data = loadBenchmark('pm-bench');
  const startLong = longDate(data.meta.window.start);
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-12">

      <div>
        <Link href="/benchmarks/polymarket" className="text-sm text-muted-foreground hover:text-foreground">&larr; Polymarket benchmark</Link>
      </div>

      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Methodology</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">How GenLayer&rsquo;s Intelligent Oracle resolves Polymarket</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          A short reference. The landing page has the narrative.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The pipeline</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Cumulative since {startLong}. Once a day we poll Polymarket for every market resolving in the next 24 hours, then run each one through three gates. Markets land in Direct source, Alternative source, or Currently held.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The gates</h2>
        <div className="space-y-5 text-base text-muted-foreground leading-relaxed">
          <div>
            <p className="text-foreground font-medium">Gate 1 &mdash; on-chain feed filter.</p>
            <p>Is the market bound to an on-chain price feed (Chainlink, Pyth)? If yes, the chain has the answer and we step out.</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Gate 2 &mdash; source URL.</p>
            <p>Do the resolution criteria name a source URL we can fetch? Markets without one wait for a later agentic-search release. We don&rsquo;t ship best-effort scraping.</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Gate 3 &mdash; accessibility.</p>
            <p>Can a validator reach the named source? If the host blocks validator traffic, we route to a verified alternate with the same fact. If no alternate exists &mdash; paywall, login, captcha, pure-consensus subjective market &mdash; the market goes to Currently held.</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Off-chain step &mdash; deeper-page agent.</p>
            <p>When a market names a host but not a specific URL, an off-chain agent picks the page and hands the URL to the Intelligent Oracle. The agent runs off-chain; the oracle runs on-chain.</p>
          </div>
        </div>
        <div id="alt-source-disclaimer" className="rounded-md border border-muted bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed mt-6">
          <span className="text-foreground font-medium">* On the alternate.</span> The alternate is currently agent-chosen, not a hardened whitelist. Anyone publishing a blog post could in principle pass this gate. Reputation and approved-alternate lists are still open product work.
        </div>
      </section>

      <section className="space-y-3" id="bradbury">
        <h2 className="text-xl font-semibold tracking-tight">Bradbury</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Bradbury is a controlled IP pool that mirrors the ranges real validators use. Studio doesn&rsquo;t see the web the way a validator does &mdash; some hosts return 403 to Studio while accepting validator traffic. Bradbury closes that gap, and once the rollout completes it surfaces per-validator on-chain transactions on every per-market detail page.
        </p>
      </section>

      <section className="space-y-3" id="tls-notary">
        <h2 className="text-xl font-semibold tracking-tight">TLS notary</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          A TLS notary proves a validator actually fetched specific content from a specific HTTPS origin. It is the cryptographic receipt for a paywalled, logged-in, or otherwise non-public page: the validator performs the fetch using its own credentials and walks away with a signed proof that the content came from that exact origin, at that time. Other validators verify the proof without re-fetching, which matters when the source is rate-limited, IP-locked, or behind a session.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          It is the resolution mode that unblocks most of what is in <span className="text-foreground">Currently held</span> today: WSJ paywalls, NYT metered articles, login-gated sports and finance sites. We don&rsquo;t ship it yet. It lands on the roadmap alongside hardened alternates and the accuracy backtest.
        </p>
      </section>

      <section className="space-y-3" id="open-questions">
        <h2 className="text-xl font-semibold tracking-tight">Open questions</h2>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li><span className="text-foreground font-medium">Accuracy backtest.</span> Today the headline is coverage. Next is replaying closed markets through the oracle on Bradbury and publishing per-category accuracy alongside it.</li>
          <li><span className="text-foreground font-medium">Hardened alternates.</span> The alternate is agent-chosen; a vetted list is still open product work.</li>
          <li><span className="text-foreground font-medium">Bradbury in production.</span> Moves runs out of Studio and exposes per-validator transactions on the detail pages.</li>
          <li><span className="text-foreground font-medium">Pending markets.</span> A few percent are still inside UMA&rsquo;s 2-hour challenge window. We refresh daily.</li>
          <li><span className="text-foreground font-medium">Longer horizons.</span> Markets resolving beyond 24 hours are out of scope today.</li>
        </ul>
      </section>

    </div>
  );
}
