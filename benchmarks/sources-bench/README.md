# Sources benchmark (`sources-bench`)

**Status:** planned. The pipeline is designed but not yet built.

## What it will measure

A versioned, queryable registry of web sources, each labeled `accessible / partial / blocked` plus the reason. Oracle contracts can consult the registry at runtime to know what they can rely on before attempting a fetch.

Headline: **count of verified working sources, by category** (absolute, not percentage). Newspapers first; expanded to government data, sports stats, on-chain explorers, public APIs, and the sources actually referenced by Polymarket markets.

## Why it matters

- The Polymarket benchmark surfaces sources that are paywalled, IP-blocked, or captcha-walled today (the *Currently unresolvable* category). The sources benchmark turns "we don't know" into "we know which sources are reachable from validator infrastructure."
- The intelligent oracle wizard at `intelligentoracle.com` can pick from verified sources when authoring a market — reducing the chance of writing a market against a source GenLayer can't reach.
- Each source is verified through three independent probes (local webdriver, raw HTTP, on-chain Bradbury fetcher) plus an LLM ground-truth check. Only sources that pass all three enter the canonical registry.

## Status

The full design lives in [PLAN.md](./PLAN.md). Pipeline implementation has not started.

The dashboard placeholder at `/benchmarks/sources-bench` reads from [`../../data/sources-bench/placeholder.json`](../../data/sources-bench/placeholder.json) and will be replaced with a real benchmark page once the v1 pipeline produces data.

## Layout (planned)

| Path | What |
|---|---|
| `pipeline/` | Seed compilation, probe execution, ground-truth check, publish. |
| `data/` | Per-category daily probe results + verified registry. |
| `runs/` | Per-source probe records. |
| `../../data/sources-bench/latest.json` | Future dashboard input. |

See [ROADMAP.md](../../ROADMAP.md) for the relative priority of building this benchmark vs. the other in-flight work.
