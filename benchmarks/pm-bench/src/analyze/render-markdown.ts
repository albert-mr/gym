import type { AnalyzeResult } from "./analyze.js";

const fmtPct = (n: number): string => `${n.toFixed(1)}%`;
const fmtNum = (n: number): string => n.toLocaleString("en-US");
const fmtSigned = (n: number): string => (n > 0 ? `+${fmtNum(n)}` : fmtNum(n));

export function renderMarkdown(date: string, r: AnalyzeResult): string {
  const lines: string[] = [];

  lines.push(`# pm-bench snapshot — ${date}`);
  lines.push("");
  lines.push(`Universe: Polymarket markets resolving in the next 24h, \`closed=false\`.`);
  lines.push("");

  lines.push(`## Header`);
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Total rows (incl. duplicates from multi-poll days) | ${fmtNum(r.totalRows)} |`);
  lines.push(`| Unique markets (by id) | ${fmtNum(r.uniqueMarkets)} |`);
  lines.push(`| Unique events (Polymarket grouping) | ${fmtNum(r.uniqueEvents)} |`);
  lines.push(`| Unique templates (digits stripped, trimmed at first \` - \`) | ${fmtNum(r.uniqueTemplates)} |`);
  lines.push(`| polled_at min | ${r.polledAtMin ?? "(none)"} |`);
  lines.push(`| polled_at max | ${r.polledAtMax ?? "(none)"} |`);
  lines.push(`| endDate min | ${r.endDateMin ?? "(none)"} |`);
  lines.push(`| endDate max | ${r.endDateMax ?? "(none)"} |`);
  lines.push("");

  lines.push(`## Funnel — what IO can solve and what it can't`);
  lines.push("");
  lines.push(`| Step | Δ | Remaining | % of total |`);
  lines.push(`| --- | ---: | ---: | ---: |`);
  for (const f of r.funnel) {
    lines.push(`| ${f.step} | ${fmtSigned(f.delta)} | ${fmtNum(f.remaining)} | ${fmtPct(f.pctOfTotal)} |`);
  }
  lines.push("");
  lines.push(`**Post-Gate-1 (IO-addressable): ${fmtNum(r.ioAddressableMarkets)} markets / ${fmtNum(r.ioAddressableTemplates)} unique templates.**`);
  lines.push(
    `**Gate 1 dropped: ${fmtNum(r.gate1Chainlink.matched)} Chainlink-fed + ${fmtNum(r.gate1NoUrl.matched)} with no URL anywhere = ${fmtNum(r.gate1Dropped)} markets.**`,
  );
  lines.push("");

  lines.push(`## Coverage scenarios`);
  lines.push("");
  lines.push(`| Scenario | Markets | Coverage | Description |`);
  lines.push(`| --- | ---: | ---: | --- |`);
  for (const s of r.coverageScenarios) {
    lines.push(`| ${s.name} | ${fmtNum(s.markets)} | ${fmtPct(s.pctOfTotal)} | ${s.description} |`);
  }
  lines.push("");
  lines.push(
    `Gate 2 (the LLM/skill rubric on the residual) is reserved for a later pass — see PLAN.md §3.3.`,
  );
  lines.push("");

  lines.push(`## Recurring vs one-off (within IO-addressable)`);
  lines.push("");
  const recPct = r.ioAddressableMarkets === 0 ? 0 : (r.ioAddressableRecurring / r.ioAddressableMarkets) * 100;
  const nonRecPct = r.ioAddressableMarkets === 0 ? 0 : (r.ioAddressableNonRecurring / r.ioAddressableMarkets) * 100;
  lines.push(`| Bucket | Markets | % of IO-addressable |`);
  lines.push(`| --- | ---: | ---: |`);
  lines.push(`| Recurring (templated, fans out daily) | ${fmtNum(r.ioAddressableRecurring)} | ${fmtPct(recPct)} |`);
  lines.push(`| Non-recurring (true one-off) | ${fmtNum(r.ioAddressableNonRecurring)} | ${fmtPct(nonRecPct)} |`);
  lines.push("");

  lines.push(`## Kinds of markets (within IO-addressable)`);
  lines.push("");
  lines.push(`| Kind | Markets | % | Templates | Events | Recurring | Note |`);
  lines.push(`| --- | ---: | ---: | ---: | ---: | ---: | --- |`);
  for (const k of r.kindBreakdown) {
    const kPct = r.ioAddressableMarkets === 0 ? 0 : (k.markets / r.ioAddressableMarkets) * 100;
    const note = k.isDeterministicFeed ? "deterministic feed (IO not useful)" : "IO-shaped";
    lines.push(
      `| ${k.label} | ${fmtNum(k.markets)} | ${fmtPct(kPct)} | ${fmtNum(k.uniqueTemplates)} | ${fmtNum(k.uniqueEvents)} | ${fmtNum(k.recurring)} | ${note} |`,
    );
  }
  lines.push("");
  lines.push(
    `**Truly IO-shaped (drop deterministic feeds): ${fmtNum(r.trulyIoShapedMarkets)} markets / ${fmtNum(r.trulyIoShapedTemplates)} unique templates.**`,
  );
  lines.push("");

  lines.push(`### Top 3 templates per kind`);
  lines.push("");
  for (const k of r.kindBreakdown) {
    if (k.topTemplates.length === 0) continue;
    lines.push(`- **${k.label}** — ${k.topTemplates.map((t) => `\`${t.template}\` (${t.count})`).join(", ")}`);
  }
  lines.push("");

  lines.push(`## Gate 1 — deterministic exclusion`);
  lines.push("");
  lines.push(
    `Two cheap rules drop markets we are confident IO doesn't need to handle. Anything left over is fed to Gate 2 (LLM/skill rubric, deferred).`,
  );
  lines.push("");

  lines.push(`### Gate 1a — Chainlink-fed`);
  lines.push("");
  lines.push(
    `Markets whose \`eventResolutionSource\` starts with one of: ${r.gate1Chainlink.prefixes
      .map((p) => `\`${p}\``)
      .join(", ")}.`,
  );
  lines.push("");
  lines.push(
    `**Gate 1a hit rate: ${fmtNum(r.gate1Chainlink.matched)} / ${fmtNum(r.gate1Chainlink.total)} (${fmtPct(r.gate1Chainlink.pct)})**`,
  );
  lines.push("");
  if (r.gate1Chainlink.pct >= 50) {
    lines.push(
      `> Decision signal: hit rate ≥ 50%. The URL-prefix rule alone disposes of half the universe. Build it first; LLM rubric can wait.`,
    );
  } else if (r.gate1Chainlink.pct >= 20) {
    lines.push(
      `> Decision signal: hit rate 20-50%. The URL-prefix rule is worth shipping, but the residual is large enough to need an LLM rubric too.`,
    );
  } else {
    lines.push(
      `> Decision signal: hit rate < 20%. The URL-prefix rule is a small cleanup; the LLM rubric carries the weight.`,
    );
  }
  lines.push("");

  lines.push(`### Gate 1b — no URL anywhere`);
  lines.push("");
  lines.push(
    `Markets where neither \`eventResolutionSource\` nor \`description\` contains any \`http(s)://\` URL. With zero URLs in the entire payload, no agentic source-recovery has anything to work with.`,
  );
  lines.push("");
  lines.push(
    `**Gate 1b hit rate: ${fmtNum(r.gate1NoUrl.matched)} / ${fmtNum(r.gate1NoUrl.total)} (${fmtPct(r.gate1NoUrl.pct)})**`,
  );
  lines.push("");
  if (r.gate1NoUrl.pct >= 20) {
    lines.push(
      `> Decision signal: ≥ 20% have no URL anywhere. A bigger-than-expected pile of markets is unrecoverable without a Gate 2 LLM step that can synthesize sources from scratch.`,
    );
  } else {
    lines.push(
      `> Decision signal: < 20% have no URL anywhere. Most markets carry a URL we can hand to Gate 2; this is a tail-case drop.`,
    );
  }
  lines.push("");

  lines.push(`## Resolution-source domains (top 20)`);
  lines.push("");
  lines.push(`| Domain | Count | % |`);
  lines.push(`| --- | ---: | ---: |`);
  for (const b of r.resolutionSourceBuckets) {
    lines.push(`| \`${b.domain}\` | ${fmtNum(b.count)} | ${fmtPct(b.pct)} |`);
  }
  lines.push("");

  lines.push(`## Top tags (top 20)`);
  lines.push("");
  if (r.topTags.length === 0) {
    lines.push(`_(none — re-run the poller with \`--enrich-tags\` to populate this.)_`);
  } else {
    lines.push(`| Tag | Count | % of rows |`);
    lines.push(`| --- | ---: | ---: |`);
    for (const t of r.topTags) {
      lines.push(`| \`${t.tag}\` | ${fmtNum(t.count)} | ${fmtPct(t.pct)} |`);
    }
  }
  lines.push("");

  lines.push(`## Event-title prefix clusters (top 20)`);
  lines.push("");
  lines.push(`Digits replaced with \`#\` and trimmed at the first \` - \` for clustering.`);
  lines.push("");
  lines.push(`| Prefix | Count | % |`);
  lines.push(`| --- | ---: | ---: |`);
  for (const t of r.topEventTitlePrefixes) {
    lines.push(`| ${t.prefix.replace(/\|/g, "\\|")} | ${fmtNum(t.count)} | ${fmtPct(t.pct)} |`);
  }
  lines.push("");

  lines.push(`## End-time histogram (hours from polled_at min)`);
  lines.push("");
  if (r.endTimeHistogram.length === 0) {
    lines.push(`_(no data)_`);
  } else {
    const max = r.endTimeHistogram.reduce((m, h) => Math.max(m, h.count), 0);
    lines.push(`| +Hour | Count | Bar |`);
    lines.push(`| ---: | ---: | --- |`);
    for (const h of r.endTimeHistogram) {
      const barLen = max > 0 ? Math.round((h.count / max) * 30) : 0;
      lines.push(`| +${h.hour}h | ${fmtNum(h.count)} | ${"█".repeat(barLen)} |`);
    }
  }
  lines.push("");

  lines.push(`## Outcome shapes`);
  lines.push("");
  lines.push(`| Shape | Count | % |`);
  lines.push(`| --- | ---: | ---: |`);
  for (const o of r.outcomeShapes) {
    lines.push(`| ${o.shape} | ${fmtNum(o.count)} | ${fmtPct(o.pct)} |`);
  }
  lines.push("");

  lines.push(`---`);
  lines.push(`Generated by \`@gym/pm-bench\` analyze.`);
  lines.push("");
  return lines.join("\n");
}
