import { describe, expect, it } from "vitest";
import {
  computeDailyReport,
  renderDailyReportMarkdown,
  type DaySummary,
} from "../src/analyze/daily-report.js";

const baseSummary = (overrides: Partial<DaySummary> = {}): DaySummary => ({
  date: "2026-05-07",
  total_rows: 1000,
  unique_markets: 1000,
  unique_events: 800,
  unique_templates: 100,
  unique_domains: 30,
  polled_at_min: "2026-05-07T08:00:00.000Z",
  polled_at_max: "2026-05-07T08:00:00.000Z",
  gate1_chainlink: { matched: 500, pct: 50 },
  gate1_no_url: { matched: 50, pct: 5 },
  gate1_dropped: 550,
  io_addressable_markets: 450,
  io_addressable_templates: 80,
  io_addressable_events: 200,
  io_addressable_recurring: 100,
  io_addressable_non_recurring: 350,
  io_unique_domains: 25,
  truly_io_shaped_markets: 400,
  truly_io_shaped_templates: 70,
  kinds: [
    {
      kind: "esports_match",
      label: "Esports match",
      markets: 200,
      unique_templates: 30,
      unique_events: 30,
      recurring: 0,
      deterministic_feed: false,
    },
    {
      kind: "sports_match",
      label: "Sports match",
      markets: 100,
      unique_templates: 20,
      unique_events: 30,
      recurring: 0,
      deterministic_feed: false,
    },
  ],
  resolution_source_buckets: [
    { domain: "data.chain.link", count: 500, pct: 50 },
    { domain: "www.twitch.tv", count: 200, pct: 20 },
    { domain: "www.uefa.com", count: 100, pct: 10 },
  ],
  io_resolution_source_buckets: [
    { domain: "www.twitch.tv", count: 200, pct: 44.4 },
    { domain: "www.uefa.com", count: 100, pct: 22.2 },
  ],
  top_families: [
    {
      template: "LoL: Team A vs Team B (BO#)",
      kind: "esports_match",
      kindLabel: "Esports match",
      markets: 30,
      recurring: false,
      domain: "www.twitch.tv",
    },
    {
      template: "Real Madrid vs. Barcelona",
      kind: "sports_match",
      kindLabel: "Sports match",
      markets: 12,
      recurring: false,
      domain: "www.uefa.com",
    },
  ],
  ...overrides,
});

describe("computeDailyReport", () => {
  it("emits today-only metrics + filtered callout when no prior summary exists", () => {
    const r = computeDailyReport(baseSummary(), null);
    expect(r.prevDate).toBeNull();
    expect(r.prevFiltered).toBeNull();
    for (const m of r.metrics) {
      expect(m.prev).toBeNull();
    }
    expect(r.filtered.chainlink.markets).toBe(500);
    expect(r.filtered.chainlink.pct).toBeCloseTo(50, 5);
    expect(r.filtered.noUrl.markets).toBe(50);
    expect(r.filtered.totalFiltered.markets).toBe(550);
    expect(r.filtered.ioAddressableMarkets).toBe(450);
    expect(r.filtered.ioAddressablePct).toBeCloseTo(45, 5);
  });

  it("computes deltas focused on unique-templates / events / domains", () => {
    const today = baseSummary({
      io_addressable_templates: 90,
      io_addressable_events: 220,
      io_unique_domains: 28,
    });
    const prev = baseSummary({ date: "2026-05-06" });
    const r = computeDailyReport(today, prev);
    expect(r.prevDate).toBe("2026-05-06");
    const tplMetric = r.metrics.find((m) => m.label === "IO-addressable: unique templates")!;
    expect(tplMetric.delta).toBe(10);
    const eventsMetric = r.metrics.find((m) => m.label === "IO-addressable: unique events")!;
    expect(eventsMetric.delta).toBe(20);
    const domMetric = r.metrics.find((m) => m.label === "IO-addressable: unique domains")!;
    expect(domMetric.delta).toBe(3);
  });

  it("kindShifts surface templates and markets together", () => {
    const today = baseSummary({
      kinds: [
        {
          kind: "esports_match",
          label: "Esports match",
          markets: 250,
          unique_templates: 35,
          unique_events: 35,
          recurring: 0,
          deterministic_feed: false,
        },
        {
          kind: "weather_forecast",
          label: "Weather forecast",
          markets: 50,
          unique_templates: 10,
          unique_events: 10,
          recurring: 50,
          deterministic_feed: false,
        },
      ],
    });
    const prev = baseSummary({
      date: "2026-05-06",
      kinds: [
        {
          kind: "esports_match",
          label: "Esports match",
          markets: 200,
          unique_templates: 30,
          unique_events: 30,
          recurring: 0,
          deterministic_feed: false,
        },
        {
          kind: "news_or_other",
          label: "News / other",
          markets: 20,
          unique_templates: 5,
          unique_events: 5,
          recurring: 0,
          deterministic_feed: false,
        },
      ],
    });
    const r = computeDailyReport(today, prev);
    const esports = r.kindShifts.find((k) => k.kind === "esports_match")!;
    expect(esports.todayTemplates).toBe(35);
    expect(esports.prevTemplates).toBe(30);
    expect(esports.templatesDelta).toBe(5);
    expect(esports.todayMarkets).toBe(250);
    expect(esports.marketsDelta).toBe(50);
    const weather = r.kindShifts.find((k) => k.kind === "weather_forecast")!;
    expect(weather.is_new).toBe(true);
    const news = r.kindShifts.find((k) => k.kind === "news_or_other")!;
    expect(news.is_dropped).toBe(true);
    expect(news.todayTemplates).toBe(0);
  });

  it("classifies IO domains as new, dropped, shifted (chainlink never appears)", () => {
    const today = baseSummary({
      io_resolution_source_buckets: [
        { domain: "www.twitch.tv", count: 350, pct: 50 },
        { domain: "kick.com", count: 80, pct: 11 },
      ],
    });
    const prev = baseSummary({
      date: "2026-05-06",
      io_resolution_source_buckets: [
        { domain: "www.twitch.tv", count: 200, pct: 44.4 },
        { domain: "www.uefa.com", count: 100, pct: 22.2 },
      ],
    });
    const r = computeDailyReport(today, prev);
    const top = r.topDomainShifts.map((d) => d.domain);
    expect(top).not.toContain("data.chain.link");
    expect(top[0]).toBe("www.twitch.tv");
    expect(r.newDomains.map((d) => d.domain)).toContain("kick.com");
    expect(r.droppedDomains.map((d) => d.domain)).toContain("www.uefa.com");
  });

  it("topFamilies reduces fanned-out templates to one row each", () => {
    const r = computeDailyReport(baseSummary(), null);
    expect(r.topFamilies).toHaveLength(2);
    expect(r.topFamilies[0]?.template).toBe("LoL: Team A vs Team B (BO#)");
    expect(r.topFamilies[0]?.markets).toBe(30);
  });

  it("renders all the new sections", () => {
    const md = renderDailyReportMarkdown(
      computeDailyReport(baseSummary(), baseSummary({ date: "2026-05-06" })),
    );
    expect(md).toContain("## Filtered out (deterministic excludes)");
    expect(md).toContain("Everything below is the IO-addressable subset only.");
    expect(md).toContain("## Headline (IO-addressable)");
    expect(md).toContain("## Kinds shift (templates, with markets in parentheses)");
    expect(md).toContain("## Top resolution-source domains in IO-addressable");
    expect(md).toContain("## Top recurring families");
    expect(md).not.toContain("data.chain.link");
  });
});
