export const GATE1_PREFIXES = [
  "https://data.chain.link/",
  "https://reference.chainlink.com/",
] as const;

export function isGate1Match(src: string | null): boolean {
  if (!src) return false;
  return GATE1_PREFIXES.some((p) => src.startsWith(p));
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
