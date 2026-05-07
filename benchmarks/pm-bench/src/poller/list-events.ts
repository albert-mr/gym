import { gammaGet, type GammaGetOptions } from "./gamma-client.js";
import { gammaEventsListSchema, type GammaRawEvent } from "../schemas/gamma-raw.js";
import { sleep } from "../lib/sleep.js";

const PAGE_SIZE = 100;
const MAX_OFFSET = 5000;
const POLITENESS_MS = 50;

export interface ListEventsOptions {
  endDateMin: Date;
  endDateMax: Date;
  pageSize?: number;
  maxOffset?: number;
  politenessMs?: number;
  client?: GammaGetOptions;
}

export async function listEventsInWindow(
  options: ListEventsOptions,
): Promise<GammaRawEvent[]> {
  const {
    endDateMin,
    endDateMax,
    pageSize = PAGE_SIZE,
    maxOffset = MAX_OFFSET,
    politenessMs = POLITENESS_MS,
    client,
  } = options;

  const out: GammaRawEvent[] = [];
  let offset = 0;

  while (offset <= maxOffset) {
    const raw = await gammaGet<unknown>(
      "/events",
      {
        closed: "false",
        end_date_min: endDateMin.toISOString(),
        end_date_max: endDateMax.toISOString(),
        order: "endDate",
        ascending: "true",
        limit: pageSize,
        offset,
      },
      client,
    );

    const batch = gammaEventsListSchema.parse(raw);
    if (batch.length === 0) break;
    out.push(...batch);
    if (batch.length < pageSize) break;

    offset += pageSize;
    await sleep(politenessMs);
  }

  return out;
}
