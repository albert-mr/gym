# pm-bench snapshot — 2026-05-10

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 11,163 |
| Unique markets (by id) | 11,163 |
| Unique events (Polymarket grouping) | 3,757 |
| Unique templates (digits stripped, trimmed at first ` - `) | 431 |
| polled_at min | 2026-05-10T11:44:08.080Z |
| polled_at max | 2026-05-10T11:44:08.080Z |
| endDate min | 2026-05-10T11:45:00.000Z |
| endDate max | 2026-05-11T11:40:00.000Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +11,163 | 11,163 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,730 | 8,433 | 75.5% |
| Drop: Pyth Network (Gate 1c) | -0 | 8,433 | 75.5% |
| Drop: no URL anywhere (Gate 1b) | -537 | 7,896 | 70.7% |

**Post-Gate-1 (IO-addressable): 7,896 markets / 422 unique templates.**
**Gate 1 dropped: 2,730 Chainlink-fed + 537 with no URL anywhere = 3,267 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 6,398 | 57.3% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 7,896 | 70.7% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 1,498 | 19.0% |
| Non-recurring (true one-off) | 6,398 | 81.0% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sports match | 4,633 | 58.7% | 228 | 610 | 0 | IO-shaped |
| Esports match | 1,596 | 20.2% | 90 | 90 | 0 | IO-shaped |
| News / other | 799 | 10.1% | 27 | 71 | 630 | IO-shaped |
| Weather forecast | 649 | 8.2% | 59 | 59 | 649 | IO-shaped |
| Crypto price feed | 219 | 2.8% | 18 | 179 | 219 | deterministic feed (IO not useful) |

**Truly IO-shaped (drop deterministic feeds): 7,677 markets / 404 unique templates.**

### Top 3 templates per kind

- **Sports match** — `Paris Saint-Germain FC vs. Stade Brestois #` (66), `Stade Rennais FC # vs. Paris FC` (64), `AS Monaco FC vs. Lille OSC` (63)
- **Esports match** — `LoL: LOS vs Fluxo W#M (BO#)` (122), `Dota #: PlayTime vs Nigma Galaxy (BO#)` (93), `Dota #: REKONIX vs Nigma Galaxy (BO#)` (80)
- **News / other** — `Bitcoin above ___ on May #, #AM ET?` (120), `Ethereum above ___ on May #, #AM ET?` (120), `Bitcoin above ___ on May #, #PM ET?` (120)
- **Weather forecast** — `Lowest temperature in London on May #?` (11), `Lowest temperature in Paris on May #?` (11), `Lowest temperature in Seoul on May #?` (11)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,730 / 11,163 (24.5%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 537 / 11,163 (4.8%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,730 | 24.5% |
| `www.twitch.tv` | 1,350 | 12.1% |
| `(empty)` | 1,307 | 11.7% |
| `www.wunderground.com` | 594 | 5.3% |
| `www.ligue1.com` | 482 | 4.3% |
| `www.laliga.com` | 344 | 3.1% |
| `www.atptour.com` | 340 | 3.0% |
| `www.cbf.com.br` | 305 | 2.7% |
| `eredivisie.nl` | 288 | 2.6% |
| `kick.com` | 232 | 2.1% |
| `www.premierleague.com` | 216 | 1.9% |
| `www.wtatennis.com` | 212 | 1.9% |
| `www.legaseriea.it` | 201 | 1.8% |
| `www.binance.com` | 175 | 1.6% |
| `www.bundesliga.com` | 139 | 1.2% |
| `www.afa.com.ar` | 136 | 1.2% |
| `premierliga.ru` | 128 | 1.1% |
| `superligaen.dk` | 128 | 1.1% |
| `www.eliteserien.no` | 128 | 1.1% |
| `www.frmf.ma` | 128 | 1.1% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `sports` | 6,835 | 61.2% |
| `games` | 6,357 | 56.9% |
| `hide-from-new` | 4,228 | 37.9% |
| `recurring` | 4,228 | 37.9% |
| `soccer` | 3,783 | 33.9% |
| `crypto-prices` | 3,579 | 32.1% |
| `crypto` | 3,579 | 32.1% |
| `up-or-down` | 2,905 | 26.0% |
| `5M` | 2,016 | 18.1% |
| `esports` | 1,667 | 14.9% |
| `rewards-automation-50-4pt5-50` | 1,004 | 9.0% |
| `league-of-legends` | 715 | 6.4% |
| `bitcoin` | 707 | 6.3% |
| `ethereum` | 705 | 6.3% |
| `15M` | 672 | 6.0% |
| `weather` | 649 | 5.8% |
| `daily-temperature` | 649 | 5.8% |
| `1H` | 648 | 5.8% |
| `basketball` | 562 | 5.0% |
| `highest-temperature` | 561 | 5.0% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| Ethereum Up or Down | 414 | 3.7% |
| Solana Up or Down | 414 | 3.7% |
| Bitcoin Up or Down | 414 | 3.7% |
| BNB Up or Down | 414 | 3.7% |
| XRP Up or Down | 414 | 3.7% |
| Dogecoin Up or Down | 414 | 3.7% |
| Hyperliquid Up or Down | 390 | 3.5% |
| # NBA Draft Lottery: #th Pick | 363 | 3.3% |
| LoL: LOS vs Fluxo W#M (BO#) | 122 | 1.1% |
| Bitcoin above ___ on May #, #AM ET? | 120 | 1.1% |
| Ethereum above ___ on May #, #AM ET? | 120 | 1.1% |
| Bitcoin above ___ on May #, #PM ET? | 120 | 1.1% |
| Ethereum above ___ on May #, #PM ET? | 120 | 1.1% |
| Dota #: PlayTime vs Nigma Galaxy (BO#) | 93 | 0.8% |
| Dota #: REKONIX vs Nigma Galaxy (BO#) | 80 | 0.7% |
| Dota #: #win vs PARIVISION (BO#) | 75 | 0.7% |
| Dota #: PlayTime vs Yellow Submarine (BO#) | 73 | 0.7% |
| LoL: T# vs Dplus KIA (BO#) | 69 | 0.6% |
| LoL: Kiwoom DRX vs Hanwha Life Esports (BO#) | 69 | 0.6% |
| LoL: Movistar KOI vs G# Esports (BO#) | 69 | 0.6% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +0h | 1,125 | ██████████████████████████████ |
| +1h | 609 | ████████████████ |
| +2h | 522 | ██████████████ |
| +3h | 866 | ███████████████████████ |
| +4h | 792 | █████████████████████ |
| +5h | 465 | ████████████ |
| +6h | 432 | ████████████ |
| +7h | 1,042 | ████████████████████████████ |
| +8h | 483 | █████████████ |
| +9h | 318 | ████████ |
| +10h | 588 | ████████████████ |
| +11h | 416 | ███████████ |
| +12h | 924 | █████████████████████████ |
| +13h | 271 | ███████ |
| +14h | 184 | █████ |
| +15h | 268 | ███████ |
| +16h | 271 | ███████ |
| +17h | 221 | ██████ |
| +18h | 156 | ████ |
| +19h | 139 | ████ |
| +20h | 308 | ████████ |
| +21h | 282 | ████████ |
| +22h | 222 | ██████ |
| +23h | 259 | ███████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 11,163 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
