import type { PolledMarket } from "../schemas/polled-market.js";
import { domainOf, isGate1Match } from "./buckets.js";

export type MarketKind =
  | "crypto_price_feed"
  | "stock_or_finance"
  | "weather_forecast"
  | "esports_match"
  | "sports_match"
  | "streamer_or_view_count"
  | "election_political"
  | "policy_political"
  | "news_or_other";

export const KIND_LABELS: Record<MarketKind, string> = {
  crypto_price_feed: "Crypto price feed",
  stock_or_finance: "Stock close threshold",
  weather_forecast: "Weather forecast",
  esports_match: "Esports match",
  sports_match: "Sports match",
  streamer_or_view_count: "Streamer / view count",
  election_political: "Election / political",
  policy_political: "Policy / political",
  news_or_other: "News / other",
};

const DETERMINISTIC_FEED_KINDS: ReadonlySet<MarketKind> = new Set([
  "crypto_price_feed",
  "stock_or_finance",
]);

export function isDeterministicFeed(kind: MarketKind): boolean {
  return DETERMINISTIC_FEED_KINDS.has(kind);
}

const PRICE_FEED_DOMAINS = new Set([
  "www.binance.com",
  "binance.com",
  "pythdata.app",
  "www.coingecko.com",
  "coingecko.com",
  "www.coinmarketcap.com",
  "coinmarketcap.com",
  "www.kraken.com",
  "kraken.com",
]);

const WEATHER_DOMAINS = new Set([
  "www.wunderground.com",
  "wunderground.com",
  "www.weather.gov",
  "weather.gov",
  "www.noaa.gov",
  "noaa.gov",
]);

const ESPORTS_DOMAINS = new Set([
  "www.dotabuff.com",
  "dotabuff.com",
  "liquipedia.net",
  "www.hltv.org",
  "hltv.org",
  "gol.gg",
  "www.gol.gg",
]);

const SPORTS_DOMAIN_HINTS = [
  "uefa",
  "nba.com",
  "nfl.com",
  "mlb.com",
  "ncaa",
  "conmebol",
  "concacaf",
  "fifa",
  "espn",
  "frmf",
  "csl-china",
  "ligagt",
  "conmebollibertadores",
  "premierleague",
  "laliga",
  "bundesliga",
  "seriea",
  "ligue1",
];

const STREAMER_DOMAINS = new Set([
  "www.twitch.tv",
  "twitch.tv",
  "kick.com",
  "www.kick.com",
  "www.youtube.com",
  "youtube.com",
]);

const STOCK_FINANCE_DOMAIN_HINTS = ["yahoo", "seekingalpha", "bloomberg", "marketwatch", "nasdaq.com"];

const ESPORTS_TITLE_PREFIXES = [
  "lol:",
  "dota",
  "counter-strike",
  "cs:",
  "valorant",
  "mobile legends",
  "rainbow six",
  "starcraft",
  "rocket league",
  "apex legends",
  "pubg",
  "fortnite",
  "overwatch",
];

const startsWithAny = (haystack: string, needles: readonly string[]): boolean => {
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.startsWith(n));
};

const includesAny = (haystack: string | null | undefined, needles: readonly string[]): boolean => {
  if (!haystack) return false;
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.includes(n));
};

const PRICE_TITLE_PATTERN = /\bup\s*or\s*down\b|\babove\s*\$|\bbelow\s*\$|\bclose(s|d)?\s+above\b|\bclose(s|d)?\s+below\b/i;
const WEATHER_TITLE_PATTERN = /\b(temperature|hurricane|wildfire|weather|snowfall|tornado)\b/i;
const SPORTS_TITLE_PATTERN = /\bvs\.?\b/i;
const ELECTION_TITLE_PATTERN = /\b(election|parliament|seats|president|prime minister|chancellor|governor|prime\s*minister)\b/i;
const POLICY_TITLE_PATTERN = /\b(congress|senate|house\s+vote|policy|tariff|sanction|impeach)\b/i;

export function categorize(market: PolledMarket): MarketKind {
  const title = market.eventTitle ?? "";
  const question = market.question ?? "";
  const domain = domainOf(market.eventResolutionSource);

  if (
    WEATHER_DOMAINS.has(domain) ||
    WEATHER_TITLE_PATTERN.test(title)
  ) {
    return "weather_forecast";
  }

  if (STOCK_FINANCE_DOMAIN_HINTS.some((h) => domain.includes(h))) {
    return "stock_or_finance";
  }

  if (
    isGate1Match(market.eventResolutionSource) ||
    PRICE_FEED_DOMAINS.has(domain) ||
    PRICE_TITLE_PATTERN.test(title) ||
    PRICE_TITLE_PATTERN.test(question)
  ) {
    return "crypto_price_feed";
  }

  if (
    startsWithAny(title, ESPORTS_TITLE_PREFIXES) ||
    ESPORTS_DOMAINS.has(domain)
  ) {
    return "esports_match";
  }

  if (
    SPORTS_TITLE_PATTERN.test(title) ||
    SPORTS_DOMAIN_HINTS.some((h) => domain.includes(h))
  ) {
    return "sports_match";
  }

  if (STREAMER_DOMAINS.has(domain)) {
    return "streamer_or_view_count";
  }

  if (ELECTION_TITLE_PATTERN.test(title)) {
    return "election_political";
  }

  if (POLICY_TITLE_PATTERN.test(title) || includesAny(title, ["fed ", "congress", "senate"])) {
    return "policy_political";
  }

  return "news_or_other";
}
