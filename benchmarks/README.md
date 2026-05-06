# Benchmarks

Each subdirectory is a self-contained bench. A bench owns its pipeline, its dataset, its run logs, and its results.

Conventions every bench should follow:

- `README.md` at the bench root: aim, how, approach, out-of-scope.
- `pipeline/` — the steps that produce the bench's outputs.
- `data/` — versioned datasets the bench publishes.
- `runs/` — one record per execution (per market, per source, per cohort).
- `results/` — aggregated metrics, leaderboard rows.
- `contracts/` — Intelligent Contracts the bench deploys (only if it deploys any).

Benches are not allowed to reach into each other's directories. Anything shared lives in `../shared/`.

## Current benches

- [`pm-bench/`](./pm-bench/) — Polymarket addressability + correctness funnel.
- [`sources-bench/`](./sources-bench/) — web source reachability dataset.
