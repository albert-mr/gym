---
name: pm-classify
description: Classify one Polymarket market through the genlayer-fit and has-source rubrics. Returns a prose summary plus a fenced structured block with the decisions, reasons, and captured source. Single-market mode only. The skill does not write to disk and does not call the Polymarket API — storage and polling are separate concerns.
allowed-tools: Read, Glob, Grep
---

# `/pm-classify`

Classify **one** Polymarket market by applying two rubrics: **genlayer-fit** (would Intelligent Oracle add value, or is this market already trivially served by something else) and **has-source** (does the market name an explicit source we could resolve against). Return the result inline; do not persist anything.

This skill is the *classification knowledge* for pm-bench. Where the result gets stored, in what shape, and how it joins the polling pipeline are open decisions tracked in `benchmarks/pm-bench/TODOS.md`. This skill stays useful regardless of how those decisions land.

## Versions

- `classifier_version: 0.1.0`
- `rubric_version: 0.1.0`

Bump these when the workflow or either rubric file changes in a way that would alter past decisions. Always include them in the structured output so the caller can stamp them onto whatever record they produce.

## Invocation

```
/pm-classify <input>
```

Where `<input>` is anything that contains enough information about one market for the rubrics to fire:

- A path to a JSON file containing the polled market (the common case).
- An inline JSON blob pasted into the argument.
- A path to a JSONL file with exactly one line.
- Free-form prose describing the market (use sparingly — the rubrics work best when they can read the question, description, and any structured source fields).

If the caller passes more than one market, abort and tell them to invoke the skill once per market.

## What the rubrics need

To classify a market the agent needs at minimum:

- The **question** the market asks.
- The market's **description** / resolution criteria (this is where Polymarket usually puts the source if there is one).
- Any structured source fields the polled-market record carries (e.g. `resolution_source`, `source_urls`).

If those are missing or empty, say so in the output and abort — don't guess.

## Workflow

### 1. Read the input

Resolve `<input>` to its content. If it's a path, use the `Read` tool. If it's an inline blob, parse it directly. Extract at least the question, description, and any source fields.

If parsing fails or required fields are absent, stop and report what's missing. Do not classify on incomplete input.

### 2. Apply the `genlayer-fit` rubric

Read `rubrics/genlayer-fit.md` and apply it to the market.

Decide one of: `pass` | `not-fit`. Write a one-line reason in verb-subject form. The reason must name the **specific** signal (the asset, the feed, the contract, the on-chain operation). Generic strings like "not a good fit" or "no clear source" are unacceptable — reject your own draft and rewrite.

### 3. Apply the `has-source` rubric (only if step 2 was `pass`)

Read `rubrics/has-source.md` and apply it. Read the **whole** description, not just the first sentence — Polymarket frequently puts the actual source one paragraph below the question.

Decide one of: `pass` | `no-source`. Write a one-line reason naming the specific signal (the URL, the domain, or the vague phrasing). If `pass`, capture the source string verbatim — exactly as it appears, no paraphrasing or normalisation. If multiple specific sources are named, join them with `"; "`.

If step 2 was `not-fit`, set the has-source decision to `skipped` with reason `skipped: genlayer-fit dropped the market` and source `null`. Don't run the rubric.

### 4. Derive the top-line classification

- `genlayer-fit = not-fit` → `not-fit`
- `genlayer-fit = pass` and `has-source = no-source` → `no-source`
- `genlayer-fit = pass` and `has-source = pass` → `addressable`

Any other combination is a bug — refuse to emit and report.

### 5. Emit the result

Output two parts:

**a) Prose summary, 2–4 lines.** What the market asks, what each rubric decided, why. Plain English, no jargon.

**b) Fenced structured block at the end.** JSON-shaped, but treat it as a portable record the caller may store however they want. Include exactly these fields:

```json
{
  "market_id": "<from input, or null if not present>",
  "classifier_version": "0.1.0",
  "rubric_version": "0.1.0",
  "genlayer_fit": {
    "decision": "pass" | "not-fit",
    "reason": "<one-line, verb-subject>"
  },
  "has_source": {
    "decision": "pass" | "no-source" | "skipped",
    "reason": "<one-line, verb-subject>",
    "source": "<verbatim string>" | null
  },
  "classification": "addressable" | "not-fit" | "no-source"
}
```

The caller (a polling orchestrator, a CI job, a human, a future rollup skill) decides what to do with this — append to a JSONL log, write a CSV row, insert into a database, drop on the floor. The skill does not know and does not care.

## Rules

- **No file writes.** This skill emits to chat. The `allowed-tools` frontmatter does not include `Write` for that reason. If you find yourself wanting to persist, stop — that decision lives outside the skill.
- **No Polymarket API calls.** This skill consumes whatever the caller hands it. Pulling fresh data is the polling job's responsibility.
- **No agentic web search.** If the input doesn't already name an explicit source, the answer is `no-source`. Finding URLs inside a named domain is a future skill's job.
- **Reasons must be specific.** A reason that doesn't name the concrete signal is rejected and rewritten before emit.
- **One market per invocation.** Don't loop over a snapshot.
- **Don't guess on missing data.** If question, description, and structured source fields are all empty, abort with a message — don't fabricate a classification.

## Files this skill uses

- `rubrics/genlayer-fit.md` — the genlayer-fit rubric.
- `rubrics/has-source.md` — the has-source rubric.
- `examples.md` — prose descriptions of the edge cases the rubrics must handle.

## Open design questions (out of scope here)

How and where classifications get stored, how the polled-market input is shaped on the wire, and how a future rollup reads them are tracked in `benchmarks/pm-bench/TODOS.md`. This skill stays storage-agnostic until those decisions are made.
