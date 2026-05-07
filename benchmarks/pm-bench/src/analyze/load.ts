import { readFile } from "node:fs/promises";
import { polledMarketSchema, type PolledMarket } from "../schemas/polled-market.js";

export async function loadJsonl(path: string): Promise<PolledMarket[]> {
  const text = await readFile(path, "utf8");
  return parseJsonl(text);
}

export function parseJsonl(text: string): PolledMarket[] {
  const rows: PolledMarket[] = [];
  let lineno = 0;
  for (const line of text.split("\n")) {
    lineno++;
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    let obj: unknown;
    try {
      obj = JSON.parse(trimmed);
    } catch (err) {
      throw new Error(
        `JSON parse failed on line ${lineno}: ${(err as Error).message}`,
      );
    }
    rows.push(polledMarketSchema.parse(obj));
  }
  return rows;
}

export function dedupeByLatestPoll(rows: PolledMarket[]): PolledMarket[] {
  const map = new Map<string, PolledMarket>();
  for (const r of rows) {
    const existing = map.get(r.id);
    if (!existing || r.polled_at > existing.polled_at) {
      map.set(r.id, r);
    }
  }
  return [...map.values()];
}
