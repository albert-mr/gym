# pm-bench snapshot — 2026-05-06

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 5,743 |
| Unique markets (by id) | 5,743 |
| Unique events (Polymarket grouping) | 3,214 |
| Unique templates (digits stripped, trimmed at first ` - `) | 295 |
| polled_at min | 2026-05-06T10:29:32.335Z |
| polled_at max | 2026-05-06T10:29:32.335Z |
| endDate min | 2026-05-06T10:30:00Z |
| endDate max | 2026-05-07T10:25:00Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +5,743 | 5,743 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,730 | 3,013 | 52.5% |
| Drop: no URL anywhere (Gate 1b) | -379 | 2,634 | 45.9% |

**Post-Gate-1 (IO-addressable): 2,634 markets / 270 unique templates.**
**Gate 1 dropped: 2,730 Chainlink-fed + 379 with no URL anywhere = 3,109 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 1,880 | 32.7% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 2,634 | 45.9% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 754 | 28.6% |
| Non-recurring (true one-off) | 1,880 | 71.4% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Esports match | 1,248 | 47.4% | 82 | 82 | 0 | IO-shaped |
| Sports match | 439 | 16.7% | 37 | 66 | 0 | IO-shaped |
| Weather forecast | 421 | 16.0% | 58 | 58 | 421 | IO-shaped |
| Crypto price feed | 270 | 10.3% | 49 | 210 | 219 | deterministic feed (IO not useful) |
| News / other | 130 | 4.9% | 13 | 13 | 114 | IO-shaped |
| Election / political | 70 | 2.7% | 3 | 3 | 0 | IO-shaped |
| Stock close threshold | 56 | 2.1% | 28 | 28 | 0 | deterministic feed (IO not useful) |

**Truly IO-shaped (drop deterministic feeds): 2,308 markets / 193 unique templates.**

### Top 3 templates per kind

- **Esports match** — `Dota #: Yellow Submarine vs #win (BO#)` (76), `LoL: Gen.G vs Nongshim Red Force (BO#)` (75), `LoL: Team WE vs Invictus Gaming (BO#)` (60)
- **Sports match** — `FC Bayern München vs. Paris Saint-Germain FC` (63), `#ers vs. Knicks` (39), `CSD Mixco vs. CSD Municipal` (14)
- **Weather forecast** — `Lowest temperature in Hong Kong on May #?` (11), `Highest temperature in Sao Paulo on May #?` (11), `Highest temperature in Toronto on May #?` (11)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)
- **News / other** — `What price will Bitcoin hit on May #?` (16), `What price will Ethereum hit on May #?` (14), `Bitcoin price on May #?` (11)
- **Election / political** — `Scotland Parliamentary Election Winner` (24), `What will Trump say during bilateral events with Brazilian P…` (24), `Wales Parliamentary Election Winner` (22)
- **Stock close threshold** — `Apple (AAPL) closes above ___ on May #?` (5), `Microsoft (MSFT) closes above ___ on May #?` (5), `Amazon (AMZN) closes above ___ on May #?` (5)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,730 / 5,743 (47.5%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 379 / 5,743 (6.6%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,730 | 47.5% |
| `(empty)` | 652 | 11.4% |
| `www.twitch.tv` | 651 | 11.3% |
| `www.wunderground.com` | 382 | 6.7% |
| `kick.com` | 317 | 5.5% |
| `www.binance.com` | 175 | 3.0% |
| `www.dotabuff.com` | 123 | 2.1% |
| `conmebollibertadores.com` | 72 | 1.3% |
| `www.conmebol.com` | 72 | 1.3% |
| `www.uefa.com` | 63 | 1.1% |
| `www.csl-china.com` | 48 | 0.8% |
| `hltv.org` | 48 | 0.8% |
| `gol.gg` | 46 | 0.8% |
| `pythdata.app` | 42 | 0.7% |
| `www.nba.com` | 40 | 0.7% |
| `www.frmf.ma` | 36 | 0.6% |
| `finance.yahoo.com` | 35 | 0.6% |
| `www.kick.com` | 33 | 0.6% |
| `www.youtube.com` | 29 | 0.5% |
| `seekingalpha.com` | 21 | 0.4% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `hide-from-new` | 3,591 | 62.5% |
| `recurring` | 3,484 | 60.7% |
| `crypto-prices` | 3,063 | 53.3% |
| `crypto` | 3,063 | 53.3% |
| `up-or-down` | 2,956 | 51.5% |
| `5M` | 2,016 | 35.1% |
| `sports` | 1,702 | 29.6% |
| `games` | 1,687 | 29.4% |
| `esports` | 1,277 | 22.2% |
| `15M` | 672 | 11.7% |
| `league-of-legends` | 585 | 10.2% |
| `bitcoin` | 463 | 8.1% |
| `ethereum` | 461 | 8.0% |
| `solana` | 447 | 7.8% |
| `xrp` | 447 | 7.8% |
| `ripple` | 447 | 7.8% |
| `politics` | 432 | 7.5% |
| `weather` | 421 | 7.3% |
| `daily-temperature` | 421 | 7.3% |
| `dogecoin` | 415 | 7.2% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| Dogecoin Up or Down | 414 | 7.2% |
| BNB Up or Down | 414 | 7.2% |
| Bitcoin Up or Down | 414 | 7.2% |
| Solana Up or Down | 414 | 7.2% |
| XRP Up or Down | 414 | 7.2% |
| Ethereum Up or Down | 414 | 7.2% |
| Hyperliquid Up or Down | 390 | 6.8% |
| Dota #: Yellow Submarine vs #win (BO#) | 76 | 1.3% |
| LoL: Gen.G vs Nongshim Red Force (BO#) | 75 | 1.3% |
| FC Bayern München vs. Paris Saint-Germain FC | 63 | 1.1% |
| LoL: Team WE vs Invictus Gaming (BO#) | 60 | 1.0% |
| Dota #: L#ga Team vs Nigma Galaxy (BO#) | 42 | 0.7% |
| Dota #: MOUZ vs PlayTime (BO#) | 41 | 0.7% |
| LoL: Top Esports vs JD Gaming (BO#) | 40 | 0.7% |
| Dota #: Team Nemesis vs Zero Tenacity (BO#) | 40 | 0.7% |
| #ers vs. Knicks | 39 | 0.7% |
| LoL: Hanwha Life Esports vs DN SOOPers (BO#) | 37 | 0.6% |
| Next First Minister of Scotland? | 34 | 0.6% |
| Next First Minister of Wales? | 33 | 0.6% |
| Tower Hamlets Mayoral Election Winner | 31 | 0.5% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +0h | 152 | ███████ |
| +1h | 643 | ██████████████████████████████ |
| +2h | 199 | █████████ |
| +3h | 234 | ███████████ |
| +4h | 324 | ███████████████ |
| +5h | 285 | █████████████ |
| +6h | 205 | ██████████ |
| +7h | 181 | ████████ |
| +8h | 271 | █████████████ |
| +9h | 302 | ██████████████ |
| +10h | 278 | █████████████ |
| +11h | 268 | █████████████ |
| +12h | 238 | ███████████ |
| +13h | 520 | ████████████████████████ |
| +14h | 175 | ████████ |
| +15h | 198 | █████████ |
| +16h | 139 | ██████ |
| +17h | 190 | █████████ |
| +18h | 137 | ██████ |
| +19h | 321 | ███████████████ |
| +20h | 119 | ██████ |
| +21h | 126 | ██████ |
| +22h | 119 | ██████ |
| +23h | 119 | ██████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 5,743 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
