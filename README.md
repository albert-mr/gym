# GenLayer Gym

W&B-style home for benchmarks, datasets, leaderboards, and run logs that measure what GenLayer's Intelligent Oracle (IO) can serve, where it breaks, and where to invest next.

Public surface: `gym.genlayer.foundation` (forthcoming).

## Layout

- `benchmarks/` — one subdir per bench. Each bench is self-contained: pipeline, data, runs, results.
  - `pm-bench/` — Polymarket benchmark. Continuous funnel of active PM markets through GenLayer-fit, source, and accessibility gates; PASS markets resolved through IO and graded against PM settlement. See `benchmarks/pm-bench/PLAN.md`.
  - `sources-bench/` — Sources benchmark. Verified registry of web sources, by category, that pass local-webdriver + on-chain-IC + ground-truth checks. See `benchmarks/sources-bench/PLAN.md`.
- `tools/` — shared local infra used by multiple benches.
  - `genvm-webdriver/` — vendored copy of the GenVM browser-render service. Local validator-equivalent for fetching. `docker compose up`.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full v1 plan.
