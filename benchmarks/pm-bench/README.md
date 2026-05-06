# pm-bench — Polymarket Benchmark

Continuously classifies Polymarket markets through a 3-gate funnel and (eventually) runs the PASS markets through Intelligent Oracle to grade against PM's settlement.

## Decisions locked so far

- **Headline metric:** addressability % — the fraction of polled markets that pass all three gates. Correctness is a secondary metric.
- **Universe:** all active Polymarket markets. No volume filter, no category cherry-picking.

## Decisions still open

- Pipeline coupling: classify-everything + sample-resolution vs other shapes. See ROADMAP §1.3.
- Polling cadence and freshness window.
- PM ground-truth handling (UMA disputes, late manual settlements).
- Public artifact format (per-market trace pages? rolling funnel chart? both?).

## Layout (planned)

- `pipeline/` — the classification and resolution steps.
- `data/` — polled-market snapshots, funnel breakdowns, resolution outcomes.
- `runs/` — one record per market attempt.
- `results/` — rolling addressability and correctness aggregates.

This README is a stub; flesh it out once the pipeline shape is locked.
