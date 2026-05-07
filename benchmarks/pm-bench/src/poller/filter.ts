import type { FlattenedMarket } from "./flatten.js";

export interface FilterWindow {
  start: Date;
  end: Date;
}

export interface FilterResult {
  kept: FlattenedMarket[];
  dropped: { market: FlattenedMarket; reason: string }[];
}

export function filterMarkets(
  rows: FlattenedMarket[],
  window: FilterWindow,
): FilterResult {
  const kept: FlattenedMarket[] = [];
  const dropped: { market: FlattenedMarket; reason: string }[] = [];

  const startMs = window.start.getTime();
  const endMs = window.end.getTime();

  for (const row of rows) {
    const m = row.market;

    if (m.closed) {
      dropped.push({ market: row, reason: "closed" });
      continue;
    }
    if (m.archived) {
      dropped.push({ market: row, reason: "archived" });
      continue;
    }

    const endMs_ = Date.parse(m.endDate);
    if (Number.isNaN(endMs_)) {
      dropped.push({ market: row, reason: "endDate-unparseable" });
      continue;
    }
    if (endMs_ < startMs) {
      dropped.push({ market: row, reason: "endDate-before-window" });
      continue;
    }
    if (endMs_ > endMs) {
      dropped.push({ market: row, reason: "endDate-after-window" });
      continue;
    }

    if (!m.outcomes || m.outcomes.length === 0) {
      dropped.push({ market: row, reason: "no-outcomes" });
      continue;
    }

    kept.push(row);
  }

  return { kept, dropped };
}
