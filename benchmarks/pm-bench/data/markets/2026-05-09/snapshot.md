# pm-bench snapshot — 2026-05-09

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 12,299 |
| Unique markets (by id) | 12,299 |
| Unique events (Polymarket grouping) | 3,870 |
| Unique templates (digits stripped, trimmed at first ` - `) | 448 |
| polled_at min | 2026-05-09T10:08:24.064Z |
| polled_at max | 2026-05-09T10:08:24.064Z |
| endDate min | 2026-05-02T17:35:00.000Z |
| endDate max | 2026-05-10T10:05:00.000Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +12,299 | 12,299 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,730 | 9,569 | 77.8% |
| Drop: Pyth Network (Gate 1c) | -0 | 9,569 | 77.8% |
| Drop: no URL anywhere (Gate 1b) | -57 | 9,512 | 77.3% |

**Post-Gate-1 (IO-addressable): 9,512 markets / 442 unique templates.**
**Gate 1 dropped: 2,730 Chainlink-fed + 57 with no URL anywhere = 2,787 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 8,092 | 65.8% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 9,512 | 77.3% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 1,420 | 14.9% |
| Non-recurring (true one-off) | 8,092 | 85.1% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sports match | 5,714 | 60.1% | 264 | 748 | 0 | IO-shaped |
| Esports match | 1,490 | 15.7% | 74 | 74 | 0 | IO-shaped |
| News / other | 1,435 | 15.1% | 26 | 74 | 553 | IO-shaped |
| Weather forecast | 655 | 6.9% | 60 | 60 | 649 | IO-shaped |
| Crypto price feed | 218 | 2.3% | 18 | 179 | 218 | deterministic feed (IO not useful) |

**Truly IO-shaped (drop deterministic feeds): 9,294 markets / 424 unique templates.**

### Top 3 templates per kind

- **Sports match** — `Liverpool FC vs. Chelsea FC` (64), `TSG # Hoffenheim vs. SV Werder Bremen` (64), `Brighton & Hove Albion FC vs. Wolverhampton Wanderers FC` (64)
- **Esports match** — `Dota #: PlayTime vs PARIVISION (BO#)` (109), `LoL: Vivo Keyd Stars vs LOUD (BO#)` (108), `Dota #: Yellow Submarine vs Tundra Esports (BO#)` (84)
- **News / other** — `PGA Tour: ONEflight Myrtle Beach Classic Top #` (300), `PGA Tour: Truist Championship Top #` (222), `PGA Tour: ONEflight Myrtle Beach Classic Winner` (121)
- **Weather forecast** — `Lowest temperature in London on May #?` (11), `Lowest temperature in Paris on May #?` (11), `Lowest temperature in Seoul on May #?` (11)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,730 / 12,299 (22.2%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 57 / 12,299 (0.5%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,730 | 22.2% |
| `www.twitch.tv` | 1,154 | 9.4% |
| `(empty)` | 1,036 | 8.4% |
| `www.jleague.jp` | 695 | 5.7% |
| `www.wunderground.com` | 594 | 4.8% |
| `www.pgatour.com` | 522 | 4.2% |
| `www.bundesliga.com` | 416 | 3.4% |
| `www.mlssoccer.com` | 384 | 3.1% |
| `www.laliga.com` | 341 | 2.8% |
| `kick.com` | 323 | 2.6% |
| `tff.org` | 306 | 2.5% |
| `www.premierleague.com` | 299 | 2.4% |
| `www.cbf.com.br` | 288 | 2.3% |
| `www.ligue2.fr` | 259 | 2.1% |
| `www.mlb.com` | 217 | 1.8% |
| `www.binance.com` | 175 | 1.4% |
| `spfl.co.uk` | 160 | 1.3% |
| `nikeliga.sk` | 152 | 1.2% |
| `www.legaseriea.it` | 138 | 1.1% |
| `www.afa.com.ar` | 136 | 1.1% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `sports` | 7,971 | 64.8% |
| `games` | 7,232 | 58.8% |
| `soccer` | 4,925 | 40.0% |
| `hide-from-new` | 4,150 | 33.7% |
| `recurring` | 4,150 | 33.7% |
| `crypto-prices` | 3,501 | 28.5% |
| `crypto` | 3,501 | 28.5% |
| `up-or-down` | 2,905 | 23.6% |
| `5M` | 2,016 | 16.4% |
| `esports` | 1,552 | 12.6% |
| `golf` | 738 | 6.0% |
| `pga` | 738 | 6.0% |
| `pga-tour` | 738 | 6.0% |
| `ethereum` | 690 | 5.6% |
| `weather` | 683 | 5.6% |
| `bitcoin` | 672 | 5.5% |
| `15M` | 672 | 5.5% |
| `daily-temperature` | 649 | 5.3% |
| `1H` | 638 | 5.2% |
| `league-of-legends` | 602 | 4.9% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| Dogecoin Up or Down | 414 | 3.4% |
| Ethereum Up or Down | 414 | 3.4% |
| Solana Up or Down | 414 | 3.4% |
| Bitcoin Up or Down | 414 | 3.4% |
| XRP Up or Down | 414 | 3.4% |
| BNB Up or Down | 414 | 3.4% |
| Hyperliquid Up or Down | 390 | 3.2% |
| PGA Tour: ONEflight Myrtle Beach Classic Top # | 300 | 2.4% |
| PGA Tour: Truist Championship Top # | 222 | 1.8% |
| PGA Tour: ONEflight Myrtle Beach Classic Winner | 121 | 1.0% |
| Bitcoin above ___ on May #, #AM ET? | 120 | 1.0% |
| Ethereum above ___ on May #, #AM ET? | 120 | 1.0% |
| Ethereum above ___ on May #, #PM ET? | 120 | 1.0% |
| Bitcoin above ___ on May #, #PM ET? | 110 | 0.9% |
| Dota #: PlayTime vs PARIVISION (BO#) | 109 | 0.9% |
| LoL: Vivo Keyd Stars vs LOUD (BO#) | 108 | 0.9% |
| PGA Tour: Truist Championship Winner | 95 | 0.8% |
| Dota #: Yellow Submarine vs Tundra Esports (BO#) | 84 | 0.7% |
| LoL: Movistar KOI vs Karmine Corp (BO#) | 76 | 0.6% |
| Dota #: REKONIX vs #win (BO#) | 71 | 0.6% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +-161h | 16 |  |
| +-160h | 22 |  |
| +-159h | 59 | █ |
| +-158h | 22 |  |
| +-156h | 10 |  |
| +-155h | 20 |  |
| +-154h | 21 |  |
| +-153h | 17 |  |
| +-2h | 12 |  |
| +-1h | 6 |  |
| +0h | 286 | ██████ |
| +1h | 1,241 | █████████████████████████ |
| +2h | 326 | ███████ |
| +3h | 908 | ███████████████████ |
| +4h | 514 | ███████████ |
| +5h | 523 | ███████████ |
| +6h | 962 | ████████████████████ |
| +7h | 646 | █████████████ |
| +8h | 646 | █████████████ |
| +9h | 267 | █████ |
| +10h | 347 | ███████ |
| +11h | 305 | ██████ |
| +12h | 398 | ████████ |
| +13h | 1,466 | ██████████████████████████████ |
| +14h | 472 | ██████████ |
| +15h | 264 | █████ |
| +16h | 247 | █████ |
| +17h | 445 | █████████ |
| +18h | 720 | ███████████████ |
| +19h | 254 | █████ |
| +20h | 221 | █████ |
| +21h | 210 | ████ |
| +22h | 149 | ███ |
| +23h | 277 | ██████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 12,299 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
