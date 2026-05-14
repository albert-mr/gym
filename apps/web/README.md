# @gym/web

The Next.js 15 dashboard at `gym.genlayer.foundation`. Reads from Vercel Postgres (Neon) at runtime via React Server Components.

## Run

```bash
pnpm install                    # at workspace root
vercel env pull apps/web/.env.local --environment=production   # one-time; pulls POSTGRES_URL
pnpm --filter @gym/web dev      # http://localhost:3000
pnpm --filter @gym/web build
```

## Data source

Postgres only. Schema in `apps/web/lib/db/schema/{raw,app}.ts`:

- `app.benchmark_meta`, `app.per_day`, `app.markets`, `app.templates`, `app.domains`, `app.bucket_styles`, `app.onchain_feed_stats` — what the dashboard queries.
- `raw.markets`, `raw.market_observations`, `raw.market_outcomes`, `raw.gate_evaluations`, `raw.studio_deploys`, `raw.polls` — append-only event log written by the pipeline; `app.*` is rebuilt deterministically from it via `benchmarks/pm-bench/scripts/rebuild-app.mjs`.

All queries live in `lib/queries/`:

- `getBenchmark(slug)` returns the `BenchmarkData` shape.
- `getMarkets(slug)` / `getMarketBySlug(slug)` for the markets pages and `/api/benchmarks/[slug]/markets` download.
- `getComingSoon(slug)` for benchmarks not yet live.

There are no JSON files acting as data sources anywhere in this repo. The downloadable dataset is served by `app/api/benchmarks/[slug]/markets/route.ts`, which streams from Postgres.

## Stack

- Next.js 15 App Router (server components by default; one client component for the explorer filters)
- Drizzle ORM + `@neondatabase/serverless` (HTTP driver, edge-friendly)
- shadcn/ui (Nova preset, Base UI under the hood) + Geist font
- Tailwind CSS with OKLCH tokens
- TypeScript strict mode

## Routes

| Route | Purpose |
|---|---|
| `/` | Benchmarks landing — one card per benchmark, each with its own headline |
| `/benchmarks/polymarket` | Polymarket benchmark — story + per-day table |
| `/benchmarks/polymarket/explorer` | Market-level audit trail (filterable client component, data passed in from the server) |
| `/benchmarks/polymarket/methodology` | Pipeline, three-oracle breakdown, three categories, open questions |
| `/benchmarks/polymarket/markets/[slug]` | Per-market detail page (server-rendered on demand) |
| `/benchmarks/sources-bench` | Sources benchmark — working vs blocked, by category, with failure reason |
| `/api/benchmarks/[slug]/markets` | JSON download of all markets for the benchmark |
| `/about` | About + repo pointer |

`/benchmarks` 308-redirects to `/`. `/benchmarks/polymarket/{drilldown,domains}` 308-redirect to the explorer.

## Deploy

Vercel:
- Root directory: `apps/web`
- Framework preset: Next.js
- Build command: `pnpm build`
- Install command: leave default (Vercel auto-detects `pnpm-workspace.yaml` at repo root and runs `pnpm install`)
- Node: 20+
- Env: `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` / `DATABASE_URL` are auto-injected by the Neon Marketplace integration (Production + Preview). For local dev, `vercel env pull` once.
