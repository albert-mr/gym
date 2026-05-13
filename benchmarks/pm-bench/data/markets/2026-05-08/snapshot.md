# pm-bench snapshot — 2026-05-08

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 7,977 |
| Unique markets (by id) | 7,977 |
| Unique events (Polymarket grouping) | 3,434 |
| Unique templates (digits stripped, trimmed at first ` - `) | 397 |
| polled_at min | 2026-05-08T09:16:54.132Z |
| polled_at max | 2026-05-08T09:16:54.132Z |
| endDate min | 2026-05-01T18:20:00.000Z |
| endDate max | 2026-05-09T09:15:00.000Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +7,977 | 7,977 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,730 | 5,247 | 65.8% |
| Drop: Pyth Network (Gate 1c) | -322 | 4,925 | 61.7% |
| Drop: no URL anywhere (Gate 1b) | -32 | 4,893 | 61.3% |

**Post-Gate-1 (IO-addressable): 4,893 markets / 352 unique templates.**
**Gate 1 dropped: 2,730 Chainlink-fed + 32 with no URL anywhere = 3,084 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 3,449 | 43.2% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 4,893 | 61.3% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 1,444 | 29.5% |
| Non-recurring (true one-off) | 3,449 | 70.5% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sports match | 1,661 | 33.9% | 135 | 238 | 0 | IO-shaped |
| Esports match | 1,258 | 25.7% | 70 | 70 | 0 | IO-shaped |
| News / other | 892 | 18.2% | 39 | 83 | 576 | IO-shaped |
| Weather forecast | 656 | 13.4% | 60 | 60 | 649 | IO-shaped |
| Crypto price feed | 229 | 4.7% | 28 | 189 | 219 | deterministic feed (IO not useful) |
| Stock close threshold | 167 | 3.4% | 19 | 19 | 0 | deterministic feed (IO not useful) |
| Election / political | 30 | 0.6% | 1 | 1 | 0 | IO-shaped |

**Truly IO-shaped (drop deterministic feeds): 4,497 markets / 305 unique templates.**

### Top 3 templates per kind

- **Sports match** — `BV Borussia # Dortmund vs. Eintracht Frankfurt` (66), `Racing Club de Lens vs. FC Nantes` (61), `Torino FC vs. US Sassuolo Calcio` (48)
- **Esports match** — `Dota #: Tundra Esports vs #win (BO#)` (88), `LoL: Ultra Prime vs LNG Esports (BO#)` (77), `Dota #: Yellow Submarine vs REKONIX (BO#)` (75)
- **News / other** — `Bitcoin above ___ on May #, #AM ET?` (120), `Ethereum above ___ on May #, #AM ET?` (120), `Bitcoin above ___ on May #, #PM ET?` (120)
- **Weather forecast** — `Lowest temperature in London on May #?` (11), `Lowest temperature in Paris on May #?` (11), `Lowest temperature in Seoul on May #?` (11)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)
- **Stock close threshold** — `Will Apple (AAPL) finish week of May # above___?` (13), `Will Microsoft (MSFT) finish week of May # above___?` (13), `Will Amazon (AMZN) finish week of May # above___?` (13)
- **Election / political** — `Farrer By-Election Winner` (30)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,730 / 7,977 (34.2%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 32 / 7,977 (0.4%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,730 | 34.2% |
| `www.twitch.tv` | 875 | 11.0% |
| `(empty)` | 868 | 10.9% |
| `www.wunderground.com` | 594 | 7.4% |
| `pythdata.app` | 322 | 4.0% |
| `kick.com` | 307 | 3.8% |
| `www.jleague.jp` | 256 | 3.2% |
| `www.mlb.com` | 200 | 2.5% |
| `www.binance.com` | 175 | 2.2% |
| `www.atptour.com` | 173 | 2.2% |
| `finance.yahoo.com` | 165 | 2.1% |
| `www.legaserieb.it` | 120 | 1.5% |
| `x.com` | 94 | 1.2% |
| `www.kleague.com` | 93 | 1.2% |
| `www.bundesliga.com` | 90 | 1.1% |
| `www.formula1.com` | 86 | 1.1% |
| `www.youtube.com` | 83 | 1.0% |
| `www.ligue1.com` | 61 | 0.8% |
| `www.laliga.com` | 53 | 0.7% |
| `www.espncricinfo.com` | 48 | 0.6% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `hide-from-new` | 4,782 | 59.9% |
| `recurring` | 4,174 | 52.3% |
| `crypto` | 3,525 | 44.2% |
| `crypto-prices` | 3,523 | 44.2% |
| `sports` | 3,037 | 38.1% |
| `games` | 3,005 | 37.7% |
| `up-or-down` | 2,956 | 37.1% |
| `5M` | 2,016 | 25.3% |
| `esports` | 1,314 | 16.5% |
| `soccer` | 1,040 | 13.0% |
| `rewards-automation-50-4pt5-50` | 835 | 10.5% |
| `multi-strikes` | 764 | 9.6% |
| `bitcoin` | 694 | 8.7% |
| `ethereum` | 692 | 8.7% |
| `15M` | 672 | 8.4% |
| `weather` | 656 | 8.2% |
| `daily-temperature` | 649 | 8.1% |
| `1H` | 648 | 8.1% |
| `finance` | 608 | 7.6% |
| `weekly` | 608 | 7.6% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| Dogecoin Up or Down | 414 | 5.2% |
| Solana Up or Down | 414 | 5.2% |
| BNB Up or Down | 414 | 5.2% |
| Ethereum Up or Down | 414 | 5.2% |
| Bitcoin Up or Down | 414 | 5.2% |
| XRP Up or Down | 414 | 5.2% |
| Hyperliquid Up or Down | 390 | 4.9% |
| Bitcoin above ___ on May #, #AM ET? | 120 | 1.5% |
| Ethereum above ___ on May #, #AM ET? | 120 | 1.5% |
| Bitcoin above ___ on May #, #PM ET? | 120 | 1.5% |
| Ethereum above ___ on May #, #PM ET? | 120 | 1.5% |
| Dota #: Tundra Esports vs #win (BO#) | 88 | 1.1% |
| LoL: Ultra Prime vs LNG Esports (BO#) | 77 | 1.0% |
| Dota #: Yellow Submarine vs REKONIX (BO#) | 75 | 0.9% |
| LoL: GIANTX vs Movistar KOI (BO#) | 70 | 0.9% |
| BV Borussia # Dortmund vs. Eintracht Frankfurt | 66 | 0.8% |
| Dota #: PARIVISION vs L#ga Team (BO#) | 66 | 0.8% |
| LoL: Karmine Corp vs G# Esports (BO#) | 65 | 0.8% |
| LoL: Kiwoom DRX vs Gen.G (BO#) | 62 | 0.8% |
| LoL: T# vs DN SOOPers (BO#) | 61 | 0.8% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +-159h | 15 | █ |
| +-155h | 74 | ███ |
| +-154h | 20 | █ |
| +-153h | 13 |  |
| +-152h | 48 | ██ |
| +0h | 190 | ███████ |
| +1h | 204 | ███████ |
| +2h | 853 | ██████████████████████████████ |
| +3h | 235 | ████████ |
| +4h | 263 | █████████ |
| +5h | 383 | █████████████ |
| +6h | 376 | █████████████ |
| +7h | 334 | ████████████ |
| +8h | 252 | █████████ |
| +9h | 618 | ██████████████████████ |
| +10h | 860 | ██████████████████████████████ |
| +11h | 397 | ██████████████ |
| +12h | 239 | ████████ |
| +13h | 268 | █████████ |
| +14h | 248 | █████████ |
| +15h | 168 | ██████ |
| +16h | 259 | █████████ |
| +17h | 196 | ███████ |
| +18h | 274 | ██████████ |
| +19h | 382 | █████████████ |
| +20h | 195 | ███████ |
| +21h | 189 | ███████ |
| +22h | 244 | █████████ |
| +23h | 180 | ██████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 7,977 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
