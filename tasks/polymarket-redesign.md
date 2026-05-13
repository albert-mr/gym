# Polymarket benchmark redesign — punch list

Source: May 12 design review with the team. Working list for the redesign — captures what was raised in the call so we can work through it together. Items are grouped by surface; cross-cutting themes are at the top. Open Questions captures the product decisions we still need to make — listed with framing, not answered.

## Goals (what this benchmark is)

The Polymarket benchmark measures how much of Polymarket's live market activity the Intelligent Oracle can resolve from public sources. It runs daily over the markets resolving in the next 24 hours, classifies them into Direct source / Alternative source / Currently unresolvable, and reports coverage today and (eventually) accuracy. It is the productized case study for Intelligent Oracle on prediction markets — a real, daily-updated proof point for the Polymarket team, prediction-market builders, and internal stakeholders.

## Cross-cutting themes (apply everywhere)

- **Show, don't tell.** Replace prose explanations with charts (pie / funnel / Sankey). Build all three for the 96.8%, pick what reads fastest, leave it interactive.
- **Items, not paragraphs.** Anywhere copy lists 3+ things (Direct / Alternative / Currently unresolvable, etc.), it becomes a bulleted list. One line per item.
- **Brand: "Intelligent Oracle" inside this benchmark.** Methodology, per-market detail, headline copy. "GenLayer's Intelligent Oracle" on first mention per page is fine. Gym landing and cross-benchmark copy stay GenLayer-led.
- **Explain every drop in the funnel.** Each filter step gets one line of "why we lose markets here" plus a real example linked to a per-market detail page.
- **Every time we miss something, explain why.** This applies to dropped markets, sources we can't access, news without explicit URLs — never silent.

## Landing & Headline

- The 96.8% needs to appear inside a visualization, not as a bare number with a footnote.
  - Build pie chart (Chainlink % / addressable / etc.), funnel chart (universe → on-chain feeds removed → addressable → resolved correctly), and Sankey. Try all three, keep what reads fastest.
  - Right-side hover-expand: hover a slice → two thin lines → expand the next chart inline.
- Show the full **100% Polymarket universe** (including Chainlink and other on-chain feeds) as the parent. The 96.8% becomes one cut inside that, in parentheses.
- Add **interactive filters on the Landing**: toggle Chainlink on/off, toggle other source families on/off, the percentage updates live. "Apaga Chainlink, apaga tal, te muestra el 100% de lo que va quedando."
- Add a **second top-line metric: "resolved correctly %"** alongside coverage. Cleanest cut (direct + alt sources we've verified) should read 100%. This is the metric the team cares about most.
- Replace prose blocks listing the three categories (Direct / Alternative / Currently unresolvable) with bulleted lists — items, one line each.

## Per-market detail page (NEW — does not exist today)

- One page per resolved market.
- **Link out to Polymarket** (the market page).
- **Link to the Intelligent Oracle on-chain transaction** when available. Big, demo-friendly visual mark: success / fail / not relevant.
- Show the steps taken: which gates passed, whether the deeper-page agent ran, what URL it resolved, what the Intelligent Oracle decided. Steps as marks, not prose.
- Linked from the Explorer listing and from methodology examples.
- **Constraint:** Studio rate-limited to ~30 req/s today. Two follow-ups:
  - Ask Edgar to raise the Studio limit (already pinged; awaiting max).
  - Real production path: run on **Bradbury** so per-validator transactions are visible and IPs are real-validator IPs.

## Explorer (listing + filters — improvement of today's drilldown)

- Two views: per-market detail (above) and this listing.
- Filters need work — better naming and better coverage:
  - Filter by on-chain-feed family (Chainlink, Pyth, etc.) — surface these explicitly; they aren't shown today
  - Filter by source bucket (Direct / Alternative / Currently unresolvable)
  - Filter by date range
  - Filter by status (resolved correctly / disagrees with Polymarket / unresolvable)
  - Filter by template pattern
  - Filter by source domain
- Naming: when a row is "alternative source," that should be obvious without interpretation. Audit every label.
- Each row links to the per-market detail page.
- Methodology category headings deep-link into pre-filtered Explorer ("Direct source examples →" → Explorer filtered to direct).
- **New filter: "Markets where Intelligent Oracle disagrees with Polymarket."** Today the count is zero; surface it the moment one appears.

## Methodology

- Lead with **Intelligent Oracle**, not GenLayer. ("GenLayer's Intelligent Oracle" on first mention is fine.)
- Talk about Intelligent Oracle **a lot** — this page is where the brand lives.
- **Coding skills section.** Walk through the gates (gate 1 / gate 2 / gate 3) used by the Intelligent Oracle in detail.
- **New implementation sub-page.** Show the `skills.md` files inline so readers can see the actual coding skills. Linked from methodology.
- **Deeper-page step.** Name it as a distinct off-chain step in the funnel. An agent does an off-chain search → resolves the URL → hands the URL to the Intelligent Oracle. Mark this clearly in the classifier and funnel so direct-with-deeper-page is visible separately from pure direct.
- **Validator-equivalent infrastructure → name it "Bradbury".** Today's copy says "validator-equivalent infrastructure"; replace with "Bradbury" and explain the controlled IP pool. Note that Studio's web.render IPs get 403'd by some hosts (e.g., SofaScore), so Studio probes are not representative of validator behavior.
- **Per-filter funnel explanations.** Each step in the funnel gets a one-line "why we lose markets here" plus 1-2 real examples linked to per-market detail. Chainlink → "deterministic on-chain feed, no need for GenLayer." No source URL → "no explicit source; eventually agentic search." Etc.
- **Three categories with examples and filter links.**
  - Direct source — bulleted items with real example links + deep-link to Explorer filtered to direct.
  - Alternative source — same, with **asterisk disclaimer**: the alt source is currently chosen by an agent, not a hardened whitelist. Anyone publishing a blog post could in principle pass.
  - Currently unresolvable — same, with per-item reason: captcha / login / paywall / 10-articles-then-paywall / etc.
- **Direct source: split visually into pure direct vs. direct-with-deeper-page-agent.** Make the off-chain agent step visible.
- **"Both yes and no" data sufficiency.** Make sure each market has data sufficient to resolve in either direction; call this out on the methodology page.
- **Long-horizon markets / out-of-scope copy:** rename. Don't call it "long horizon." Explain per filter step why these drop today (often: no explicit source; news markets without official data).
- **Intelligent Oracle ↔ Polymarket fit.** Add a section explaining why Intelligent Oracle is a good fit for Polymarket-style markets (data-driven resolution at scale, no human bond, etc.).

## Sources benchmark (sources-bench)

- **Add tags to every source.** Tags include `polymarket`, `news`, `local-news`, `sports`, `argentina`, etc. Multi-tag is fine.
- **Add a "why is this source here" field per source** — which benchmark / dataset / context surfaced it. Polymarket-derived sources get the `polymarket` tag.
- Filter view by tag.
- Distinguish clearly two orthogonal axes:
  - **Source accessibility** — can GenLayer / Intelligent Oracle reach it? (current Yes/No column)
  - **Source usage** — which benchmark / market type uses this source?
- **Submissions flow (link to Open Questions).** External contributors should be able to add sources. PR? Form? Decide later.

## Open Questions

Listed with framing only — no proposed answers. These shape the Intelligent Oracle product and need real product decisions before they're answered.

- **How do we know an alternative source is reputable and covers the necessary data?** Example: ESPN may not cover Argentine third-division metropolitan league. Per-source coverage validation is unsolved today.
- **Possible attacks.** Today the Intelligent Oracle accepts agent-chosen sources beyond a basic whitelist. An adversary could publish a fake blog post that satisfies the agent. UMA punts this to bonded disputes; we don't yet have an automated equivalent.
- **Do we need multiple source agreement to resolve a market?** N-of-M consensus? Always? Only for high-value markets? Open.
- **What does it mean for Polymarket to provide an alternative source?** What's the protocol — Polymarket suggests, we validate? We propose, Polymarket approves? Who's the agent today vs. the hardened future version?
- **Backup if a source fails.** A domain goes down or changes layout. UMA falls back on human common sense; we don't. How do we encode backups so a missing ESPN endpoint doesn't break a market?
- **Dispute / escalation protocol — do we elevate to UMA after a dispute?** Internet Court doesn't exist yet; UMA is the practical fallback. How and when?
- **Long-horizon markets** (election forecasts, year-end markets, news without official data). Different risk profile, no explicit source URLs in many cases. What's the inclusion path? Agentic search? Different resolution mode?
- **Surfacing Intelligent Oracle ↔ Polymarket disagreements.** When we eventually have one, what's the review flow? Manual review? Automated re-run? Notification?
- **Are we Intelligent-Oracle-running every market every day, or batched representative templates?** Productizing this matters: today it's manual, batches take ~20 min, Studio rate limits constrain parallelism.

## Roadmap (deferred from the punch list, all from yesterday's call)

- **Accuracy backtest.** Replay closed markets through the Intelligent Oracle on Bradbury, compare to Polymarket's resolution. Turns the coverage claim into an accuracy claim — what gives the "100% resolved correctly" framing a real foundation.
- **Run Intelligent Oracle in real time on every market.** Today it is manual daily activation with batch runs that are rate-limit constrained. Productize the cadence.
- **Bradbury production deployment.** Move benchmark runs off Studio so per-validator transactions are visible on the per-market detail page and IPs match real validators.
- **Studio rate-limit raise from Edgar.** Already pinged; awaiting max.
- **Currently-unresolvable resolution paths.** TLS notary for API-only sources; official APIs (e.g., New York Times) where available.
- **Submissions flow for the sources benchmark.** PR-based or form-based contribution path for external contributors.
- **Intelligent Oracle branding push outside this benchmark** (docs, landing). Albert needs ownership / access to push those changes.
