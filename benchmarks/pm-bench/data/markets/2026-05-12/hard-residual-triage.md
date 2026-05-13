# 2026-05-12 hard-residual triage (WebSearch-first)

Triage of the 88 hard-bucket markets identified by `list-hard-residual.mjs`. Cluster summary in `hard-residual-clusters.md`.

## Cluster 1 — x.com tweet counts (72 markets, 82%)

**Sample market**: `2136876 — Will White House post 0-19 posts from May 5 to May 12, 2026?`
- `resolutionSource`: `https://x.com/WhiteHouse`
- **Key description excerpt**: *"The resolution source for this market is the 'Post Counter' figure for posts found at https://xtracker.polymarket.com. Individual posts can be viewed by clicking 'Export Data'. If the tracker does not update correctly in accordance with the rules, X itself may be used as a secondary resolution source."*

**Verdict**: `ROUTABLE_VIA_REBIND` — the actual resolution source is `xtracker.polymarket.com`, **which is already in the RENDER set** of `cross-day-classify.mjs` (line 36). The classifier currently misses this because `realBinding()` reads `eventResolutionSource` (x.com) first and only falls through to description URLs when the source is a STREAMING host. x.com is not in STREAMING, so x.com sticks.

**Action**: extend `realBinding()` to prefer `xtracker.polymarket.com` from description when present (regardless of eventResolutionSource). This is the **"xtracker rebind decision (parked; +0.5% headline if applied)"** referenced in `CLAUDE.md`. Estimated lift is larger than +0.5% — on 2026-05-12 alone it moves 72/88 hard markets to RENDER (+2.2% on that day; smaller % impact at the 7-day window level but consistent).

**No Studio probe needed** — xtracker is already verified RENDER-routable.

## Cluster 2 — IPL cricket via espncricinfo (12 markets, 14%)

**Sample market**: `2141144 — Indian Premier League: Delhi Capitals vs Chennai Super Kings`
- `resolutionSource`: `https://www.espncricinfo.com/`
- **Key description excerpt**: *"The primary resolution source for this market is the official statistics of the event as recognized by the governing body or event organizers. However, if the governing body or event organizers have not published final match statistics within 2 hours after the event's conclusion, a consensus of credible reporting may be used instead."*

**Verdict**: `NOVEL_CANDIDATE` — the primary source is "governing body" (the IPL → `iplt20.com`), not espncricinfo. espncricinfo is Akamai-blocked per memory (`project_pm_bench_full_alt_matrix.md`). Real binding should be `iplt20.com` for IPL markets.

**WebSearch confirmation**: `iplt20.com` publishes per-match scorecards (e.g., `iplt20.com/matches/...`). ESPN.com cricket (espn.com/cricket/series/...) is also a candidate but likely same Akamai backend.

**Action**: Studio-probe `www.iplt20.com` to confirm `web.render + wait_after_loaded="8s"` returns usable scorecards. If yes, add `CRICINFO_REROUTED = new Set(['www.espncricinfo.com'])` with `rebindHost:'www.iplt20.com'`, parallel to `FRMF_REROUTED`. Plus add to verdicts.jsonl seed.

## Cluster 3 — Seeking Alpha earnings beat/miss (2 markets, 2%)

**Sample market**: `2110080 — Will eToro (ETOR) beat quarterly earnings?`
- `resolutionSource`: `https://seekingalpha.com/`
- **Key description excerpt**: *"The resolution source will be the GAAP EPS listed in the company's official earnings documents. If eToro releases earnings without GAAP EPS, then the market will resolve according to the GAAP EPS figure reported by SeekingAlpha."*

**Verdict**: `MIXED` — primary source is the company's own earnings press release (varies per company, render-friendly but no fixed domain), fallback is seekingalpha (paywall). Public alternates from WebSearch: `investing.com/earnings`, `chartmill.com`, SEC EDGAR (`sec.gov`), Yahoo Finance earnings calendar.

**Action**: Defer. Each market's primary source is the company-specific IR page — varies per ticker. No single REROUTED set can cover this cluster. Options: (a) add `sec.gov` (EDGAR) to NEW_RENDER for any post-earnings 8-K filing, (b) leave 2 markets as `hard` until skill-based discovery handles them. Recommend (b) for now — 2 markets is tail-noise; build the structural fix into the skill later, not today.

## Cluster 4 — Farside ETF flows (2 markets, 2%)

**Sample market**: `2188915 — Bitcoin ETF Flows on May 12?`
- `resolutionSource`: `https://farside.co.uk/btc/`
- **Key description excerpt**: *"The resolution source is Farside Investors, specifically the ETF Flow tab available at https://farside.co.uk/btc/ in the 'Total' column for the date specified in the title."*

**Verdict**: `UNVERIFIED_HARD` — farside.co.uk is the explicit, only-listed primary source. It's in HARD set (line 98 of `cross-day-classify.mjs`), but the classifier comment doesn't say why. Memory has no entry. Possible reasons: rendered via JS, geo-blocked, Cloudflare-walled.

**Action**: Studio-probe `farside.co.uk/btc/` with `web.render + wait_after_loaded="8s"` to check whether it actually fails or whether it's stale-tagged HARD. If render works, move `farside.co.uk` from HARD to NEW_RENDER. WebSearch confirms alternate trackers exist (`sosovalue.com`, `coinglass.com`, `bitbo.io`) if Farside truly fails — but Polymarket pinned Farside specifically, so an alt-source rebind isn't a clean substitute.

## Summary

| Cluster | Markets | Action | Studio cost |
| --- | ---: | --- | --- |
| x.com tweet counts | 72 | Code change: xtracker rebind in `realBinding()` | $0 (already verified) |
| espncricinfo IPL | 12 | Studio-probe `iplt20.com`, add CRICINFO_REROUTED | ~$1-2 |
| Seeking Alpha earnings | 2 | Defer to future skill-based work | $0 |
| Farside ETF flows | 2 | Studio-probe `farside.co.uk/btc/` to verify HARD status | ~$1-2 |
| **TOTAL** | **88** | **Probes:** 2 small | **~$2-4** |

If all four actions land, the 88-market 2026-05-12 residual → 2 markets (just Seeking Alpha). 86 markets (98% of residual) move to solved buckets.

## Decision required before proceeding

1. **Xtracker rebind is parked** per `CLAUDE.md` (memory `pm_bench_full_alt_matrix.md` doesn't address it). Unparking is a code change to `cross-day-classify.mjs` + classifier behavior change. Confirm before editing.
2. **Studio probes for iplt20.com + farside.co.uk** require `genlayer` CLI access and Studio account credit. Confirm before running.
