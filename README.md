# GenLayer Gym

**Where we measure what GenLayer can do.**

Public benchmarks for the GenLayer ecosystem. Daily-refreshed, reproducible, every number traceable to a committed file. Maintained by the [GenLayer Foundation](https://genlayer.foundation).

Public surface: `gym.genlayer.foundation` (forthcoming).

---

## Layout

```
gym/
├── apps/
│   └── web/                   # Next.js dashboard at gym.genlayer.foundation
├── benchmarks/
│   ├── pm-bench/              # Polymarket benchmark — daily resolution coverage
│   └── sources-bench/         # Sources benchmark — accessibility registry
├── data/
│   ├── pm-bench/              # Daily JSON the dashboard reads
│   └── sources-bench/
└── tools/
    └── genvm-webdriver/       # Vendored GenVM browser-render (validator-equivalent)
```

Each benchmark is self-contained: poll → analyze → classify → emit JSON. The dashboard reads `data/<benchmark>/latest.json` at build time. Push to `main` triggers a Vercel rebuild.

## Live benchmarks

| Benchmark | Question | Headline |
|---|---|---|
| **Polymarket benchmark** | What fraction of Polymarket markets resolving in the next 24 hours can GenLayer resolve? | ~96.8% (cumulative since May 6, 2026; excludes Chainlink/Pyth) |
| **Sources benchmark** | Which web sources are reachable from validator-equivalent infrastructure? | 72 working / 6 blocked (out of 78 unique hosts) |

## How to read the headlines

The Polymarket benchmark's `96.8%` is **forward-looking inference**: GenLayer has been Studio-verified on representative markets per source family; we claim every market on those families would resolve the same way. The methodology page on the dashboard documents this in plain prose.

Polymarket's daily universe is roughly 41% on-chain price feeds (Chainlink ~40%, Pyth ~1%) and 59% markets that need human-style resolution. The headline measures only the second group — the only one where an LLM oracle has a role.

## Local development

```bash
pnpm install                                          # workspace install
pnpm --filter @gym/pm-bench daily                     # poll + analyze today
node benchmarks/pm-bench/scripts/poll-closed.mjs      # fetch resolution outcomes
node benchmarks/pm-bench/scripts/build-data-json.mjs  # emit data/pm-bench/latest.json
pnpm --filter @gym/web dev                            # http://localhost:3000
pnpm --filter @gym/web build                          # static export → apps/web/.next
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md).

## License

MIT. Maintained by the GenLayer Foundation. This is foundation-published benchmark evidence — not an open-contribution project.
