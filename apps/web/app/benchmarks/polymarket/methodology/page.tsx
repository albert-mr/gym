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
          GenLayer&rsquo;s Intelligent Oracle is a deterministic-enough resolution layer for markets whose answer lives on the open web. This page walks through how the Intelligent Oracle decides a Polymarket market: the universe it sees, the gates it runs, the implementation behind those gates, and the three categories every market lands in.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The universe</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Cumulative since {startLong}. Each day at the same UTC moment, we poll Polymarket&rsquo;s public API for every market resolving in the next 24 hours and add the new markets to the cumulative dataset.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">Out of scope today.</span> Some markets drop out of the addressable set before the Intelligent Oracle even runs: deterministic on-chain feeds (Chainlink, Pyth), markets with no source URL anywhere in their resolution criteria, and markets routed through subjective consensus. Each drop is explained per-step in <a href="#funnel" className="underline underline-offset-2 hover:text-foreground">the funnel section below</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Polymarket has three oracles. We measure one.</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Polymarket settles markets through three on-chain oracles. The Intelligent Oracle is the GenLayer product that substitutes for the human proposer in UMA&rsquo;s Optimistic Oracle &mdash; the share Polymarket leaves for software interpretation of an external source. Across our daily polls (since {startLong}, {data.onchainFeedStats.polledUniverse.toLocaleString()} unique markets):
        </p>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li><span className="text-foreground font-medium">UMA Optimistic Oracle: {data.onchainFeedStats.addressablePct.toFixed(0)}%.</span> A human proposer reads the source, the answer is challengeable for two hours. This is the slice the Intelligent Oracle replaces.</li>
          <li><span className="text-foreground font-medium">Chainlink Data Feeds: {data.onchainFeedStats.chainlinkPct.toFixed(0)}%.</span> Deterministic on-chain price feeds (mostly recurring &ldquo;BTC Up or Down hourly&rdquo;-style markets). No human in the loop. The Intelligent Oracle has no role.</li>
          <li><span className="text-foreground font-medium">Pyth Network: {data.onchainFeedStats.pythPct.toFixed(1)}%.</span> Deterministic high-frequency price oracle for stocks and commodities. No human in the loop. The Intelligent Oracle has no role.</li>
        </ul>
        <p className="text-base text-muted-foreground leading-relaxed">
          We drop the Chainlink and Pyth markets at the first gate. The headline measures only the UMA share: the markets whose resolution requires interpreting an external source.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The pipeline</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Each day we poll Polymarket&rsquo;s public API for markets resolving in the next 24 hours. Markets bound to deterministic on-chain price feeds (Chainlink, Pyth) are removed: the Intelligent Oracle is not a substitute for these. Markets with no source URL anywhere in their resolution criteria are removed: there is nothing to resolve against. The remaining markets form the cumulative addressable universe.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Every market in that universe is then mapped to a source family the Intelligent Oracle has end-to-end coverage for. The market lands in one of three categories: Direct source, Alternative source, or Currently unresolvable. The first two count toward the headline; the third does not.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">One callout.</span> Some markets in the Direct-source bucket reach their answer through a small off-chain agent step before the on-chain Intelligent Oracle runs &mdash; the agent navigates to a specific page on the source host and hands the URL to the Intelligent Oracle. The agent step is distinct from the Intelligent Oracle step and is explained <a href="#deeper-page" className="underline underline-offset-2 hover:text-foreground">below</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">How the Intelligent Oracle decides</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          The Intelligent Oracle runs a market through three gates. A market that passes all three is resolvable today; a market that fails any one is either out of scope (gate 1) or currently unresolvable (gate 2 or 3).
        </p>
        <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
          <div>
            <p className="text-foreground font-medium">Gate 1 &mdash; on-chain feed filter.</p>
            <p>Tests whether the market is bound to a deterministic on-chain price feed (Chainlink, Pyth). If yes, the Intelligent Oracle has no role &mdash; the chain already has the answer. <span className="italic">Passes:</span> any non-Chainlink, non-Pyth market <Link href="/benchmarks/polymarket/markets/lowest-temperature-in-london-on-may-6-2026" className="underline underline-offset-2 hover:text-foreground">(example market &rarr;)</Link>. <span className="italic">Fails:</span> any Chainlink-bound &ldquo;BTC Up or Down&rdquo; hourly market.</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Gate 2 &mdash; source URL presence.</p>
            <p>Tests whether the resolution criteria name an explicit source URL the Intelligent Oracle can fetch. If no source is named, there is nothing to resolve against. <span className="italic">Passes:</span> a sports market that names a fixture page <Link href="/benchmarks/polymarket/markets/chi-wsz-hai-2026-05-06" className="underline underline-offset-2 hover:text-foreground">(example market &rarr;)</Link>. <span className="italic">Fails:</span> a news market that asks &ldquo;will the President say X this week&rdquo; without naming a transcript host.</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Gate 3 &mdash; source accessibility.</p>
            <p>Tests whether the named source host is reachable from validator-range infrastructure. If the host blocks validator traffic, we look for a verified alternate that contains the same resolution fact; if no alternate exists, the market is currently unresolvable. <span className="italic">Passes:</span> wunderground.com responds to validator-range requests <Link href="/benchmarks/polymarket/markets/lowest-temperature-in-london-on-may-6-2026" className="underline underline-offset-2 hover:text-foreground">(example market &rarr;)</Link>. <span className="italic">Fails (routed to alternate):</span> frmf.ma is unreliable and we route to flashscore.com instead <Link href="/benchmarks/polymarket/markets/mar1-fus-irt-2026-05-06" className="underline underline-offset-2 hover:text-foreground">(example market &rarr;)</Link>.</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Implementation: the coding skills</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          The coding skills behind those gates &mdash; gate functions, classifier rules, alternate routing &mdash; live in <code className="bg-muted px-1 rounded text-sm">benchmarks/pm-bench/scripts/</code>. The two anchor files are <code className="bg-muted px-1 rounded text-sm">cross-day-classify.mjs</code> (the classifier that decides which bucket a market lands in) and <code className="bg-muted px-1 rounded text-sm">lib/hierarchy.mjs</code> (the source-family hierarchy and alternate routing table). We&rsquo;ll inline a public-facing <code className="bg-muted px-1 rounded text-sm">skills.md</code> on this page once we&rsquo;ve stabilized the API; until then the source tree is the spec.
        </p>
      </section>

      <section className="space-y-3" id="deeper-page">
        <h2 className="text-xl font-semibold tracking-tight">The deeper-page agent step</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Some markets name a source <span className="italic">host</span> rather than a specific URL: &ldquo;according to ESPN,&rdquo; not &ldquo;according to espn.com/nba/game/_/gameId/12345.&rdquo; An off-chain agent searches the source host, resolves the specific URL for that market, and hands that URL to the Intelligent Oracle. The agent step is off-chain; the Intelligent Oracle step is on-chain.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          That distinction matters for how the Direct-source bucket should be read. It splits in two:
        </p>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li><span className="text-foreground font-medium">Pure direct.</span> The URL Polymarket named is the URL the Intelligent Oracle fetched. No agent navigation.</li>
          <li><span className="text-foreground font-medium">Direct with deeper-page agent.</span> The URL Polymarket named is the host; the off-chain agent navigated to the specific page, and the Intelligent Oracle fetched that page.</li>
        </ul>
      </section>

      <section className="space-y-3" id="bradbury">
        <h2 className="text-xl font-semibold tracking-tight">Bradbury &mdash; controlled validator IPs</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Bradbury is GenLayer&rsquo;s controlled IP pool that mirrors the IP ranges real validators use. Studio&rsquo;s <code className="bg-muted px-1 rounded text-sm">web.render</code> IPs are <span className="italic">not</span> representative of validator behavior &mdash; some hosts (e.g. sofascore.com) return HTTP 403 to Studio while accepting validator-range traffic. Bradbury makes Studio runs faithful to production and also makes per-validator on-chain transactions visible on the per-market detail page.
        </p>
      </section>

      <section className="space-y-3" id="funnel">
        <h2 className="text-xl font-semibold tracking-tight">Where markets drop</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          One line per filter step on why markets fall out, with example markets where settled exemplars exist.
        </p>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li><span className="text-foreground font-medium">Chainlink.</span> Deterministic on-chain feed, no need for the Intelligent Oracle. (Chainlink markets are filtered before they reach the per-market dataset, so no detail page exists.)</li>
          <li><span className="text-foreground font-medium">Pyth.</span> Deterministic high-frequency price oracle, no need for the Intelligent Oracle. (Same as Chainlink &mdash; no per-market detail page.)</li>
          <li><span className="text-foreground font-medium">No source URL.</span> No explicit source in the resolution criteria; eventually handled by agentic search (out of scope today).</li>
          <li><span className="text-foreground font-medium">Source not accessible (no alternate).</span> Host blocks validator IPs; we route to a verified alternate when one exists, otherwise the market is currently unresolvable. <Link href="/benchmarks/polymarket/markets/spx-opens-up-or-down-on-may-6-2026" className="underline underline-offset-2 hover:text-foreground">(example market &rarr;)</Link></li>
          <li><span className="text-foreground font-medium">Subjective / consensus-only.</span> No canonical external source; needs a different resolution mode. <Link href="/benchmarks/polymarket/markets/donald-trump-tie-color-on-may-7" className="underline underline-offset-2 hover:text-foreground">(example market &rarr;)</Link></li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The three categories</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Every market in the addressable universe lands in exactly one of these three categories.
        </p>

        <div className="space-y-2">
          <h3 className="text-base font-medium text-foreground">Direct source</h3>
          <p className="text-base text-muted-foreground leading-relaxed">The source named in Polymarket&rsquo;s resolution criteria is the source the Intelligent Oracle fetches.</p>
          <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
            <li>Wunderground temperature reading <Link href="/benchmarks/polymarket/markets/lowest-temperature-in-london-on-may-6-2026" className="underline underline-offset-2 hover:text-foreground">(example &rarr;)</Link></li>
            <li>Binance price snapshot (JSON API) <Link href="/benchmarks/polymarket/markets/bitcoin-up-or-down-may-6-2026-6am-et" className="underline underline-offset-2 hover:text-foreground">(example &rarr;)</Link></li>
            <li>csl-china.com fixture page <Link href="/benchmarks/polymarket/markets/chi-wsz-hai-2026-05-06" className="underline underline-offset-2 hover:text-foreground">(example &rarr;)</Link></li>
          </ul>
          <p className="text-base text-muted-foreground leading-relaxed">
            <Link href="/benchmarks/polymarket/drilldown?bucket=render,api" className="underline underline-offset-2 hover:text-foreground">See all Direct-source markets in the Explorer &rarr;</Link>
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-medium text-foreground">Alternative source<sup><a href="#alt-source-disclaimer" className="underline underline-offset-2 hover:text-foreground">*</a></sup></h3>
          <p className="text-base text-muted-foreground leading-relaxed">The named host is not reachable from validator infrastructure. The Intelligent Oracle routes to a verified alternate that contains the same resolution fact.</p>
          <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
            <li>kick.com &rarr; Liquipedia <Link href="/benchmarks/polymarket/markets/cs2-wal2-rbls-2026-05-06" className="underline underline-offset-2 hover:text-foreground">(example &rarr;)</Link></li>
            <li>kick.com &rarr; bo3.gg <Link href="/benchmarks/polymarket/markets/cs2-wal2-rbls-2026-05-06" className="underline underline-offset-2 hover:text-foreground">(example &rarr;)</Link></li>
            <li>frmf.ma &rarr; Flashscore <Link href="/benchmarks/polymarket/markets/mar1-fus-irt-2026-05-06" className="underline underline-offset-2 hover:text-foreground">(example &rarr;)</Link></li>
          </ul>
          <p className="text-base text-muted-foreground leading-relaxed">
            <Link href="/benchmarks/polymarket/drilldown?bucket=alt,liquipedia_recover,bo3_recover,frmf_via_flashscore,eurovision_via_wiki" className="underline underline-offset-2 hover:text-foreground">See all Alternative-source markets in the Explorer &rarr;</Link>
          </p>
          <div id="alt-source-disclaimer" className="rounded-md border border-muted bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">* On the alternate.</span> The alternate is currently chosen by an agent, not a hardened whitelist. Anyone publishing a blog post could in principle pass this gate. The hardened version &mdash; reputation, multi-source consensus, Polymarket-approved alternates &mdash; is an open product decision; see <a href="#open-questions" className="underline underline-offset-2 hover:text-foreground">Open questions</a>.
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-medium text-foreground">Currently unresolvable</h3>
          <p className="text-base text-muted-foreground leading-relaxed">No accessible canonical source today. We mark these honestly and revisit when the infrastructure or methodology improves.</p>
          <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
            <li>Paywall &mdash; full-article access requires a paid subscription. <Link href="/benchmarks/polymarket/markets/spx-opens-up-or-down-on-may-6-2026" className="underline underline-offset-2 hover:text-foreground">(example &rarr;)</Link></li>
            <li>10-articles-then-paywall &mdash; soft metered paywall blocks repeat validator fetches. <Link href="/benchmarks/polymarket/markets/cvs-quarterly-earnings-nongaap-eps-05-06-2026-2pt21" className="underline underline-offset-2 hover:text-foreground">(example &rarr;)</Link></li>
            <li>Pure-consensus subjective &mdash; no canonical external source. <Link href="/benchmarks/polymarket/markets/donald-trump-tie-color-on-may-7" className="underline underline-offset-2 hover:text-foreground">(example &rarr;)</Link></li>
            <li>Unclassified pop-culture / meta markets. <Link href="/benchmarks/polymarket/markets/what-will-be-said-on-the-next-all-in-podcast-may-8" className="underline underline-offset-2 hover:text-foreground">(example &rarr;)</Link></li>
          </ul>
          <p className="text-base text-muted-foreground leading-relaxed">
            <Link href="/benchmarks/polymarket/drilldown?bucket=hard,yahoo,subjective,misc,no_source,studio_blocked,hltv_lost" className="underline underline-offset-2 hover:text-foreground">See all Currently-unresolvable markets in the Explorer &rarr;</Link>
            <span> The <Link href="/benchmarks/sources-bench" className="underline underline-offset-2 hover:text-foreground">Sources benchmark</Link> tracks them by failure reason.</span>
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Data sufficiency</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Every market in this dataset has data sufficient to resolve in either direction. We exclude markets where only one outcome&rsquo;s evidence is accessible &mdash; if the &ldquo;Yes&rdquo; outcome has a clean public record and the &ldquo;No&rdquo; outcome would require a paywalled source, the market is not addressable for this benchmark.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Intelligent Oracle &harr; Polymarket fit</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Polymarket-style markets are a strong fit for the Intelligent Oracle. The shape of the work is data-driven resolution at scale: tens of thousands of markets per year, each pointing at an external source, each with a binary or short-categorical answer, each priced low enough that a human-bond model (the UMA default) is expensive overhead.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The Intelligent Oracle replaces the human proposer step with deterministic-enough software: transparent gates, predictable cost per resolution, no bond required, and consistent behavior on verified sources. For the high-volume tier &mdash; sports, prices, official outcomes &mdash; the Intelligent Oracle settles markets without human intervention. For the long tail &mdash; subjective markets, paywalled news &mdash; UMA&rsquo;s bonded fallback remains the right escalation path.
        </p>
      </section>

      <section className="space-y-3" id="open-questions">
        <h2 className="text-xl font-semibold tracking-tight">Open questions</h2>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li><span className="text-foreground font-medium">Accuracy backtest.</span> The headline measures resolution coverage. The next milestone is replaying closed markets through the Intelligent Oracle on <a href="#bradbury" className="underline underline-offset-2 hover:text-foreground">Bradbury</a> and comparing the output to Polymarket&rsquo;s settlement, then publishing per-category accuracy alongside coverage.</li>
          <li><span className="text-foreground font-medium">Hardened alternate sources.</span> The alternate is currently agent-chosen, not a hardened whitelist &mdash; see the <a href="#alt-source-disclaimer" className="underline underline-offset-2 hover:text-foreground">alternate disclaimer above</a>. Reputation, multi-source consensus, and Polymarket-approved alternates are all open product decisions.</li>
          <li><span className="text-foreground font-medium">Bradbury production deployment.</span> Moving Intelligent Oracle runs from Studio to <a href="#bradbury" className="underline underline-offset-2 hover:text-foreground">Bradbury</a> makes per-validator on-chain transactions visible on the per-market detail page and removes the Studio-vs-validator IP discrepancy.</li>
          <li><span className="text-foreground font-medium">Currently-pending markets.</span> A few percent of recent markets have not finished UMA&rsquo;s 2-hour challenge window. We label them <code className="bg-muted px-1 rounded text-sm">pending</code> and refresh daily.</li>
          <li><span className="text-foreground font-medium">Long-horizon markets.</span> Markets resolving further out than 24 hours are out of scope today. Whether to extend coverage, and how (agentic search? different resolution mode?), is open.</li>
        </ul>
      </section>

    </div>
  );
}
