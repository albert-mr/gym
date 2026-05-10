# pm-bench snapshot — 2026-05-10

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 9,476 |
| Unique markets (by id) | 9,476 |
| Unique events (Polymarket grouping) | 3,573 |
| Unique templates (digits stripped, trimmed at first ` - `) | 325 |
| polled_at min | 2026-05-10T11:44:08.080Z |
| polled_at max | 2026-05-10T11:44:08.080Z |
| endDate min | 2026-05-10T11:45:00Z |
| endDate max | 2026-05-11T11:40:00Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +9,476 | 9,476 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,730 | 6,746 | 71.2% |
| Drop: no URL anywhere (Gate 1b) | -676 | 6,070 | 64.1% |

**Post-Gate-1 (IO-addressable): 6,070 markets / 307 unique templates.**
**Gate 1 dropped: 2,730 Chainlink-fed + 676 with no URL anywhere = 3,406 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 5,282 | 55.7% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 6,070 | 64.1% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 788 | 13.0% |
| Non-recurring (true one-off) | 5,282 | 87.0% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sports match | 3,982 | 65.6% | 132 | 478 | 0 | IO-shaped |
| Esports match | 1,282 | 21.1% | 85 | 85 | 0 | IO-shaped |
| Weather forecast | 382 | 6.3% | 56 | 56 | 382 | IO-shaped |
| Crypto price feed | 219 | 3.6% | 18 | 179 | 219 | deterministic feed (IO not useful) |
| News / other | 205 | 3.4% | 16 | 18 | 187 | IO-shaped |

**Truly IO-shaped (drop deterministic feeds): 5,851 markets / 289 unique templates.**

### Top 3 templates per kind

- **Sports match** — `Paris Saint-Germain FC vs. Stade Brestois #` (66), `Stade Rennais FC # vs. Paris FC` (64), `AS Monaco FC vs. Lille OSC` (63)
- **Esports match** — `Dota #: REKONIX vs Nigma Galaxy (BO#)` (80), `LoL: LOS vs Fluxo W#M (BO#)` (71), `LoL: T# vs Dplus KIA (BO#)` (69)
- **Weather forecast** — `Lowest temperature in Hong Kong on May #?` (11), `Highest temperature in Buenos Aires on May #?` (11), `Highest temperature in NYC on May #?` (11)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)
- **News / other** — `Bitcoin above ___ on May #, #AM ET?` (20), `Ethereum above ___ on May #, #AM ET?` (20), `What price will Bitcoin hit on May #?` (16)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,730 / 9,476 (28.8%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 676 / 9,476 (7.1%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,730 | 28.8% |
| `(empty)` | 967 | 10.2% |
| `www.twitch.tv` | 949 | 10.0% |
| `www.ligue1.com` | 482 | 5.1% |
| `www.laliga.com` | 344 | 3.6% |
| `www.wunderground.com` | 340 | 3.6% |
| `www.cbf.com.br` | 308 | 3.3% |
| `kick.com` | 295 | 3.1% |
| `eredivisie.nl` | 288 | 3.0% |
| `www.premierleague.com` | 216 | 2.3% |
| `www.legaseriea.it` | 201 | 2.1% |
| `www.binance.com` | 175 | 1.8% |
| `www.eliteserien.no` | 152 | 1.6% |
| `www.bundesliga.com` | 139 | 1.5% |
| `www.afa.com.ar` | 136 | 1.4% |
| `premierliga.ru` | 128 | 1.4% |
| `superligaen.dk` | 128 | 1.4% |
| `www.frmf.ma` | 128 | 1.4% |
| `www.mlssoccer.com` | 98 | 1.0% |
| `www.fortunaliga.cz` | 96 | 1.0% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `sports` | 5,881 | 62.1% |
| `games` | 5,264 | 55.6% |
| `soccer` | 3,810 | 40.2% |
| `hide-from-new` | 3,518 | 37.1% |
| `recurring` | 3,518 | 37.1% |
| `crypto-prices` | 3,136 | 33.1% |
| `crypto` | 3,136 | 33.1% |
| `up-or-down` | 2,905 | 30.7% |
| `5M` | 2,016 | 21.3% |
| `esports` | 1,351 | 14.3% |
| `rewards-automation-50-4pt5-50` | 786 | 8.3% |
| `15M` | 672 | 7.1% |
| `nba` | 538 | 5.7% |
| `basketball` | 538 | 5.7% |
| `league-of-legends` | 526 | 5.6% |
| `bitcoin` | 486 | 5.1% |
| `ethereum` | 484 | 5.1% |
| `ligue-1` | 482 | 5.1% |
| `2026-nba-draft-lottery` | 462 | 4.9% |
| `2026-nba-draft` | 462 | 4.9% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| Ethereum Up or Down | 414 | 4.4% |
| Solana Up or Down | 414 | 4.4% |
| Bitcoin Up or Down | 414 | 4.4% |
| BNB Up or Down | 414 | 4.4% |
| XRP Up or Down | 414 | 4.4% |
| Dogecoin Up or Down | 414 | 4.4% |
| Hyperliquid Up or Down | 390 | 4.1% |
| # NBA Draft Lottery: #th Pick | 363 | 3.8% |
| Dota #: REKONIX vs Nigma Galaxy (BO#) | 80 | 0.8% |
| LoL: LOS vs Fluxo W#M (BO#) | 71 | 0.7% |
| LoL: T# vs Dplus KIA (BO#) | 69 | 0.7% |
| Paris Saint-Germain FC vs. Stade Brestois # | 66 | 0.7% |
| LoL: Kiwoom DRX vs Hanwha Life Esports (BO#) | 65 | 0.7% |
| Stade Rennais FC # vs. Paris FC | 64 | 0.7% |
| AS Monaco FC vs. Lille OSC | 63 | 0.7% |
| FC Barcelona vs. Real Madrid CF | 63 | 0.7% |
| LoL: Weibo Gaming vs Ninjas in Pyjamas (BO#) | 62 | 0.7% |
| Le Havre AC vs. Olympique de Marseille | 62 | 0.7% |
| West Ham United FC vs. Arsenal FC | 59 | 0.6% |
| Burnley FC vs. Aston Villa FC | 57 | 0.6% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +0h | 848 | ██████████████████████████ |
| +1h | 587 | ██████████████████ |
| +2h | 518 | ████████████████ |
| +3h | 861 | ██████████████████████████ |
| +4h | 784 | ████████████████████████ |
| +5h | 431 | █████████████ |
| +6h | 389 | ████████████ |
| +7h | 988 | ██████████████████████████████ |
| +8h | 331 | ██████████ |
| +9h | 345 | ██████████ |
| +10h | 388 | ████████████ |
| +11h | 376 | ███████████ |
| +12h | 903 | ███████████████████████████ |
| +13h | 243 | ███████ |
| +14h | 147 | ████ |
| +15h | 137 | ████ |
| +16h | 252 | ████████ |
| +17h | 135 | ████ |
| +18h | 122 | ████ |
| +19h | 125 | ████ |
| +20h | 128 | ████ |
| +21h | 148 | ████ |
| +22h | 161 | █████ |
| +23h | 129 | ████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 9,476 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
