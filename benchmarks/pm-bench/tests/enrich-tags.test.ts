import { describe, expect, it, vi } from "vitest";
import { enrichTagsForEvents } from "../src/poller/enrich-tags.js";

const okJson = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("enrichTagsForEvents", () => {
  it("calls /events/{id} once per unique id and returns slug arrays", async () => {
    const responses = new Map<string, unknown>([
      ["/events/100", { id: "100", tags: [{ slug: "politics" }, { slug: "us" }] }],
      ["/events/200", { id: "200", tags: [{ slug: "crypto" }] }],
    ]);
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      calls.push(url);
      const path = new URL(url).pathname;
      const body = responses.get(path);
      if (!body) throw new Error(`unexpected url ${url}`);
      return okJson(body);
    });

    const result = await enrichTagsForEvents(["100", "200", "100"], {
      politenessMs: 0,
      client: { fetchImpl: fetchImpl as unknown as typeof fetch, initialBackoffMs: 1, maxBackoffMs: 1 },
    });

    expect(result.size).toBe(2);
    expect(result.get("100")).toEqual(["politics", "us"]);
    expect(result.get("200")).toEqual(["crypto"]);
    expect(calls.length).toBe(2);
  });

  it("returns an empty array for events with no tags", async () => {
    const fetchImpl = vi.fn(async () => okJson({ id: "300" }));
    const result = await enrichTagsForEvents(["300"], {
      politenessMs: 0,
      client: { fetchImpl: fetchImpl as unknown as typeof fetch, initialBackoffMs: 1, maxBackoffMs: 1 },
    });
    expect(result.get("300")).toEqual([]);
  });
});
