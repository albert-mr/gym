import { describe, expect, it, vi, beforeEach } from "vitest";
import { fixedClock } from "../src/lib/clock.js";

const upsertMarkets = vi.fn(async (rows: unknown[]) => rows.length);
const insertObservations = vi.fn(async (_pid: number, rows: unknown[]) => rows.length);
const createPoll = vi.fn(async () => 42);
const finishPoll = vi.fn(async () => {});
const close = vi.fn(async () => {});

vi.mock("../src/lib/db-writers.mjs", () => ({
  upsertMarkets,
  insertObservations,
  createPoll,
  finishPoll,
  close,
  sql: vi.fn(),
}));

// runPoll must be imported after the mock is registered so it picks up the stubs.
const { runPoll } = await import("../src/cli/poll.js");

const okJson = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("runPoll end-to-end", () => {
  beforeEach(() => {
    upsertMarkets.mockClear();
    insertObservations.mockClear();
    createPoll.mockClear();
    finishPoll.mockClear();
  });

  it("polls, filters, and writes one market row to raw.* tables", async () => {
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
        tags: [{ id: 1, slug: "politics", label: "Politics" }],
        markets: [
          {
            id: "m-keep",
            conditionId: "0xkeep",
            question: "Will it rain?",
            slug: "rain",
            endDate: "2026-05-06T12:00:00Z",
            closed: false,
            active: true,
            archived: false,
            outcomes: "[\"Yes\", \"No\"]",
            outcomePrices: "[\"0.4\", \"0.6\"]",
            volumeNum: 10,
            liquidityNum: 5,
            createdAt: "2025-11-06T00:00:00Z",
            updatedAt: "2026-05-06T08:00:00Z",
          },
          {
            id: "m-closed",
            conditionId: "0xc",
            question: "q",
            slug: "s",
            endDate: "2026-05-06T12:00:00Z",
            closed: true,
            active: true,
            archived: false,
          },
          {
            id: "m-future",
            conditionId: "0xf",
            question: "q",
            slug: "s2",
            endDate: "2026-05-08T12:00:00Z",
            closed: false,
            active: true,
            archived: false,
          },
        ],
      },
    ];

    const responses = [okJson(events), okJson([])];
    const fetchImpl = vi.fn(async () => responses.shift()!);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchImpl as unknown as typeof fetch;

    try {
      const result = await runPoll(
        { date: null, horizonHours: 24, enrichTags: false, baseUrl: null },
        fixedClock("2026-05-06T06:00:00Z"),
      );

      expect(result.summary.events_fetched).toBe(1);
      expect(result.summary.markets_flattened).toBe(3);
      expect(result.summary.after_filter).toBe(1);
      expect(result.summary.dropped).toBe(2);
      expect(result.summary.drop_reasons.closed).toBe(1);
      expect(result.summary.drop_reasons["endDate-after-window"]).toBe(1);
      expect(result.summary.markets_upserted).toBe(1);
      expect(result.summary.observations_inserted).toBe(1);
      expect(result.pollDate).toBe("2026-05-06");

      // Confirm the row that hit upsertMarkets has the expected shape.
      const callsUpsert = upsertMarkets.mock.calls as unknown as Array<[Array<Record<string, unknown>>]>;
      const rows = callsUpsert[0]![0];
      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.id).toBe("m-keep");
      expect(row.eventResolutionSource).toBe("https://src");
      expect(row.outcomes).toEqual(["Yes", "No"]);
      expect(row.outcomePrices).toEqual([0.4, 0.6]);
      expect(row.polled_at).toBe("2026-05-06T06:00:00.000Z");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("treats each call as its own poll run (no append-to-file semantics)", async () => {
    const eventTemplate = {
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
    };

    const responsesA = [okJson([eventTemplate]), okJson([])];
    const responsesB = [okJson([eventTemplate]), okJson([])];
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = vi.fn(async () => responsesA.shift()!) as unknown as typeof fetch;
      await runPoll(
        { date: null, horizonHours: 24, enrichTags: false, baseUrl: null },
        fixedClock("2026-05-06T06:00:00Z"),
      );

      globalThis.fetch = vi.fn(async () => responsesB.shift()!) as unknown as typeof fetch;
      await runPoll(
        { date: null, horizonHours: 24, enrichTags: false, baseUrl: null },
        fixedClock("2026-05-06T07:00:00Z"),
      );

      // createPoll fires twice (one per run), each with the same poll_date.
      expect(createPoll).toHaveBeenCalledTimes(2);
      const callsCreate = createPoll.mock.calls as unknown as Array<[string, ...unknown[]]>;
      expect(callsCreate[0]![0]).toBe("2026-05-06");
      expect(callsCreate[1]![0]).toBe("2026-05-06");
      // upsertMarkets fires per run; raw.markets dedupes on (id) at the DB layer.
      expect(upsertMarkets).toHaveBeenCalledTimes(2);
      // insertObservations(pollId, rows) — rows[i].polled_at differs between the two runs.
      const callsObs = insertObservations.mock.calls as unknown as Array<[number, Array<Record<string, unknown>>]>;
      const obsA = callsObs[0]![1];
      const obsB = callsObs[1]![1];
      expect(obsA[0]!.polled_at).not.toBe(obsB[0]!.polled_at);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
