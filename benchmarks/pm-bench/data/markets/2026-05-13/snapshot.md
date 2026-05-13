# pm-bench snapshot — 2026-05-13

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 6,861 |
| Unique markets (by id) | 6,861 |
| Unique events (Polymarket grouping) | 3,353 |
| Unique templates (digits stripped, trimmed at first ` - `) | 295 |
| polled_at min | 2026-05-13T10:54:43.455Z |
| polled_at max | 2026-05-13T10:55:07.238Z |
| endDate min | 2026-05-13T10:55:00Z |
| endDate max | 2026-05-14T10:50:00Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +6,861 | 6,861 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,730 | 4,131 | 60.2% |
| Drop: Pyth Network (Gate 1c) | -42 | 4,089 | 59.6% |
| Drop: no URL anywhere (Gate 1b) | -25 | 4,064 | 59.2% |

**Post-Gate-1 (IO-addressable): 4,064 markets / 267 unique templates.**
**Gate 1 dropped: 2,730 Chainlink-fed + 25 with no URL anywhere = 2,797 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 3,304 | 48.2% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 4,064 | 59.2% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 760 | 18.7% |
| Non-recurring (true one-off) | 3,304 | 81.3% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sports match | 1,824 | 44.9% | 61 | 227 | 0 | IO-shaped |
| Esports match | 1,392 | 34.3% | 96 | 96 | 0 | IO-shaped |
| Weather forecast | 407 | 10.0% | 56 | 56 | 407 | IO-shaped |
| Crypto price feed | 228 | 5.6% | 27 | 188 | 219 | deterministic feed (IO not useful) |
| News / other | 174 | 4.3% | 16 | 18 | 134 | IO-shaped |
| Stock close threshold | 39 | 1.0% | 11 | 11 | 0 | deterministic feed (IO not useful) |

**Truly IO-shaped (drop deterministic feeds): 3,797 markets / 229 unique templates.**

### Top 3 templates per kind

- **Sports match** — `Deportivo Alavés vs. FC Barcelona` (60), `Stade Brestois # vs. RC Strasbourg Alsace` (55), `RCD Espanyol de Barcelona vs. Athletic Club` (53)
- **Esports match** — `LoL: T# vs Nongshim Red Force (BO#)` (67), `LoL: Oh My God vs EDward Gaming (BO#)` (52), `Dota #: ex-HEROIC vs GamerLegion (BO#)` (50)
- **Weather forecast** — `Lowest temperature in Hong Kong on May #?` (11), `Highest temperature in Sao Paulo on May #?` (11), `Highest temperature in Buenos Aires on May #?` (11)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)
- **News / other** — `Bitcoin above ___ on May #, #AM ET?` (20), `Ethereum above ___ on May #, #AM ET?` (20), `What price will Bitcoin hit on May #?` (16)
- **Stock close threshold** — `Apple (AAPL) closes above ___ on May #?` (5), `Microsoft (MSFT) closes above ___ on May #?` (5), `Amazon (AMZN) closes above ___ on May #?` (5)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,730 / 6,861 (39.8%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 25 / 6,861 (0.4%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,730 | 39.8% |
| `www.twitch.tv` | 988 | 14.4% |
| `www.mlssoccer.com` | 452 | 6.6% |
| `www.wunderground.com` | 368 | 5.4% |
| `(empty)` | 271 | 3.9% |
| `kick.com` | 264 | 3.8% |
| `www.cbf.com.br` | 224 | 3.3% |
| `www.laliga.com` | 211 | 3.1% |
| `www.binance.com` | 175 | 2.6% |
| `www.efa.com.eg` | 116 | 1.7% |
| `www.ligue1.com` | 107 | 1.6% |
| `upl.ua` | 102 | 1.5% |
| `spfl.co.uk` | 102 | 1.5% |
| `lfpb.com.bo` | 96 | 1.4% |
| `www.afa.com.ar` | 68 | 1.0% |
| `dimayor.com.co` | 68 | 1.0% |
| `www.fortunaliga.cz` | 64 | 0.9% |
| `hltv.org` | 48 | 0.7% |
| `gol.gg` | 46 | 0.7% |
| `pythdata.app` | 42 | 0.6% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `hide-from-new` | 3,580 | 52.2% |
| `recurring` | 3,490 | 50.9% |
| `games` | 3,216 | 46.9% |
| `sports` | 3,216 | 46.9% |
| `crypto` | 3,083 | 44.9% |
| `crypto-prices` | 3,081 | 44.9% |
| `up-or-down` | 2,956 | 43.1% |
| `5M` | 2,016 | 29.4% |
| `soccer` | 1,781 | 26.0% |
| `esports` | 1,405 | 20.5% |
| `15M` | 672 | 9.8% |
| `counter-strike-2` | 481 | 7.0% |
| `dota-2` | 477 | 7.0% |
| `bitcoin` | 474 | 6.9% |
| `ethereum` | 471 | 6.9% |
| `mls` | 452 | 6.6% |
| `solana` | 447 | 6.5% |
| `xrp` | 446 | 6.5% |
| `ripple` | 446 | 6.5% |
| `dogecoin` | 415 | 6.0% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| Ethereum Up or Down | 414 | 6.0% |
| Solana Up or Down | 414 | 6.0% |
| Dogecoin Up or Down | 414 | 6.0% |
| Bitcoin Up or Down | 414 | 6.0% |
| XRP Up or Down | 414 | 6.0% |
| BNB Up or Down | 414 | 6.0% |
| Hyperliquid Up or Down | 390 | 5.7% |
| LoL: T# vs Nongshim Red Force (BO#) | 67 | 1.0% |
| Deportivo Alavés vs. FC Barcelona | 60 | 0.9% |
| Stade Brestois # vs. RC Strasbourg Alsace | 55 | 0.8% |
| RCD Espanyol de Barcelona vs. Athletic Club | 53 | 0.8% |
| LoL: Oh My God vs EDward Gaming (BO#) | 52 | 0.8% |
| Villarreal CF vs. Sevilla FC | 52 | 0.8% |
| Racing Club de Lens vs. Paris Saint-Germain FC | 52 | 0.8% |
| Dota #: ex-HEROIC vs GamerLegion (BO#) | 50 | 0.7% |
| Dota #: Aurora vs Team Liquid (BO#) | 50 | 0.7% |
| LoL: DN SOOPers vs Dplus KIA (BO#) | 48 | 0.7% |
| Getafe CF vs. RCD Mallorca | 46 | 0.7% |
| Dota #: Team Falcons vs Virtus.pro (BO#) | 45 | 0.7% |
| Dota #: Team Spirit vs Vici Gaming (BO#) | 44 | 0.6% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +0h | 141 | ██████ |
| +1h | 651 | ██████████████████████████████ |
| +2h | 205 | █████████ |
| +3h | 309 | ██████████████ |
| +4h | 331 | ███████████████ |
| +5h | 444 | ████████████████████ |
| +6h | 423 | ███████████████████ |
| +7h | 225 | ██████████ |
| +8h | 638 | █████████████████████████████ |
| +9h | 252 | ████████████ |
| +10h | 249 | ███████████ |
| +11h | 405 | ███████████████████ |
| +12h | 527 | ████████████████████████ |
| +13h | 540 | █████████████████████████ |
| +14h | 259 | ████████████ |
| +15h | 215 | ██████████ |
| +16h | 135 | ██████ |
| +17h | 181 | ████████ |
| +18h | 128 | ██████ |
| +19h | 119 | █████ |
| +20h | 119 | █████ |
| +21h | 126 | ██████ |
| +22h | 120 | ██████ |
| +23h | 119 | █████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 6,861 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
