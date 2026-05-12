# pm-bench snapshot — 2026-05-11

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 5,348 |
| Unique markets (by id) | 5,348 |
| Unique events (Polymarket grouping) | 3,202 |
| Unique templates (digits stripped, trimmed at first ` - `) | 282 |
| polled_at min | 2026-05-07T08:59:12.479Z |
| polled_at max | 2026-05-07T08:59:12.479Z |
| endDate min | 2026-05-07T09:00:00Z |
| endDate max | 2026-05-08T08:55:00Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +5,348 | 5,348 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,730 | 2,618 | 49.0% |
| Drop: Pyth Network (Gate 1c) | -42 | 2,576 | 48.2% |
| Drop: no URL anywhere (Gate 1b) | -69 | 2,507 | 46.9% |

**Post-Gate-1 (IO-addressable): 2,507 markets / 253 unique templates.**
**Gate 1 dropped: 2,730 Chainlink-fed + 69 with no URL anywhere = 2,841 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 1,722 | 32.2% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 2,507 | 46.9% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 785 | 31.3% |
| Non-recurring (true one-off) | 1,722 | 68.7% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Esports match | 1,173 | 46.8% | 77 | 77 | 0 | IO-shaped |
| Weather forecast | 430 | 17.2% | 57 | 57 | 430 | IO-shaped |
| Sports match | 346 | 13.8% | 28 | 55 | 0 | IO-shaped |
| News / other | 258 | 10.3% | 20 | 23 | 136 | IO-shaped |
| Crypto price feed | 228 | 9.1% | 27 | 188 | 219 | deterministic feed (IO not useful) |
| Stock close threshold | 72 | 2.9% | 44 | 44 | 0 | deterministic feed (IO not useful) |

**Truly IO-shaped (drop deterministic feeds): 2,207 markets / 182 unique templates.**

### Top 3 templates per kind

- **Esports match** — `LoL: Dplus KIA vs KT Rolster (BO#)` (49), `LoL: HMBLE vs Colossal Gaming (BO#)` (39), `LoL: Weibo Gaming vs Team WE (BO#)` (37)
- **Weather forecast** — `Lowest temperature in Hong Kong on May #?` (11), `Highest temperature in London on May #?` (11), `Highest temperature in Sao Paulo on May #?` (11)
- **Sports match** — `Cavaliers vs. Pistons` (37), `Aston Villa FC vs. Nottingham Forest FC` (34), `SC Freiburg vs. SC Braga` (34)
- **News / other** — `## Free App in the US Apple App Store on May #?` (42), `What will be said on the next All-In Podcast? (May #)` (25), `Bitcoin above ___ on May #, #AM ET?` (20)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)
- **Stock close threshold** — `Apple (AAPL) closes above ___ on May #?` (5), `Microsoft (MSFT) closes above ___ on May #?` (5), `Amazon (AMZN) closes above ___ on May #?` (5)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,730 / 5,348 (51.0%)**

> Decision signal: hit rate ≥ 50%. The URL-prefix rule alone disposes of half the universe. Build it first; LLM rubric can wait.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 69 / 5,348 (1.3%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,730 | 51.0% |
| `www.twitch.tv` | 743 | 13.9% |
| `(empty)` | 411 | 7.7% |
| `www.wunderground.com` | 388 | 7.3% |
| `kick.com` | 284 | 5.3% |
| `www.binance.com` | 175 | 3.3% |
| `www.uefa.com` | 92 | 1.7% |
| `www.dotabuff.com` | 68 | 1.3% |
| `conmebollibertadores.com` | 60 | 1.1% |
| `www.conmebol.com` | 48 | 0.9% |
| `pythdata.app` | 42 | 0.8% |
| `www.youtube.com` | 40 | 0.7% |
| `www.nba.com` | 38 | 0.7% |
| `seekingalpha.com` | 37 | 0.7% |
| `www.efa.com.eg` | 36 | 0.7% |
| `www.frmf.ma` | 36 | 0.7% |
| `finance.yahoo.com` | 35 | 0.7% |
| `play-origin.sooplive.com` | 16 | 0.3% |
| `www.ligagt.org` | 14 | 0.3% |
| `www.slstat.com` | 12 | 0.2% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `hide-from-new` | 3,638 | 68.0% |
| `recurring` | 3,515 | 65.7% |
| `crypto` | 3,085 | 57.7% |
| `crypto-prices` | 3,083 | 57.6% |
| `up-or-down` | 2,956 | 55.3% |
| `5M` | 2,016 | 37.7% |
| `sports` | 1,534 | 28.7% |
| `games` | 1,519 | 28.4% |
| `esports` | 1,173 | 21.9% |
| `15M` | 672 | 12.6% |
| `league-of-legends` | 646 | 12.1% |
| `bitcoin` | 474 | 8.9% |
| `ethereum` | 472 | 8.8% |
| `solana` | 447 | 8.4% |
| `xrp` | 447 | 8.4% |
| `ripple` | 447 | 8.4% |
| `weather` | 436 | 8.2% |
| `daily-temperature` | 430 | 8.0% |
| `dogecoin` | 415 | 7.8% |
| `hype` | 415 | 7.8% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| Bitcoin Up or Down | 414 | 7.7% |
| Ethereum Up or Down | 414 | 7.7% |
| Solana Up or Down | 414 | 7.7% |
| XRP Up or Down | 414 | 7.7% |
| Dogecoin Up or Down | 414 | 7.7% |
| BNB Up or Down | 414 | 7.7% |
| Hyperliquid Up or Down | 390 | 7.3% |
| LoL: Dplus KIA vs KT Rolster (BO#) | 49 | 0.9% |
| ## Free App in the US Apple App Store on May #? | 42 | 0.8% |
| LoL: HMBLE vs Colossal Gaming (BO#) | 39 | 0.7% |
| LoL: Weibo Gaming vs Team WE (BO#) | 37 | 0.7% |
| LoL: HANJIN BRION vs BNK FEARX (BO#) | 37 | 0.7% |
| Cavaliers vs. Pistons | 37 | 0.7% |
| Dota #: #win vs Team Nemesis (BO#) | 36 | 0.7% |
| LoL: Ninjas in Pyjamas vs Anyone's Legend (BO#) | 35 | 0.7% |
| Aston Villa FC vs. Nottingham Forest FC | 34 | 0.6% |
| SC Freiburg vs. SC Braga | 34 | 0.6% |
| Dota #: L#ga Team vs MOUZ (BO#) | 32 | 0.6% |
| LoL: Vitality.Bee vs Galions (BO#) | 25 | 0.5% |
| What will be said on the next All-In Podcast? (May #) | 25 | 0.5% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +0h | 160 | ████████ |
| +1h | 157 | ████████ |
| +2h | 128 | ██████ |
| +3h | 608 | ██████████████████████████████ |
| +4h | 184 | █████████ |
| +5h | 205 | ██████████ |
| +6h | 250 | ████████████ |
| +7h | 291 | ██████████████ |
| +8h | 172 | ████████ |
| +9h | 243 | ████████████ |
| +10h | 301 | ███████████████ |
| +11h | 268 | █████████████ |
| +12h | 318 | ████████████████ |
| +13h | 271 | █████████████ |
| +14h | 246 | ████████████ |
| +15h | 426 | █████████████████████ |
| +16h | 148 | ███████ |
| +17h | 164 | ████████ |
| +18h | 136 | ███████ |
| +19h | 186 | █████████ |
| +20h | 122 | ██████ |
| +21h | 119 | ██████ |
| +22h | 119 | ██████ |
| +23h | 126 | ██████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 5,348 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
