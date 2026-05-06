# shared

Code reused across benches. Anything that lives here must be used by 2+ benches; if it's only used by one, it belongs inside that bench.

Planned modules:

- `genlayer/` — IO factory client, Intelligent Contract deploy/call helpers.
- `polymarket/` — Polymarket API client (markets, outcomes, settlements).
- `schemas/` — dataset schemas (funnel rows, run records, source labels).
