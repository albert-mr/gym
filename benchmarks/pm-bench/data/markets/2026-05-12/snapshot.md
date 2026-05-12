# pm-bench snapshot — 2026-05-12

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 6,101 |
| Unique markets (by id) | 6,101 |
| Unique events (Polymarket grouping) | 3,283 |
| Unique templates (digits stripped, trimmed at first ` - `) | 277 |
| polled_at min | 2026-05-12T09:08:12.457Z |
| polled_at max | 2026-05-12T09:08:12.457Z |
| endDate min | 2026-05-12T09:10:00Z |
| endDate max | 2026-05-13T09:05:00Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +6,101 | 6,101 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,728 | 3,373 | 55.3% |
| Drop: Pyth Network (Gate 1c) | -42 | 3,331 | 54.6% |
| Drop: no URL anywhere (Gate 1b) | -20 | 3,311 | 54.3% |

**Post-Gate-1 (IO-addressable): 3,311 markets / 250 unique templates.**
**Gate 1 dropped: 2,728 Chainlink-fed + 20 with no URL anywhere = 2,790 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 2,540 | 41.6% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 3,311 | 54.3% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 771 | 23.3% |
| Non-recurring (true one-off) | 2,540 | 76.7% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sports match | 1,377 | 41.6% | 51 | 169 | 0 | IO-shaped |
| Esports match | 1,022 | 30.9% | 85 | 85 | 0 | IO-shaped |
| Weather forecast | 437 | 13.2% | 57 | 57 | 437 | IO-shaped |
| Crypto price feed | 228 | 6.9% | 27 | 188 | 219 | deterministic feed (IO not useful) |
| News / other | 209 | 6.3% | 20 | 20 | 115 | IO-shaped |
| Stock close threshold | 38 | 1.1% | 10 | 10 | 0 | deterministic feed (IO not useful) |

**Truly IO-shaped (drop deterministic feeds): 3,045 markets / 213 unique templates.**

### Top 3 templates per kind

- **Sports match** — `RC Celta de Vigo vs. Levante UD` (51), `Real Betis Balompié vs. Elche CF` (50), `CA Osasuna vs. Club Atlético de Madrid` (47)
- **Esports match** — `LoL: paiN Gaming Academy vs #REX (BO#)` (39), `LoL: Top Esports vs Ninjas in Pyjamas (BO#)` (37), `LoL: Invictus Gaming vs Bilibili Gaming (BO#)` (37)
- **Weather forecast** — `Lowest temperature in Hong Kong on May #?` (11), `Highest temperature in London on May #?` (11), `Highest temperature in Paris on May #?` (11)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)
- **News / other** — `What will be said on the next Lemonade Stand Podcast? (May #…` (23), `Elon Musk # tweets May #` (21), `What price will Bitcoin hit on May #?` (15)
- **Stock close threshold** — `Apple (AAPL) closes above ___ on May #?` (5), `Microsoft (MSFT) closes above ___ on May #?` (5), `Amazon (AMZN) closes above ___ on May #?` (5)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,728 / 6,101 (44.7%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 20 / 6,101 (0.3%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,728 | 44.7% |
| `www.twitch.tv` | 594 | 9.7% |
| `www.wunderground.com` | 395 | 6.5% |
| `kick.com` | 247 | 4.0% |
| `(empty)` | 242 | 4.0% |
| `www.binance.com` | 175 | 2.9% |
| `www.laliga.com` | 148 | 2.4% |
| `upl.ua` | 136 | 2.2% |
| `www.fortunaliga.cz` | 128 | 2.1% |
| `www.cbf.com.br` | 116 | 1.9% |
| `www.efa.com.eg` | 108 | 1.8% |
| `spfl.co.uk` | 102 | 1.7% |
| `www.kleague.com` | 96 | 1.6% |
| `lfpb.com.bo` | 96 | 1.6% |
| `x.com` | 71 | 1.2% |
| `www.legaserieb.it` | 68 | 1.1% |
| `dimayor.com.co` | 68 | 1.1% |
| `www.slstat.com` | 64 | 1.0% |
| `liquipedia.net` | 50 | 0.8% |
| `gol.gg` | 46 | 0.8% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `hide-from-new` | 3,588 | 58.8% |
| `recurring` | 3,499 | 57.4% |
| `crypto` | 3,062 | 50.2% |
| `crypto-prices` | 3,060 | 50.2% |
| `up-or-down` | 2,954 | 48.4% |
| `games` | 2,399 | 39.3% |
| `sports` | 2,399 | 39.3% |
| `5M` | 2,014 | 33.0% |
| `soccer` | 1,316 | 21.6% |
| `esports` | 1,035 | 17.0% |
| `15M` | 672 | 11.0% |
| `ethereum` | 462 | 7.6% |
| `bitcoin` | 462 | 7.6% |
| `counter-strike-2` | 453 | 7.4% |
| `xrp` | 447 | 7.3% |
| `ripple` | 447 | 7.3% |
| `solana` | 447 | 7.3% |
| `weather` | 437 | 7.2% |
| `daily-temperature` | 437 | 7.2% |
| `rewards-automation-50-4pt5-50` | 426 | 7.0% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| BNB Up or Down | 414 | 6.8% |
| XRP Up or Down | 414 | 6.8% |
| Solana Up or Down | 414 | 6.8% |
| Ethereum Up or Down | 414 | 6.8% |
| Dogecoin Up or Down | 413 | 6.8% |
| Bitcoin Up or Down | 413 | 6.8% |
| Hyperliquid Up or Down | 390 | 6.4% |
| RC Celta de Vigo vs. Levante UD | 51 | 0.8% |
| Real Betis Balompié vs. Elche CF | 50 | 0.8% |
| CA Osasuna vs. Club Atlético de Madrid | 47 | 0.8% |
| LoL: paiN Gaming Academy vs #REX (BO#) | 39 | 0.6% |
| LoL: Top Esports vs Ninjas in Pyjamas (BO#) | 37 | 0.6% |
| LoL: Invictus Gaming vs Bilibili Gaming (BO#) | 37 | 0.6% |
| Dota #: Two Move vs Power Rangers (BO#) | 36 | 0.6% |
| FK Oleksandriya vs. FK Zorya Luhansk | 34 | 0.6% |
| FK Epitsentr Dunaivtsi vs. FK Polissia | 34 | 0.6% |
| FK Metalist # Kharkiv vs. FK Karpaty Lviv | 34 | 0.6% |
| RNK Veres Rivne vs. FK Kryvbas Kryvyi Rih | 34 | 0.6% |
| Modena FC # vs. SS Juve Stabia | 34 | 0.6% |
| Red Star FC vs. Rodez Aveyron Football | 34 | 0.6% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +0h | 178 | █████████ |
| +1h | 223 | ███████████ |
| +2h | 607 | ██████████████████████████████ |
| +3h | 196 | ██████████ |
| +4h | 255 | █████████████ |
| +5h | 404 | ████████████████████ |
| +6h | 438 | ██████████████████████ |
| +7h | 333 | ████████████████ |
| +8h | 280 | ██████████████ |
| +9h | 390 | ███████████████████ |
| +10h | 299 | ███████████████ |
| +11h | 242 | ████████████ |
| +12h | 261 | █████████████ |
| +13h | 247 | ████████████ |
| +14h | 310 | ███████████████ |
| +15h | 226 | ███████████ |
| +16h | 197 | ██████████ |
| +17h | 163 | ████████ |
| +18h | 211 | ██████████ |
| +19h | 128 | ██████ |
| +20h | 131 | ██████ |
| +21h | 119 | ██████ |
| +22h | 126 | ██████ |
| +23h | 137 | ███████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 6,101 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
