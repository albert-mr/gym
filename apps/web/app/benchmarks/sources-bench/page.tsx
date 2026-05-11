import Link from 'next/link';
import { loadBenchmark } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { BucketBadge } from '@/components/BucketBadge';
import type { DomainRow, BenchmarkData } from '@/lib/types';

const WORKING_BUCKETS = new Set(['render','alt','api','liquipedia_recover','bo3_recover','frmf_via_flashscore','eurovision_via_wiki']);

const FAILURE_REASONS: Record<string, string> = {
  yahoo: 'Soft paywall — login wall behind the public URL.',
  hard: 'IP-blocked or Cloudflare-walled to validator infrastructure; no working alternate found.',
  studio_blocked: 'Returns HTTP 403 to Studio web.render IPs; no alternate available.',
  hltv_lost: 'No alternate path that contains the resolution data.',
  subjective: 'No canonical web source; resolution requires consensus of credible reporting.',
  no_source: 'No URL declared in Polymarket’s resolution criteria.',
  misc: 'Source not yet probed; falls outside known categories.',
};

const REBIND_LABEL: Record<string, string> = {
  liquipedia_recover: 'liquipedia.net',
  bo3_recover: 'bo3.gg',
  frmf_via_flashscore: 'flashscore.com',
  eurovision_via_wiki: 'en.wikipedia.org',
};

type Categorized = Record<string, DomainRow[]>;

function groupByCategory(domains: DomainRow[]): Categorized {
  const out: Categorized = {};
  for (const d of domains) {
    const cat = d.category || 'Other';
    if (!out[cat]) out[cat] = [];
    out[cat].push(d);
  }
  // Sort each category alphabetically by host
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.host.localeCompare(b.host));
  return out;
}

function partition(domains: DomainRow[]) {
  const working = domains.filter(d => WORKING_BUCKETS.has(d.dominantBucket));
  const blocked = domains.filter(d => !WORKING_BUCKETS.has(d.dominantBucket));
  return {
    workingByCategory: groupByCategory(working),
    blockedByCategory: groupByCategory(blocked),
    workingCount: working.length,
    blockedCount: blocked.length,
  };
}

export default function SourcesBenchPage() {
  const pm: BenchmarkData = loadBenchmark('pm-bench');
  const { workingByCategory, blockedByCategory, workingCount, blockedCount } = partition(pm.domains);

  // Sort categories: most sources first, but bias toward Sports/Esports/Crypto going first when ties
  const sortCats = (obj: Categorized) =>
    Object.keys(obj).sort((a, b) => obj[b].length - obj[a].length);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 space-y-12">

      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Sources benchmark</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Source accessibility</h1>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          Which web sources are reachable from validator-equivalent infrastructure, by category &mdash; and which ones are blocked, with the reason. Built from the {pm.domains.length} unique source hosts that appeared in Polymarket&apos;s resolution criteria across the cumulative dataset.
        </p>
        <p className="text-xs text-muted-foreground/80 max-w-2xl">
          v1 reuses the per-source verification work from the <Link href="/benchmarks/polymarket" className="underline underline-offset-2 hover:text-foreground">Polymarket benchmark</Link>. v2 will extend with category-specific seed lists (newspapers, government data, public APIs) probed independently &mdash; see the <a className="underline underline-offset-2 hover:text-foreground" href="https://github.com/genlayer-foundation" target="_blank" rel="noopener noreferrer">PLAN.md</a>.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left column: What works */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-border pb-2">
            <h2 className="text-xl font-semibold tracking-tight">What works</h2>
            <Badge variant="secondary" className="font-mono text-xs">{workingCount} sources</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sources we use for resolution. Either the named host returns the data directly, or we route to a Studio-verified alternate that contains the same fact.
          </p>
          <div className="space-y-6">
            {sortCats(workingByCategory).map(cat => (
              <div key={cat}>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{cat}</h3>
                <ul className="space-y-1.5">
                  {workingByCategory[cat].map(d => {
                    const isAlternate = !!REBIND_LABEL[d.dominantBucket];
                    const target = REBIND_LABEL[d.dominantBucket] ?? null;
                    return (
                      <li key={d.host} className="text-sm flex flex-wrap items-baseline gap-x-2">
                        <code className="text-foreground/90 text-[12.5px]">{d.host}</code>
                        {isAlternate && target && (
                          <span className="text-xs text-muted-foreground">
                            &rarr; <code className="text-foreground/70 text-[12px]">{target}</code>
                          </span>
                        )}
                        <BucketBadge
                          bucket={d.dominantBucket}
                          label={pm.bucketLabels[d.dominantBucket] ?? d.dominantBucket}
                          color={pm.bucketColors[d.dominantBucket]}
                          className="ml-auto"
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: What's blocked */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-border pb-2">
            <h2 className="text-xl font-semibold tracking-tight">What&rsquo;s blocked</h2>
            <Badge variant="outline" className="font-mono text-xs">{blockedCount} sources</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sources we cannot reach today, with the reason. Each is a candidate for a future alternate, a TLSNotary unblock path, or a methodology revision.
          </p>
          <div className="space-y-6">
            {sortCats(blockedByCategory).map(cat => (
              <div key={cat}>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{cat}</h3>
                <ul className="space-y-2.5">
                  {blockedByCategory[cat].map(d => (
                    <li key={d.host} className="text-sm">
                      <div className="flex items-baseline gap-2">
                        <code className="text-foreground/90 text-[12.5px]">{d.host}</code>
                        <BucketBadge
                          bucket={d.dominantBucket}
                          label={pm.bucketLabels[d.dominantBucket] ?? d.dominantBucket}
                          color={pm.bucketColors[d.dominantBucket]}
                          className="ml-auto"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {FAILURE_REASONS[d.dominantBucket] ?? 'No working route found.'}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      </section>

      <section className="border-t border-border pt-6">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
          The category labels come from the dominant L1 of the markets bound to each host (Sports, Crypto, Politics, Weather, Esports, Entertainment, Economy, Other). When a benchmark v2 ships category-specific seed lists (newspapers, government data) those will appear in this same view; the contract for adding a source is documented in <Link href="/about" className="underline underline-offset-2 hover:text-foreground">About</Link>.
        </p>
      </section>

    </div>
  );
}
