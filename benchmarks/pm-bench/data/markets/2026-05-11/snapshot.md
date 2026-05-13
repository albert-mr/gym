# pm-bench snapshot — 2026-05-11

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 8,285 |
| Unique markets (by id) | 8,285 |
| Unique events (Polymarket grouping) | 3,509 |
| Unique templates (digits stripped, trimmed at first ` - `) | 419 |
| polled_at min | 2026-05-11T10:32:47.683Z |
| polled_at max | 2026-05-11T10:32:47.683Z |
| endDate min | 2026-05-04T21:40:00.000Z |
| endDate max | 2026-05-13T00:00:00.000Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +8,285 | 8,285 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,730 | 5,555 | 67.0% |
| Drop: Pyth Network (Gate 1c) | -41 | 5,514 | 66.6% |
| Drop: no URL anywhere (Gate 1b) | -297 | 5,217 | 63.0% |

**Post-Gate-1 (IO-addressable): 5,217 markets / 383 unique templates.**
**Gate 1 dropped: 2,730 Chainlink-fed + 297 with no URL anywhere = 3,068 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 3,771 | 45.5% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 5,217 | 63.0% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 1,446 | 27.7% |
| Non-recurring (true one-off) | 3,771 | 72.3% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sports match | 2,519 | 48.3% | 170 | 324 | 0 | IO-shaped |
| Esports match | 1,046 | 20.0% | 85 | 85 | 0 | IO-shaped |
| News / other | 732 | 14.0% | 27 | 73 | 578 | IO-shaped |
| Weather forecast | 649 | 12.4% | 59 | 59 | 649 | IO-shaped |
| Crypto price feed | 228 | 4.4% | 27 | 188 | 219 | deterministic feed (IO not useful) |
| Stock close threshold | 43 | 0.8% | 15 | 15 | 0 | deterministic feed (IO not useful) |

**Truly IO-shaped (drop deterministic feeds): 4,946 markets / 341 unique templates.**

### Top 3 templates per kind

- **Sports match** — `Timberwolves vs. Spurs` (53), `SSC Napoli vs. Bologna FC #` (52), `Tottenham Hotspur FC vs. Leeds United FC` (52)
- **Esports match** — `Dota #: PARIVISION vs #win (BO#)` (109), `Dota #: #win vs PlayTime (BO#)` (83), `LoL: Ei Nerd Esports vs Estral Esports (BO#)` (39)
- **News / other** — `Bitcoin above ___ on May #, #AM ET?` (120), `Ethereum above ___ on May #, #AM ET?` (120), `Bitcoin above ___ on May #, #PM ET?` (120)
- **Weather forecast** — `Lowest temperature in London on May #?` (11), `Lowest temperature in Paris on May #?` (11), `Lowest temperature in Seoul on May #?` (11)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)
- **Stock close threshold** — `Apple (AAPL) closes above ___ on May #?` (5), `Microsoft (MSFT) closes above ___ on May #?` (5), `Amazon (AMZN) closes above ___ on May #?` (5)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,730 / 8,285 (33.0%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 297 / 8,285 (3.6%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,730 | 33.0% |
| `(empty)` | 1,096 | 13.2% |
| `www.twitch.tv` | 777 | 9.4% |
| `www.wtatennis.com` | 656 | 7.9% |
| `www.wunderground.com` | 594 | 7.2% |
| `www.atptour.com` | 381 | 4.6% |
| `www.ligaportugal.pt` | 238 | 2.9% |
| `www.binance.com` | 175 | 2.1% |
| `kick.com` | 171 | 2.1% |
| `www.mlb.com` | 159 | 1.9% |
| `www.nba.com` | 141 | 1.7% |
| `premierliga.ru` | 96 | 1.2% |
| `www.frmf.ma` | 96 | 1.2% |
| `www.kleague.com` | 96 | 1.2% |
| `www.laliga.com` | 85 | 1.0% |
| `www.lpf.ro` | 68 | 0.8% |
| `www.slstat.com` | 64 | 0.8% |
| `liga1.pe` | 64 | 0.8% |
| `www.legaseriea.it` | 52 | 0.6% |
| `www.premierleague.com` | 52 | 0.6% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `hide-from-new` | 4,267 | 51.5% |
| `recurring` | 4,176 | 50.4% |
| `sports` | 3,565 | 43.0% |
| `games` | 3,565 | 43.0% |
| `crypto` | 3,527 | 42.6% |
| `crypto-prices` | 3,523 | 42.5% |
| `up-or-down` | 2,955 | 35.7% |
| `5M` | 2,016 | 24.3% |
| `soccer` | 1,075 | 13.0% |
| `esports` | 1,059 | 12.8% |
| `tennis` | 1,037 | 12.5% |
| `bitcoin` | 694 | 8.4% |
| `ethereum` | 692 | 8.4% |
| `15M` | 672 | 8.1% |
| `weather` | 649 | 7.8% |
| `daily-temperature` | 649 | 7.8% |
| `1H` | 648 | 7.8% |
| `highest-temperature` | 561 | 6.8% |
| `rewards-automation-50-4pt5-50` | 553 | 6.7% |
| `multi-strikes` | 524 | 6.3% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| Dogecoin Up or Down | 414 | 5.0% |
| Solana Up or Down | 414 | 5.0% |
| BNB Up or Down | 414 | 5.0% |
| Bitcoin Up or Down | 414 | 5.0% |
| XRP Up or Down | 414 | 5.0% |
| Ethereum Up or Down | 414 | 5.0% |
| Hyperliquid Up or Down | 390 | 4.7% |
| Bitcoin above ___ on May #, #AM ET? | 120 | 1.4% |
| Ethereum above ___ on May #, #AM ET? | 120 | 1.4% |
| Bitcoin above ___ on May #, #PM ET? | 120 | 1.4% |
| Ethereum above ___ on May #, #PM ET? | 120 | 1.4% |
| Dota #: PARIVISION vs #win (BO#) | 109 | 1.3% |
| Dota #: #win vs PlayTime (BO#) | 83 | 1.0% |
| Timberwolves vs. Spurs | 53 | 0.6% |
| SSC Napoli vs. Bologna FC # | 52 | 0.6% |
| Tottenham Hotspur FC vs. Leeds United FC | 52 | 0.6% |
| Rayo Vallecano de Madrid vs. Girona FC | 51 | 0.6% |
| WTT | 47 | 0.6% |
| Pistons vs. Cavaliers | 44 | 0.5% |
| Thunder vs. Lakers | 43 | 0.5% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +-157h | 12 |  |
| +-156h | 44 | █ |
| +-155h | 45 | █ |
| +-153h | 34 | █ |
| +-2h | 26 | █ |
| +-1h | 10 |  |
| +0h | 259 | ████████ |
| +1h | 984 | ██████████████████████████████ |
| +2h | 168 | █████ |
| +3h | 297 | █████████ |
| +4h | 244 | ███████ |
| +5h | 359 | ███████████ |
| +6h | 355 | ███████████ |
| +7h | 362 | ███████████ |
| +8h | 684 | █████████████████████ |
| +9h | 327 | ██████████ |
| +10h | 367 | ███████████ |
| +11h | 173 | █████ |
| +12h | 197 | ██████ |
| +13h | 720 | ██████████████████████ |
| +14h | 191 | ██████ |
| +15h | 352 | ███████████ |
| +16h | 159 | █████ |
| +17h | 247 | ████████ |
| +18h | 170 | █████ |
| +19h | 150 | █████ |
| +20h | 163 | █████ |
| +21h | 380 | ████████████ |
| +22h | 482 | ███████████████ |
| +23h | 296 | █████████ |
| +37h | 28 | █ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 8,285 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
