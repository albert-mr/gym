# pm-bench TODOs

Open decisions tracked outside the skill. The `/pm-classify` skill stays storage-agnostic until the items below land.

Each item lists options + tradeoffs. None are decided. When one is, move it from this file into `PLAN.md` and lock it.

---

## 1. Where do classifications get stored?

The skill emits a structured block per invocation. Something needs to catch those and persist them so the funnel rollup, the defects digest, and any future audit can read them. Open questions:

### 1a. Storage format

- **Append-only JSONL per market** (`data/runs/{market_id}.jsonl`). One file per market, every classification re-run is a new line. Easy to diff, plays well with git, what PLAN §3.5 originally suggested. Cons: filesystem fans out to thousands of small files, no cross-market query without a scan.
- **One JSONL per day** (`data/runs/{YYYY-MM-DD}.jsonl`). One file per polling day, every classification of every market that day appended. Easier to grep across markets in a day, harder to follow one market's history across days.
- **Single rolling JSONL** (`data/runs.jsonl`). All-classifications-ever in one file. Simplest. Becomes massive over time; git diffs get noisy.
- **CSV** (one row per classification). Human-skimmable, opens in Excel/Sheets. Bad for nested fields (the `has_source.source` value sometimes has commas or semicolons); column drift is fragile.
- **SQLite** (`data/runs.sqlite`). Real queries, indexes, joins later. Adds a binary file to git (or a build step). More machinery than the v1.0 funnel needs.
- **No persistent storage in v1.0** — let the polling orchestrator catch the structured block and decide. The skill stays pure; storage lives in the polling job's CI workflow.

**Recommendation pending.** PLAN §3.5 leans append-only JSONL; format-per-market vs format-per-day is the real fork.

### 1b. Where do they live in the repo

- `benchmarks/pm-bench/data/runs/` (PLAN.md says this).
- `benchmarks/pm-bench/runs/` (the existing `benchmarks/README.md` convention — drift between docs).
- Outside the repo entirely (S3, a database) and just keep summaries in git.

Pick one and update both `PLAN.md` and `benchmarks/README.md` so they agree.

### 1c. Versioning fields on each persisted record

Whatever store wins, the persisted record should carry at least `classifier_version`, `rubric_version`, `schema_version` (of whatever record-shape is locked), and `network` (null until v1.1). PLAN §7.3 mandates this for any persisted artifact. The skill emits `classifier_version` and `rubric_version` in its structured block; the storage layer adds the rest.

---

## 2. What's the polled-market input shape?

The skill expects "question, description, source fields" but doesn't lock the shape. The polling team owns what comes off the Gamma API. Open questions:

- **Which Gamma fields do we trust?** Specifically: where does PM put the resolution source? Sometimes it's a structured `resolution_source` field. Sometimes it's only in `description`. The polling job needs to decide whether to flatten / synthesize / pass through raw.
- **Schema-validated at the polling boundary** (PLAN §7.2)? If yes, where does the schema live? A sibling file the skill could read for orientation? Or owned entirely by the polling job?
- **Does the polled record include PM's own category tag?** Useful for funnel breakdowns later (sports / crypto / politics / news / other) even if the classifier doesn't trust it.

### 2a. Market-id stability

PM Gamma exposes both `condition_id` (hex) and `slug` (kebab). They're not interchangeable:

- `condition_id` is unique and stable, opaque.
- `slug` is human-readable but can collide across deletions/relaunches.

**Recommendation pending.** `condition_id` is the safer pick for filenames and primary keys; `slug` is friendlier for human inspection. Could carry both in the record and key by `condition_id`.

---

## 3. Polling ↔ classifier handshake

The polling team writes per-day snapshots; the classifier consumes one market at a time. Open questions:

- **Who orchestrates the per-market loop?** A bash/TypeScript script that iterates the snapshot and invokes `/pm-classify` per row? A separate `/pm-classify-batch` skill that loops? Inline in the polling job?
- **How does the orchestrator collect the structured blocks?** Re-invoke a child Claude session and capture stdout? Run a non-Claude wrapper? Both have ergonomic costs.
- **Idempotency** (PLAN §7.4). Re-running classification on the same polled market on the same day must produce the same outputs (modulo timestamp). Nothing in the skill enforces this; the rubrics are LLM-driven and may drift between runs. Decide whether the storage layer dedupes by `(market_id, classifier_version, rubric_version)` or accepts duplicates.

---

## 4. Funnel rollup

A future `/pm-funnel-rollup` skill reads classifications and produces:

- `results/funnel-daily.jsonl` — one structured row per day with counts (PLAN §3.6).
- `reports/{YYYY-MM-DD}-funnel.md` — human-readable rollup.

It cannot be designed until question 1 is answered (it needs to know how to read classifications). Block this on the storage decision.

---

## 5. Source-accessibility (Gate 3 / source probe)

Out of scope for the classifier. The future probe skill consumes addressable classifications and emits its own log. Open question: does the probe live in `pm-bench`, or does it call into `sources-bench` (PLAN §4.4)? Decide when sources-bench has shipped enough to integrate against.

---

## 6. README convention drift

`benchmarks/README.md` line 8 says benches use `runs/` at the bench root. `PLAN.md §3.5` says `data/runs/`. Pick one and update the loser. (Trivial fix; tracked here so it doesn't get lost.)

---

## How to use this file

When you're ready to decide one of these, write the choice into `PLAN.md` (locked) and remove the section from this file. This document should shrink over time.
