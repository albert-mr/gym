import { describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runPoll } from "../src/cli/poll.js";
import { fixedClock } from "../src/lib/clock.js";

const okJson = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("runPoll end-to-end", () => {
  it("polls, filters, and writes JSONL with one row", async () => {
    const events = [
      {
        id: "e-1",
        title: "Test event",
        slug: "test-event",
        resolutionSource: "https://src",
        endDate: "2026-05-06T12:00:00Z",
        closed: false,
        archived: false,
        active: true,
        tags: [
          { id: 1, slug: "politics", label: "Politics" },
        ],
        markets: [
          {
            id: "m-keep",
            conditionId: "0x1",
            question: "in window?",
            slug: "in",
            endDate: "2026-05-06T12:00:00Z",
            closed: false,
            active: true,
            archived: false,
            outcomes: "[\"Yes\", \"No\"]",
            outcomePrices: "[\"0.4\", \"0.6\"]",
            volumeNum: 100,
            liquidityNum: 25,
            createdAt: "2025-11-06T00:00:00Z",
            updatedAt: "2026-05-06T08:00:00Z",
          },
          {
            id: "m-closed",
            conditionId: "0x2",
            question: "closed?",
            slug: "c",
            endDate: "2026-05-06T12:00:00Z",
            closed: true,
            active: true,
            archived: false,
            outcomes: "[\"Yes\", \"No\"]",
            outcomePrices: "[\"0.5\", \"0.5\"]",
            volumeNum: 50,
            liquidityNum: 10,
            createdAt: "2025-11-06T00:00:00Z",
            updatedAt: "2026-05-06T08:00:00Z",
          },
          {
            id: "m-out",
            conditionId: "0x3",
            question: "outside window?",
            slug: "o",
            endDate: "2027-01-01T00:00:00Z",
            closed: false,
            active: true,
            archived: false,
            outcomes: "[\"Yes\", \"No\"]",
            outcomePrices: "[\"0.5\", \"0.5\"]",
            volumeNum: 50,
            liquidityNum: 10,
            createdAt: "2025-11-06T00:00:00Z",
            updatedAt: "2026-05-06T08:00:00Z",
          },
        ],
      },
    ];

    const responses = [okJson(events), okJson([])];
    const fetchImpl = vi.fn(async () => responses.shift()!);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchImpl as unknown as typeof fetch;

    try {
      const dir = await mkdtemp(join(tmpdir(), "pm-bench-"));
      const result = await runPoll(
        {
          date: null,
          horizonHours: 24,
          outDir: dir,
          enrichTags: false,
          baseUrl: null,
        },
        fixedClock("2026-05-06T06:00:00Z"),
      );

      expect(result.summary.events_fetched).toBe(1);
      expect(result.summary.markets_flattened).toBe(3);
      expect(result.summary.after_filter).toBe(1);
      expect(result.summary.dropped).toBe(2);
      expect(result.summary.drop_reasons.closed).toBe(1);
      expect(result.summary.drop_reasons["endDate-after-window"]).toBe(1);
      expect(result.outFile).toBe(join(dir, "2026-05-06", "all.jsonl"));

      const text = await readFile(result.outFile, "utf8");
      const lines = text.trim().split("\n");
      expect(lines.length).toBe(1);

      const row = JSON.parse(lines[0]!);
      expect(row.schema_version).toBe("1.0.0");
      expect(row.id).toBe("m-keep");
      expect(row.closed).toBe(false);
      expect(row.outcomes).toEqual(["Yes", "No"]);
      expect(row.outcomePrices).toEqual([0.4, 0.6]);
      expect(row.eventId).toBe("e-1");
      expect(row.eventResolutionSource).toBe("https://src");
      expect(row.tags).toEqual(["politics"]);
      expect(row.endDate).toBe("2026-05-06T12:00:00Z");
      expect(row.polled_at).toBe("2026-05-06T06:00:00.000Z");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("appends to an existing daily file rather than overwriting", async () => {
    const events = [
      {
        id: "e-1",
        title: "T",
        slug: "t",
        resolutionSource: "",
        endDate: "2026-05-06T12:00:00Z",
        closed: false,
        archived: false,
        active: true,
        markets: [
          {
            id: "m-1",
            conditionId: "0x1",
            question: "q",
            slug: "s",
            endDate: "2026-05-06T12:00:00Z",
            closed: false,
            active: true,
            archived: false,
            outcomes: "[\"Yes\", \"No\"]",
            outcomePrices: "[\"0.5\", \"0.5\"]",
            volumeNum: 1,
            liquidityNum: 1,
            createdAt: "2025-11-06T00:00:00Z",
            updatedAt: "2026-05-06T08:00:00Z",
          },
        ],
      },
    ];

    const dir = await mkdtemp(join(tmpdir(), "pm-bench-"));
    const responsesA = [okJson(events), okJson([])];
    const responsesB = [okJson(events), okJson([])];
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = vi.fn(async () => responsesA.shift()!) as unknown as typeof fetch;
      await runPoll(
        { date: null, horizonHours: 24, outDir: dir, enrichTags: false, baseUrl: null },
        fixedClock("2026-05-06T06:00:00Z"),
      );

      globalThis.fetch = vi.fn(async () => responsesB.shift()!) as unknown as typeof fetch;
      await runPoll(
        { date: null, horizonHours: 24, outDir: dir, enrichTags: false, baseUrl: null },
        fixedClock("2026-05-06T07:00:00Z"),
      );

      const text = await readFile(join(dir, "2026-05-06", "all.jsonl"), "utf8");
      const lines = text.trim().split("\n");
      expect(lines.length).toBe(2);
      const a = JSON.parse(lines[0]!);
      const b = JSON.parse(lines[1]!);
      expect(a.id).toBe("m-1");
      expect(b.id).toBe("m-1");
      expect(a.polled_at).not.toBe(b.polled_at);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
