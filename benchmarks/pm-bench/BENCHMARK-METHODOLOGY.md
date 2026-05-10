# pm-bench: Polymarket Resolution Benchmark Methodology

## Purpose

Quantify what fraction of Polymarket's daily market universe a GenLayer intelligent oracle can resolve end-to-end, with hard evidence per source family.

## Universe definition

Two universes are tracked daily:

1. **24-hour horizon** (operational): markets ending in the next 24 hours. ~6-9k markets/day. Sports + crypto + short-term events. The "what we'd resolve today" headline.

2. **30-day horizon** (academic): markets ending in the next 30 days. ~18-22k markets/day. Includes long-term political, election, geopolitical, season-long, and tournament markets. The "full GenLayer-addressable universe" headline.

Both are polled from `gamma-api.polymarket.com/events`, flattened to per-market rows, and saved as `data/markets[/-30d]/{date}/all.jsonl`.

## Gate funnel (current state)

```
Polled markets (N events × M markets per event)
  ↓ Gate 1 (deterministic, IMPLEMENTED)
  ↓   1a: drop Chainlink-bound (eventResolutionSource startsWith chain.link/reference.chainlink.com)
  ↓   1b: drop no-URL (no http(s):// in eventResolutionSource OR description)
gate1-pass.jsonl (the addressable universe)
  ↓ Gate 2 (LLM source-adequacy rubric, NOT YET IMPLEMENTED — done by hand via classifier sets)
  ↓ Gate 3 (URL accessibility probe at validator-equivalent infra, NOT YET IMPLEMENTED — done by spot-check Studio deploys)
solvable estimate
```

Gates 2 and 3 are designed in PLAN.md but currently approximated by `scripts/cross-day-classify.mjs` (per-domain heuristic) plus periodic 10-25 market Studio dry-runs.

## Bucket taxonomy

| bucket | how it resolves | example |
|---|---|---|
| `render` | Direct fetch of the binding URL via `gl.nondet.web.render(mode=text, wait=10s)` | wunderground, NHL, UEFA, Apple, weather.gov |
| `alt` | Binding domain isn't directly fetchable; route to a Studio-verified alt URL | bundesliga.com → ESPN ger.1 |
| `api` | JSON endpoint via `gl.nondet.web.get` | Binance, Pyth, OpenDota |
| `liquipedia_recover` | HLTV CS markets (CF-walled) recovered via Liquipedia | tournament winners, handicaps |
| `bo3_recover` | HLTV per-map total kills recovered via bo3.gg | Map 1 Odd/Even Total Kills |
| `frmf_via_flashscore` | Moroccan football recovered via Flashscore Botola page | Botola Pro matches |
| `subjective` | Resolution requires consensus of credible reporting with no canonical source | Trump-tie color, US House primary winners, Iran airspace closure |
| `hard` | Paywall, login wall, captcha, or no recovery path | Yahoo Finance, x.com, sooplive, PressReader |
| `studio_blocked` | Real source exists but Studio's IP is anti-bot blocked AND no alternate | (currently empty after frmf.ma→Flashscore reroute) |
| `misc` | Unclassified domain — needs probe | new league sites we haven't seen yet |

## Subjective detection (`isSubjective`, v6)

A market is subjective if it has consensus phrasing AND any of:
1. Description contains only asset URLs (S3 / polymarket-upload / image extensions)
2. Description has no URLs at all
3. "Resolution source ... will be a consensus of X" — consensus is the mechanism, not fallback
4. "Consensus of [adj] sources, including <URL>" — URL is illustrative
5. Iran-style: "primary resolution sources will be official information from <vague entity> AND a consensus" with URLs in qualifying-example context

NOT subjective: real source pinned (eurovision.tv style) with consensus mentioned only as fallback.

## Studio verification protocol

End-to-end verification deploys an `IntelligentOracle` contract per market to GenLayer Studio (chainId 61999, RPC https://studio.genlayer.com/api), calls `resolve()`, reads back outcome, compares with the deterministically-known expected outcome.

Cumulative Studio-verified markets across May 7-10 sessions: 108
- 54/54 binding-render (May 7)
- 8/16 ALT bucket (May 9 — SofaScore IP-block discovered)
- 7/8 next-batch (May 9 — NBA boxscore + binding-render recoveries)
- 15/15 May 10 (3 new ESPN leagues + commentary URL + Liquipedia + bo3.gg + Flashscore Botola)
- 8 probe contracts (route verification)

Effective Studio match rate after rerouting decisions: 100/108 = 92.6%. The 8 misses were all SofaScore IP-blocks (recoverable via reroute).

## Operational findings (must-knows for the production pipeline)

1. **SofaScore returns HTTP 403** to GenLayer Studio web.render IPs. Local genvm-webdriver works fine — different IP. For SofaScore-routed leagues with ESPN coverage, use ESPN. For others (Slovak, Ukrainian, Korean K-League, Croatian) use direct binding render. Moroccan rerouted to Flashscore Botola.

2. **ESPN scoreboards REQUIRE `mode=text` + 10s wait**. mode=html captures JS bundle pre-hydration with no real scores (just CSS hex values that look like scores, e.g., `043-0`).

3. **ESPN commentary URL** (`/soccer/commentary/_/gameId/<id>`) covers per-match props (HT/FT, scorers, corners, cards). Game IDs resolved via `site.api.espn.com/apis/site/v2/sports/soccer/<league>/scoreboard?dates=YYYYMMDD`.

4. **Liquipedia + Studio**: must use mode=text (not mode=html). 10s wait. Renders post-hydration.

5. **Streaming-platform rebind**: 100% of markets bound to twitch/kick/youtube have a "official information from <URL>" pattern in the description that identifies the real data source (gol.gg, hltv, liquipedia, dotabuff, vlr.gg, bo3.gg). Verified across 4 days, 0 misses.

6. **Contract gotcha**: `rules` constructor arg cannot be empty array. Fall back to `[description]` if no rule sentences extracted.

7. **genlayer-cli string-arg quirk**: digit-only strings get auto-coerced to int. Prefix `market_id` with `m_` to keep as string.

## Failure-decode recipe (validator result)

When a Studio resolve transaction completes but contract state shows empty outcome:

```bash
TX=<resolve_tx_hash>
curl -sX POST -H 'Content-Type: application/json' \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionByHash\",\"params\":[\"$TX\"],\"id\":1}" \
  https://studio.genlayer.com/api | python3 -c "
import json, sys, base64
d = json.load(sys.stdin)
v = d['result']['consensus_data']['validators'][0]
raw = base64.b64decode(v['result'])
print(raw.decode('utf-8', 'replace'))
"
```

First byte is a status marker; the rest is a UTF-8 error message including the original Python exception.

## Cross-day stability tracking

Daily: `bash scripts/daily-benchmark-run.sh` (poll → analyze → snapshot, both horizons).

Snapshots accumulate in `data/benchmark-daily/snapshots.jsonl` with universe size, per-bucket counts, solve %, and new-domain emergence. After 14+ days, `node scripts/stability-report.mjs` prints mean/stdev/95% CI per metric.

Convergence criterion: when `new_domains_count` is 0 for 5 consecutive days, the classifier is considered domain-complete. After that, any solve % change is purely a market-mix or methodology effect.

## Honest claims

- "The pm-bench classifier estimates that **X%** of Polymarket's `<horizon>`-market universe is resolvable end-to-end via GenLayer's intelligent oracle, based on per-domain routing inferred from N Studio dry-runs across the May 7-10 development window."

NOT defensible without further work:
- "GenLayer resolves X% of all Polymarket" without specifying horizon
- "X%" without confidence interval (need cross-day stability data)
- "X%" without acknowledging that ~98% is Studio-inferred from per-source-family probes, not directly tested per market

## Files in this benchmark

- `scripts/cross-day-classify.mjs` — bucket classifier (current authoritative)
- `scripts/list-alt-bucket.mjs` — per-domain alt-source recommendations
- `scripts/benchmark-snapshot.mjs` — record one daily snapshot
- `scripts/stability-report.mjs` — print mean/stdev/CI from snapshots
- `scripts/daily-benchmark-run.sh` — orchestrator (poll → analyze → snapshot, both horizons)
- `scripts/deploy-{alt,next,may10}-oracles.mjs` — Studio deploy runners
- `contracts/intelligent_oracle.py` — IntelligentOracle reference contract (mode=text, 10s wait)
- `data/benchmark-daily/snapshots.jsonl` — cross-day series
- `data/benchmark-daily/domains-seen.json` — lifetime domain set
- `data/markets/{date}/` — daily 24h-horizon poll + analyze artifacts
- `data/markets-30d/{date}/` — daily 30-day-horizon poll + analyze artifacts
