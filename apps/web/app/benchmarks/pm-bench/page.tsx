import Link from 'next/link';
import { loadBenchmark } from '../../../lib/data';
import { HeadlineCard } from '../../../components/HeadlineCard';
import { VerificationCallout } from '../../../components/VerificationLevels';
import { PerDayTable } from '../../../components/PerDayTable';

export default function PmBenchPage() {
  const data = loadBenchmark('pm-bench');
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 space-y-10">
      <header>
        <div className="font-mono text-sm text-ink-500 mb-1">pm-bench</div>
        <h1 className="text-3xl font-bold text-ink-900 mb-2">Polymarket routability</h1>
        <p className="text-ink-500 leading-relaxed">
          Daily classification of every Polymarket market ending in the next 24 hours. Asks one question: can GenLayer&apos;s intelligent oracle route this market to a known canonical source?
        </p>
      </header>

      <HeadlineCard headlinePct={data.meta.headlinePct} totalPass={data.meta.totalPass} dates={data.meta.dates} />

      <VerificationCallout data={data} />

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-3">Why only 24h-horizon markets</h2>
        <p className="text-ink-700 leading-relaxed">
          This is the only window where we have operational rights to substitute the resolution. Long-term markets (election forecasts ending November, &quot;X happens by EOY&quot;, etc.) have a fundamentally different risk profile and need a different treatment we&apos;re not yet equipped for. We measure step-by-step, day-by-day.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-3">Per-day routability</h2>
        <p className="text-ink-700 leading-relaxed mb-4">
          Each day&apos;s addressable universe split by where we&apos;d fetch the resolution data. Hover any column for the exact definition.
        </p>
        <PerDayTable data={data} />
        <p className="text-xs text-ink-500 mt-3 leading-relaxed">
          <strong>Direct</strong> = the host named in Polymarket&apos;s <code>eventResolutionSource</code> is what we use (with the eRS URL as-is OR a deeper URL on the same host).{' '}
          <strong>Alt</strong> = we reroute to a different host than the criteria mentions (LaLiga → ESPN, HLTV → Liquipedia, frmf.ma → Flashscore, eurovision.tv → Wikipedia).{' '}
          <strong>Unsolvable</strong> = paywalled, IP-blocked, captcha&apos;d, or pure-consensus subjective.{' '}
          <strong>Resolved</strong> = Polymarket has flipped the market to closed=true with outcomePrices = [1,0] or [0,1].
        </p>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link href="/benchmarks/pm-bench/drilldown" className="bg-ink-900 text-white px-4 py-2 rounded hover:bg-ink-700 transition text-sm">Drill down by category → template →</Link>
        <Link href="/benchmarks/pm-bench/methodology" className="bg-white border border-ink-200 px-4 py-2 rounded hover:bg-ink-50 transition text-sm">Methodology + verification levels</Link>
        <Link href="/benchmarks/pm-bench/domains" className="bg-white border border-ink-200 px-4 py-2 rounded hover:bg-ink-50 transition text-sm">Per-domain routing</Link>
      </section>
    </div>
  );
}
