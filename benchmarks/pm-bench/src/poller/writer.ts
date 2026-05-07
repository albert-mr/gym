import { mkdir, appendFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function appendJsonl<T>(path: string, rows: T[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  if (rows.length === 0) {
    await appendFile(path, "");
    return;
  }
  const payload = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await appendFile(path, payload);
}
