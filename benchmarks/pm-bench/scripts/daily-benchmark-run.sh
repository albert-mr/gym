#!/bin/bash
# daily-benchmark-run.sh
# One-shot daily benchmark: poll → analyze → poll-closed → rebuild app.* layer.
# All writes go to Postgres (Vercel/Neon). No files are produced.
#
# Requires apps/web/.env.local with POSTGRES_URL_NON_POOLING (run `vercel env pull`).
#
# Usage:  bash scripts/daily-benchmark-run.sh
#   Optionally:  DATE=2026-05-15 bash scripts/daily-benchmark-run.sh

set -euo pipefail
cd "$(dirname "$0")/.."

DATE="${DATE:-$(date -u +%Y-%m-%d)}"
echo "=== Daily benchmark run for $DATE (24h horizon) ==="

echo "--- poll ---"
npm run poll -- --date "$DATE"

echo "--- analyze ---"
npm run analyze -- --date "$DATE"

echo "--- poll-closed (outcomes for $DATE) ---"
node scripts/poll-closed.mjs "$DATE" "$DATE"

echo "--- rebuild app.* from raw.* ---"
# rebuild-app fully rebuilds app.* from whatever's currently in raw.*. Running it daily
# is the right behaviour once the pipeline has been writing into raw for a couple of weeks
# (so the historic window is represented). Until then, raw only covers the dates that have
# completed a full poll → analyze cycle in the new schema. If you'd rather hold the legacy
# aggregates (from the one-time latest.json seed) and only top up the dates that ran today,
# comment this line out and refresh app.per_day manually for the new date.
node scripts/rebuild-app.mjs

echo "=== DONE for $DATE ==="
