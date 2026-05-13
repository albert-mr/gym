import { Suspense } from 'react';
import Link from 'next/link';
import { ExplorerClient } from './ExplorerClient';

export default function ExplorerPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-3">
        <Link href="/benchmarks/polymarket" className="text-sm text-muted-foreground hover:text-foreground">&larr; Polymarket benchmark</Link>
      </div>
      <header className="mb-8 space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Explorer</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Every market, every source, every cut</h1>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          One filter bar drives one view. Pick how to group the markets &mdash; by category, by resolution path, by source host, by day, or as a flat list &mdash; and the summary on top updates live.
        </p>
      </header>
      <Suspense fallback={<div className="text-muted-foreground text-sm italic py-12 text-center">Loading filters…</div>}>
        <ExplorerClient />
      </Suspense>
    </div>
  );
}
