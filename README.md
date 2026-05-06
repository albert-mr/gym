# GenLayer Gym

W&B-style home for benchmarks, datasets, leaderboards, and run logs that measure what GenLayer's Intelligent Oracle (IO) can serve, where it breaks, and where to invest next.

Public surface: `gym.genlayer.foundation` (forthcoming).

## Layout

- `benchmarks/` — one subdir per bench. Each bench is self-contained: pipeline, data, runs, results.
  - `pm-bench/` — Polymarket benchmark. Continuous funnel of upcoming PM markets through GenLayer-fit, source, and accessibility gates; PASS markets resolved through IO and graded against PM settlement.
  - `sources-bench/` — Sources benchmark. Versioned dataset of web sources labeled `accessible` / `partial` / `blocked` + reason, probed by an Intelligent Contract and ground-truth-checked off-chain.
- `shared/` — code reused across benches (GenLayer SDK / IO factory client, Polymarket client, dataset schemas).
- `site/` — `gym.genlayer.foundation` frontend. Built once bench data shapes stabilize.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full v1 plan.
