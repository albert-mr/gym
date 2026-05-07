import { describe, expect, it } from "vitest";
import type { PolledMarket } from "../src/schemas/polled-market.js";
import { pickSamples } from "../src/analyze/sample.js";

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
  eventTitle: "t",
  eventEndDate: "2026-05-06T12:00:00.000Z",
  eventResolutionSource: null,
  tags: null,
  ...overrides,
});

describe("pickSamples", () => {
  it("excludes chainlink, empty-source, and deterministic-feed markets", () => {
    const rows: PolledMarket[] = [
      mkMarket({
        id: "chain",
        eventResolutionSource: "https://data.chain.link/streams/btc-usd",
        eventTitle: "Bitcoin Up or Down - May 6",
        tags: ["crypto"],
      }),
      mkMarket({
        id: "empty",
        eventResolutionSource: "",
        eventTitle: "Will X happen",
        tags: ["news"],
      }),
      mkMarket({
        id: "stock",
        eventResolutionSource: "https://finance.yahoo.com/quote/AAPL",
        eventTitle: "Apple closes above 200 on May 6",
        tags: ["stocks"],
      }),
      mkMarket({
        id: "esports",
        eventResolutionSource: "https://www.twitch.tv/lck",
        eventTitle: "LoL: T1 vs Gen.G - LCK",
        tags: ["esports", "sports"],
      }),
    ];
    const picks = pickSamples(rows);
    const ids = picks.map((p) => p.market?.id).filter(Boolean);
    expect(ids).toContain("esports");
    expect(ids).not.toContain("chain");
    expect(ids).not.toContain("empty");
    expect(ids).not.toContain("stock");
  });

  it("maximizes diversity across (kind, domain) and never duplicates ids", () => {
    const rows: PolledMarket[] = [
      // Two esports markets sharing one domain — sampler should pick at most one.
      mkMarket({
        id: "lol-twitch-1",
        eventResolutionSource: "https://www.twitch.tv/lck",
        eventTitle: "LoL: T1 vs Gen.G - LCK",
        tags: ["esports", "sports"],
      }),
      mkMarket({
        id: "lol-twitch-2",
        eventResolutionSource: "https://www.twitch.tv/lck",
        eventTitle: "LoL: HLE vs DK - LCK",
        tags: ["esports", "sports"],
      }),
      // Same kind, different domain — preferred over the second twitch row.
      mkMarket({
        id: "dota-dotabuff",
        eventResolutionSource: "https://www.dotabuff.com/x",
        eventTitle: "Dota 2: Team A vs Team B",
        tags: ["esports"],
      }),
      // Different kind, different domain.
      mkMarket({
        id: "sports-uefa",
        eventResolutionSource: "https://www.uefa.com/x",
        eventTitle: "Real Madrid vs. Barcelona",
        tags: ["sports"],
      }),
      mkMarket({
        id: "weather-wu",
        eventResolutionSource: "https://www.wunderground.com/x",
        eventTitle: "Highest temperature in London on May 6",
        tags: ["weather"],
      }),
      mkMarket({
        id: "news-reuters",
        eventResolutionSource: "https://reuters.com/x",
        eventTitle: "Breaking news headline",
        tags: ["news"],
      }),
    ];

    const picks = pickSamples(rows);
    expect(picks.length).toBe(5);
    const ids = picks.map((p) => p.market?.id);
    expect(new Set(ids).size).toBe(picks.length);

    // Picks are id-sorted with tiebreaker; first market scores 3 → `dota-dotabuff`.
    // Subsequent picks prefer score-3 (both kind+domain new) candidates,
    // breaking ties on id-sorted order: news, sports, weather.
    // Final pick must reuse a kind (only twitch esports rows remain).
    expect(ids).toEqual([
      "dota-dotabuff",
      "news-reuters",
      "sports-uefa",
      "weather-wu",
      "lol-twitch-1",
    ]);
  });

  it("returns null markets when fewer than 5 eligible rows exist", () => {
    const rows: PolledMarket[] = [
      mkMarket({
        id: "only",
        eventResolutionSource: "https://www.uefa.com/x",
        eventTitle: "Real Madrid vs. Barcelona",
        tags: ["sports"],
      }),
    ];
    const picks = pickSamples(rows);
    expect(picks.length).toBe(5);
    expect(picks[0]?.market?.id).toBe("only");
    for (let i = 1; i < 5; i++) {
      expect(picks[i]?.market).toBeNull();
    }
  });
});
