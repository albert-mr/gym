import { readFile } from "node:fs/promises";
import { polledMarketSchema, type PolledMarket } from "../schemas/polled-market.js";

export async function loadProbeInputs(path: string): Promise<PolledMarket[]> {
  const text = await readFile(path, "utf8");
  return parseProbeInputs(text);
}

export function parseProbeInputs(text: string): PolledMarket[] {
  const out: PolledMarket[] = [];
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
    out.push(polledMarketSchema.parse(unwrapMarket(obj)));
  }
  return out;
}

function unwrapMarket(obj: unknown): unknown {
  if (
    obj !== null &&
    typeof obj === "object" &&
    "market" in obj &&
    !("schema_version" in obj)
  ) {
    return (obj as { market: unknown }).market;
  }
  return obj;
}
