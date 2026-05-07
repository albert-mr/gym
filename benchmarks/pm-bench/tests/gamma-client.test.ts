import { describe, expect, it, vi } from "vitest";
import { gammaGet, GammaHttpError } from "../src/poller/gamma-client.js";

const okJson = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

const errResponse = (status: number): Response =>
  new Response("upstream error", { status, statusText: "Server Error" });

describe("gammaGet", () => {
  it("returns parsed JSON on success", async () => {
    const mock = vi.fn(async () => okJson({ ok: true }));
    const result = await gammaGet<{ ok: boolean }>(
      "/markets",
      { limit: 1 },
      { fetchImpl: mock as unknown as typeof fetch, initialBackoffMs: 1, maxBackoffMs: 1 },
    );
    expect(result).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("retries on 429 then succeeds", async () => {
    let n = 0;
    const mock = vi.fn(async () => {
      n++;
      if (n < 3) return errResponse(429);
      return okJson({ ok: true });
    });
    const result = await gammaGet<{ ok: boolean }>(
      "/markets",
      {},
      {
        fetchImpl: mock as unknown as typeof fetch,
        initialBackoffMs: 1,
        maxBackoffMs: 1,
        maxAttempts: 4,
      },
    );
    expect(result).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it("retries on 503 then succeeds", async () => {
    let n = 0;
    const mock = vi.fn(async () => {
      n++;
      if (n < 2) return errResponse(503);
      return okJson({ ok: true });
    });
    const result = await gammaGet<{ ok: boolean }>(
      "/events",
      {},
      {
        fetchImpl: mock as unknown as typeof fetch,
        initialBackoffMs: 1,
        maxBackoffMs: 1,
      },
    );
    expect(result).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 400 (non-retryable client error)", async () => {
    const mock = vi.fn(async () => errResponse(400));
    await expect(
      gammaGet(
        "/markets",
        {},
        { fetchImpl: mock as unknown as typeof fetch, initialBackoffMs: 1, maxBackoffMs: 1 },
      ),
    ).rejects.toBeInstanceOf(GammaHttpError);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("gives up after maxAttempts on persistent 500", async () => {
    const mock = vi.fn(async () => errResponse(500));
    await expect(
      gammaGet(
        "/markets",
        {},
        {
          fetchImpl: mock as unknown as typeof fetch,
          initialBackoffMs: 1,
          maxBackoffMs: 1,
          maxAttempts: 3,
        },
      ),
    ).rejects.toBeInstanceOf(GammaHttpError);
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it("encodes query params in the URL", async () => {
    let capturedUrl: string | null = null;
    const mock = vi.fn(async (url: string) => {
      capturedUrl = url;
      return okJson([]);
    });
    await gammaGet(
      "/events",
      { closed: "false", limit: 100, end_date_min: "2026-05-06T00:00:00.000Z" },
      { fetchImpl: mock as unknown as typeof fetch, initialBackoffMs: 1, maxBackoffMs: 1 },
    );
    expect(capturedUrl).toContain("closed=false");
    expect(capturedUrl).toContain("limit=100");
    expect(capturedUrl).toContain("end_date_min=2026-05-06T00%3A00%3A00.000Z");
  });
});
