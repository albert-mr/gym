#!/usr/bin/env bash
# migrate-all.sh — one-shot backfill of Postgres from existing JSONL/JSON.
# Idempotent: safe to re-run.
#
# Usage:
#   bash benchmarks/pm-bench/scripts/migrate/migrate-all.sh
#
# Requires apps/web/.env.local with POSTGRES_URL_NON_POOLING set (vercel env pull).

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"

echo "=== 01: raw.markets + raw.market_observations ==="
node "$HERE/01-load-raw-markets.mjs"

echo "=== 02: raw.market_outcomes ==="
node "$HERE/02-load-raw-outcomes.mjs"

echo "=== 03: raw.gate_evaluations ==="
node "$HERE/03-load-raw-gates.mjs"

echo "=== 04: raw.studio_deploys ==="
node "$HERE/04-load-raw-studio.mjs"

echo "=== 05: app.* (from latest.json, one-time seed) ==="
node "$HERE/05-rebuild-app.mjs"

echo "=== 06: app.* (from raw, verify rebuild logic works) ==="
node "$HERE/../rebuild-app.mjs"

echo "=== done ==="
