# pm-bench snapshot — 2026-05-11

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 9,446 |
| Unique markets (by id) | 9,446 |
| Unique events (Polymarket grouping) | 3,591 |
| Unique templates (digits stripped, trimmed at first ` - `) | 342 |
| polled_at min | 2026-05-09T10:08:24.064Z |
| polled_at max | 2026-05-09T10:08:24.064Z |
| endDate min | 2026-05-09T10:10:00Z |
| endDate max | 2026-05-10T10:00:00Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +9,446 | 9,446 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,723 | 6,723 | 71.2% |
| Drop: Pyth Network (Gate 1c) | -0 | 6,723 | 71.2% |
| Drop: no URL anywhere (Gate 1b) | -25 | 6,698 | 70.9% |

**Post-Gate-1 (IO-addressable): 6,698 markets / 337 unique templates.**
**Gate 1 dropped: 2,723 Chainlink-fed + 25 with no URL anywhere = 2,748 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 6,048 | 64.0% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 6,698 | 70.9% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 650 | 9.7% |
| Non-recurring (true one-off) | 6,048 | 90.3% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sports match | 4,335 | 64.7% | 179 | 540 | 0 | IO-shaped |
| Esports match | 1,007 | 15.0% | 64 | 64 | 0 | IO-shaped |
| News / other | 733 | 10.9% | 17 | 22 | 33 | IO-shaped |
| Weather forecast | 405 | 6.0% | 59 | 59 | 399 | IO-shaped |
| Crypto price feed | 218 | 3.3% | 18 | 179 | 218 | deterministic feed (IO not useful) |

**Truly IO-shaped (drop deterministic feeds): 6,480 markets / 319 unique templates.**

### Top 3 templates per kind

- **Sports match** — `Liverpool FC vs. Chelsea FC` (64), `TSG # Hoffenheim vs. SV Werder Bremen` (64), `Brighton & Hove Albion FC vs. Wolverhampton Wanderers FC` (64)
- **Esports match** — `LoL: LOS vs Fluxo W#M (BO#)` (63), `LoL: KT Rolster vs BNK FEARX (BO#)` (58), `Dota #: Yellow Submarine vs Tundra Esports (BO#)` (57)
- **News / other** — `PGA Tour: Truist Championship Top #` (216), `PGA Tour: ONEflight Myrtle Beach Classic Top #` (207), `PGA Tour: Truist Championship Winner` (93)
- **Weather forecast** — `Lowest temperature in Hong Kong on May #?` (11), `Highest temperature in London on May #?` (11), `Highest temperature in Paris on May #?` (11)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,723 / 9,446 (28.8%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 25 / 9,446 (0.3%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,723 | 28.8% |
| `www.twitch.tv` | 719 | 7.6% |
| `www.jleague.jp` | 606 | 6.4% |
| `www.pgatour.com` | 423 | 4.5% |
| `(empty)` | 419 | 4.4% |
| `www.mlssoccer.com` | 384 | 4.1% |
| `www.bundesliga.com` | 379 | 4.0% |
| `www.wunderground.com` | 354 | 3.7% |
| `www.premierleague.com` | 299 | 3.2% |
| `www.cbf.com.br` | 288 | 3.0% |
| `www.laliga.com` | 267 | 2.8% |
| `www.binance.com` | 175 | 1.9% |
| `www.fortunaliga.cz` | 160 | 1.7% |
| `kick.com` | 153 | 1.6% |
| `www.legaseriea.it` | 138 | 1.5% |
| `www.afa.com.ar` | 136 | 1.4% |
| `www.ligue2.fr` | 128 | 1.4% |
| `tff.org` | 126 | 1.3% |
| `www.ufc.com` | 121 | 1.3% |
| `www.dotabuff.com` | 103 | 1.1% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `sports` | 5,950 | 63.0% |
| `games` | 5,342 | 56.6% |
| `soccer` | 4,054 | 42.9% |
| `hide-from-new` | 3,373 | 35.7% |
| `recurring` | 3,373 | 35.7% |
| `crypto-prices` | 2,974 | 31.5% |
| `crypto` | 2,974 | 31.5% |
| `up-or-down` | 2,898 | 30.7% |
| `5M` | 2,009 | 21.3% |
| `esports` | 1,068 | 11.3% |
| `15M` | 672 | 7.1% |
| `golf` | 607 | 6.4% |
| `pga` | 607 | 6.4% |
| `pga-tour` | 607 | 6.4% |
| `league-of-legends` | 439 | 4.6% |
| `solana` | 436 | 4.6% |
| `xrp` | 436 | 4.6% |
| `ripple` | 436 | 4.6% |
| `ethereum` | 435 | 4.6% |
| `bitcoin` | 425 | 4.5% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| Dogecoin Up or Down | 413 | 4.4% |
| Ethereum Up or Down | 413 | 4.4% |
| Solana Up or Down | 413 | 4.4% |
| Bitcoin Up or Down | 413 | 4.4% |
| XRP Up or Down | 413 | 4.4% |
| BNB Up or Down | 413 | 4.4% |
| Hyperliquid Up or Down | 389 | 4.1% |
| PGA Tour: Truist Championship Top # | 216 | 2.3% |
| PGA Tour: ONEflight Myrtle Beach Classic Top # | 207 | 2.2% |
| PGA Tour: Truist Championship Winner | 93 | 1.0% |
| PGA Tour: ONEflight Myrtle Beach Classic Winner | 91 | 1.0% |
| Liverpool FC vs. Chelsea FC | 64 | 0.7% |
| TSG # Hoffenheim vs. SV Werder Bremen | 64 | 0.7% |
| Brighton & Hove Albion FC vs. Wolverhampton Wanderers FC | 64 | 0.7% |
| LoL: LOS vs Fluxo W#M (BO#) | 63 | 0.7% |
| VfL Wolfsburg vs. FC Bayern München | 61 | 0.6% |
| Fulham FC vs. AFC Bournemouth | 59 | 0.6% |
| VfB Stuttgart vs. Bayer # Leverkusen | 58 | 0.6% |
| LoL: KT Rolster vs BNK FEARX (BO#) | 58 | 0.6% |
| Sunderland AFC vs. Manchester United FC | 57 | 0.6% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +0h | 194 | █████ |
| +1h | 908 | ███████████████████████ |
| +2h | 264 | ███████ |
| +3h | 752 | ███████████████████ |
| +4h | 415 | ███████████ |
| +5h | 443 | ███████████ |
| +6h | 647 | █████████████████ |
| +7h | 428 | ███████████ |
| +8h | 511 | █████████████ |
| +9h | 219 | ██████ |
| +10h | 310 | ████████ |
| +11h | 317 | ████████ |
| +12h | 182 | █████ |
| +13h | 1,160 | ██████████████████████████████ |
| +14h | 405 | ██████████ |
| +15h | 264 | ███████ |
| +16h | 241 | ██████ |
| +17h | 309 | ████████ |
| +18h | 571 | ███████████████ |
| +19h | 221 | ██████ |
| +20h | 183 | █████ |
| +21h | 187 | █████ |
| +22h | 119 | ███ |
| +23h | 196 | █████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 9,446 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
