import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 space-y-10">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">About</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">GenLayer Gym</h1>
        <p className="text-base text-muted-foreground leading-relaxed">Where we measure what GenLayer can do. A reproducible, open-source home for benchmarks across the GenLayer ecosystem.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">What this is</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          GenLayer Gym hosts daily-refreshed benchmarks measuring what GenLayer can do across multiple surfaces — the intelligent oracle, source accessibility, and more as we build them. Each benchmark is self-contained: polling pipeline, daily raw data, classifier, and rendered dashboard live in one monorepo. Every number on the site traces to a committed file.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Who runs it</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Maintained by the <a className="underline underline-offset-2 hover:text-foreground" href="https://genlayer.foundation" target="_blank" rel="noopener noreferrer">GenLayer Foundation</a>. Read GenLayer Gym as foundation-published benchmark evidence — not a marketing page.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Add your benchmark</h2>
        <ol className="list-decimal pl-5 space-y-2 text-base text-muted-foreground leading-relaxed">
          <li>Fork the repo. Add a new directory under <code className="bg-muted px-1 rounded text-sm">benchmarks/&lt;name&gt;/</code>.</li>
          <li>Write a poller that produces daily JSONL snapshots under <code className="bg-muted px-1 rounded text-sm">benchmarks/&lt;name&gt;/data/</code>.</li>
          <li>Write a builder that emits <code className="bg-muted px-1 rounded text-sm">data/&lt;name&gt;/latest.json</code> matching the <code className="bg-muted px-1 rounded text-sm">BenchmarkData</code> type in <code className="bg-muted px-1 rounded text-sm">apps/web/lib/types.ts</code>.</li>
          <li>Add a route under <code className="bg-muted px-1 rounded text-sm">apps/web/app/benchmarks/&lt;name&gt;/</code>.</li>
          <li>Open a pull request. Vercel deploys a preview automatically.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Repository</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          <a className="underline underline-offset-2 hover:text-foreground" href="https://github.com/genlayer-foundation" target="_blank" rel="noopener noreferrer">github.com/genlayer-foundation</a> · MIT licensed.
        </p>
      </section>

      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
      </div>
    </div>
  );
}
