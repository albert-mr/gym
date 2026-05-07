---
rubric: genlayer-fit
rubric_version: 0.1.0
---

# `genlayer-fit` rubric

Decide whether resolving this market with **Intelligent Oracle (IO)** would add value, or whether the market is already trivially served by something else. If IO would add no value, the market is **not-fit** and gets dropped. If IO is a sensible resolver, the market **passes** to the next rubric.

## Output

Pick exactly one decision and write a one-line reason in verb-subject form.

- `pass` — IO is a sensible resolver for this market.
- `not-fit` — something else already resolves this trivially.

The reason must name the **specific** signal that drove the decision (the asset, the contract, the feed, the on-chain event). Generic strings like "not a good fit" or "no clear source" are unacceptable.

Examples of acceptable reasons:

- `not-fit: BTC/USD price is served by Chainlink price feeds`
- `not-fit: resolution is the value of an on-chain ERC-20 balance at block N`
- `not-fit: settles on UMA optimistic oracle with deterministic dispute logic`
- `pass: resolution depends on a real-world sports outcome that requires reading a news source`
- `pass: question asks whether a public figure made a public statement by a deadline`

## How to decide

A market is **not-fit** when ALL of the following are true:

1. The resolution can be computed from a deterministic on-chain or public-numeric source (a price feed, an on-chain balance, a tx existence, a block number, a Chainlink-served quantity).
2. There is no human-language judgment required to map the source to the outcome.
3. The result a competent script would produce is the same as the result a competent human would produce, every time.

If even one of those is false, the market **passes**.

A market is **pass** when ANY of the following are true:

- Resolution requires reading a news article, an official announcement, a press release, a social-media post, a regulatory filing, or any other prose-form source.
- Resolution requires interpreting a real-world event (a game, a vote, a launch, a court ruling, a cancellation) where the boundary between outcomes is a judgment call.
- Resolution requires aggregating, comparing, or filtering information from sources that aren't already structured into a feed.
- The market is denominated in a way Chainlink / standard price feeds don't cover (a specific company's revenue, a specific person's net worth at a date, a sport-specific stat).

## Hard rules

- **Do not invent capabilities.** If a market mentions an oracle the project doesn't actually integrate with, that doesn't make it deterministic. Judge by what's actually feasible today.
- **Do not let "vague source" leak into this rubric.** Source viability is the next rubric's job. Here you only judge whether IO would add value if a viable source existed.
- **When in doubt, pass.** It is cheaper to drop a market at `has-source` than to wrongly mark a passable market as `not-fit` and lose it to the funnel.

## Edge cases worth being explicit about

- **Crypto prices not on Chainlink.** A market on a long-tail token's price might require off-chain reading even though it's "just a price." If it's not on Chainlink and there's no obvious deterministic feed, treat as `pass`.
- **Mixed markets.** A market that bundles "did event X happen AND did price Y exceed Z" is `pass` — the event-half requires judgment.
- **Prediction-of-prediction.** A market about whether another market resolves a certain way is generally `pass` because it inherits the underlying market's judgment surface.
