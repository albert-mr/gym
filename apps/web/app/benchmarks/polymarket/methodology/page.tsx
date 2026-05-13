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
          The full pipeline, the gates, and the open questions. The landing covers the narrative; this page is the reference.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The pipeline</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Cumulative since {startLong}. Each day at the same UTC moment, we poll Polymarket&rsquo;s public API for every market resolving in the next 24 hours and add the new markets to the cumulative dataset. The Intelligent Oracle then runs each market through three gates. Markets that pass land in one of three buckets: Direct source, Alternative source, or Currently held.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The classifier rules live in <code className="bg-muted px-1 rounded text-sm">benchmarks/pm-bench/scripts/cross-day-classify.mjs</code>. The source-family hierarchy and alternate-routing table live in <code className="bg-muted px-1 rounded text-sm">benchmarks/pm-bench/scripts/lib/hierarchy.mjs</code>. Until we inline a public-facing <code className="bg-muted px-1 rounded text-sm">skills.md</code>, the source tree is the spec.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The gates</h2>
        <div className="space-y-5 text-base text-muted-foreground leading-relaxed">
          <div>
            <p className="text-foreground font-medium">Gate 1 &mdash; on-chain feed filter.</p>
            <p>Tests whether the market is bound to a deterministic on-chain price feed (Chainlink, Pyth). If yes, we hand the market back &mdash; the chain already has the answer. The Intelligent Oracle has no role.</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Gate 2 &mdash; source URL presence.</p>
            <p>Tests whether the resolution criteria name an explicit source URL the Intelligent Oracle can fetch. Markets without a named source are set aside for a future agentic-search release; we do not ship best-effort scraping.</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Gate 3 &mdash; source accessibility.</p>
            <p>Tests whether the named source host is reachable from validator-range infrastructure. When the host blocks validator traffic, the Intelligent Oracle routes to a verified alternate that contains the same fact. When no alternate exists (paywall, login wall, captcha, pure-consensus subjective markets), we surface the market in the <span className="italic">Currently held</span> bucket honestly &mdash; we do not claim to handle it yet.</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Off-chain step &mdash; deeper-page agent.</p>
            <p>Some markets name a source host rather than a specific URL. An off-chain agent navigates to the specific page and hands that URL to the Intelligent Oracle. The agent step is off-chain; the Intelligent Oracle step is on-chain.</p>
          </div>
        </div>
        <div id="alt-source-disclaimer" className="rounded-md border border-muted bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed mt-6">
          <span className="text-foreground font-medium">* On the alternate.</span> The alternate is currently chosen by an agent, not a hardened whitelist. Anyone publishing a blog post could in principle pass this gate. The hardened version &mdash; reputation, multi-source consensus, Polymarket-approved alternates &mdash; is an open product decision.
        </div>
      </section>

      <section className="space-y-3" id="bradbury">
        <h2 className="text-xl font-semibold tracking-tight">Bradbury</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Bradbury is GenLayer&rsquo;s controlled IP pool that mirrors the IP ranges real validators use. Studio&rsquo;s <code className="bg-muted px-1 rounded text-sm">web.render</code> IPs are not representative of validator behavior &mdash; some hosts (e.g. sofascore.com) return HTTP 403 to Studio while accepting validator-range traffic. Bradbury makes Studio runs faithful to production and surfaces per-validator on-chain transactions on every per-market detail page once the rollout completes.
        </p>
      </section>

      <section className="space-y-3" id="open-questions">
        <h2 className="text-xl font-semibold tracking-tight">Open questions</h2>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li><span className="text-foreground font-medium">Accuracy backtest.</span> The headline measures resolution coverage. The next milestone is replaying closed markets through the Intelligent Oracle on Bradbury and comparing the output to Polymarket&rsquo;s settlement, then publishing per-category accuracy alongside coverage.</li>
          <li><span className="text-foreground font-medium">Hardened alternate sources.</span> The alternate is currently agent-chosen, not a hardened whitelist (see the alternate disclaimer above). Reputation, multi-source consensus, and Polymarket-approved alternates are all open product decisions.</li>
          <li><span className="text-foreground font-medium">Bradbury production deployment.</span> Moving Intelligent Oracle runs from Studio to Bradbury makes per-validator on-chain transactions visible on the per-market detail page and removes the Studio-vs-validator IP discrepancy.</li>
          <li><span className="text-foreground font-medium">Currently-pending markets.</span> A few percent of recent markets have not finished UMA&rsquo;s 2-hour challenge window. We label them <code className="bg-muted px-1 rounded text-sm">pending</code> and refresh daily.</li>
          <li><span className="text-foreground font-medium">Long-horizon markets.</span> Markets resolving further out than 24 hours are out of scope today. Whether to extend coverage, and how (agentic search? different resolution mode?), is open.</li>
        </ul>
      </section>

    </div>
  );
}
