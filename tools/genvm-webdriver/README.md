# tools/genvm-webdriver

Vendored copy of the GenVM WebDriver service. Used by gym benchmarks for local probing — same browser driver shape that GenVM validators use when calling `gl.nondet.web.render(url, mode="text")`.

This is the **local validator-equivalent** for fetching. Real benchmarks run on testnet (Bradbury); this is for development, fixture generation, and pre-flight checks.

## Origin

Vendored from `intelligent-oracle/polymarket/genvm_webdriver/` (which itself mirrors `genlayerlabs/genvm` / `modules/webdriver`). When upstream changes meaningfully, re-sync by hand and note the upstream commit in the commit message.

## Run

```bash
cd gym/tools/genvm-webdriver
docker compose up --build
```

Service listens on `http://127.0.0.1:4444`.

## API

The same shape GenVM uses internally:

```
GET /render?url=<encoded-url>&mode=text&waitAfterLoaded=0
```

Healthcheck:

```
GET /healthcheck?mode=text&url=<encoded-test-url>
```

## What this covers

- `gl.nondet.web.render(url, mode="text")` — browser render path. Yes.

## What this does NOT cover

- `gl.nondet.web.get(url)` — raw HTTP path. GenVM uses a different code path; benches simulate this with their own HTTP probe.
- Validator consensus. No `prompt_comparative` here.
- GenVM sandbox / TLD checks.
- Contract execution.

For the real, end-to-end thing, deploy `WebFetcher` (or the relevant IC) to Bradbury and call from there.

## Consumers

- `benchmarks/sources-bench` — local probe step in v1.0. See `benchmarks/sources-bench/PLAN.md` §3.3.
- `benchmarks/pm-bench` — Gate 3 source-accessibility probe in v1.1. See `benchmarks/pm-bench/PLAN.md` §4.4.
