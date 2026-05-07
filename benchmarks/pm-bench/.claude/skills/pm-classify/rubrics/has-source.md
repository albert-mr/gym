---
rubric: has-source
rubric_version: 0.1.0
---

# `has-source` rubric

Only run this rubric if `genlayer-fit` decided `pass`.

Decide whether the market actually points to a usable source we could resolve against. If yes, **pass** and capture the source string verbatim. If no, **no-source** and drop.

## Output

Pick exactly one decision and write a one-line reason in verb-subject form. Capture the source string verbatim (the URL or the domain mention) when the decision is `pass`; otherwise leave the source field null.

- `pass` — market points to an explicit URL or names a specific domain that downstream tooling could fetch from.
- `no-source` — market lists no source, points only to "examples", or refers vaguely to news/sources without naming one.

Examples of acceptable reasons:

- `pass: PM resolution_source field is https://www.nba.com/games/...`
- `pass: description names nba.com as the deciding source`
- `pass: description points to apnews.com for the official result`
- `no-source: description says "see news reports" without naming any outlet`
- `no-source: description lists ESPN, Reuters, AP only as examples and reserves discretion`
- `no-source: no source field set and description does not mention any outlet by name`

## How to decide — what counts as an explicit source

**Pass** when the market specifies at least one of:

1. A full URL in `resolution_source`, `source_urls`, or anywhere in `description`.
2. A specific domain name (e.g. `nba.com`, `apnews.com`, `reuters.com`, `sec.gov`) named as the source. Domain-only is sufficient — finding the exact URL inside that domain is the next skill's job, not this one's.
3. A specific publication or organization that maps unambiguously to one place (e.g. "the official NBA box score", "the SEC EDGAR filing", "the White House press briefing transcript"). The source has to be unambiguous enough that two reasonable humans would agree on where to look.

**No-source** when ALL of the following are true:

1. No URL appears anywhere in the structured fields or the description.
2. No specific domain is named.
3. No specific publication / organization is named in a way that maps to one unambiguous place.
4. The description either is silent on sourcing, lists outlets only as examples ("such as ESPN, Reuters, or any major sports outlet"), or reserves discretion ("PM will use its judgment based on news reports").

## Hard rules

- **Domain mention counts.** If the description says "according to nba.com", that is a `pass` even though no specific URL is given. Capture `nba.com` as the source string.
- **"Examples" do not count.** Lists of outlets that PM names as examples (with hedging language like "such as", "including but not limited to", "any major outlet") are `no-source`, because none of them is binding.
- **Vague aggregator references do not count.** "News", "the press", "official sources" without naming one are `no-source`.
- **Read the whole description.** PM frequently puts the actual source one paragraph below the question. Do not stop at the first sentence.
- **Capture the source verbatim.** When `pass`, copy the URL or domain string exactly as it appears (no paraphrasing, no normalisation). The downstream Gate-3 probe needs the raw string.

## Edge cases worth being explicit about

- **Multiple specific sources listed.** If PM names two or three specific URLs/domains as binding, `pass` and capture all of them joined by "; " in the source string.
- **Specific source plus hedge.** "Will resolve based on nba.com box score, or any other authoritative source if nba.com is unavailable." Treat as `pass` with `nba.com` as the captured source — there is one specific binding source, the hedge is a fallback.
- **Source is itself an aggregator.** "Will resolve based on whichever outlet reports first." This is `no-source` because no specific outlet is named.
- **Source is a person's account.** "Will resolve based on @elonmusk on X." Treat as `pass` with `x.com/elonmusk` (or the verbatim handle) — a specific account on a specific platform is unambiguous.
