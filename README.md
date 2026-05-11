# GenLayer Gym

**Where we measure what GenLayer can do.**

Open benchmarks for the GenLayer ecosystem — public, reproducible, daily-refreshed. One benchmark per question. All pipelines, daily snapshots, classifiers, and dashboards live in this repo so any number can be reproduced or challenged.

Public surface: `gym.genlayer.foundation` (forthcoming).

---

## Layout

```
gym/
├── apps/
│   └── web/                   # Next.js dashboard — gym.genlayer.foundation
├── benchmarks/
│   ├── pm-bench/              # Polymarket benchmark — daily resolution coverage
│   └── sources-bench/         # Sources benchmark — accessibility registry (planned)
├── data/
│   ├── pm-bench/              # Daily JSON the dashboard reads
│   └── sources-bench/
├── tools/
│   └── genvm-webdriver/       # Vendored GenVM browser-render (validator-equivalent)
└── README.md / ROADMAP.md / BENCHMARK-METHODOLOGY.md
```

Each benchmark is self-contained: poll → analyze → classify → emit JSON. The dashboard
reads `data/<benchmark>/latest.json` at build time. Push to main triggers a Vercel rebuild.

## Live benchmarks

| Benchmark | Question | Status | Headline |
|---|---|---|---|
| **Polymarket benchmark** (`benchmarks/pm-bench/`) | What fraction of Polymarket markets resolving in the next 24 hours can GenLayer resolve? | Live | ~97% |
| **Sources benchmark** (`benchmarks/sources-bench/`) | Which web sources are accessible from validator infrastructure? | Planned | — |

## How to read the headline

The Polymarket benchmark's "97%" is forward-looking inference: GenLayer has been Studio-verified end-to-end on representative markets per source family; we claim all markets on those families would resolve the same way. It's a model of what GenLayer can do, grounded in real Studio runs — not a record of every market individually executed.

Full verification levels and defensible phrasing live in the dashboard's [methodology page](./apps/web/app/benchmarks/polymarket/methodology/page.tsx) and [BENCHMARK-METHODOLOGY.md](./benchmarks/pm-bench/BENCHMARK-METHODOLOGY.md).

## Adding a benchmark

1. Create `benchmarks/<name>/` with a poller that produces daily JSONL snapshots under `benchmarks/<name>/data/`.
2. Add a builder script that emits `data/<name>/latest.json` matching the `BenchmarkData` type in `apps/web/lib/types.ts`.
3. Add a route under `apps/web/app/benchmarks/<name>/`.
4. Open a PR. Vercel deploys a preview automatically.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the data contract and conventions.

## Local development

```bash
pnpm install                                          # installs all workspace packages
pnpm --filter @gym/pm-bench daily                     # poll + analyze today
node benchmarks/pm-bench/scripts/build-data-json.mjs  # emit data/pm-bench/latest.json
pnpm --filter @gym/web dev                            # http://localhost:3000
pnpm --filter @gym/web build                          # static export → apps/web/.next
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md).

## License

MIT. Maintained by the [GenLayer Foundation](https://genlayer.foundation).
