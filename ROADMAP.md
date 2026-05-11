# GenLayer Gym — Roadmap

**Last updated:** 2026-05-11
**Maintainer:** Albert Martinez (@GenLayer Foundation)

GenLayer Gym is the open, reproducible home for benchmarks measuring what GenLayer can do across the ecosystem. This roadmap captures what's live, what's next, and what's deferred.

---

## Current state

- **Dashboard** — `apps/web/` (Next.js 15 + shadcn/ui). 9 SSG routes, static export, deploys to Vercel. Reads daily JSON from `data/<benchmark>/latest.json`. Tagline: *where we measure what GenLayer can do.*
- **Polymarket benchmark** — Live. Daily classification of every Polymarket market resolving in the next 24 hours through a deterministic gate funnel + per-source-family classifier. Headline: ~97% of the addressable universe can be resolved by GenLayer's intelligent oracle.
- **Sources benchmark** — Planned. Plan locked in [`benchmarks/sources-bench/PLAN.md`](./benchmarks/sources-bench/PLAN.md); pipeline not yet built.

## Headline framing

The Polymarket benchmark's "97%" is **forward-looking inference**: GenLayer has been Studio-verified end-to-end on representative markets per source family; we claim every market on those families would resolve the same way. It's a model of what GenLayer can do, grounded in real Studio runs — not a per-market record. Three verification levels are documented on the dashboard's `/methodology` page.

This framing locks the bar for any future benchmark: the headline is what the system can do today, and the methodology page declares exactly how each market in the count was verified.

---

## What's next

Priority order. Each item has a clear definition of done.

### 1. Ship publicly

Deploy `apps/web/` to Vercel under `gym.genlayer.foundation`. Done when the dashboard is reachable on a public URL and shares cleanly.

### 2. Daily refresh automation

GitHub Action on a cron: poll → analyze → poll-closed → build-data-json → commit `data/pm-bench/`. Done when the dashboard reflects yesterday's resolutions without manual work.

### 3. Accuracy backtest

Replay every closed Polymarket market through a local LLM with the same prompt the intelligent oracle uses; compare the LLM's output against Polymarket's settlement. This turns the forward-looking-inference headline into a per-market accuracy claim. Needs a storage layer (Supabase or extended JSONL) and budget for LLM calls. Estimated 2–3 days of work.

Done when the dashboard's methodology page shows a real accuracy number per category, replacing the inferred number.

### 4. Sources benchmark v1

Stand up the pipeline described in [`benchmarks/sources-bench/PLAN.md`](./benchmarks/sources-bench/PLAN.md). Start with newspapers, verify via local webdriver, ground-truth-check off-chain, publish a count-by-category dashboard page. Done when `/benchmarks/sources-bench` shows real data instead of a placeholder.

### 5. Real-network credibility check

The Polymarket benchmark currently anchors on Studio (centralized testbed). When GenLayer's real testnet is available, run the same source-family probes there and update the methodology page to reflect production-network results. Done when the dashboard distinguishes "Studio-verified" from "real-network-verified" per source family.

---

## Out of scope

- **Backfilling historical Polymarket markets.** We grade what we attempt going forward, not history.
- **Content-correctness scoring for sources.** Sources benchmark measures reachability, not whether the content is true.
- **Auto-filing IO defect issues against `intelligent-oracle`.** Manual digest, then maybe later.
- **Cross-source quality / ranking.** A separate benchmark someday, not v1.

---

## Adjacent work (lives elsewhere)

- **Intelligent Oracle** (`intelligentoracle.com`) — the AI-powered oracle dApp on GenLayer. Headline: ~1h finality, <$1 per market. GenLayer Gym exists to make those numbers measurable; its FAQ surfaces live numbers from this repo.
- **TLSNotary work** — separate research workstream. When live, it becomes the Gate 3 unblock path for currently-unresolvable sources (paywalled, login-walled, IP-gated). Out of GenLayer Gym v1.

---

## How to contribute a benchmark

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the data contract and folder conventions.
