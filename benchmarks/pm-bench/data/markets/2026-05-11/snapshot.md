# pm-bench snapshot — 2026-05-11

Universe: Polymarket markets resolving in the next 24h, `closed=false`.

## Header

| Metric | Value |
| --- | --- |
| Total rows (incl. duplicates from multi-poll days) | 6,125 |
| Unique markets (by id) | 6,125 |
| Unique events (Polymarket grouping) | 3,272 |
| Unique templates (digits stripped, trimmed at first ` - `) | 291 |
| polled_at min | 2026-05-11T10:32:47.683Z |
| polled_at max | 2026-05-11T10:32:47.683Z |
| endDate min | 2026-05-11T10:35:00Z |
| endDate max | 2026-05-12T10:30:00Z |

## Funnel — what IO can solve and what it can't

| Step | Δ | Remaining | % of total |
| --- | ---: | ---: | ---: |
| Total polled | +6,125 | 6,125 | 100.0% |
| Drop: Chainlink-fed (Gate 1a) | -2,723 | 3,402 | 55.5% |
| Drop: Pyth Network (Gate 1c) | -41 | 3,361 | 54.9% |
| Drop: no URL anywhere (Gate 1b) | -297 | 3,064 | 50.0% |

**Post-Gate-1 (IO-addressable): 3,064 markets / 255 unique templates.**
**Gate 1 dropped: 2,723 Chainlink-fed + 297 with no URL anywhere = 3,061 markets.**

## Coverage scenarios

| Scenario | Markets | Coverage | Description |
| --- | ---: | ---: | --- |
| One-off only | 2,341 | 38.2% | IO-addressable AND not tagged `recurring` (true novelty) |
| Post-Gate-1 (deterministic exclusion) | 3,064 | 50.0% | Drop Chainlink-fed AND drop markets with no URL anywhere |

Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.

## Recurring vs one-off (within IO-addressable)

| Bucket | Markets | % of IO-addressable |
| --- | ---: | ---: |
| Recurring (templated, fans out daily) | 723 | 23.6% |
| Non-recurring (true one-off) | 2,341 | 76.4% |

## Kinds of markets (within IO-addressable)

| Kind | Markets | % | Templates | Events | Recurring | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Sports match | 1,184 | 38.6% | 38 | 134 | 0 | IO-shaped |
| Esports match | 877 | 28.6% | 89 | 89 | 0 | IO-shaped |
| Weather forecast | 388 | 12.7% | 58 | 58 | 388 | IO-shaped |
| News / other | 344 | 11.2% | 28 | 30 | 116 | IO-shaped |
| Crypto price feed | 228 | 7.4% | 27 | 188 | 219 | deterministic feed (IO not useful) |
| Stock close threshold | 43 | 1.4% | 15 | 15 | 0 | deterministic feed (IO not useful) |

**Truly IO-shaped (drop deterministic feeds): 2,793 markets / 213 unique templates.**

### Top 3 templates per kind

- **Sports match** — `SSC Napoli vs. Bologna FC #` (52), `Tottenham Hotspur FC vs. Leeds United FC` (52), `Rayo Vallecano de Madrid vs. Girona FC` (51)
- **Esports match** — `Dota #: #win vs PlayTime (BO#)` (40), `LoL: Ei Nerd Esports vs Estral Esports (BO#)` (39), `LoL: Ozarox Esports vs SU Esports (BO#)` (24)
- **Weather forecast** — `Lowest temperature in Hong Kong on May #?` (11), `Highest temperature in Sao Paulo on May #?` (11), `Highest temperature in Buenos Aires on May #?` (11)
- **News / other** — `## Free App in the US Apple App Store on May #?` (42), `Eurovision #: First Semi-Final Winner` (27), `Eurovision #: Second Semi-Final Winner` (27)
- **Crypto price feed** — `Bitcoin Up or Down` (24), `Ethereum Up or Down` (24), `Solana Up or Down` (24)
- **Stock close threshold** — `Apple (AAPL) closes above ___ on May #?` (5), `Microsoft (MSFT) closes above ___ on May #?` (5), `Amazon (AMZN) closes above ___ on May #?` (5)

## Gate 1 — deterministic exclusion

Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).

### Gate 1a — Chainlink-fed

Markets whose `eventResolutionSource` starts with one of: `https://data.chain.link/`, `https://reference.chainlink.com/`.

**Gate 1a hit rate: 2,723 / 6,125 (44.5%)**

> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.

### Gate 1b — no URL anywhere

Markets where neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.

**Gate 1b hit rate: 297 / 6,125 (4.8%)**

> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.

## Resolution-source domains (top 20)

| Domain | Count | % |
| --- | ---: | ---: |
| `data.chain.link` | 2,723 | 44.5% |
| `(empty)` | 694 | 11.3% |
| `www.twitch.tv` | 490 | 8.0% |
| `www.wunderground.com` | 347 | 5.7% |
| `www.ligaportugal.pt` | 238 | 3.9% |
| `kick.com` | 199 | 3.2% |
| `www.binance.com` | 175 | 2.9% |
| `www.nba.com` | 101 | 1.6% |
| `premierliga.ru` | 96 | 1.6% |
| `www.frmf.ma` | 96 | 1.6% |
| `www.kleague.com` | 96 | 1.6% |
| `www.laliga.com` | 85 | 1.4% |
| `www.lpf.ro` | 68 | 1.1% |
| `www.slstat.com` | 64 | 1.0% |
| `liga1.pe` | 64 | 1.0% |
| `www.huya.com` | 55 | 0.9% |
| `www.legaseriea.it` | 52 | 0.8% |
| `www.premierleague.com` | 52 | 0.8% |
| `liquipedia.net` | 44 | 0.7% |
| `pythdata.app` | 41 | 0.7% |

## Top tags (top 20)

| Tag | Count | % of rows |
| --- | ---: | ---: |
| `hide-from-new` | 3,537 | 57.7% |
| `recurring` | 3,446 | 56.3% |
| `crypto` | 3,058 | 49.9% |
| `crypto-prices` | 3,054 | 49.9% |
| `up-or-down` | 2,948 | 48.1% |
| `sports` | 2,061 | 33.6% |
| `games` | 2,061 | 33.6% |
| `5M` | 2,009 | 32.8% |
| `soccer` | 1,063 | 17.4% |
| `esports` | 890 | 14.5% |
| `15M` | 672 | 11.0% |
| `counter-strike-2` | 503 | 8.2% |
| `bitcoin` | 463 | 7.6% |
| `ethereum` | 461 | 7.5% |
| `solana` | 445 | 7.3% |
| `xrp` | 445 | 7.3% |
| `ripple` | 445 | 7.3% |
| `dogecoin` | 414 | 6.8% |
| `bnb` | 414 | 6.8% |
| `hype` | 414 | 6.8% |

## Event-title prefix clusters (top 20)

Digits replaced with `#` and trimmed at the first ` - ` for clustering.

| Prefix | Count | % |
| --- | ---: | ---: |
| Dogecoin Up or Down | 413 | 6.7% |
| Solana Up or Down | 413 | 6.7% |
| BNB Up or Down | 413 | 6.7% |
| Bitcoin Up or Down | 413 | 6.7% |
| XRP Up or Down | 413 | 6.7% |
| Ethereum Up or Down | 413 | 6.7% |
| Hyperliquid Up or Down | 389 | 6.4% |
| SSC Napoli vs. Bologna FC # | 52 | 0.8% |
| Tottenham Hotspur FC vs. Leeds United FC | 52 | 0.8% |
| Rayo Vallecano de Madrid vs. Girona FC | 51 | 0.8% |
| ## Free App in the US Apple App Store on May #? | 42 | 0.7% |
| Dota #: #win vs PlayTime (BO#) | 40 | 0.7% |
| Pistons vs. Cavaliers | 39 | 0.6% |
| LoL: Ei Nerd Esports vs Estral Esports (BO#) | 39 | 0.6% |
| Thunder vs. Lakers | 37 | 0.6% |
| FC Metaloglobus București vs. FC Hermannstadt | 34 | 0.6% |
| FCSB vs. AFC Unirea Slobozia | 34 | 0.6% |
| SD Huesca vs. Real Sociedad de Fútbol B | 34 | 0.6% |
| Millwall FC vs. Hull City AFC | 34 | 0.6% |
| CF Estrela da Amadora vs. FC Famalicão | 34 | 0.6% |

## End-time histogram (hours from polled_at min)

| +Hour | Count | Bar |
| ---: | ---: | --- |
| +0h | 140 | ██████ |
| +1h | 596 | ████████████████████████ |
| +2h | 165 | ███████ |
| +3h | 255 | ██████████ |
| +4h | 183 | ███████ |
| +5h | 335 | ██████████████ |
| +6h | 289 | ████████████ |
| +7h | 350 | ██████████████ |
| +8h | 642 | ██████████████████████████ |
| +9h | 289 | ████████████ |
| +10h | 210 | █████████ |
| +11h | 184 | ███████ |
| +12h | 160 | ██████ |
| +13h | 739 | ██████████████████████████████ |
| +14h | 165 | ███████ |
| +15h | 199 | ████████ |
| +16h | 141 | ██████ |
| +17h | 205 | ████████ |
| +18h | 153 | ██████ |
| +19h | 119 | █████ |
| +20h | 119 | █████ |
| +21h | 126 | █████ |
| +22h | 119 | █████ |
| +23h | 242 | ██████████ |

## Outcome shapes

| Shape | Count | % |
| --- | ---: | ---: |
| binary | 6,125 | 100.0% |

---
Generated by `@gym/pm-bench` analyze.
