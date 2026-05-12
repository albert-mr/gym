# GenLayer Gym — Roadmap

**Last updated:** 2026-05-12
**Maintainer:** Albert Martinez (GenLayer Foundation)

GenLayer Gym is the public, reproducible home for benchmarks measuring what GenLayer can do across the ecosystem. This roadmap is what's live, what's next, and what's deferred.

---

## Current state

- **Dashboard** — `apps/web/` (Next.js 15 + shadcn/ui). 8 static routes, deploys to Vercel. Reads daily JSON from `data/<benchmark>/latest.json`.
- **Polymarket benchmark** — Live. Cumulative since May 6, 2026: of 23,915 addressable Polymarket markets, 96.8% are within GenLayer's resolution coverage. Excludes the ~41% of Polymarket resolved by Chainlink/Pyth on-chain feeds.
- **Sources benchmark** — Live (v1 derived from pm-bench). 78 unique source hosts tracked: 72 working, 6 blocked.

## Headline framing

The Polymarket benchmark headline is **forward-looking inference**: GenLayer has been verified on representative markets per source family; we claim every market on those families would resolve the same way. It's a model of what GenLayer can do, not a per-market record. The dashboard's methodology page documents this in plain prose.

Future benchmarks must follow the same rule: the headline is what the system can do today, and the methodology page declares exactly what's been verified.

---

## What's next

Priority order. Each item has a clear definition of done.

### 1. Ship publicly

Deploy `apps/web/` to Vercel under `gym.genlayer.foundation`. Done when the dashboard is reachable on a public URL.

### 2. Daily refresh automation

GitHub Action on a cron: poll → analyze → poll-closed → build-data-json → commit `data/pm-bench/`. Done when the dashboard reflects yesterday's resolutions without manual work.

### 3. Accuracy backtest

Replay every closed Polymarket market through a local LLM with the same prompt the intelligent oracle uses; compare the LLM's output against Polymarket's settlement. Turns the forward-looking-inference headline into a per-market accuracy claim.

Done when the dashboard's methodology page shows a real accuracy number per category, replacing the inferred number.

### 4. Sources benchmark v2

Stand up an independent pipeline that probes sources directly (local webdriver + on-chain fetcher + ground-truth check), rather than deriving from pm-bench's domain table. Start with newspapers, expand to government data and public APIs.

Done when `/benchmarks/sources-bench` shows results from its own probes instead of pm-bench-derived data.

### 5. Real-network credibility check

When GenLayer's real testnet is available, run the same source-family probes there and update the methodology page to reflect production-network results. Done when the dashboard distinguishes development-environment-verified from real-network-verified per source family.

---

## Out of scope

- **Backfilling historical Polymarket markets.** We grade what we attempt going forward, not history.
- **Content-correctness scoring for sources.** Sources benchmark measures reachability, not whether the content is true.
- **Cross-source quality / ranking.** A separate benchmark someday, not v1.

---

## Adjacent work (lives elsewhere)

- **Intelligent Oracle** (`intelligentoracle.com`) — the AI-powered oracle dApp on GenLayer. Headline: ~1h finality, <$1 per market. GenLayer Gym exists to make those numbers measurable.
- **TLSNotary work** — separate research workstream. When live, it becomes the unblock path for currently-unresolvable sources (paywalled, login-walled, IP-gated). Out of GenLayer Gym v1.
