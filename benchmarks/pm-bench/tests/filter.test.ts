import { describe, expect, it } from "vitest";
import { filterMarkets } from "../src/poller/filter.js";
import type { FlattenedMarket } from "../src/poller/flatten.js";
import type { GammaRawMarket } from "../src/schemas/gamma-raw.js";

const mkMarket = (overrides: Partial<GammaRawMarket> = {}): GammaRawMarket => ({
  id: "1",
  question: "q",
  slug: "s",
  conditionId: "0x1",
  description: null,
  endDate: "2026-05-06T12:00:00Z",
  startDate: null,
  closed: false,
  active: true,
  archived: false,
  outcomes: ["Yes", "No"],
  outcomePrices: ["0.5", "0.5"],
  volume: null,
  volumeNum: null,
  liquidity: null,
  liquidityNum: null,
  createdAt: null,
  updatedAt: null,
  umaResolutionStatuses: null,
  marketType: null,
  ...overrides,
});

const mkRow = (overrides: Partial<GammaRawMarket> = {}): FlattenedMarket => ({
  market: mkMarket(overrides),
  eventId: "evt-1",
  eventTitle: "evt",
  eventEndDate: "2026-05-06T12:00:00Z",
  eventResolutionSource: null,
  eventTags: null,
});

const window = {
  start: new Date("2026-05-06T06:00:00Z"),
  end: new Date("2026-05-07T06:00:00Z"),
};

describe("filterMarkets", () => {
  it("keeps a market with endDate inside the window", () => {
    const r = filterMarkets([mkRow({ endDate: "2026-05-06T12:00:00Z" })], window);
    expect(r.kept.length).toBe(1);
    expect(r.dropped.length).toBe(0);
  });

  it("keeps boundary endDate equal to window.start", () => {
    const r = filterMarkets([mkRow({ endDate: window.start.toISOString() })], window);
    expect(r.kept.length).toBe(1);
  });

  it("keeps boundary endDate equal to window.end", () => {
    const r = filterMarkets([mkRow({ endDate: window.end.toISOString() })], window);
    expect(r.kept.length).toBe(1);
  });

  it("drops endDate one ms before window.start", () => {
    const justBefore = new Date(window.start.getTime() - 1).toISOString();
    const r = filterMarkets([mkRow({ endDate: justBefore })], window);
    expect(r.kept.length).toBe(0);
    expect(r.dropped[0]?.reason).toBe("endDate-before-window");
  });

  it("drops endDate one ms after window.end", () => {
    const justAfter = new Date(window.end.getTime() + 1).toISOString();
    const r = filterMarkets([mkRow({ endDate: justAfter })], window);
    expect(r.kept.length).toBe(0);
    expect(r.dropped[0]?.reason).toBe("endDate-after-window");
  });

  it("drops closed markets even when endDate is in window", () => {
    const r = filterMarkets([mkRow({ closed: true })], window);
    expect(r.kept.length).toBe(0);
    expect(r.dropped[0]?.reason).toBe("closed");
  });

  it("drops archived markets", () => {
    const r = filterMarkets([mkRow({ archived: true })], window);
    expect(r.kept.length).toBe(0);
    expect(r.dropped[0]?.reason).toBe("archived");
  });

  it("drops markets with no outcomes", () => {
    const r = filterMarkets([mkRow({ outcomes: null })], window);
    expect(r.kept.length).toBe(0);
    expect(r.dropped[0]?.reason).toBe("no-outcomes");
  });

  it("drops UMA-stuck markets (past endDate, not yet closed)", () => {
    const r = filterMarkets([mkRow({ endDate: "2025-10-31T00:00:00Z" })], window);
    expect(r.kept.length).toBe(0);
    expect(r.dropped[0]?.reason).toBe("endDate-before-window");
  });

  it("drops markets with unparseable endDate", () => {
    const r = filterMarkets([mkRow({ endDate: "not-a-date" })], window);
    expect(r.kept.length).toBe(0);
    expect(r.dropped[0]?.reason).toBe("endDate-unparseable");
  });
});
