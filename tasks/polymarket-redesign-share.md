# Polymarket benchmark redesign — share

May 12 design review. Working list of what's next, grouped by surface. Open Questions are open — listed, not answered.

## What this benchmark is

The Polymarket benchmark measures how much of Polymarket's live market activity the Intelligent Oracle can resolve from public sources. It runs daily over the markets resolving in the next 24 hours, classifies them into Direct source / Alternative source / Currently unresolvable, and reports coverage today (and accuracy once we run the backtest). It is the productized case study for Intelligent Oracle on prediction markets.

## Themes (apply everywhere)

- Show, don't tell — charts replace prose, items replace paragraphs.
- "Intelligent Oracle" leads inside this benchmark (gym landing stays GenLayer).
- Explain every drop in the funnel, every miss, every choice — never silent.

## Landing & Headline

- 96.8% inside an interactive visualization (pie / funnel / Sankey — build all three, keep what reads fastest).
- Show the full 100% Polymarket universe; 96.8% is one cut inside it.
- Interactive filters on Landing (toggle Chainlink, source families) — the % updates live.
- Add a second top-line metric: "resolved correctly %" (target 100% on the cleanest cut).

## Per-market detail page (new)

- One page per market. Link to Polymarket and to the Intelligent Oracle on-chain transaction.
- Big visual success / fail / not-relevant mark.
- Show the gates that passed, the source URL used, the decision.
- Linked from the Explorer listing and from methodology examples.

## Explorer (listing + filters)

- Better filter naming so each row reads as itself ("alternative source" is obvious without interpretation).
- Add filters: on-chain-feed family, status, source domain, "Intelligent Oracle disagrees with Polymarket".
- Each row → per-market detail page.
- Methodology category headings deep-link into the pre-filtered Explorer.

## Methodology

- Lead with Intelligent Oracle. Talk about it a lot — this page is where the brand lives.
- Coding skills section (gate 1 / gate 2 / gate 3) and a new implementation sub-page that shows `skills.md` inline.
- Name the "deeper-page" off-chain agent step as a distinct funnel step.
- Rename "validator-equivalent infrastructure" → **Bradbury**, with the controlled-IP explanation.
- Per filter step, one line on why markets drop + 1–2 real examples linked to per-market detail.
- Three categories as bulleted items with examples and Explorer deep-links. Alternative source gets a disclaimer asterisk (agent-chosen today, not a hardened whitelist).
- Call out "both yes and no" data sufficiency.

## Sources benchmark

- Tag every source (`polymarket`, `news`, `local-news`, `sports`, etc.). Filter view by tag.
- Add a "why is this source here" field per source.
- Distinguish two axes: source accessibility (can we reach it?) vs. source usage (which benchmark uses it?).
- Submissions flow for external contributors (decide PR vs. form — see Open Questions).

## Open Questions

- How do we know an alternative source is reputable and covers the necessary data?
- Possible attacks (agent-chosen sources, fake blog posts that pass the agent).
- Do we need multiple-source agreement to resolve a market?
- What does it mean for Polymarket to provide an alternative source? Protocol, agent, hardening?
- Backup if the primary source fails or changes layout.
- Dispute / escalation — do we elevate to UMA after a dispute?
- Long-horizon markets — different risk profile, no explicit source URL in many cases. Inclusion path?
- Surfacing Intelligent Oracle ↔ Polymarket disagreements when they appear.
- Intelligent Oracle cadence — every market every day, or batched representatives?

## Roadmap (from the call, deferred from the punch list)

- Accuracy backtest — replay closed markets through Intelligent Oracle on Bradbury, compare to Polymarket.
- Run Intelligent Oracle in real time on every market (today: manual, batched, rate-limit constrained).
- Bradbury production deployment.
- Studio rate-limit raise from Edgar (pinged, awaiting max).
- Currently-unresolvable resolution paths — TLS notary, official APIs (e.g., New York Times).
- Submissions flow for sources benchmark.
- Intelligent Oracle branding push outside this benchmark (docs, landing).
