# CLAUDE.md — agent guidance for GenLayer Gym

This file is read by AI coding agents working on this repo. Keep it short and current.

## What this repo is

**GenLayer Gym** — open benchmarks for the GenLayer ecosystem. Tagline: *Where we measure what GenLayer can do.*

Public surface: `gym.genlayer.foundation` (forthcoming). The `apps/web/` Next.js app deploys to Vercel. The `benchmarks/<name>/` folders hold pipelines that produce daily JSON snapshots committed to `data/<name>/`. The dashboard reads those JSON files at build time. No backend, no DB.

## Layout

```
apps/web/             Next.js 15 dashboard (shadcn/ui, Tailwind, TypeScript strict)
benchmarks/
  pm-bench/           Polymarket benchmark (LIVE) — daily resolution coverage
data/
  pm-bench/           Daily JSON the dashboard reads
tools/
  genvm-webdriver/    Vendored validator-equivalent fetcher
```

## Headline framing — important

The Polymarket benchmark headline is **forward-looking inference**: GenLayer has been Studio-verified end-to-end on representative markets per source family; we claim all markets on those families would resolve the same way. It's a model of what GenLayer can do, grounded in real Studio runs — not a record of every market individually executed.

Public copy on the dashboard should:
- Say **GenLayer can resolve X%** (forward-looking capability) — not "GenLayer resolved" (past-tense fact).
- Use **"Polymarket markets resolving in the next 24 hours"** — never "24-hour markets" (means something else).
- Use display name **"Polymarket benchmark"**, not "pm-bench" (the latter is the codebase slug).
- Use **"Direct source / Alternative source / Currently unresolvable"** for the three top-level categories.
- Methodology page is the place for nuance; headline pages stay clean.

## Editing the dashboard copy

- Hero headline: `apps/web/app/page.tsx`
- Per-benchmark headline component: `apps/web/components/HeadlineCard.tsx`
- Bucket display labels: `benchmarks/pm-bench/scripts/build-data-json.mjs` (`BUCKET_LABELS` const)
- Per-day table: `apps/web/components/PerDayTable.tsx`
- Methodology page copy: `apps/web/app/benchmarks/polymarket/methodology/page.tsx`

After changing labels in `BUCKET_LABELS`, regenerate JSON: `node benchmarks/pm-bench/scripts/build-data-json.mjs`.

## Common workflows

```bash
# Daily refresh (manual; cron will automate this)
bash benchmarks/pm-bench/scripts/daily-benchmark-run.sh   # poll → analyze → snapshot for today
node benchmarks/pm-bench/scripts/poll-closed.mjs          # fetch resolution outcomes
node benchmarks/pm-bench/scripts/build-data-json.mjs      # emit data/pm-bench/latest.json

# Dashboard
pnpm --filter @gym/web dev              # http://localhost:3000
pnpm --filter @gym/web build            # static export
pnpm --filter @gym/web typecheck

# Cross-day classifier (still authoritative for the bucket counts)
node benchmarks/pm-bench/scripts/cross-day-classify.mjs 2026-05-06 2026-05-07 ...
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
- Don't add backend / DB; data lives in committed JSON.

## Workflow expectations

- Plan substantive changes via `/office-hours` before coding. The user expects narrative + naming + design decisions to be locked before implementation.
- After significant changes, run `codex exec` for an independent review (the user requested this in the redesign session).
- Keep `data/<benchmark>/latest.json` committed; it's the source of truth for the dashboard. Do not gitignore it.
- For new benchmarks, follow the data contract in `apps/web/lib/types.ts > BenchmarkData`.

## Open work

- Vercel deploy + custom domain
- GitHub Action for daily refresh (cron → poll → analyze → build JSON → commit → auto-deploy)
- Sources benchmark: stub → real
- Accuracy backtest (replay closed markets through a local LLM, compare to Polymarket outcome) — this turns the routability claim into an accuracy claim. Biggest research milestone next.
- xtracker rebind decision (parked; +0.5% headline if applied)
