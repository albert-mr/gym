#!/bin/bash
# daily-benchmark-run.sh
# One-shot daily benchmark: poll → analyze → snapshot for both 24h and 30-day horizons.
# Designed to be run by cron once per day.
#
# Usage:  bash scripts/daily-benchmark-run.sh
#   Optionally:  DATE=2026-05-10 bash scripts/daily-benchmark-run.sh

set -euo pipefail
cd "$(dirname "$0")/.."

DATE="${DATE:-$(date -u +%Y-%m-%d)}"
echo "=== Daily benchmark run for $DATE ==="
echo

# 24h horizon (operational)
echo "--- 24h-horizon poll ---"
npm run poll -- --date "$DATE" >/dev/null 2>&1
npm run analyze >/dev/null 2>&1
node scripts/benchmark-snapshot.mjs "$DATE" 24

# 30-day horizon (academic)
echo
echo "--- 30-day-horizon poll ---"
npm run poll -- --date "$DATE" --horizon-hours 720 --out-dir data/markets-30d >/dev/null 2>&1
npm run analyze -- --in "data/markets-30d/$DATE/all.jsonl" --out-dir "data/markets-30d/$DATE" >/dev/null 2>&1
# Update the symlink for classifier
ln -sf "../markets-30d/$DATE" "data/markets/${DATE}-30d"
node scripts/benchmark-snapshot.mjs "$DATE" 720

echo
echo "=== DONE for $DATE ==="
echo "Snapshots: $(wc -l < data/benchmark-daily/snapshots.jsonl) total rows"
echo "Lifetime domains seen: $(python3 -c "import json; print(len(json.load(open('data/benchmark-daily/domains-seen.json'))))")"
