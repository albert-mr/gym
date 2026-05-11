// Gate 1 deterministic-oracle exclusions. Markets whose resolution source is one of
// these prefixes are already served by an on-chain oracle (Chainlink Data Feeds or
// Pyth Network), so GenLayer's intelligent oracle has no role to play. Excluded from
// the addressable universe.
//
// Chainlink: deterministic price feeds, automated settlement.
// Pyth: deterministic high-frequency price oracle (commodities + US stocks per
//       Polymarket's April 2026 partnership).
//
// Note: off-chain exchanges/aggregators (Binance, Kraken, CoinGecko, CoinMarketCap)
// are NOT excluded — they are referenced by resolution criteria but read off-chain
// by UMA proposers (or GenLayer's LLM oracle as substitute).
export const GATE1_CHAINLINK_PREFIXES = [
  "https://data.chain.link/",
  "https://reference.chainlink.com/",
] as const;

export const GATE1_PYTH_PREFIXES = [
  "https://pythdata.app/",
  "https://hermes.pyth.network/",
] as const;

export const GATE1_PREFIXES = [
  ...GATE1_CHAINLINK_PREFIXES,
  ...GATE1_PYTH_PREFIXES,
] as const;

export type Gate1Reason = "chainlink" | "pyth" | null;

export function gate1Reason(src: string | null): Gate1Reason {
  if (!src) return null;
  if (GATE1_CHAINLINK_PREFIXES.some((p) => src.startsWith(p))) return "chainlink";
  if (GATE1_PYTH_PREFIXES.some((p) => src.startsWith(p))) return "pyth";
  return null;
}

export function isGate1Match(src: string | null): boolean {
  return gate1Reason(src) !== null;
}

export function isEmptySource(src: string | null): boolean {
  return !src || src.trim() === "";
}

const URL_RE = /\bhttps?:\/\/\S+/i;

export function hasAnyUrl(m: {
  eventResolutionSource: string | null;
  description: string | null;
}): boolean {
  if (m.eventResolutionSource && URL_RE.test(m.eventResolutionSource)) return true;
  if (m.description && URL_RE.test(m.description)) return true;
  return false;
}

export function domainOf(url: string | null): string {
  if (!url || url.trim() === "") return "(empty)";
  try {
    return new URL(url).hostname;
  } catch {
    return "(invalid-url)";
  }
}

export function eventTitlePrefix(title: string | null): string {
  if (!title) return "(no-title)";
  const stripped = title.replace(/\d+/g, "#");
  const dashIdx = stripped.indexOf(" - ");
  const cut = dashIdx > 0 ? stripped.slice(0, dashIdx) : stripped;
  return cut.length > 60 ? cut.slice(0, 60) + "…" : cut;
}

export function outcomeShape(n: number): string {
  if (n === 2) return "binary";
  if (n === 3) return "3-way";
  return `${n}-way`;
}
