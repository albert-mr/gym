# pm-bench snapshot — 2026-05-11

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 6,080 |
| Unique markets (by id) | 6,080 |
| Unique events (Polymarket grouping) | 3,272 |
| Unique templates (digits stripped, trimmed at first ` - `) | 324 |
| polled_at min | 2026-05-08T09:16:54.132Z |
| polled_at max | 2026-05-08T09:16:54.132Z |
| endDate min | 2026-05-08T09:20:00Z |
| endDate max | 2026-05-09T09:15:00Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +6,080 | 6,080 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,723 | 3,357 | 55.2% |
| Drop: Pyth Network (Gate 1c) | -237 | 3,120 | 51.3% |
| Drop: no URL anywhere (Gate 1b) | -0 | 3,120 | 51.3% |

**Post-Gate-1 (IO-addressable): 3,120 markets / 281 unique templates.**
**Gate 1 dropped: 2,723 Chainlink-fed + 0 with no URL anywhere = 2,960 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 2,352 | 38.7% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 3,120 | 51.3% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 768 | 24.6% |
| Non-recurring (true one-off) | 2,352 | 75.4% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Esports match | 1,067 | 34.2% | 76 | 76 | 0 | IO-shaped |
| Sports match | 881 | 28.2% | 66 | 131 | 0 | IO-shaped |
| Weather forecast | 440 | 14.1% | 58 | 58 | 433 | IO-shaped |
| News / other | 306 | 9.8% | 33 | 33 | 116 | IO-shaped |
| Crypto price feed | 229 | 7.3% | 28 | 189 | 219 | deterministic feed (IO not useful) |
| Stock close threshold | 167 | 5.4% | 19 | 19 | 0 | deterministic feed (IO not useful) |
| Election / political | 30 | 1.0% | 1 | 1 | 0 | IO-shaped |

**Truly IO-shaped (drop deterministic feeds): 2,724 markets / 234 unique templates.**

### Top 3 templates per kind

- **Esports match** — `LoL: T# vs DN SOOPers (BO#)` (57), `Dota #: Nigma Galaxy vs PlayTime (BO#)` (45), `Dota #: Tundra Esports vs #win (BO#)` (44)
- **Sports match** — `BV Borussia # Dortmund vs. Eintracht Frankfurt` (66), `Racing Club de Lens vs. FC Nantes` (61), `Torino FC vs. US Sassuolo Calcio` (48)
- **Weather forecast** — `Lowest temperature in Hong Kong on May #?` (11), `Highest temperature in London on May #?` (11), `Highest temperature in Paris on May #?` (11)
- **News / other** — `Elon Musk # tweets May #` (18), `What price will Bitcoin hit on May #?` (16), `What price will Ethereum hit on May #?` (14)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)
- **Stock close threshold** — `Will Apple (AAPL) finish week of May # above___?` (13), `Will Microsoft (MSFT) finish week of May # above___?` (13), `Will Amazon (AMZN) finish week of May # above___?` (13)
- **Election / political** — `Farrer By-Election Winner` (30)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,723 / 6,080 (44.8%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 0 / 6,080 (0.0%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,723 | 44.8% |
| `www.twitch.tv` | 509 | 8.4% |
| `www.wunderground.com` | 400 | 6.6% |
| `kick.com` | 374 | 6.2% |
| `(empty)` | 356 | 5.9% |
| `pythdata.app` | 237 | 3.9% |
| `www.binance.com` | 175 | 2.9% |
| `finance.yahoo.com` | 165 | 2.7% |
| `www.dotabuff.com` | 131 | 2.2% |
| `www.legaserieb.it` | 120 | 2.0% |
| `www.bundesliga.com` | 90 | 1.5% |
| `www.jleague.jp` | 84 | 1.4% |
| `x.com` | 65 | 1.1% |
| `www.ligue1.com` | 61 | 1.0% |
| `www.youtube.com` | 57 | 0.9% |
| `www.laliga.com` | 53 | 0.9% |
| `www.efa.com.eg` | 48 | 0.8% |
| `www.legaseriea.it` | 48 | 0.8% |
| `www.nba.com` | 40 | 0.7% |
| `upl.ua` | 36 | 0.6% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `hide-from-new` | 4,014 | 66.0% |
| `recurring` | 3,491 | 57.4% |
| `crypto` | 3,058 | 50.3% |
| `crypto-prices` | 3,056 | 50.3% |
| `up-or-down` | 2,949 | 48.5% |
| `5M` | 2,009 | 33.0% |
| `sports` | 1,948 | 32.0% |
| `games` | 1,942 | 31.9% |
| `esports` | 1,120 | 18.4% |
| `soccer` | 766 | 12.6% |
| `15M` | 672 | 11.1% |
| `rewards-automation-50-4pt5-50` | 573 | 9.4% |
| `finance` | 523 | 8.6% |
| `weekly` | 523 | 8.6% |
| `equities` | 464 | 7.6% |
| `bitcoin` | 463 | 7.6% |
| `stocks` | 462 | 7.6% |
| `ethereum` | 461 | 7.6% |
| `solana` | 446 | 7.3% |
| `xrp` | 446 | 7.3% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| Dogecoin Up or Down | 413 | 6.8% |
| Solana Up or Down | 413 | 6.8% |
| BNB Up or Down | 413 | 6.8% |
| Ethereum Up or Down | 413 | 6.8% |
| Bitcoin Up or Down | 413 | 6.8% |
| XRP Up or Down | 413 | 6.8% |
| Hyperliquid Up or Down | 389 | 6.4% |
| BV Borussia # Dortmund vs. Eintracht Frankfurt | 66 | 1.1% |
| Racing Club de Lens vs. FC Nantes | 61 | 1.0% |
| LoL: T# vs DN SOOPers (BO#) | 57 | 0.9% |
| Torino FC vs. US Sassuolo Calcio | 48 | 0.8% |
| Dota #: Nigma Galaxy vs PlayTime (BO#) | 45 | 0.7% |
| Dota #: Tundra Esports vs #win (BO#) | 44 | 0.7% |
| Dota #: Yellow Submarine vs REKONIX (BO#) | 43 | 0.7% |
| Dota #: PARIVISION vs L#ga Team (BO#) | 42 | 0.7% |
| Levante UD vs. CA Osasuna | 41 | 0.7% |
| Knicks vs. #ers | 40 | 0.7% |
| LoL: Ultra Prime vs LNG Esports (BO#) | 39 | 0.6% |
| LoL: GMBLERS ESPORTS vs Zena Esports (BO#) | 39 | 0.6% |
| LoL: Kiwoom DRX vs Gen.G (BO#) | 37 | 0.6% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +0h | 151 | ███████ |
| +1h | 130 | ██████ |
| +2h | 606 | ██████████████████████████ |
| +3h | 209 | █████████ |
| +4h | 209 | █████████ |
| +5h | 318 | ██████████████ |
| +6h | 364 | ████████████████ |
| +7h | 233 | ██████████ |
| +8h | 294 | █████████████ |
| +9h | 524 | ███████████████████████ |
| +10h | 695 | ██████████████████████████████ |
| +11h | 261 | ███████████ |
| +12h | 189 | ████████ |
| +13h | 256 | ███████████ |
| +14h | 268 | ████████████ |
| +15h | 145 | ██████ |
| +16h | 149 | ██████ |
| +17h | 148 | ██████ |
| +18h | 196 | ████████ |
| +19h | 194 | ████████ |
| +20h | 136 | ██████ |
| +21h | 131 | ██████ |
| +22h | 150 | ██████ |
| +23h | 124 | █████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 6,080 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
