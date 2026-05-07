import { gammaGet, type GammaGetOptions } from "./gamma-client.js";
import { gammaRawEventSchema } from "../schemas/gamma-raw.js";
import { sleep } from "../lib/sleep.js";

const POLITENESS_MS = 50;

export async function enrichTagsForEvents(
  eventIds: Iterable<string>,
  options: { politenessMs?: number; client?: GammaGetOptions } = {},
): Promise<Map<string, string[]>> {
  const { politenessMs = POLITENESS_MS, client } = options;
  const result = new Map<string, string[]>();
  const unique = Array.from(new Set(eventIds));

  for (const id of unique) {
    const raw = await gammaGet<unknown>(`/events/${id}`, {}, client);
    const parsed = gammaRawEventSchema.parse(raw);
    const slugs = (parsed.tags ?? [])
      .map((t) => t.slug)
      .filter((s): s is string => typeof s === "string" && s.length > 0);
    result.set(id, slugs);
    await sleep(politenessMs);
  }

  return result;
}
