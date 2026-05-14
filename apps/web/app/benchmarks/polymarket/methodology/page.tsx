import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBenchmark } from '@/lib/queries/benchmark';
import { longDate } from '@/lib/format';

export default async function MethodologyPage() {
  const data = await getBenchmark('pm-bench');
  if (!data) notFound();
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
            <p className="text-foreground font-medium">Gate 1: on-chain feed filter.</p>
            <p>Is the market bound to an on-chain price feed (Chainlink, Pyth)? If yes, the chain has the answer and we step out.</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Gate 2: source URL.</p>
            <p>Do the resolution criteria name a source URL we can fetch? Markets without one wait for a later agentic-search release. We don&rsquo;t ship best-effort scraping.</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Gate 3: accessibility.</p>
            <p>Can a validator reach the named source? If the host blocks validator traffic, we route to a verified alternate with the same fact. If no alternate exists (paywall, login, captcha, pure-consensus subjective market), the market goes to Currently held.</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Off-chain step: deeper-page agent.</p>
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
          Bradbury is <a href="https://genlayer.com/testnet" target="_blank" rel="noreferrer" className="underline hover:text-foreground">GenLayer&rsquo;s testnet</a>. The benchmark runs in Studio today (GenLayer&rsquo;s developer environment); moving it to Bradbury runs each market through real validators and surfaces per-validator on-chain transactions on every per-market detail page.
        </p>
      </section>

      <section className="space-y-3" id="tls-notary">
        <h2 className="text-xl font-semibold tracking-tight">TLS notary</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          A TLS notary is a cryptographic receipt that specific bytes came from a specific HTTPS origin at a specific time. It&rsquo;s the same primitive GenLayer Labs is piloting in its Twitter bounty, applied to any web source. One validator fetches with its own credentials; the proof is portable, and the rest verify it without re-fetching. For this benchmark, it unlocks most of <span className="text-foreground">Currently held</span>: paywalled, logged-in, rate-limited, or IP-locked pages. Not shipped yet; on the roadmap alongside hardened alternates and the accuracy backtest.
        </p>
      </section>

      <section className="space-y-3" id="open-questions">
        <h2 className="text-xl font-semibold tracking-tight">Open questions</h2>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li><span className="text-foreground font-medium">Accuracy backtest.</span> Today the headline is coverage. Next is replaying closed markets through the oracle on Bradbury and publishing per-category accuracy alongside it.</li>
          <li><span className="text-foreground font-medium">Hardened alternates.</span> The alternate is agent-chosen; a vetted list is still open product work.</li>
          <li><span className="text-foreground font-medium">Bradbury in production.</span> Moves runs out of Studio and exposes per-validator transactions on the detail pages.</li>
          <li><span className="text-foreground font-medium">Vertical-specific prompts.</span> The oracle prompt is horizontal today; per-vertical prompts (esports, sports, weather) should sharpen routing and resolution.</li>
        </ul>
      </section>

    </div>
  );
}
