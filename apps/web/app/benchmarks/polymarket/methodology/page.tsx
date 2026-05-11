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
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">How GenLayer resolves Polymarket</h1>
        <p className="text-base text-muted-foreground leading-relaxed">The universe, the pipeline, and the three resolution categories &mdash; in plain prose.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The universe</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Cumulative since {startLong}. Each day at the same UTC moment, we poll Polymarket&rsquo;s public API for every market resolving in the next 24 hours, drop the markets resolved by deterministic on-chain oracles (Chainlink, Pyth), and add the remainder to the cumulative dataset. Long-horizon markets (election forecasts in November, &ldquo;X happens by end of year&rdquo;) have a different risk profile and need different treatment; they are out of scope for this benchmark.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Polymarket has three oracles. We measure one.</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Polymarket settles markets through three on-chain oracles:
        </p>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li><span className="text-foreground font-medium">UMA Optimistic Oracle</span> &mdash; the bulk of Polymarket&rsquo;s markets. A human proposer reads the source, the answer is challengeable for two hours. This is the resolution GenLayer&rsquo;s intelligent oracle substitutes for.</li>
          <li><span className="text-foreground font-medium">Chainlink Data Feeds</span> &mdash; deterministic on-chain price feeds. No human in the loop. GenLayer has no role.</li>
          <li><span className="text-foreground font-medium">Pyth Network</span> &mdash; deterministic high-frequency price oracle for stocks and commodities. No human in the loop. GenLayer has no role.</li>
        </ul>
        <p className="text-base text-muted-foreground leading-relaxed">
          We drop the Chainlink and Pyth markets at the first gate. The headline measures only the UMA universe &mdash; the markets whose resolution requires interpreting an external source.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The pipeline</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Each day we poll Polymarket&rsquo;s public API for markets resolving in the next 24 hours. Markets bound to deterministic on-chain price feeds (Chainlink, Pyth) are removed: GenLayer is not a substitute for these. Markets with no source URL anywhere in their resolution criteria are removed: there is nothing to resolve against. The remaining markets form the cumulative addressable universe.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Every market in that universe is then mapped to a source family GenLayer has end-to-end coverage for. The market lands in one of three categories &mdash; Direct source, Alternative source, or Currently unresolvable. The first two count toward the headline; the third does not.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">The three categories</h2>
        <dl className="space-y-4 text-base text-muted-foreground leading-relaxed">
          <div>
            <dt className="font-medium text-foreground">Direct source</dt>
            <dd>The source named in Polymarket&rsquo;s resolution criteria is the source GenLayer fetches. Sometimes that is the exact URL Polymarket provides; sometimes GenLayer navigates to a deeper page on the same host. Either way, GenLayer reads the source the criteria points to.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Alternative source</dt>
            <dd>The named host is not reachable from validator infrastructure &mdash; Cloudflare-walled, JS-only, geo-blocked, or anti-bot-blocked. GenLayer routes to a verified alternate that contains the same resolution fact. LaLiga &rarr; ESPN, HLTV &rarr; Liquipedia, Eurovision.tv &rarr; Wikipedia, frmf.ma &rarr; Flashscore.</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Currently unresolvable</dt>
            <dd>Paywall, login wall, captcha, or pure-consensus subjective markets with no canonical source. We mark these honestly and revisit when the infrastructure or methodology improves &mdash; the <Link href="/benchmarks/sources-bench" className="underline underline-offset-2 hover:text-foreground">Sources benchmark</Link> tracks them by failure reason.</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Open questions</h2>
        <ul className="space-y-2 text-base text-muted-foreground leading-relaxed list-disc pl-5">
          <li><span className="text-foreground font-medium">Accuracy backtest.</span> The headline measures resolution coverage. The next milestone is replaying closed markets through a local LLM and comparing the output to Polymarket&rsquo;s settlement, then publishing per-category accuracy alongside coverage.</li>
          <li><span className="text-foreground font-medium">Validator-equivalent infrastructure.</span> Some hosts return HTTP 403 to certain validator IP ranges. The production answer should test against the same IPs validators would use, not a single development environment.</li>
          <li><span className="text-foreground font-medium">Currently-pending markets.</span> A few percent of recent markets have not finished UMA&rsquo;s 2-hour challenge window. We label them <code className="bg-muted px-1 rounded text-sm">pending</code> and refresh daily.</li>
          <li><span className="text-foreground font-medium">Long-horizon markets.</span> Markets resolving further out than 24 hours are out of scope today. Whether to extend coverage there &mdash; and how &mdash; is open.</li>
        </ul>
      </section>

    </div>
  );
}
