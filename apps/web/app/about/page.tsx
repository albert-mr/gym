import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 space-y-8 text-ink-700 leading-relaxed">
      <header>
        <h1 className="text-3xl font-bold text-ink-900 mb-2">About gym</h1>
        <p className="text-ink-500">A reproducible, open-source home for GenLayer&apos;s intelligent oracle benchmarks.</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">What it is</h2>
        <p>
          gym hosts daily-refreshed benchmarks measuring what GenLayer&apos;s intelligent oracle can resolve, where it breaks, and where to invest next. Each benchmark is self-contained: the polling pipeline, the raw daily data, the classifier, and the rendered dashboard are all in one monorepo. Every number on the site can be traced back to a committed file in the repo.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Who runs it</h2>
        <p>
          The <a className="text-blue-600 hover:underline" href="https://genlayer.foundation" target="_blank" rel="noopener noreferrer">GenLayer Foundation</a> maintains this project. It powers the public credibility claims behind <a className="text-blue-600 hover:underline" href="https://intelligentoracle.com" target="_blank" rel="noopener noreferrer">intelligentoracle.com</a>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">How to contribute a benchmark</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Fork the repo and add a new directory under <code className="bg-ink-100 px-1 rounded text-sm">benchmarks/&lt;name&gt;/</code>.</li>
          <li>Write a daily polling script that produces a JSONL snapshot under <code className="bg-ink-100 px-1 rounded text-sm">benchmarks/&lt;name&gt;/data/</code>.</li>
          <li>Write a builder that emits <code className="bg-ink-100 px-1 rounded text-sm">data/&lt;name&gt;/latest.json</code> conforming to the <code className="bg-ink-100 px-1 rounded text-sm">BenchmarkData</code> type in <code className="bg-ink-100 px-1 rounded text-sm">apps/web/lib/types.ts</code>.</li>
          <li>Add a route in <code className="bg-ink-100 px-1 rounded text-sm">apps/web/app/benchmarks/&lt;name&gt;/</code>.</li>
          <li>Open a PR. Vercel auto-builds a preview.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Repo</h2>
        <p>
          <a className="text-blue-600 hover:underline" href="https://github.com/genlayer-foundation" target="_blank" rel="noopener noreferrer">github.com/genlayer-foundation</a> · MIT licensed · contributions welcome.
        </p>
      </section>

      <section>
        <Link href="/" className="text-sm text-ink-500 hover:text-ink-700">← Home</Link>
      </section>
    </div>
  );
}
