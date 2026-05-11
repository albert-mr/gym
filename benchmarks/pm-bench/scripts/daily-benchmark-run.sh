#!/bin/bash
# daily-benchmark-run.sh
# One-shot daily benchmark: poll → analyze → snapshot for the 24h-resolving market window.
# Designed to be run by cron once per day.
#
# Scope: ONLY markets ending in the next 24 hours. We do not poll long-term markets
# (30-day or all-open) because we measure routability day-by-day, not on a long-tail
# universe we have no operational rights on yet.
#
# Usage:  bash scripts/daily-benchmark-run.sh
#   Optionally:  DATE=2026-05-10 bash scripts/daily-benchmark-run.sh

set -euo pipefail
cd "$(dirname "$0")/.."

DATE="${DATE:-$(date -u +%Y-%m-%d)}"
echo "=== Daily benchmark run for $DATE (24h horizon) ==="
echo

npm run poll -- --date "$DATE" >/dev/null 2>&1
npm run analyze >/dev/null 2>&1
node scripts/benchmark-snapshot.mjs "$DATE" 24

echo
echo "=== DONE for $DATE ==="
echo "Snapshots: $(wc -l < data/benchmark-daily/snapshots.jsonl) total rows"
echo "Lifetime domains seen: $(python3 -c "import json; print(len(json.load(open('data/benchmark-daily/domains-seen.json'))))")"
