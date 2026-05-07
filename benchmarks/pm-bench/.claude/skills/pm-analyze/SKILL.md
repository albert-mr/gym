---
name: pm-analyze
description: Read pm-bench's daily Polymarket snapshot JSONL and produce three artifacts — a snapshot rollup, a 5-row showcase header (kind+domain-diverse), and a day-over-day daily report. Use when the user asks what's in pm-bench's data, how Gate 1 should be tuned, wants a daily report comparing today against yesterday, or wants a quick scan of the universe.
---

# pm-analyze

This skill wraps three TypeScript CLIs in `benchmarks/pm-bench`:

- `pnpm --filter @gym/pm-bench analyze` — reads a daily JSONL, writes `snapshot.md` + `summary.json`.
- `pnpm --filter @gym/pm-bench sample` — picks 5 deliberately-different markets (kind+domain diversity), writes `header.md` + `header.jsonl`.
- `pnpm --filter @gym/pm-bench daily-report` — diffs today's `summary.json` against the previous day's, writes `daily-report.md` + `daily-report.json`.

All three are deterministic. Same input → same output. They never call the network — they only read files in `benchmarks/pm-bench/data/markets/`.

## Default behaviour (read this first)

1. **Always operate on the latest available date** unless the user explicitly names another. The latest date is the highest-numbered subdirectory under `benchmarks/pm-bench/data/markets/` that has an `all.jsonl` (and, for `daily-report`, a `summary.json`).
2. **Never silently overwrite an existing daily report.** `daily-report` exits with status code **3** and prints `{"stage":"daily-report","status":"exists",...}` if `daily-report.md` already exists for the target date. When you see this, ask the user whether to redo it. Only re-run with `--force` after explicit confirmation.
3. **Never reason about volume or liquidity.** pm-bench is about reach across the *universe of markets*, not dollars. The pipeline does not bucket by `volumeNum`, and the sample picker explicitly excludes deterministic-feed kinds (chainlink, stock-or-finance domains). Don't propose volume cutoffs.
4. **Always run the reasoning step.** After `daily-report` writes its files, you (the agent) MUST read `daily-report.json` and produce `daily-report-notes.md` with LLM-authored commentary. The TypeScript pipeline is deterministic by design; the *insight* layer is your job. See "Reasoning step" below.

## When to invoke

Trigger on any of these:

- "What's in today's pm-bench data?" / "What does the universe look like?"
- "Run the daily report" / "How does today compare to yesterday?"
- "What should Gate 1 look like?" / "What other deterministic rules could go in Gate 1?"
- "How many markets have no URL anywhere?" / "How big is the residual after Gate 1?"
- "Give me five different example markets" / "Show me the variety"
- After a fresh `pnpm poll` when the user wants a sanity check on the snapshot.

Do **not** invoke this skill to:

- Run the poller (use `pnpm --filter @gym/pm-bench poll`).
- Run Gate 2 (the LLM/skill rubric — not yet built; see PLAN §3.3).
- Score correctness against Polymarket settlement (that's v1.1, PLAN §4.6).

## How to invoke

### Standard daily flow

```bash
# After `pnpm poll`, run all three stages on the latest date:
pnpm --filter @gym/pm-bench analyze        # writes snapshot.md + summary.json
pnpm --filter @gym/pm-bench sample         # writes header.md + header.jsonl
pnpm --filter @gym/pm-bench daily-report   # writes daily-report.md + daily-report.json
```

### Specific date

```bash
pnpm --filter @gym/pm-bench analyze       --date 2026-05-07
pnpm --filter @gym/pm-bench sample        --date 2026-05-07
pnpm --filter @gym/pm-bench daily-report  --date 2026-05-07
pnpm --filter @gym/pm-bench daily-report  --date 2026-05-07 --prev-date 2026-05-05
```

### Re-running daily-report on a date that already has one

The CLI refuses by default. The skill must ask the user, then add `--force`:

```bash
pnpm --filter @gym/pm-bench daily-report --force
pnpm --filter @gym/pm-bench daily-report --date 2026-05-07 --force
```

### Other flags

```bash
# Read a specific JSONL (fixtures, one-off probes)
pnpm --filter @gym/pm-bench analyze --in path/to/markets.jsonl

# Keep duplicate rows from re-polled days (default behaviour: dedupe by id, latest polled_at wins)
pnpm --filter @gym/pm-bench analyze --no-dedup
```

## Outputs (per date directory)

`benchmarks/pm-bench/data/markets/{date}/`:

| File | Source | Purpose |
| --- | --- | --- |
| `all.jsonl` | `pnpm poll` | Raw poll output |
| `snapshot.md` | `analyze` | Descriptive rollup (funnel, kinds, domains, tags, etc.) |
| `summary.json` | `analyze` | Machine-readable summary; canonical input for `daily-report` |
| `gate1-pass.jsonl` | `analyze` | Markets surviving Gate 1 (the IO-addressable set) |
| `gate1-drop-chainlink.jsonl` | `analyze` | Gate 1a drops |
| `gate1-drop-no-url.jsonl` | `analyze` | Gate 1b drops |
| `header.md` / `header.jsonl` | `sample` | 5 kind+domain-diverse showcase markets |
| `daily-report.md` | `daily-report` | Day-over-day human-readable report |
| `daily-report.json` | `daily-report` | Day-over-day machine-readable report |
| `daily-report-notes.md` | **agent (you)** | LLM-authored observations / anomalies / actions |

## Reasoning step (always run after `daily-report`)

The TypeScript CLIs are deterministic: same input → same output. They count and bucket; they do not interpret. **You must add the interpretation.**

After `daily-report` writes `daily-report.md` + `daily-report.json`, do this:

1. Read `data/markets/{date}/daily-report.json` and `data/markets/{date}/summary.json`.
2. Optionally peek at `data/markets/{prev}/summary.json` if you want to verify a delta.
3. Write `data/markets/{date}/daily-report-notes.md` with the structure below.

If `daily-report-notes.md` already exists, ask the user before overwriting — same rule as the report itself.

### `daily-report-notes.md` structure

```markdown
# pm-bench daily-report notes — {date}

## Observations

- [4-6 bullets. Each cites a specific number from daily-report.json. Each adds context the deterministic table doesn't.]

## Anomalies / things to verify

- [0-3 bullets. Empty section is fine. Use for: a domain that disappeared without explanation, a kind delta that looks like a polling artifact, a recurring family that grew unusually fast.]

## Recommended actions

- [1-3 bullets. Concrete next moves: "Add `pythdata.app` to `categorize.ts` PRICE_FEED_DOMAINS", "Re-poll with --enrich-tags to confirm sports tag drift", "Flag for the Gate 2 design pass: `(empty)` is up 3pp."]
```

### What counts as an observation worth writing

- A delta that crosses a behavioural threshold (e.g. truly-IO-shaped templates ±10%, IO unique domains ±15%, recurring share ±3pp).
- A new domain in the IO subset that's a deterministic feed candidate (price API, weather API, sports API) — say so explicitly.
- A kind that flipped to/from absent — explain the most likely cause (tournament window, election cycle).
- A top family that suddenly grew — note whether it's a new league or a fan-out of an existing template.
- The relationship between two metrics (e.g. "templates +5 but markets −85 = recurring fans collapsed").

### What NOT to put in notes

- Restated numbers from the table. The reader can already see them.
- Volume / liquidity reasoning (forbidden by Default behaviour rule 3).
- Speculation about price movements or market sentiment.
- Anything you can't back with a number from the JSON.

## How to read the daily report

The daily report has four sections that drive decisions:

1. **Headline.** Total markets, IO funnel, recurring vs one-off, with day-over-day deltas (count and %). Significant moves: `Truly-IO-shaped markets` ±10%, Gate 1a hit rate ±5pp, recurring share ±3pp.
2. **Kinds shift.** Per-kind market count today vs yesterday. Watch for `is_new` (kind appeared today) and `is_dropped` (kind absent today) — usually means an event family rotated in/out of the 24h window. A deterministic-feed kind growing means more chainlink/stock-feed markets; a non-deterministic kind growing means more reach for IO.
3. **Top 10 resolution-source domains today.** Δ count + Δ share for each. A new domain at >5% share that's a deterministic feed → propose adding it to Gate 1.
4. **New / dropped domains.** Filtered to ≥1% share to suppress noise. Surfacing here means a real shift in Polymarket's universe, not a polling jitter.

## How to read the snapshot

The sections that drive decisions:

1. **Funnel.** Total → Drop Gate 1a (Chainlink) → Drop Gate 1b (no URL anywhere) → Post-Gate-1 (IO-addressable). Counts must reconcile.
2. **Gate 1a — Chainlink-fed.** Counts markets whose `eventResolutionSource` starts with `https://data.chain.link/` or `https://reference.chainlink.com/`. Decision signal:
   - **≥ 50%** → URL-prefix rule alone disposes of the bulk of the universe.
   - **20-50%** → URL-prefix rule is worth shipping, residual is large enough to need an LLM rubric in Gate 2 too.
   - **< 20%** → URL-prefix rule is small cleanup; Gate 2's LLM rubric carries the weight.
3. **Gate 1b — no URL anywhere.** ≥ 20% means a surprisingly large pile is unrecoverable; < 20% means tail-case drop.
4. **Resolution-source domains (top 20).** New domains here are good prompts for "should this be a deterministic Gate 1 rule?"
5. **Event-title prefix clusters.** Catches recurring market shapes that the domain bucket misses.

## Common follow-ups

- **Daily-report shows a new domain >5% share that points at a deterministic feed** (price API, weather API, sports scores) → propose adding it to `categorize.ts` and (if URL-prefix is reliable) extending Gate 1 (PLAN §9.3).
- **Truly-IO-shaped markets dropped >15% day-over-day** → check the `Kinds shift` table; usually a tournament or event window closed. Confirm with `pnpm poll` again the next day before drawing conclusions.
- **Recurring share rose sharply** → the universe is consolidating into templated daily fans; sampler will repeat shapes and v1.1 settlement scoring needs more variety.

## Limitations

- **Tags are conditional on the polling query.** When the poller runs without `--enrich-tags`, tags appear on most rows but the array is taken straight from the events list. Re-poll with `--enrich-tags` if you need every row to have tags.
- **`eventResolutionSource` is event-level.** A single event with multiple inner markets has one source for all of them.
- **Sample picker uses kind+domain diversity, filtering out chainlink, empty-source, and deterministic-feed markets.** If those filters drop the universe below 5 eligible rows, picks are padded with `null` and the bucket label says `(no eligible market)`.
- **Daily-report needs `summary.json` from both dates.** If you're comparing against an old date that pre-dates `summary.json` being written, run `pnpm analyze --date YYYY-MM-DD` first to backfill it.
- **Garbage in, garbage out.** Malformed rows fail the zod schema in `src/schemas/polled-market.ts`, which throws and aborts the run.

## Code paths (for the curious)

- Loader: `benchmarks/pm-bench/src/analyze/load.ts` (`loadJsonl`, `parseJsonl`, `dedupeByLatestPoll`).
- Buckets: `benchmarks/pm-bench/src/analyze/buckets.ts` (`isGate1Match`, `hasAnyUrl`, `domainOf`, `eventTitlePrefix`).
- Categorize: `benchmarks/pm-bench/src/analyze/categorize.ts` (`categorize`, `isDeterministicFeed`).
- Analyze core: `benchmarks/pm-bench/src/analyze/analyze.ts` (`analyze`).
- Markdown render: `benchmarks/pm-bench/src/analyze/render-markdown.ts`.
- Sample picker: `benchmarks/pm-bench/src/analyze/sample.ts` (`pickSamples`, kind+domain diversity).
- Daily report: `benchmarks/pm-bench/src/analyze/daily-report.ts` (`computeDailyReport`, `renderDailyReportMarkdown`).
- CLIs: `benchmarks/pm-bench/src/cli/{analyze,sample,daily-report}.ts`.
- Tests: `benchmarks/pm-bench/tests/{analyze,sample,daily-report}.test.ts`.

## Re-running on a fresh day

```bash
# 1. Pull today's universe
pnpm --filter @gym/pm-bench poll

# 2. Read the universe (run all three; daily-report will refuse if already done)
pnpm --filter @gym/pm-bench analyze
pnpm --filter @gym/pm-bench sample
pnpm --filter @gym/pm-bench daily-report

# 3. Open the reports
open benchmarks/pm-bench/data/markets/$(date -u +%Y-%m-%d)/snapshot.md
open benchmarks/pm-bench/data/markets/$(date -u +%Y-%m-%d)/daily-report.md
```

If `pnpm poll` was run twice on the same day, `analyze` and `sample` both dedupe by `id` (latest `polled_at` wins) by default — so the doubled file from a verification run is a non-issue. Pass `--no-dedup` to `analyze` if you specifically want to compare snapshot-to-snapshot drift.
