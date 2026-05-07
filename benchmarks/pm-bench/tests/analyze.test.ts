import { describe, expect, it } from "vitest";
import type { PolledMarket } from "../src/schemas/polled-market.js";
import { analyze } from "../src/analyze/analyze.js";
import { hasAnyUrl, isGate1Match } from "../src/analyze/buckets.js";
import { dedupeByLatestPoll, parseJsonl } from "../src/analyze/load.js";

const mkMarket = (overrides: Partial<PolledMarket> = {}): PolledMarket => ({
  schema_version: "1.0.0",
  polled_at: "2026-05-06T10:00:00.000Z",
  id: "1",
  conditionId: "0x1",
  question: "q",
  slug: "s",
  description: null,
  endDate: "2026-05-06T12:00:00.000Z",
  startDate: null,
  closed: false,
  active: true,
  archived: false,
  outcomes: ["Yes", "No"],
  outcomePrices: [0.5, 0.5],
  volumeNum: 100,
  liquidityNum: 50,
  createdAt: null,
  updatedAt: null,
  umaResolutionStatuses: null,
  marketType: null,
  eventId: "e1",
  eventTitle: "Some event - May 6",
  eventEndDate: "2026-05-06T12:00:00.000Z",
  eventResolutionSource: null,
  tags: null,
  ...overrides,
});

describe("hasAnyUrl", () => {
  it("returns true when eventResolutionSource has a URL", () => {
    expect(
      hasAnyUrl({ eventResolutionSource: "https://example.com/feed", description: null }),
    ).toBe(true);
  });

  it("returns true when only description carries a URL", () => {
    expect(
      hasAnyUrl({
        eventResolutionSource: null,
        description: "Resolves per https://example.com/feed at 18:00 UTC.",
      }),
    ).toBe(true);
  });

  it("returns false when both fields are URL-free", () => {
    expect(hasAnyUrl({ eventResolutionSource: null, description: null })).toBe(false);
    expect(hasAnyUrl({ eventResolutionSource: "", description: "" })).toBe(false);
    expect(
      hasAnyUrl({ eventResolutionSource: "  ", description: "Resolves per the announcement." }),
    ).toBe(false);
  });

  it("recognizes http (not just https)", () => {
    expect(
      hasAnyUrl({ eventResolutionSource: null, description: "see http://foo.test/x for details" }),
    ).toBe(true);
  });
});

describe("isGate1Match", () => {
  it("matches Chainlink prefixes only", () => {
    expect(isGate1Match("https://data.chain.link/streams/btc-usd")).toBe(true);
    expect(isGate1Match("https://reference.chainlink.com/foo")).toBe(true);
    expect(isGate1Match("https://www.binance.com/en/trade/BTC_USDT")).toBe(false);
    expect(isGate1Match(null)).toBe(false);
  });
});

describe("dedupeByLatestPoll", () => {
  it("keeps the row with the latest polled_at per id", () => {
    const rows = [
      mkMarket({ id: "1", polled_at: "2026-05-06T10:00:00.000Z", volumeNum: 1 }),
      mkMarket({ id: "1", polled_at: "2026-05-06T11:00:00.000Z", volumeNum: 2 }),
      mkMarket({ id: "2", polled_at: "2026-05-06T10:00:00.000Z", volumeNum: 5 }),
    ];
    const out = dedupeByLatestPoll(rows);
    expect(out.length).toBe(2);
    const m1 = out.find((r) => r.id === "1")!;
    expect(m1.volumeNum).toBe(2);
  });
});

describe("parseJsonl", () => {
  it("parses one row per non-empty line", () => {
    const sample = JSON.stringify(mkMarket({ id: "x" }));
    const text = `${sample}\n\n${sample}\n`;
    const out = parseJsonl(text);
    expect(out.length).toBe(2);
  });

  it("reports the line number on a bad parse", () => {
    const sample = JSON.stringify(mkMarket({ id: "x" }));
    const text = `${sample}\n{bad json`;
    expect(() => parseJsonl(text)).toThrowError(/line 2/);
  });
});

describe("analyze", () => {
  const rows: PolledMarket[] = [
    mkMarket({
      id: "a",
      eventId: "e-chain-1",
      eventResolutionSource: "https://data.chain.link/streams/btc-usd",
      tags: ["crypto", "bitcoin"],
      volumeNum: 50,
      eventTitle: "Bitcoin Up or Down - May 6, 6:15AM",
    }),
    mkMarket({
      id: "b",
      eventId: "e-chain-2",
      eventResolutionSource: "https://data.chain.link/streams/eth-usd",
      tags: ["crypto", "ethereum"],
      volumeNum: 500,
      eventTitle: "Ethereum Up or Down - May 6, 6:30AM",
    }),
    mkMarket({
      id: "c",
      eventId: "e-sport",
      eventResolutionSource: "https://www.espn.com/nba/scoreboard",
      tags: ["sports", "nba"],
      volumeNum: 5000,
      eventTitle: "Lakers vs Celtics - May 6",
    }),
    mkMarket({
      id: "d",
      eventId: "e-uma",
      eventResolutionSource: "",
      tags: ["politics"],
      volumeNum: 12000,
      eventTitle: "Will X happen by tomorrow",
    }),
    mkMarket({
      id: "e",
      eventId: "e-news",
      eventResolutionSource: "https://www.reuters.com/world/",
      tags: ["news"],
      volumeNum: 200000,
      eventTitle: "Breaking news - some headline",
      outcomes: ["A", "B", "C"],
      outcomePrices: [0.2, 0.3, 0.5],
    }),
  ];

  it("computes counts and uniqueness correctly", () => {
    const r = analyze(rows);
    expect(r.totalRows).toBe(5);
    expect(r.uniqueMarkets).toBe(5);
    expect(r.uniqueEvents).toBe(5);
  });

  it("counts Gate 1a (Chainlink) drops by URL prefix", () => {
    const r = analyze(rows);
    expect(r.gate1Chainlink.matched).toBe(2);
    expect(r.gate1Chainlink.total).toBe(5);
    expect(r.gate1Chainlink.pct).toBeCloseTo(40, 1);
  });

  it("counts Gate 1b (no URL anywhere) drops", () => {
    // Row "d" has eventResolutionSource="" and description=null — no URL anywhere.
    const r = analyze(rows);
    expect(r.gate1NoUrl.matched).toBe(1);
    expect(r.gate1NoUrl.pct).toBeCloseTo(20, 1);
    expect(r.gate1Dropped).toBe(3);
  });

  it("buckets resolution-source domains", () => {
    const r = analyze(rows);
    const top = r.resolutionSourceBuckets[0]!;
    expect(top.domain).toBe("data.chain.link");
    expect(top.count).toBe(2);
    const empty = r.resolutionSourceBuckets.find((b) => b.domain === "(empty)");
    expect(empty?.count).toBe(1);
  });

  it("reports tag frequency including multi-tag rows", () => {
    const r = analyze(rows);
    const crypto = r.topTags.find((t) => t.tag === "crypto");
    expect(crypto?.count).toBe(2);
    const sports = r.topTags.find((t) => t.tag === "sports");
    expect(sports?.count).toBe(1);
  });

  it("classifies outcome shapes", () => {
    const r = analyze(rows);
    const binary = r.outcomeShapes.find((s) => s.shape === "binary");
    expect(binary?.count).toBe(4);
    const threeWay = r.outcomeShapes.find((s) => s.shape === "3-way");
    expect(threeWay?.count).toBe(1);
  });

  it("renders an end-time histogram in hour buckets", () => {
    const future = mkMarket({
      id: "future",
      polled_at: "2026-05-06T10:00:00.000Z",
      endDate: "2026-05-06T15:30:00.000Z",
    });
    const r = analyze([rows[0]!, future]);
    expect(r.endTimeHistogram.length).toBeGreaterThan(0);
    const hours = r.endTimeHistogram.map((h) => h.hour);
    expect(hours).toContain(2);
    expect(hours).toContain(5);
  });
});
