# pm-bench snapshot — 2026-05-12

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 7,385 |
| Unique markets (by id) | 7,385 |
| Unique events (Polymarket grouping) | 3,444 |
| Unique templates (digits stripped, trimmed at first ` - `) | 357 |
| polled_at min | 2026-05-12T09:08:12.457Z |
| polled_at max | 2026-05-12T09:08:12.457Z |
| endDate min | 2026-05-12T09:10:00.000Z |
| endDate max | 2026-05-13T09:05:00.000Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +7,385 | 7,385 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,730 | 4,655 | 63.0% |
| Drop: Pyth Network (Gate 1c) | -42 | 4,613 | 62.5% |
| Drop: no URL anywhere (Gate 1b) | -0 | 4,613 | 62.5% |

**Post-Gate-1 (IO-addressable): 4,613 markets / 334 unique templates.**
**Gate 1 dropped: 2,730 Chainlink-fed + 0 with no URL anywhere = 2,772 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 3,179 | 43.0% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 4,613 | 62.5% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 1,434 | 31.1% |
| Non-recurring (true one-off) | 3,179 | 68.9% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sports match | 2,065 | 44.8% | 136 | 290 | 0 | IO-shaped |
| Esports match | 985 | 21.4% | 83 | 83 | 0 | IO-shaped |
| News / other | 649 | 14.1% | 20 | 63 | 566 | IO-shaped |
| Weather forecast | 649 | 14.1% | 59 | 59 | 649 | IO-shaped |
| Crypto price feed | 228 | 4.9% | 27 | 188 | 219 | deterministic feed (IO not useful) |
| Stock close threshold | 37 | 0.8% | 9 | 9 | 0 | deterministic feed (IO not useful) |

**Truly IO-shaped (drop deterministic feeds): 4,348 markets / 298 unique templates.**

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

**Gate 1a hit rate: 2,730 / 7,385 (37.0%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 0 / 7,385 (0.0%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,730 | 37.0% |
| `www.twitch.tv` | 700 | 9.5% |
| `(empty)` | 663 | 9.0% |
| `www.wunderground.com` | 594 | 8.0% |
| `www.atptour.com` | 502 | 6.8% |
| `kick.com` | 201 | 2.7% |
| `www.binance.com` | 175 | 2.4% |
| `www.wtatennis.com` | 159 | 2.2% |
| `www.laliga.com` | 148 | 2.0% |
| `upl.ua` | 136 | 1.8% |
| `www.fortunaliga.cz` | 128 | 1.7% |
| `www.cbf.com.br` | 116 | 1.6% |
| `spfl.co.uk` | 102 | 1.4% |
| `www.kleague.com` | 96 | 1.3% |
| `www.efa.com.eg` | 96 | 1.3% |
| `x.com` | 72 | 1.0% |
| `www.legaserieb.it` | 68 | 0.9% |
| `www.afa.com.ar` | 68 | 0.9% |
| `dimayor.com.co` | 68 | 0.9% |
| `www.slstat.com` | 64 | 0.9% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `hide-from-new` | 4,252 | 57.6% |
| `recurring` | 4,164 | 56.4% |
| `crypto` | 3,515 | 47.6% |
| `crypto-prices` | 3,513 | 47.6% |
| `games` | 3,050 | 41.3% |
| `sports` | 3,050 | 41.3% |
| `up-or-down` | 2,956 | 40.0% |
| `5M` | 2,016 | 27.3% |
| `soccer` | 1,274 | 17.3% |
| `esports` | 999 | 13.5% |
| `bitcoin` | 694 | 9.4% |
| `ethereum` | 682 | 9.2% |
| `15M` | 672 | 9.1% |
| `tennis` | 661 | 9.0% |
| `weather` | 649 | 8.8% |
| `daily-temperature` | 649 | 8.8% |
| `1H` | 638 | 8.6% |
| `rewards-automation-50-4pt5-50` | 600 | 8.1% |
| `highest-temperature` | 561 | 7.6% |
| `multi-strikes` | 514 | 7.0% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| BNB Up or Down | 414 | 5.6% |
| Dogecoin Up or Down | 414 | 5.6% |
| XRP Up or Down | 414 | 5.6% |
| Solana Up or Down | 414 | 5.6% |
| Ethereum Up or Down | 414 | 5.6% |
| Bitcoin Up or Down | 414 | 5.6% |
| Hyperliquid Up or Down | 390 | 5.3% |
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
| +0h | 209 | ███████ |
| +1h | 331 | ███████████ |
| +2h | 869 | ██████████████████████████████ |
| +3h | 344 | ████████████ |
| +4h | 275 | █████████ |
| +5h | 290 | ██████████ |
| +6h | 456 | ████████████████ |
| +7h | 300 | ██████████ |
| +8h | 454 | ████████████████ |
| +9h | 431 | ███████████████ |
| +10h | 296 | ██████████ |
| +11h | 256 | █████████ |
| +12h | 251 | █████████ |
| +13h | 286 | ██████████ |
| +14h | 319 | ███████████ |
| +15h | 264 | █████████ |
| +16h | 231 | ████████ |
| +17h | 165 | ██████ |
| +18h | 222 | ████████ |
| +19h | 176 | ██████ |
| +20h | 156 | █████ |
| +21h | 155 | █████ |
| +22h | 230 | ████████ |
| +23h | 419 | ██████████████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 7,385 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
