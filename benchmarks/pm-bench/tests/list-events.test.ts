import { describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listEventsInWindow } from "../src/poller/list-events.js";

const fixtureDir = resolve(fileURLToPath(import.meta.url), "..", "fixtures");
const loadFixture = async (name: string): Promise<unknown> =>
  JSON.parse(await readFile(resolve(fixtureDir, name), "utf8"));

const okJson = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("listEventsInWindow", () => {
  it("stops paginating when a partial page is returned", async () => {
    const page1 = await loadFixture("events-window-page1.json");
    const mock = vi.fn(async () => okJson(page1));
    const events = await listEventsInWindow({
      endDateMin: new Date("2026-05-06T00:00:00Z"),
      endDateMax: new Date("2026-05-07T00:00:00Z"),
      pageSize: 100,
      politenessMs: 0,
      client: { fetchImpl: mock as unknown as typeof fetch, initialBackoffMs: 1, maxBackoffMs: 1 },
    });
    expect(events.length).toBe(2);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("stops paginating when an empty page is returned (full prior page)", async () => {
    const page1 = await loadFixture("events-window-page1.json");
    const empty = await loadFixture("events-empty.json");
    const responses = [okJson(page1), okJson(empty)];
    const mock = vi.fn(async () => responses.shift()!);
    const events = await listEventsInWindow({
      endDateMin: new Date("2026-05-06T00:00:00Z"),
      endDateMax: new Date("2026-05-07T00:00:00Z"),
      pageSize: 2,
      politenessMs: 0,
      client: { fetchImpl: mock as unknown as typeof fetch, initialBackoffMs: 1, maxBackoffMs: 1 },
    });
    expect(events.length).toBe(2);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("passes window dates as end_date_min/end_date_max", async () => {
    const empty = await loadFixture("events-empty.json");
    let captured: string | null = null;
    const mock = vi.fn(async (url: string) => {
      captured = url;
      return okJson(empty);
    });
    await listEventsInWindow({
      endDateMin: new Date("2026-05-06T00:00:00.000Z"),
      endDateMax: new Date("2026-05-07T00:00:00.000Z"),
      pageSize: 100,
      politenessMs: 0,
      client: { fetchImpl: mock as unknown as typeof fetch, initialBackoffMs: 1, maxBackoffMs: 1 },
    });
    expect(captured).toContain("end_date_min=2026-05-06T00%3A00%3A00.000Z");
    expect(captured).toContain("end_date_max=2026-05-07T00%3A00%3A00.000Z");
    expect(captured).toContain("closed=false");
    expect(captured).toContain("order=endDate");
    expect(captured).toContain("ascending=true");
  });
});
