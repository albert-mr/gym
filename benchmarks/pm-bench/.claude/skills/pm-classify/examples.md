# Edge cases the rubrics must handle

Prose descriptions of the market shapes the classifier should get right. Use these to sanity-check rubric drift. They are documentation, not test fixtures — there is no input schema bound to them.

When a real market lands that the classifier handles wrong, write its summary as a new entry below and update the rubric until the entry's expected outcome holds.

---

## `not-fit` cases — markets a deterministic oracle already serves

### Chainlink price feed
A market on whether BTC/USD is above some threshold at a future timestamp, where the resolution rule explicitly cites a Chainlink price feed (or names a feed contract address). Expected: `genlayer-fit = not-fit`. Reason should name the asset and the feed: `not-fit: BTC/USD is served by Chainlink price feeds`.

### Pure on-chain settlement
A market on whether an Ethereum address receives X tokens between block A and block B, computed by summing transaction values on-chain. No external sources. Expected: `genlayer-fit = not-fit`. Reason should name the on-chain operation: `not-fit: resolves by summing on-chain ERC-20 transfers between two block heights`.

---

## `addressable` cases — passes both rubrics

### Sports market with explicit URL
"Will the Lakers beat the Celtics on April 15?" with the description naming a specific NBA box-score URL. Expected: `genlayer-fit = pass`, `has-source = pass`, source captured verbatim as the URL. Reason for has-source should name the URL.

### Sports market with domain only (no exact URL)
"Will the Warriors win the 2025-26 NBA Championship, as reported by nba.com." No URL given, but the domain is named. Expected: `genlayer-fit = pass`, `has-source = pass`, source captured as `nba.com`. The domain mention counts — finding the exact URL inside is a separate future step.

### Structured field and description name different sources
An esports market where the description names a stats database as the binding source ("official information from https://gol.gg/esports/home") while the polled `eventResolutionSource` field points at a live-stream URL on a different domain (`https://www.twitch.tv/LITofficial`). The two sources differ in kind: the description URL is a post-match results page; the structured field is a live broadcast. Expected: `genlayer-fit = pass`, `has-source = pass`, with both sources captured joined by `"; "` per the multiple-sources rule. The non-obvious bit is that disagreement between PM's structured field and the prose-named source is not a contradiction to resolve — it's two binding signals, both kept.

---

## `no-source` cases — fits GenLayer but no usable source

### Vague aggregator
A politics market resolved "based on news reports and official sources" with no specific outlet or URL named. Expected: `genlayer-fit = pass`, `has-source = no-source`. Reason should name the vagueness: `no-source: description says "news reports and official sources" without naming any outlet`.

### Outlets named only as examples
A tech market resolved "based on credible news coverage from major outlets such as Reuters, The Verge, TechCrunch, Bloomberg, or any other reputable technology publication, at PM's discretion." Outlets appear, but the hedge ("such as", "or any other", "at PM's discretion") makes none binding. Expected: `genlayer-fit = pass`, `has-source = no-source`. Reason should name the example-only phrasing.

---

## How to use this file

If you change a rubric, mentally walk through every entry above and confirm the expected outcome still holds. Any drift means either the rubric needs another adjustment or the example needs revision (and the rubric's `rubric_version` should bump).
