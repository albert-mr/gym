import { describe, expect, it } from "vitest";
import { categorize, isDeterministicFeed } from "../src/analyze/categorize.js";
import type { PolledMarket } from "../src/schemas/polled-market.js";

const mk = (overrides: Partial<PolledMarket> = {}): PolledMarket => ({
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
  volumeNum: null,
  liquidityNum: null,
  createdAt: null,
  updatedAt: null,
  umaResolutionStatuses: null,
  marketType: null,
  eventId: "e1",
  eventTitle: null,
  eventEndDate: null,
  eventResolutionSource: null,
  tags: null,
  ...overrides,
});

describe("categorize", () => {
  it("classifies chainlink as crypto_price_feed", () => {
    expect(
      categorize(mk({ eventResolutionSource: "https://data.chain.link/streams/btc-usd" })),
    ).toBe("crypto_price_feed");
  });

  it("classifies binance futures as crypto_price_feed", () => {
    expect(
      categorize(
        mk({
          eventTitle: "Bitcoin Up or Down - May 6, 11AM ET",
          eventResolutionSource: "https://www.binance.com/en/futures/BTCUSDT",
        }),
      ),
    ).toBe("crypto_price_feed");
  });

  it("classifies wunderground as weather_forecast", () => {
    expect(
      categorize(
        mk({
          eventTitle: "Highest temperature in Atlanta on May 6?",
          eventResolutionSource: "https://www.wunderground.com/weather/us/ga/atlanta",
        }),
      ),
    ).toBe("weather_forecast");
  });

  it("classifies LoL match as esports_match", () => {
    expect(
      categorize(
        mk({
          eventTitle: "LoL: Gen.G vs Nongshim Red Force (BO3)",
          eventResolutionSource: "https://www.twitch.tv/lol_esports",
        }),
      ),
    ).toBe("esports_match");
  });

  it("classifies Dota match (dotabuff source) as esports_match", () => {
    expect(
      categorize(
        mk({
          eventTitle: "Dota 2: Team Nemesis vs Zero Tenacity (BO3)",
          eventResolutionSource: "https://www.dotabuff.com/matches/...",
        }),
      ),
    ).toBe("esports_match");
  });

  it("classifies UEFA match as sports_match", () => {
    expect(
      categorize(
        mk({
          eventTitle: "FC Bayern München vs. Paris Saint-Germain FC",
          eventResolutionSource: "https://www.uefa.com/",
        }),
      ),
    ).toBe("sports_match");
  });

  it("classifies pure twitch (non-esports title) as streamer_or_view_count", () => {
    expect(
      categorize(
        mk({
          eventTitle: "Will streamer X reach 10000 subs by midnight?",
          eventResolutionSource: "https://www.twitch.tv/somestreamer",
        }),
      ),
    ).toBe("streamer_or_view_count");
  });

  it("classifies election title as election_political", () => {
    expect(
      categorize(
        mk({
          eventTitle: "Scottish Parliament Election Winner",
          eventResolutionSource: "https://www.bbc.co.uk/news/politics",
        }),
      ),
    ).toBe("election_political");
  });

  it("classifies stock close-above (yahoo source) as stock_or_finance", () => {
    expect(
      categorize(
        mk({
          eventTitle: "Apple (AAPL) closes above $200 on May 6?",
          eventResolutionSource: "https://finance.yahoo.com/quote/AAPL",
        }),
      ),
    ).toBe("stock_or_finance");
  });

  it("falls back to news_or_other on non-matching domains", () => {
    expect(
      categorize(
        mk({
          eventTitle: "Some long-tail one-off question",
          eventResolutionSource: "https://example.com/random",
        }),
      ),
    ).toBe("news_or_other");
  });

  it("isDeterministicFeed reports crypto_price_feed and stock_or_finance as feeds", () => {
    expect(isDeterministicFeed("crypto_price_feed")).toBe(true);
    expect(isDeterministicFeed("stock_or_finance")).toBe(true);
    expect(isDeterministicFeed("sports_match")).toBe(false);
    expect(isDeterministicFeed("weather_forecast")).toBe(false);
    expect(isDeterministicFeed("news_or_other")).toBe(false);
  });
});
