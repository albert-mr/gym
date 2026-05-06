# sources-bench — Plan

Concrete, point-based plan for the sources benchmark. Read top to bottom. Every numbered item is small enough to act on.

## 1. Why sources-bench exists

1.1. To produce a verified registry of web sources that Intelligent Contracts can trust as source-of-truth, organized by category.
1.2. Headline number: **count of verified working sources, broken down by category**. Not a percentage. An absolute count that grows over time.
1.3. "Verified" means the source's content is reachable from local validator-equivalent infrastructure AND from the on-chain Bradbury fetcher AND a ground-truth check confirms both probes returned real content. All three gates required.
1.4. Newspapers first. Then more categories: sports stats, government data, on-chain explorers, public APIs, social platforms.
1.5. Downstream consumers: pm-bench Gate 3 reads from this registry instead of probing inline; IO contracts pick from it when writing new markets; the wizard auto-suggests verified sources.

## 2. Decisions already locked

2.1. Headline metric: **count of verified sources by category** (absolute, not %).
2.2. Universe: **whatever the seed compilation skill produces**, starting with curated newspapers.
2.3. Verification rule: **only enters the registry if all probes pass and agree** — local webdriver render + local raw HTTP get + Bradbury IC fetcher + ground-truth check.
2.4. Stack: **TypeScript** for everything sources-bench owns. The IC probe contract (`WebFetcher`) stays Python in `intelligent-oracle`.
2.5. Storage: **append-only JSONL** committed to git.
2.6. Local infra: **GenVM webdriver vendored at `gym/tools/genvm-webdriver/`** (top-level shared tool, used by sources-bench now and pm-bench Gate 3 later).
2.7. Seed compilation: **a Claude Code skill**, invocable manually or from CI.
2.8. Rollout: **local-first**. v1.0 = seed + local probes + ground-truth. v1.1 = + Bradbury IC + full three-way agreement gate. Publishing to gym frontend is post-v1.1.

## 3. v1.0 — seed + local probes + provisional registry

3.1. **Vendor the GenVM webdriver.** Copy `intelligent-oracle/polymarket/genvm_webdriver/` into `gym/tools/genvm-webdriver/` (service + docker-compose + README only; probe scripts stay upstream as reference). One `docker compose up` from `gym/tools/genvm-webdriver/` brings up the service on `localhost:4444`.
3.2. **Seed compilation skill.** `gym/benchmarks/sources-bench/skills/sources-seed-compile/SKILL.md`. Takes parameters (category, region, language, paywalled?). Produces a candidate JSONL with `url, category, region, language, expected_content_type, candidate_added_at`. No verification yet; this is candidate generation only.
3.3. **Local webdriver probe.** TS module that hits `http://127.0.0.1:4444/render?url=...&mode=text`. Records: HTTP status, response size, rendered-text length, error class (timeout / blocked / 4xx / 5xx / parse-error). Same endpoint shape GenVM uses for `gl.nondet.web.render(..., mode="text")`.
3.4. **Local raw HTTP probe.** TS module that does a plain fetch with validator-equivalent headers and no JS execution. Simulates `gl.nondet.web.get()`. Records the same fields plus content-type + body sample.
3.5. **Ground-truth check.** TS module + LLM call. Given the two local probe results, an LLM judges whether they look like real content for the URL (vs login walls, captcha pages, JS-stub pages, error pages). Output: `agrees_with_url_intent: yes | no | uncertain` + one-line reason.
3.6. **Provisional verification.** A candidate that passes both local probes AND ground-truth lands in `data/verified-local.jsonl`. NOT promoted to canonical registry yet — that needs Bradbury (v1.1).
3.7. **Categorized count rollup.** TS report tallies `data/verified-local.jsonl` by category and writes `reports/{YYYY-MM-DD}-counts.md`. v1.0 headline is the local-only verified count.
3.8. **README.** `benchmarks/sources-bench/README.md` documents how to run, links to latest counts rollup, lists current verified count by category.

## 4. v1.1 — full verification via Bradbury IC

4.1. **Reuse pm-bench GenLayer CLI wrapper.** sources-bench's IC probe shells out to `genlayer` CLI exactly like pm-bench's deploy + resolve. No duplicate plumbing.
4.2. **Deploy WebFetcher to Bradbury.** Use `intelligent-oracle/contracts/web_fetcher.py`. One contract instance shared across sessions; it's stateless on the source-side. Address recorded in `config/io-deployments.json`.
4.3. **IC probe.** For each candidate that passed v1.0 local probes, call `WebFetcher.fetch(url)` on Bradbury. Capture full receipt: returned size, excerpt, n_calls, latency, cost.
4.4. **Three-way agreement gate.** A candidate is promoted to canonical `data/verified.jsonl` only if local-render + local-get + Bradbury-IC + ground-truth all agree the source returns real content. Anything less stays in `data/verified-local.jsonl` with a reason explaining the disagreement.
4.5. **Eviction sweep.** Weekly: re-probe everything in `data/verified.jsonl` through the same three-way gate. If a source flips, append to `data/evicted.jsonl` with reason. The original verified record is never overwritten (append-only). The active registry is `verified.jsonl` minus matching `evicted.jsonl` entries by source_id.
4.6. **Categorized count rollup (extended).** Reports verified count, evicted count, net-active count per category. Trend: verified-additions per week, eviction rate per category.
4.7. **Cost guardrail.** Per-run cap on Bradbury calls. Aborts gracefully and logs partial state.

## 5. Parallel workstream — category expansion

5.1. v1.0 ships newspapers only. Once the verification pipeline is stable, expand:
- Sports stats sources (ESPN, official league sites)
- Government data (BLS, ECB, official census APIs)
- On-chain explorers (etherscan, blockscout)
- Public APIs (CoinGecko, ExchangeRate hosts)
- Social platforms (where TLSNotary becomes the unblock path)
5.2. Each new category goes through the same skill + verification pipeline. No new code unless the category needs a new probe mode.
5.3. Can run in parallel with v1.1 once the verification gate is in place.

## 6. What can run in parallel (across branches)

**v1.0:**
- 6.1. Vendor genvm-webdriver into `tools/` (point 3.1) — fully independent.
- 6.2. Seed compilation skill (point 3.2) — fixture-driven, independent.
- 6.3. Local webdriver + raw HTTP probe modules (points 3.3, 3.4) — depend only on the webdriver running locally.
- 6.4. Ground-truth check (point 3.5) — fixture-driven from probe outputs.
- 6.5. Rollup + README (points 3.7, 3.8) — fixture-driven.

**Unblocking step:** agree on the schemas — `Candidate`, `LocalProbeResult`, `GroundTruthVerdict`, `VerifiedRecord`, `EvictionRecord`. Once locked, the five tracks fan out.

**v1.1:**
- 6.6. Bradbury IC probe (points 4.2, 4.3) — independent, reuses pm-bench CLI wrapper.
- 6.7. Three-way agreement gate (point 4.4) — pure logic, depends on schema.
- 6.8. Eviction sweep (point 4.5) — independent, runs against existing registry.

## 7. Characteristics every piece must have

7.1. **100% rule.** Only sources verified to work end up in the canonical registry. No "probably works"; no "worked once last week". The registry is consumed as truth, so it has to be true.
7.2. **Append-only at the boundary.** Verification, eviction, probe results — all append-only. Corrections are new records.
7.3. **Schema-validated at the boundary.** Every probe output, LLM verdict, IC receipt parses through a typed schema before downstream code touches it.
7.4. **Versioned.** Every record carries `schema_version`, `probe_version`, `ground_truth_version`, `network` — whichever apply. Re-verifications carry forward old versions for diffability.
7.5. **Idempotent.** Re-running a probe on the same source the same day is allowed and produces the same outcome (modulo timestamps).
7.6. **Categorized.** Every entry has `category`. Where relevant: `region`, `language`, `paywalled`.
7.7. **Cost-bounded.** LLM calls and IC calls have per-run caps; abort gracefully when hit.
7.8. **Reference, don't import.** `WebFetcher` contract stays in `intelligent-oracle`; sources-bench deploys it but does not modify. The webdriver service is vendored once and tracked from upstream.
7.9. **Public-first dataset.** Everything in `data/`, `reports/` committed to git.
7.10. **Three-way agreement is non-negotiable** (v1.1+). Local render + local get + IC fetcher + ground-truth must all agree before a source is promoted to canonical. Any divergence keeps the source in the local-verified bucket with a reason.

## 8. Out of scope (named, not silent)

8.1. Auto-publishing to `gym.genlayer.foundation` frontend — comes after JSONL shape stabilizes.
8.2. Cross-source content-correctness scoring — sources-bench measures reachability, not whether the content is true.
8.3. Source ranking / quality scoring — could become its own bench later.
8.4. TLSNotary-fetched sources — separate workstream, ROADMAP §5. Out of v1.0 and v1.1.
8.5. Auto-pulling sources from pm-bench markets — v2 enhancement.
8.6. Captcha-bypass or login-flow probing — by design, sources requiring those don't enter the registry. They stay candidates with a reason.
8.7. Direct GenLayer RPC client — waiting on `genlayer-js`. We shell out to CLI.

## 9. Decisions to revisit after first cohort

9.1. Eviction cadence (weekly v1.1 default vs more aggressive).
9.2. Whether `data/verified-local.jsonl` is published or only `data/verified.jsonl`.
9.3. Ground-truth model choice and prompt — first version will need calibration.
9.4. Skill output format and parameters — adjust after first batch of newspaper candidates.
9.5. Manual-override path for sources we trust but can't probe (those needing TLSNotary).
9.6. Default IC network — Bradbury recommended; confirm with IO team before v1.1.
9.7. Whether the seed skill should also propose categories, or only enumerate within a given category.

## 10. Reference (read, don't import)

10.1. `intelligent-oracle/polymarket/genvm_webdriver/` — upstream we vendor from. Same docker-compose, same `/render` endpoint.
10.2. `intelligent-oracle/polymarket/genvm_webdriver/scripts/probe_genvm_webdriver.py` — Python probe pattern; we reimplement in TypeScript.
10.3. `intelligent-oracle/contracts/web_fetcher.py` — `WebFetcher.fetch(url)` IC contract we deploy to Bradbury.
10.4. `intelligent-oracle/polymarket/data/probes/` — historical probe outputs, useful for fixture-driven testing.
10.5. `gym/benchmarks/pm-bench/PLAN.md` — sister bench. This plan deliberately mirrors its structure and reuses its conventions (schemas, JSONL ops, GenLayer CLI wrapper).
10.6. `gym/tools/genvm-webdriver/README.md` — local run instructions, vendored copy.
