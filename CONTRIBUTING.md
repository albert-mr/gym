# Contributing to GenLayer Gym

Thank you for considering a contribution. GenLayer Gym is open by design — every benchmark in this repo is meant to be reproduced, audited, or extended.

## What kinds of contributions

- **New benchmark**: a self-contained pipeline that asks one well-defined question about GenLayer.
- **Improvements to an existing benchmark**: better classifier, expanded source coverage, fixed bugs.
- **Dashboard improvements**: copy, accessibility, performance, mobile.
- **Methodology critiques**: open an issue with the specific number you dispute and the evidence.

## Adding a new benchmark

A benchmark is one folder under `benchmarks/<name>/` plus one folder under `data/<name>/`.

### 1. Pipeline (under `benchmarks/<name>/`)

You decide the language and structure. Convention so far:

```
benchmarks/<name>/
├── package.json            # if Node, name it @gym/<name>
├── README.md               # what it measures, how, daily refresh cmd
├── PLAN.md                 # design doc
├── scripts/
│   ├── poll.mjs            # daily poller — writes raw snapshot to data/
│   ├── analyze.mjs         # classifier / aggregator — writes derived snapshot
│   └── build-data-json.mjs # emits the JSON the dashboard reads
└── data/                   # daily snapshots committed to repo
```

### 2. Data contract (under `data/<name>/`)

Your `build-data-json.mjs` must write `data/<name>/latest.json` matching the `BenchmarkData` type in `apps/web/lib/types.ts`:

```ts
type BenchmarkData = {
  meta: { dates, generatedAt, totalPass, totalSolved, headlinePct, window };
  perDay: Record<string, PerDay>;
  templates: Template[];
  domains: DomainRow[];
  unsolvables: Unsolvable[];
  marketsByTemplate: Record<string, MarketRow[]>;
  verificationLevels: { directVerified, directVerifiedNote, inferred, heuristic };
  bucketLabels: Record<string, string>;
  bucketColors: Record<string, string>;
};
```

If your benchmark doesn't fit this shape exactly (e.g., sources-bench will have different bucket semantics), open a discussion before extending the type.

### 3. Dashboard route (under `apps/web/app/benchmarks/<name>/`)

A `page.tsx` server component that calls `loadBenchmark('<name>')` and renders the headline, the breakdown table, and the methodology link.

For now reuse the existing `HeadlineCard`, `PerDayTable`, `DomainTable`, `DrilldownTree`, `BucketBadge`, and `VerificationLevels` components. Tailor copy as needed.

### 4. Open the PR

- Vercel auto-builds a preview from `apps/web/`.
- Include in the PR description: the question your benchmark answers, the methodology in one paragraph, and the verification level behind your headline.

## The "verification levels" rule

Every public number on GenLayer Gym must declare its verification level:

1. **Studio-verified end-to-end** — the contract was deployed, executed, and the output matched ground truth.
2. **Per-source-family inferred** — verified on a representative; we claim the result generalizes.
3. **Classifier heuristic only** — categorized but never executed.

If your benchmark mixes levels, the methodology page must explain the split. The defensible phrasing block on the methodology page should reflect the actual evidence.

## Reproducibility

- All raw daily snapshots live in `benchmarks/<name>/data/` and are committed.
- Re-running `build-data-json.mjs` against the same snapshots must produce identical `data/<name>/latest.json`.
- If a snapshot has to be re-collected (e.g., upstream API regression), commit the new snapshot alongside the old one and update methodology with the change.

## Code style

- Prefer plain Node ES modules (`.mjs`) for benchmark pipelines; TypeScript for the dashboard.
- shadcn/ui components for any new dashboard UI.
- No external chart libraries unless a benchmark genuinely needs one — inline SVG suffices for most.

## License

By contributing you agree your contribution is licensed under MIT.
