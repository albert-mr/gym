# 2026-05-12 hard-bucket residual — cluster analysis

Universe re-poll window: `[2026-05-12T09:08:12Z, 2026-05-13T09:08:12Z]` (the live `polled_at_min` ± 24h). Re-poll covers 7,515 closed events vs. 6,101 in the original live `closed=false` poll — different but overlapping windows. Gate-1 drops 2,772 (2,730 Chainlink + 42 Pyth). Hard bucket = 88 markets (vs. 76 in the original snapshot — same families, broader window).

Source: `list-hard-residual.mjs` against `gamma-api.polymarket.com/events?closed=true`.

## Cluster breakdown

| Host | Markets | % of residual | Notes |
| --- | ---: | ---: | --- |
| `x.com` | 72 | 82% | Tweet-count markets for public figures. Studio web.render gets the X login wall. |
| `www.espncricinfo.com` | 12 | 14% | IPL cricket prop markets. Akamai-blocked from Studio (memory: same backend as ESPN cricket). |
| `seekingalpha.com` | 2 | 2% | Quarterly earnings beat/miss markets (eToro, Under Armour). Paywall. |
| `farside.co.uk` | 2 | 2% | ETF flows (BTC, ETH) — currently HARD; routing TBD. |
| **TOTAL** | **88** | **100%** | |

## Event-title breakdown (top 15)

| Markets | Event |
| ---: | --- |
| 26 | Elon Musk # tweets May 5 - May 12, 2026? |
| 13 | Khamenei # posts May 5 - May 12, 2026? |
| 11 | White House # posts May 5 - May 12, 2026? |
| 11 | NYC Mayor # posts May 5 - May 12, 2026? |
| 11 | Zelenskyy # posts May 5 - May 12, 2026? |
| 3 | IPL: Delhi Capitals vs Chennai Super Kings |
| 3 | IPL: Delhi Capitals vs Chennai Super Kings - Toss Match Double |
| 3 | IPL: Delhi Capitals vs Chennai Super Kings - Most Sixes |
| 3 | IPL: Delhi Capitals vs Chennai Super Kings - Team Top Batter |
| 1 | Will eToro (ETOR) beat quarterly earnings? |
| 1 | Will Under Armour (UAA) beat quarterly earnings? |
| 1 | Bitcoin ETF Flows on May 12? |
| 1 | Ethereum ETF Flows on May 12? |

## Strategic shape

This is not 88 individual probes. It's **4 strategic decisions**:

1. **Twitter/X tweet counts (72 markets, 82%)** — One decision routes most of the residual.
2. **IPL cricket via espncricinfo (12 markets, 14%)** — One alt-source decision routes 14%.
3. **Earnings beats via Seeking Alpha (2 markets)** — Either find a public alt or leave as `hard`.
4. **ETF flows via Farside (2 markets)** — Either confirm Farside actually works or find an alt.

Resolve these four and the 05-12 `hard` bucket goes to 0.
