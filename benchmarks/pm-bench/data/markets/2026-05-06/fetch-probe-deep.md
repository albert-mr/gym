# Deep fetch-probe — 2026-05-06 yesterday's markets

Probed against the local genvm-webdriver (`http://127.0.0.1:4444`) on 2026-05-07. For each market the agentic step uses WebSearch (or rules) to find a *deep* URL likely to contain the resolution data, instead of the bare domain root that polling captured. The webdriver fetch is what a validator running `gl.nondet.web.render(url)` would observe.

## Per-market

### 1. `2164466` — BTC up/down 6:15-6:30 ET May 6 (Chainlink)
- **Source kind:** Chainlink stream (`data.chain.link/streams/btc-usd`).
- **Decision:** skipped. Chainlink streams are not a renderable webpage — they're feeds. pm-bench Gate 1 already drops Chainlink markets as `not-fit`. Including this market in the deep-probe would be a category error.

### 2/5. `2061882` + `2061884` — Bayern–PSG (UCL semi-final 2nd leg)
- **Named domain:** `uefa.com`
- **Agentic discovery:** WebSearch site:uefa.com → match page + highlights article.
- **Probed deep URL:** `https://www.uefa.com/.../news/...bayern-1-1-paris-agg-5-6-highlights-ousmane-dembele-takes-h/`
- **Webdriver result:** 200 OK, ~7 KB rendered text. Score "1-1", aggregate "5-6", scorers, line-ups all present.
- **Resolution check:** Bayern 1-1 Paris in regulation → both "Will X win?" markets resolve **NO**. The body unambiguously contains this.
- **Side note:** the *match page* (`.../match/2048073...`) returned ~250 bytes on default settings (SPA loaded only nav stub). With `waitUntil=networkidle2` and `waitAfterLoaded=4` it grew to 6 KB but was dominated by a cookie consent overlay — still no score visible. **News articles outperform match pages on UEFA's domain.**

### 3. `922766` — SNP most seats in 2026 Scottish Parliament election
- **Named domain:** *(empty in poll data)*
- **Agentic discovery:** WebSearch → `parliament.scot/msps/elections/election-2026` plus competitive sources (BBC, Wikipedia, ballotbox.scot).
- **Probed deep URL:** `https://www.parliament.scot/msps/elections/election-2026`
- **Webdriver result:** 200 OK, ~3.5 KB clean text. But content is structural ("129 MSPs, 8 regions, how voting works") — no results.
- **Resolution check:** the vote was on 2026-05-07 (today); counting starts 9 AM 2026-05-08. **Results do not yet exist anywhere on the web.** Even perfect agentic discovery cannot resolve this market today. Re-probe on 2026-05-08+.

### 4. `2116636` — BTC above $86k on May 6
- **Named domain:** *(empty in poll data; PM rules pin Binance)*
- **Two attempts:**
  - **Binance (binding):** `https://www.binance.com/en/trade/BTC_USDT` → webdriver returns `Resulting-Status: 202` with empty body. Binance hard-blocks headless Chromium.
  - **CoinMarketCap (alternate):** `https://coinmarketcap.com/currencies/bitcoin/historical-data/` → 200 OK, 40 KB rendered. Body contains the exact row: `May 06, 2026 $80,930.74 $82,792.21 $80,751.02 $81,427.53`.
- **Resolution check:** May 6 high was $82,792.21, well below $86,000. Market resolves **NO**.
- **Real signal:** the *binding* source is unfetchable from validator-equivalent infra. The *correct answer* is fetchable, but only from a non-binding source. Resolving this market via CMC would violate the rules-as-written even though it agrees with reality. **This is exactly the kind of source-vs-data divergence Gate 3 should be surfacing.**

## Headline findings (5 markets, 6 probes)

| pattern | count | what it teaches |
|---|---|---|
| **Deep URL transforms thin into rich body** | 1 (UEFA news article vs domain root) | Domain-root probing systematically under-reports fetchability. The agentic step is doing real work. |
| **Match-page SPAs are bot-hostile** | 1 (UEFA `/match/...`) | Even with `networkidle2` + extra wait, cookie wall blocks score. Article URLs win on the same domain. |
| **Binding source unfetchable; alternate source fine** | 1 (Binance vs CMC) | The hardest case for IO. If the rules pin a Cloudflare-protected domain, no amount of agentic discovery within rules saves us. |
| **Result not yet published anywhere** | 1 (Scottish election) | Discovery can't synthesize data that doesn't exist. Probe-time relative to event-time matters; we should re-probe after `endDate + N hours`. |
| **Skip-by-design** | 1 (Chainlink) | Already handled by Gate 1; the deep-probe pipeline shouldn't even see these. |

## What this means for v1 of the probe

The "raw URL only" probe we built today has clear failure modes that the agentic step fixes for free on at least one class of source (news/long-form pages on the same domain as the polled URL). Three concrete next moves, in order of value:

1. **Inside the polled domain, prefer article/canonical URLs over the root.** Easiest win. Even a per-domain rule list would help (e.g., `uefa.com` → search news index for the event title; `wunderground.com/history/daily/...` → use the named historical URL with date verified before probing).

2. **Probe relative to event-time, not poll-time.** Polling captures the URL up-front; resolution reality lands hours-to-days later. The probe should run on `endDate + buffer`, not `polled_at`.

3. **When the binding source is unfetchable, that is itself the finding** — flag it loudly (it's the highest-value Gate 3 signal: this market structurally cannot be IO-resolved as written). Don't silently substitute alternate sources; report the gap.

## Caveat on this run

This was a manual five-market exploration, not a CLI. Discovery used WebSearch on this agent; the webdriver calls were curl commands. Codifying this into a `pm-bench fetch-probe-deep` CLI requires:
- a search backend the codified version can call (the `WebSearch` API I used here isn't redistributable to a CLI)
- per-domain heuristics or an LLM step to pick the deep URL given the market
- a verification step (substring match against expected outcome words, or a small LLM check)

Worth doing once we know what we'd be codifying — these five probes are the design data for that.
