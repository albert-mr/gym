# pm-bench snapshot — 2026-05-12

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 7,515 |
| Unique markets (by id) | 7,515 |
| Unique events (Polymarket grouping) | 3,439 |
| Unique templates (digits stripped, trimmed at first ` - `) | 352 |
| polled_at min | 2026-05-12T09:08:12.457Z |
| polled_at max | 2026-05-12T09:08:12.457Z |
| endDate min | 2026-05-05T22:40:00.000Z |
| endDate max | 2026-05-13T09:05:00.000Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +7,515 | 7,515 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,730 | 4,785 | 63.7% |
| Drop: Pyth Network (Gate 1c) | -42 | 4,743 | 63.1% |
| Drop: no URL anywhere (Gate 1b) | -0 | 4,743 | 63.1% |

**Post-Gate-1 (IO-addressable): 4,743 markets / 329 unique templates.**
**Gate 1 dropped: 2,730 Chainlink-fed + 0 with no URL anywhere = 2,772 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 3,320 | 44.2% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 4,743 | 63.1% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 1,423 | 30.0% |
| Non-recurring (true one-off) | 3,320 | 70.0% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sports match | 2,215 | 46.7% | 136 | 290 | 0 | IO-shaped |
| Esports match | 976 | 20.6% | 79 | 79 | 0 | IO-shaped |
| News / other | 649 | 13.7% | 20 | 63 | 566 | IO-shaped |
| Weather forecast | 638 | 13.5% | 58 | 58 | 638 | IO-shaped |
| Crypto price feed | 228 | 4.8% | 27 | 188 | 219 | deterministic feed (IO not useful) |
| Stock close threshold | 37 | 0.8% | 9 | 9 | 0 | deterministic feed (IO not useful) |

**Truly IO-shaped (drop deterministic feeds): 4,478 markets / 293 unique templates.**

### Top 3 templates per kind

- **Sports match** — `RC Celta de Vigo vs. Levante UD` (51), `Real Betis Balompié vs. Elche CF` (50), `CA Osasuna vs. Club Atlético de Madrid` (47)
- **Esports match** — `LoL: Invictus Gaming vs Bilibili Gaming (BO#)` (73), `LoL: Top Esports vs Ninjas in Pyjamas (BO#)` (57), `LoL: paiN Gaming Academy vs #REX (BO#)` (39)
- **News / other** — `Bitcoin above ___ on May #, #AM ET?` (120), `Ethereum above ___ on May #, #AM ET?` (120), `Bitcoin above ___ on May #, #PM ET?` (120)
- **Weather forecast** — `Lowest temperature in London on May #?` (11), `Lowest temperature in Paris on May #?` (11), `Lowest temperature in Seoul on May #?` (11)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)
- **Stock close threshold** — `Apple (AAPL) closes above ___ on May #?` (5), `Microsoft (MSFT) closes above ___ on May #?` (5), `Amazon (AMZN) closes above ___ on May #?` (5)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,730 / 7,515 (36.3%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 0 / 7,515 (0.0%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,730 | 36.3% |
| `www.twitch.tv` | 697 | 9.3% |
| `(empty)` | 663 | 8.8% |
| `www.wunderground.com` | 583 | 7.8% |
| `www.atptour.com` | 502 | 6.7% |
| `kick.com` | 201 | 2.7% |
| `www.mlb.com` | 178 | 2.4% |
| `www.binance.com` | 175 | 2.3% |
| `www.wtatennis.com` | 159 | 2.1% |
| `www.laliga.com` | 148 | 2.0% |
| `upl.ua` | 136 | 1.8% |
| `www.fortunaliga.cz` | 128 | 1.7% |
| `www.cbf.com.br` | 116 | 1.5% |
| `spfl.co.uk` | 102 | 1.4% |
| `www.kleague.com` | 96 | 1.3% |
| `www.efa.com.eg` | 96 | 1.3% |
| `x.com` | 72 | 1.0% |
| `www.legaserieb.it` | 68 | 0.9% |
| `www.afa.com.ar` | 68 | 0.9% |
| `dimayor.com.co` | 68 | 0.9% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `hide-from-new` | 4,241 | 56.4% |
| `recurring` | 4,153 | 55.3% |
| `crypto` | 3,515 | 46.8% |
| `crypto-prices` | 3,513 | 46.7% |
| `games` | 3,191 | 42.5% |
| `sports` | 3,191 | 42.5% |
| `up-or-down` | 2,956 | 39.3% |
| `5M` | 2,016 | 26.8% |
| `soccer` | 1,274 | 17.0% |
| `esports` | 990 | 13.2% |
| `bitcoin` | 694 | 9.2% |
| `ethereum` | 682 | 9.1% |
| `15M` | 672 | 8.9% |
| `tennis` | 661 | 8.8% |
| `1H` | 638 | 8.5% |
| `weather` | 638 | 8.5% |
| `daily-temperature` | 638 | 8.5% |
| `rewards-automation-50-4pt5-50` | 589 | 7.8% |
| `highest-temperature` | 561 | 7.5% |
| `multi-strikes` | 514 | 6.8% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| BNB Up or Down | 414 | 5.5% |
| Dogecoin Up or Down | 414 | 5.5% |
| XRP Up or Down | 414 | 5.5% |
| Solana Up or Down | 414 | 5.5% |
| Ethereum Up or Down | 414 | 5.5% |
| Bitcoin Up or Down | 414 | 5.5% |
| Hyperliquid Up or Down | 390 | 5.2% |
| Bitcoin above ___ on May #, #AM ET? | 120 | 1.6% |
| Ethereum above ___ on May #, #AM ET? | 120 | 1.6% |
| Bitcoin above ___ on May #, #PM ET? | 120 | 1.6% |
| Ethereum above ___ on May #, #PM ET? | 110 | 1.5% |
| LoL: Invictus Gaming vs Bilibili Gaming (BO#) | 73 | 1.0% |
| LoL: Top Esports vs Ninjas in Pyjamas (BO#) | 57 | 0.8% |
| RC Celta de Vigo vs. Levante UD | 51 | 0.7% |
| Real Betis Balompié vs. Elche CF | 50 | 0.7% |
| CA Osasuna vs. Club Atlético de Madrid | 47 | 0.6% |
| LoL: paiN Gaming Academy vs #REX (BO#) | 39 | 0.5% |
| WTT | 37 | 0.5% |
| Dota #: Two Move vs Power Rangers (BO#) | 36 | 0.5% |
| FK Oleksandriya vs. FK Zorya Luhansk | 34 | 0.5% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +-155h | 77 | ███ |
| +-154h | 17 | █ |
| +-153h | 13 |  |
| +-152h | 42 | █ |
| +-110h | 1 |  |
| +-1h | 12 |  |
| +0h | 209 | ███████ |
| +1h | 331 | ████████████ |
| +2h | 858 | ██████████████████████████████ |
| +3h | 344 | ████████████ |
| +4h | 275 | ██████████ |
| +5h | 290 | ██████████ |
| +6h | 456 | ████████████████ |
| +7h | 300 | ██████████ |
| +8h | 454 | ████████████████ |
| +9h | 431 | ███████████████ |
| +10h | 296 | ██████████ |
| +11h | 253 | █████████ |
| +12h | 251 | █████████ |
| +13h | 286 | ██████████ |
| +14h | 316 | ███████████ |
| +15h | 261 | █████████ |
| +16h | 231 | ████████ |
| +17h | 165 | ██████ |
| +18h | 222 | ████████ |
| +19h | 176 | ██████ |
| +20h | 144 | █████ |
| +21h | 155 | █████ |
| +22h | 230 | ████████ |
| +23h | 419 | ███████████████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 7,515 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
