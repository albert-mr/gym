import { sleep } from "../lib/sleep.js";

export const GAMMA_API_BASE =
  process.env.POLYMARKET_API_BASE ?? "https://gamma-api.polymarket.com";

const USER_AGENT = "gym-pm-bench/0.1";

export interface GammaGetOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  maxAttempts?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  timeoutMs?: number;
}

export class GammaHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
    public readonly body: string,
  ) {
    super(`Gamma API ${status} ${statusText} for ${url}: ${body.slice(0, 200)}`);
    this.name = "GammaHttpError";
  }
}

const isRetryableStatus = (status: number): boolean =>
  status === 429 || (status >= 500 && status < 600);

const buildUrl = (
  base: string,
  path: string,
  query: Record<string, string | number | boolean | undefined>,
): string => {
  const url = new URL(path.replace(/^\/+/, ""), base.endsWith("/") ? base : `${base}/`);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
};

export async function gammaGet<T = unknown>(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
  opts: GammaGetOptions = {},
): Promise<T> {
  const {
    baseUrl = GAMMA_API_BASE,
    fetchImpl = fetch,
    maxAttempts = 4,
    initialBackoffMs = 1000,
    maxBackoffMs = 8000,
    timeoutMs = 30_000,
  } = opts;

  const url = buildUrl(baseUrl, path, query);

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        method: "GET",
        headers: { "user-agent": USER_AGENT, accept: "application/json" },
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const err = new GammaHttpError(res.status, res.statusText, url, body);
        if (!isRetryableStatus(res.status) || attempt === maxAttempts) {
          throw err;
        }
        lastError = err;
      } else {
        return (await res.json()) as T;
      }
    } catch (err) {
      lastError = err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      const isHttp = err instanceof GammaHttpError;
      if (isHttp && !isRetryableStatus(err.status)) throw err;
      if (attempt === maxAttempts) throw err;
      if (!isAbort && !isHttp && !(err instanceof TypeError)) throw err;
    } finally {
      clearTimeout(timer);
    }

    const backoff = Math.min(initialBackoffMs * 2 ** (attempt - 1), maxBackoffMs);
    await sleep(backoff);
  }

  throw lastError ?? new Error(`gammaGet exhausted attempts: ${url}`);
}
