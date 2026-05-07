import type { GammaRawEvent, GammaRawMarket } from "../schemas/gamma-raw.js";

export interface FlattenedMarket {
  market: GammaRawMarket;
  eventId: string;
  eventTitle: string | null;
  eventEndDate: string | null;
  eventResolutionSource: string | null;
  eventTags: string[] | null;
}

const tagsFromEvent = (event: GammaRawEvent): string[] | null => {
  if (!event.tags || event.tags.length === 0) return null;
  const slugs = event.tags
    .map((t) => t.slug)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
  return slugs.length > 0 ? slugs : null;
};

export function flattenEvents(events: GammaRawEvent[]): FlattenedMarket[] {
  const out: FlattenedMarket[] = [];
  for (const event of events) {
    const markets = event.markets ?? [];
    const eventTags = tagsFromEvent(event);
    for (const market of markets) {
      out.push({
        market,
        eventId: event.id,
        eventTitle: event.title ?? null,
        eventEndDate: event.endDate ?? null,
        eventResolutionSource: event.resolutionSource ?? null,
        eventTags,
      });
    }
  }
  return out;
}
