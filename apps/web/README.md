# @gym/web

The Next.js 15 dashboard at `gym.genlayer.foundation`. Static export, SSG only, reads JSON from the monorepo `data/` folder at build time.

## Run

```bash
pnpm install                    # at workspace root
pnpm --filter @gym/web dev      # http://localhost:3000
pnpm --filter @gym/web build    # static export under .next
```

## Data source

Each page reads `data/<benchmark>/latest.json` via `lib/data.ts` (`loadBenchmark(name)`).
Regenerate the JSON by running `build-data-json.mjs` in the benchmark's folder, e.g.:

```bash
node benchmarks/pm-bench/scripts/build-data-json.mjs
```

The dashboard never fetches Polymarket directly — all data is committed JSON.

## Stack

- Next.js 15 App Router (server components by default; one client component for the drill-down filters)
- shadcn/ui (Nova preset, Base UI under the hood) + Geist font
- Tailwind CSS with OKLCH tokens
- TypeScript strict mode

## Routes

| Route | Purpose |
|---|---|
| `/` | Story-first homepage with the live headline pulled from `data/pm-bench/latest.json` |
| `/benchmarks` | Index of all benchmarks |
| `/benchmarks/polymarket` | Polymarket benchmark — story + per-day table |
| `/benchmarks/polymarket/drilldown` | Market-level audit trail (filterable client component) |
| `/benchmarks/polymarket/methodology` | Verification levels, defensible phrasing, gate funnel |
| `/benchmarks/polymarket/domains` | Per-source routing |
| `/benchmarks/sources-bench` | Planned benchmark placeholder |
| `/about` | About + contribution guide |

## Adding a benchmark route

See repo-root [CONTRIBUTING.md](../../CONTRIBUTING.md). The short version:

1. Make sure your benchmark emits `data/<name>/latest.json` matching `lib/types.ts > BenchmarkData`.
2. Create `app/benchmarks/<name>/page.tsx`. Reuse `HeadlineCard`, `PerDayTable`, `DrilldownTree`, etc.
3. Add a card in `app/benchmarks/page.tsx`.

## Deploy

Vercel:
- Root directory: `apps/web`
- Framework preset: Next.js
- Build command: `pnpm build`
- Install command: leave default (Vercel auto-detects pnpm-workspace.yaml at repo root and runs `pnpm install`)
- Node: 20+
