# pm-bench — Plan

Concrete, point-based plan for the Polymarket benchmark. Read top to bottom. Every numbered item is small enough to act on.

## 1. Why pm-bench exists

1.1. To produce a public, citable answer to "what fraction of real Polymarket markets can Intelligent Oracle (IO) actually serve?"
1.2. To replace anecdote ("IO works great on this demo market") with a versioned dataset that survives scrutiny.
1.3. To surface IO defects with evidence, so the IO team fixes the right things in the right order.
1.4. A v0 of this exists in Python inside `intelligent-oracle/`. pm-bench is the canonical successor: TypeScript, public-by-default, versioned, owned by the gym.

## 2. Decisions already locked

2.1. Headline metric: **addressability %** (the funnel itself). Correctness is secondary.
2.2. Universe: **all active Polymarket markets**. No volume filter, no category cherry-picking.
2.3. Stack: **TypeScript** for everything pm-bench owns. The IO contract stays Python in `intelligent-oracle`.
2.4. Rollout: **classification-first**. v1.0 = poll + classify + funnel. v1.1 = + deploy + resolve + compare.
2.5. Storage: **append-only JSONL** committed to git. No database in v1.

## 3. v1.0 — what gets shipped first (the funnel)

3.1. **Polling.** Daily job that pulls every active Polymarket market through the Gamma API and appends to `data/markets/{YYYY-MM-DD}/all.jsonl`. Idempotent. Resilient to rate limits. Schema-validated at the boundary.
3.2. **Gate 1 (deterministic exclusion).** Two cheap rules, both deterministic, both run from the snapshot with no LLM:
  - **Gate 1a — Chainlink-fed.** `eventResolutionSource` startsWith `https://data.chain.link/` or `https://reference.chainlink.com/`. Already served by an on-chain feed; IO not needed.
  - **Gate 1b — no URL anywhere.** Neither `eventResolutionSource` nor `description` contains any `http(s)://` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.
  Each rule is a separate, named line in the funnel. Anything that survives both rules flows to Gate 2.
3.3. **Gate 2 (LLM/skill rubric on the residual).** Deferred — reserved for a future pass. Will reason over the residual to (a) decide whether the listed source is actually adequate, and (b) where the source is missing or weak, attempt agentic recovery from URLs found in the description. Out of scope for v1.0; the slot is reserved so the funnel can grow into it.
3.4. **Reasoned labels.** Every gate decision carries a one-line reason. Not "not-fit" but "not-fit: Chainlink prefix matched on `eventResolutionSource`" or "not-fit: no URL in `eventResolutionSource` or `description`."
3.5. **Per-market run record.** Append-only log per market, in `data/runs/{market_id}.jsonl`. Every classification, every later event, lands as a new line.
3.6. **Funnel rollup.** Daily process that derives, from `data/markets/{date}/all.jsonl`, the filtered subsets `gate1-pass.jsonl`, `gate1-drop-chainlink.jsonl`, `gate1-drop-no-url.jsonl`, the showcase `header.jsonl` / `header.md`, and the human-readable `snapshot.md` — all co-located under `data/markets/{date}/`. Counts must reconcile (drops + pass = total); rollup fails loudly if they don't. The rolling cross-day funnel still lands in `results/funnel-daily.jsonl`.
3.7. **CI cron.** Daily GitHub Actions workflow that runs the full v1.0 pipeline and commits the day's outputs.
3.8. **README.** Top of `benchmarks/pm-bench/README.md` links to the latest `data/markets/{date}/snapshot.md` and shows the current addressability number.

## 4. v1.1 — what gets added after v1.0 ships

4.1. **Stratified sampler.** From the day's PASS markets, sample a stratified subset across categories (sports, crypto, politics, news, other). Deterministic given a seed. Capped per run.
4.2. **GenLayer CLI wrapper.** TypeScript wrapper around the `genlayer` CLI subprocess (deploy, write, read, balance). Parses receipts. Retries transient failures. There is no JS SDK; we shell out.
4.3. **IO deploy.** For each sampled market, deploy a fresh `PolymarketResolver` instance (`intelligent-oracle/contracts/polymarket_resolver.py`). Default network: Asimov testnet. Record the contract address into the run record.
4.4. **Gate 3 (source accessible).** Probe the source URL from validator-equivalent infrastructure before calling IO. Categorize the result: paywall / IP-block / captcha / 4xx / 5xx / timeout / partial. v2 reads this from `sources-bench` instead.
4.5. **IO resolve.** For markets that pass Gate 3, call `resolve(market_id, question, criteria, primary_source, outcomes_csv)` via the CLI. Capture outcome, reasoning, source URL, latency, cost.
4.6. **Compare against PM settlement.** At `pm_resolved + 48h`, diff IO outcome vs PM. Mark as `match | mismatch | undetermined`. Schedule a `+7d` re-check for UMA dispute reversals.
4.7. **Funnel update.** Extend the daily funnel with `n_pass_gate3` and `n_inaccessible`. Inaccessible markets retroactively drop from PASS but the original classification record stays untouched.
4.8. **Correctness rollup.** New rolling dataset in `results/correctness-rolling.jsonl` and a human-readable summary in `reports/correctness-summary.md`. Broken down by category, with N and a confidence band.
4.9. **Cost guardrail.** Per-run cap on credits/gas spent. Aborts gracefully and logs partial state if exceeded.

## 5. Parallel workstream — IO defects digest

5.1. Not part of the pipeline. Runs alongside.
5.2. Weekly: read mismatches and `divergent` classification cases, group by failure mode (source misread, prompt brittleness, outcome enum mismatch, timeout).
5.3. Output: `reports/defects-{YYYY-WW}.md` Markdown digest.
5.4. Manually filed as issues against `intelligent-oracle`. Auto-filing comes later, if at all.

## 6. What can run in parallel (across branches)

**v1.0:**
- 6.1. Polling (point 3.1) — independent of everything once the schema is agreed.
- 6.2. Classifier (points 3.2–3.4) — can develop against fixture data while polling is built.
- 6.3. Storage + rollup (points 3.5–3.6) — also fixture-driven.
- 6.4. CI cron + ops (point 3.7) — can be set up against any one of the above first.

**Unblocking step:** agree on the schemas (`PolledMarket`, `ClassifiedMarket`, `FunnelDay`). Once locked, the four tracks fan out.

**v1.1:**
- 6.5. CLI wrapper (point 4.2) — pure plumbing, independent.
- 6.6. Sampler (point 4.1) — pure logic, independent.
- 6.7. Gate 3 probe (point 4.4) — independent.
- 6.8. Compare + dispute re-check (point 4.6) — independent until it joins point 4.5's output.
- 6.9. Defects digest (section 5) — drafts against historical compare records once any exist.

## 7. Characteristics every piece must have

7.1. **Append-only at the boundary.** No row ever overwritten. Corrections are new records that supersede.
7.2. **Schema-validated at the boundary.** Every external input (PM API, LLM output, CLI receipt) parses through a typed schema before downstream code touches it.
7.3. **Versioned.** Every record carries `schema_version`, `classifier_version`, `rubric_version`, `network` — whichever apply. So historical data stays interpretable when logic changes.
7.4. **Idempotent.** Re-running the same step on the same day produces the same outputs (modulo timestamps).
7.5. **Observable.** Structured logs. Every step logs counts in / counts out / counts dropped, with reasons.
7.6. **Cost-bounded.** Any paid API call (Anthropic, GenLayer credits) has a per-run cap and aborts gracefully.
7.7. **Reference, don't import.** We reimplement the existing `intelligent-oracle` Python in TypeScript. No cross-repo imports.
7.8. **Public-first dataset.** Everything in `data/`, `results/`, `reports/` is committed to git unless there is a concrete reason not to.
7.9. **Honest about uncertainty.** `divergent` classifications, `undetermined` comparisons, dispute reversals each get their own category. Never collapsed into a binary.

## 8. Out of scope (named, not silent)

8.1. Factory pattern for per-market IO contracts — depends on IO §3.2 R&D. v1.1 deploys per market.
8.2. TLSNotary integration for Gate 3 unblock paths — separate workstream, ROADMAP §5.
8.3. Public site at `gym.genlayer.foundation` — comes after JSONL shape stabilizes.
8.4. Backfilling historical PM markets — ROADMAP §1.4 excludes this explicitly.
8.5. Direct GenLayer RPC client — waiting on `genlayer-js`. We shell out.
8.6. Cohort-shared contract instances — per-market until we see contention or cost pressure.
8.7. Auto-filing IO defect issues — manual through first six months.

## 9. Decisions to revisit after the first cohort

9.1. Sample size and stratification, calibrated to the v1.0 funnel shape.
9.2. Retention policy for `data/markets/{date}/all.jsonl`, depending on row counts.
9.3. More deterministic Gate 1 rules. Candidates: non-Chainlink price-feed domains (binance.com, pyth.network, coingecko.com, kraken.com — already half-implemented in `src/analyze/categorize.ts:36-47`), stock/finance domains (yahoo, bloomberg, marketwatch, seeking), and recurring-template patterns ("Up or Down"). Each rule needs its own evidence and its own line in the funnel before it ships.
9.4. Gate 2 design — the LLM/skill rubric on the residual. Shape, prompt, cost guardrails, evidence collection, error modes.
9.5. Polling cadence (daily vs more frequent for late-resolution sports markets).
9.6. Per-market vs per-cohort contract deploys, after first cost data.
9.7. Default network for v1.1 (Asimov recommended; confirm with IO team).

## 10. Reference (read, don't import)

10.1. `intelligent-oracle/contracts/polymarket_resolver.py` — the contract we deploy.
10.2. `intelligent-oracle/src/platforms/polymarket.py` — PM Gamma parsing patterns.
10.3. `intelligent-oracle/src/bench_runner.py` — `genlayer` CLI receipt-parsing pattern.
10.4. `intelligent-oracle/polymarket/src/build_polymarket_benchmark_package.py` — the v0 Python benchmark we are succeeding.
10.5. `testnet/dashboard/lib/sources/chain.ts` — viem + AddressManager pattern, if direct RPC reads become useful later.
