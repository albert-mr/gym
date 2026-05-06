# sources-bench — Web Source Reachability Benchmark

Versioned dataset of web sources, each labeled `accessible` / `partial` / `blocked` + reason. Probed by an Intelligent Contract from validator infrastructure, ground-truth-checked off-chain.

v1 ships newspapers. v2 extends with sources actually referenced by `pm-bench` markets.

## Layout (planned)

- `contracts/` — the probe Intelligent Contract.
- `pipeline/` — seed compilation, probe execution, ground-truth check, publish, PM-source extension.
- `data/` — `sources-db`: the versioned source catalog the gym publishes.
- `runs/` — per-source probe results.

This README is a stub; flesh it out once we pick up sources-bench. See `../../ROADMAP.md` §2 for the full plan.
