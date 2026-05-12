import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { classify, type ProbeAttempt } from "../src/fetch-probe/classify-result.js";
import { parseProbeInputs } from "../src/fetch-probe/load-input.js";
import { probeMarket } from "../src/fetch-probe/probe.js";
import { runFetchProbe } from "../src/fetch-probe/run.js";
import type { PolledMarket } from "../src/schemas/polled-market.js";

const okResp = (body: string, resultingStatus = 200): Response =>
  new Response(body, {
    status: 200,
    headers: { "Resulting-Status": String(resultingStatus) },
  });

const mkMarket = (overrides: Partial<PolledMarket> = {}): PolledMarket => ({
  schema_version: "1.0.0",
  polled_at: "2026-05-07T00:00:00.000Z",
  id: "1",
  conditionId: "0x1",
  question: "q",
  slug: "s",
  description: null,
  endDate: "2026-05-07T12:00:00.000Z",
  startDate: null,
  closed: false,
  active: true,
  archived: false,
  outcomes: ["Yes", "No"],
  outcomePrices: [0.5, 0.5],
  volumeNum: 100,
  liquidityNum: 50,
  createdAt: null,
  updatedAt: null,
  umaResolutionStatuses: null,
  marketType: null,
  eventId: "e1",
  eventTitle: "t",
  eventEndDate: "2026-05-07T12:00:00.000Z",
  eventResolutionSource: "https://example.com/page",
  tags: null,
  ...overrides,
});

describe("classify", () => {
  it("ok: 2xx with body >= 1KB and no fingerprints", () => {
    const body = "x".repeat(2048);
    const out = classify({
      kind: "upstream_response",
      resulting_status: 200,
      body,
    } satisfies ProbeAttempt);
    expect(out.classification).toBe("ok");
    expect(out.http_status).toBe(200);
    expect(out.body_size).toBe(2048);
    expect(out.error).toBeNull();
  });

  it("empty: 2xx with body < 1KB", () => {
    const out = classify({
      kind: "upstream_response",
      resulting_status: 200,
      body: "tiny",
    });
    expect(out.classification).toBe("empty");
    expect(out.http_status).toBe(200);
  });

  it("captcha: body matches Cloudflare challenge fingerprint", () => {
    const body = "Just a moment...".padEnd(2048, " ") + "Attention Required | Cloudflare";
    const out = classify({
      kind: "upstream_response",
      resulting_status: 200,
      body,
    });
    expect(out.classification).toBe("captcha");
  });

  it("paywall: body matches subscriber-wall phrasing", () => {
    const body = ("Subscribe to read the rest of this article. ").repeat(40);
    const out = classify({
      kind: "upstream_response",
      resulting_status: 200,
      body,
    });
    expect(out.classification).toBe("paywall");
  });

  it("http-4xx: 404", () => {
    const out = classify({
      kind: "upstream_response",
      resulting_status: 404,
      body: "Not Found",
    });
    expect(out.classification).toBe("http-4xx");
    expect(out.http_status).toBe(404);
  });

  it("http-5xx: 502", () => {
    const out = classify({
      kind: "upstream_response",
      resulting_status: 502,
      body: "Bad Gateway",
    });
    expect(out.classification).toBe("http-5xx");
  });

  it("timeout: Resulting-Status 408 OR navigation-timeout body", () => {
    const fromStatus = classify({
      kind: "upstream_response",
      resulting_status: 408,
      body: "",
    });
    expect(fromStatus.classification).toBe("timeout");

    const fromBody = classify({
      kind: "upstream_response",
      resulting_status: 521,
      body: "Navigation timeout",
    });
    expect(fromBody.classification).toBe("timeout");
  });

  it("webdriver-down: webdriver_unreachable propagates the error", () => {
    const out = classify({
      kind: "webdriver_unreachable",
      error: "fetch failed: ECONNREFUSED",
    });
    expect(out.classification).toBe("webdriver-down");
    expect(out.error).toMatch(/ECONNREFUSED/);
  });

  it("webdriver-down: webdriver itself returns 500", () => {
    const out = classify({
      kind: "webdriver_error",
      webdriver_http: 500,
      error: "Internal Server Error",
    });
    expect(out.classification).toBe("webdriver-down");
    expect(out.error).toMatch(/HTTP 500/);
  });
});

describe("probeMarket", () => {
  it("builds a record with elapsed_ms and head_chars", async () => {
    const fakeFetch: typeof fetch = async (input) => {
      const u = new URL(input.toString());
      expect(u.pathname).toBe("/render");
      expect(u.searchParams.get("url")).toBe("https://example.com");
      expect(u.searchParams.get("mode")).toBe("text");
      return okResp("a".repeat(2048), 200);
    };
    const r = await probeMarket(
      { market_id: "m1", url: "https://example.com" },
      {
        webdriverUrl: "http://127.0.0.1:4444",
        mode: "text",
        loadTimeoutMs: 5000,
        fetchImpl: fakeFetch,
        now: () => new Date("2026-05-07T10:00:00.000Z"),
      },
    );
    expect(r.market_id).toBe("m1");
    expect(r.url).toBe("https://example.com");
    expect(r.classification).toBe("ok");
    expect(r.body_size).toBe(2048);
    expect(r.head_chars).toHaveLength(500);
    expect(r.probed_at).toBe("2026-05-07T10:00:00.000Z");
    expect(r.error).toBeNull();
  });

  it("classifies webdriver-down on fetch rejection", async () => {
    const fakeFetch: typeof fetch = async () => {
      throw new TypeError("fetch failed");
    };
    const r = await probeMarket(
      { market_id: "m2", url: "https://example.com" },
      {
        webdriverUrl: "http://127.0.0.1:4444",
        mode: "text",
        loadTimeoutMs: 5000,
        fetchImpl: fakeFetch,
        now: () => new Date("2026-05-07T10:00:00.000Z"),
      },
    );
    expect(r.classification).toBe("webdriver-down");
    expect(r.body_size).toBe(0);
  });
});

describe("runFetchProbe end-to-end", () => {
  it("writes JSONL, skips no-url markets, reports rollup", async () => {
    const markets: PolledMarket[] = [
      mkMarket({ id: "ok-1", eventResolutionSource: "https://a.example/" }),
      mkMarket({ id: "no-url", eventResolutionSource: null }),
      mkMarket({ id: "404-1", eventResolutionSource: "https://b.example/" }),
    ];
    const fakeFetch: typeof fetch = async (input) => {
      const u = new URL(input.toString());
      const target = u.searchParams.get("url") ?? "";
      if (target.startsWith("https://a.example")) {
        return okResp("a".repeat(2048), 200);
      }
      return okResp("Not Found", 404);
    };
    const tmp = await mkdtemp(join(tmpdir(), "fetch-probe-"));
    const outFile = join(tmp, "fetch-probe.jsonl");
    const res = await runFetchProbe(markets, {
      webdriverUrl: "http://127.0.0.1:4444",
      mode: "text",
      loadTimeoutMs: 5000,
      limit: null,
      outFile,
      fetchImpl: fakeFetch,
      now: () => new Date("2026-05-07T10:00:00.000Z"),
    });
    expect(res.records).toHaveLength(2);
    expect(res.skipped_no_url).toEqual(["no-url"]);
    expect(res.rollup.ok).toBe(1);
    expect(res.rollup["http-4xx"]).toBe(1);
    expect(res.rollup["no-url"]).toBe(1);

    const written = await readFile(outFile, "utf8");
    const lines = written.trim().split("\n");
    expect(lines).toHaveLength(2);
    const row1 = JSON.parse(lines[0]!);
    expect(row1.market_id).toBe("ok-1");
    expect(row1.classification).toBe("ok");
  });

  it("respects --limit", async () => {
    const markets: PolledMarket[] = [
      mkMarket({ id: "a", eventResolutionSource: "https://a.example/" }),
      mkMarket({ id: "b", eventResolutionSource: "https://b.example/" }),
      mkMarket({ id: "c", eventResolutionSource: "https://c.example/" }),
    ];
    const calls: string[] = [];
    const fakeFetch: typeof fetch = async (input) => {
      const u = new URL(input.toString());
      calls.push(u.searchParams.get("url") ?? "");
      return okResp("a".repeat(2048), 200);
    };
    const tmp = await mkdtemp(join(tmpdir(), "fetch-probe-"));
    const res = await runFetchProbe(markets, {
      webdriverUrl: "http://127.0.0.1:4444",
      mode: "text",
      loadTimeoutMs: 5000,
      limit: 2,
      outFile: join(tmp, "fetch-probe.jsonl"),
      fetchImpl: fakeFetch,
      now: () => new Date("2026-05-07T10:00:00.000Z"),
    });
    expect(res.records).toHaveLength(2);
    expect(calls).toEqual(["https://a.example/", "https://b.example/"]);
  });
});

describe("parseProbeInputs", () => {
  it("accepts polled-market rows directly", () => {
    const market = mkMarket({ id: "m1" });
    const text = JSON.stringify(market) + "\n";
    const rows = parseProbeInputs(text);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe("m1");
  });

  it("unwraps {bucket,rule,market} rows from header.jsonl", () => {
    const market = mkMarket({ id: "h1" });
    const wrapped = { bucket: "Sports", rule: "diversity", market };
    const text = JSON.stringify(wrapped) + "\n";
    const rows = parseProbeInputs(text);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe("h1");
  });

  it("ignores blank lines", () => {
    const text = "\n" + JSON.stringify(mkMarket({ id: "x" })) + "\n\n";
    const rows = parseProbeInputs(text);
    expect(rows).toHaveLength(1);
  });
});
