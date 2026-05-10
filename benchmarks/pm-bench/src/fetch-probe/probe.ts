import { classify, type ProbeAttempt } from "./classify-result.js";
import type { ProbeRecord } from "./types.js";
import { FETCH_PROBE_SCHEMA_VERSION } from "./types.js";

export interface ProbeInput {
  market_id: string;
  url: string;
}

export interface ProbeOptions {
  webdriverUrl: string;
  mode: "text" | "html";
  loadTimeoutMs: number;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

export async function probeMarket(
  input: ProbeInput,
  opts: ProbeOptions,
): Promise<ProbeRecord> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const now = opts.now ?? (() => new Date());
  const startedAt = Date.now();

  const target = new URL("/render", opts.webdriverUrl);
  target.searchParams.set("url", input.url);
  target.searchParams.set("mode", opts.mode);
  target.searchParams.set("loadTimeout", String(opts.loadTimeoutMs));

  const attempt = await runAttempt(fetchImpl, target, opts.loadTimeoutMs);
  const outcome = classify(attempt);
  const elapsed_ms = Date.now() - startedAt;

  return {
    schema_version: FETCH_PROBE_SCHEMA_VERSION,
    probed_at: now().toISOString(),
    market_id: input.market_id,
    url: input.url,
    url_source: "eventResolutionSource",
    webdriver_url: opts.webdriverUrl,
    mode: opts.mode,
    http_status: outcome.http_status,
    classification: outcome.classification,
    body_size: outcome.body_size,
    head_chars: outcome.head_chars,
    elapsed_ms,
    error: outcome.error,
  };
}

async function runAttempt(
  fetchImpl: typeof fetch,
  target: URL,
  loadTimeoutMs: number,
): Promise<ProbeAttempt> {
  const controller = new AbortController();
  const clientTimeoutMs = loadTimeoutMs + 5_000;
  const timeoutHandle = setTimeout(() => controller.abort(), clientTimeoutMs);

  try {
    const res = await fetchImpl(target.toString(), { signal: controller.signal });
    const body = await res.text();

    if (res.status >= 400) {
      return {
        kind: "webdriver_error",
        webdriver_http: res.status,
        error: body.slice(0, 200),
      };
    }

    const headerVal = res.headers.get("Resulting-Status");
    const resulting_status = headerVal !== null ? Number(headerVal) : res.status;

    if (!Number.isFinite(resulting_status)) {
      return {
        kind: "webdriver_error",
        webdriver_http: res.status,
        error: `Resulting-Status header missing or invalid: ${headerVal ?? "<absent>"}`,
      };
    }

    return { kind: "upstream_response", resulting_status, body };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { kind: "webdriver_unreachable", error: message };
  } finally {
    clearTimeout(timeoutHandle);
  }
}
