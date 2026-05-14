# CLAUDE.md — agent guidance for GenLayer Gym

This file is read by AI coding agents working on this repo. Keep it short and current.

## What this repo is

**GenLayer Gym** — open benchmarks for the GenLayer ecosystem. Tagline: *Where we measure what GenLayer can do.*

Public surface: `gym.genlayer.foundation` (forthcoming). The `apps/web/` Next.js app deploys to Vercel. Each `benchmarks/<name>/` folder owns a daily pipeline that writes into **Vercel Postgres (Neon)**. The dashboard reads from Postgres at runtime via React Server Components — no JSON files are used as a data source anywhere in the repo.

## Layout

```
apps/web/                       Next.js 15 dashboard (shadcn/ui, Tailwind, TypeScript strict)
  lib/db/                       Drizzle ORM client + schema (raw.* and app.*)
  lib/queries/                  Server-side query helpers used by RSC pages
  drizzle/migrations/           Generated SQL migrations
  app/api/benchmarks/[slug]/
    markets/route.ts            JSON download endpoint backed by Postgres
benchmarks/
  pm-bench/                     Polymarket benchmark (LIVE)
    src/cli/poll.ts             daily poll → raw.markets + raw.market_observations
    src/cli/analyze.ts          gate-1 classifier → raw.gate_evaluations
    src/lib/db-writers.mjs      shared postgres.js writers (used by .ts and .mjs scripts)
    scripts/poll-closed.mjs     resolution outcomes → raw.market_outcomes
    scripts/rebuild-app.mjs     raw.* → app.* (replaces legacy build-data-json.mjs)
    scripts/daily-benchmark-run.sh   orchestrator (poll → analyze → poll-closed → rebuild-app)
    scripts/cross-day-classify.mjs   exports classifyMarket() used by rebuild-app
    scripts/migrate/            one-time backfill scripts (raw.* + app.* from old JSONL)
tools/
  genvm-webdriver/              Vendored validator-equivalent fetcher
drizzle.config.ts               Drizzle Kit config (multi-schema: raw, app)
```

## Database

- **Host**: Vercel Postgres / Neon. Project `kumbags-projects/gym-web`.
- **Two schemas**: `raw.*` is the immutable polling log (markets, observations, outcomes, gate evaluations, Studio deploys); `app.*` holds derived dashboard tables (benchmark_meta, per_day, markets, templates, domains, bucket_styles, onchain_feed_stats).
- **Local env**: `apps/web/.env.local` contains the Postgres connection strings. Refresh with `vercel env pull apps/web/.env.local --environment=production` (Neon stores its vars on Production/Preview by default). The file is gitignored.
- **Two clients**:
  - Server-side dashboard reads (`apps/web/lib/db/client.ts`) use `@neondatabase/serverless` over HTTP — edge-friendly, pooled.
  - Pipeline scripts (`benchmarks/pm-bench/src/lib/db-writers.mjs`) use `postgres.js` over a direct connection — better for bulk INSERTs.
- **Migrations**: `pnpm db:generate` (drizzle-kit), `pnpm db:migrate` (apply). Schema changes go through Drizzle — never hand-edit applied SQL.

## Headline framing — important

The Polymarket benchmark headline is **forward-looking inference**: GenLayer has been Studio-verified end-to-end on representative markets per source family; we claim all markets on those families would resolve the same way. It's a model of what GenLayer can do, grounded in real Studio runs — not a record of every market individually executed.

Public copy on the dashboard should:
- Say **GenLayer can resolve X%** (forward-looking capability) — not "GenLayer resolved" (past-tense fact).
- Don't reintroduce a time window in user-facing copy (no "24 hours", "24-hour markets", "next 24 hours", "resolving today"). The benchmark window is implicit in "cumulative since {start date}" — don't restate it.
- Use display name **"Polymarket benchmark"**, not "pm-bench" (the latter is the codebase slug).
- Use **"Direct source / Alternative source / Currently unresolvable"** for the three top-level categories.
- Methodology page is the place for nuance; headline pages stay clean.

## Editing the dashboard copy

- Hero headline: `apps/web/app/page.tsx`
- Per-benchmark headline component: `apps/web/components/HeadlineCard.tsx`
- Bucket display labels and colours: `BUCKET_LABELS` / `BUCKET_COLORS` in `benchmarks/pm-bench/scripts/rebuild-app.mjs`. Rebuilding the app layer (next bullet) is what propagates these into `app.bucket_styles`.
- Per-day table: `apps/web/components/PerDayTable.tsx`
- Methodology page copy: `apps/web/app/benchmarks/polymarket/methodology/page.tsx`

After changing labels, re-derive: `node benchmarks/pm-bench/scripts/rebuild-app.mjs`.

## Common workflows

```bash
# Daily refresh (manual; cron will automate this)
bash benchmarks/pm-bench/scripts/daily-benchmark-run.sh   # poll → analyze → poll-closed → rebuild-app

# Dashboard
pnpm --filter @gym/web dev              # http://localhost:3000
pnpm --filter @gym/web build
pnpm --filter @gym/web typecheck

# DB
pnpm db:generate                        # generate a new migration from schema/*.ts
pnpm db:migrate                         # apply pending migrations to the live DB
pnpm db:studio                          # browse rows in Drizzle Studio

# Ad-hoc classification (reads raw.gate_evaluations + raw.markets from Postgres)
node benchmarks/pm-bench/scripts/rebuild-app.mjs --start 2026-05-06 --end 2026-05-13
```

## Naming conventions

- **In code / URLs**: `pm-bench`, `sources-bench` (lowercase, kebab, stable identifiers)
- **In UI**: "Polymarket benchmark", "Sources benchmark"
- **Brand**: "GenLayer Gym" (always; never just "gym" in user-facing copy)
- **Tagline**: "where we measure what GenLayer can do"

## What NOT to do

- Don't use emojis anywhere in user-facing copy or commit messages (user preference).
- Don't claim per-market accuracy without running the accuracy backtest. Forward-looking inference is the current ceiling.
- Don't change `pm-bench` → something else in the codebase folder names; they're stable. Display rename only.
- Don't add chart libraries without need; inline SVG is enough.
- Don't reintroduce committed JSON/JSONL as a data source. Postgres is the source of truth. If you need a downloadable JSON view, expose an API route under `apps/web/app/api/...` that streams from the DB (see `app/api/benchmarks/[slug]/markets/route.ts`).
- Don't hand-edit applied Drizzle migrations. Always: change schema in `apps/web/lib/db/schema/*.ts`, run `pnpm db:generate`, commit the new SQL, run `pnpm db:migrate`.

## Workflow expectations

- Plan substantive changes via `/office-hours` before coding. The user expects narrative + naming + design decisions to be locked before implementation.
- After significant changes, run `codex exec` for an independent review (the user requested this in the redesign session).
- For new benchmarks, add a row to `app.benchmark_meta` (status `live` or `coming_soon`) and follow the data contract in `apps/web/lib/types.ts > BenchmarkData`. The dashboard queries derive everything from `app.*`.

## Open work

- Vercel deploy + custom domain
- GitHub Action for daily refresh (cron triggers `daily-benchmark-run.sh`, which now writes straight to Postgres — no commit step required)
- Sources benchmark: stub → real
- Accuracy backtest (replay closed markets through a local LLM, compare to Polymarket outcome) — this turns the routability claim into an accuracy claim. Biggest research milestone next.
- Retire the auxiliary scripts that still expect JSONL on disk (`scripts/regen-all-jsonl.mjs`, `scripts/list-hard-residual.mjs`, `scripts/benchmark-snapshot.mjs`, `src/cli/sample.ts`, `src/cli/fetch-probe.ts`, `src/cli/daily-report.ts`) — they're broken after the data dirs were removed; replace each with a DB-reading version as needed.
