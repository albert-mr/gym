# Polymarket benchmark (`pm-bench`)

Daily measurement of what fraction of Polymarket's near-term market universe can be resolved by GenLayer's intelligent oracle.

The dashboard for this benchmark is at `/benchmarks/polymarket` in [@gym/web](../../apps/web). This folder holds the pipeline that produces the data that dashboard reads.

## What it measures

Headline: **GenLayer can resolve X% of Polymarket markets resolving in the next 24 hours.**

We poll Polymarket once a day, keep only markets resolving in the next 24h, drop the ones served by deterministic on-chain oracles (Chainlink, Pyth), and classify the remainder by where the resolution data lives. Categories:

- **Direct source** — the host named in Polymarket's resolution criteria is what GenLayer fetches (the URL as-is, or a deeper page on the same host)
- **Alternative source** — the named host isn't reachable from validator infrastructure (Cloudflare-walled, JS-only, geo-blocked); we route to a Studio-verified alternate (LaLiga → ESPN, HLTV → Liquipedia, eurovision.tv → Wikipedia, etc.)
- **Currently unresolvable** — paywall, login wall, captcha, or pure-consensus subjective markets with no canonical source

The headline number is **forward-looking inference**: GenLayer has been Studio-verified end-to-end on representative markets per source family; we claim all markets on those families would resolve the same way. The methodology page on the dashboard lays out the three verification levels in detail.

See [BENCHMARK-METHODOLOGY.md](./BENCHMARK-METHODOLOGY.md) for the full methodology, the gate funnel, and the defensible phrasing.

## Daily pipeline

```bash
# from benchmarks/pm-bench/
pnpm poll                                # poll Polymarket gamma-api → data/markets/<date>/all.jsonl
pnpm analyze                             # classify gates → data/markets/<date>/gate1-pass.jsonl, snapshot.md
node scripts/poll-closed.mjs             # fetch resolution outcomes → data/markets/closed-index.jsonl
node scripts/build-data-json.mjs         # emit ../../data/pm-bench/latest.json (the dashboard input)
```

`scripts/daily-benchmark-run.sh` wraps poll + analyze + snapshot for cron.

## Active scripts

| Script | Purpose |
|---|---|
| `scripts/cross-day-classify.mjs` | Authoritative classifier. Imports `classifyMarket()` consumed by the data builder. Run directly to print per-day bucket counts. |
| `scripts/build-data-json.mjs` | Emits `data/pm-bench/{window}.json` + `latest.json` for the dashboard. |
| `scripts/lib/hierarchy.mjs` | Derives the L1 → L2 → L3 category path + question template signature for each market. |
| `scripts/poll-closed.mjs` | Re-polls Polymarket for already-closed markets so we know which way each one settled. |
| `scripts/benchmark-snapshot.mjs` | Records one day's bucket counts to the rolling stability series. |
| `scripts/stability-report.mjs` | Prints mean/stdev/CI from the stability series once 14+ days are recorded. |
| `scripts/daily-benchmark-run.sh` | Cron entrypoint: poll → analyze → snapshot for today. |

## Data layout

| Path | What |
|---|---|
| `data/markets/<date>/all.jsonl` | Raw daily poll, one row per market. |
| `data/markets/<date>/gate1-pass.jsonl` | After dropping Chainlink/Pyth/no-URL markets. |
| `data/markets/<date>/closed.jsonl` | Per-day re-poll of closed events with their resolution outcomes. |
| `data/markets/closed-index.jsonl` | Global id→winner index across the window. |
| `data/markets/<date>/snapshot.md` | Human-readable daily summary. |
| `data/markets/<date>/summary.json` | Machine-readable funnel counts for the day. |
| `data/benchmark-daily/snapshots.jsonl` | Rolling cross-day stability series. |
| `data/benchmark-daily/domains-seen.json` | Lifetime set of every host we've seen in `eventResolutionSource`. |
| `../../data/pm-bench/latest.json` | Emitted by `build-data-json.mjs`; consumed by the dashboard. |

## Contributing

See repo-root [CONTRIBUTING.md](../../CONTRIBUTING.md) for the data contract and conventions.
