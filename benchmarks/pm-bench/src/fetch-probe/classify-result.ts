import type { Classification } from "./types.js";

export type ProbeAttempt =
  | { kind: "webdriver_unreachable"; error: string }
  | { kind: "webdriver_error"; webdriver_http: number; error: string }
  | { kind: "upstream_response"; resulting_status: number; body: string };

export interface ClassifiedOutcome {
  classification: Classification;
  http_status: number | null;
  body_size: number;
  head_chars: string;
  error: string | null;
}

const OK_BODY_MIN_BYTES = 1024;
const HEAD_CHARS_MAX = 500;

const CAPTCHA_PATTERNS: RegExp[] = [
  /\bcaptcha\b/i,
  /just a moment\.\.\./i,
  /attention required\s*\|\s*cloudflare/i,
  /checking your browser before accessing/i,
];

const PAYWALL_PATTERNS: RegExp[] = [
  /subscribe to (read|continue)/i,
  /to continue reading,? (please )?subscribe/i,
  /sign in to (read|continue)/i,
  /this article is for subscribers/i,
];

const NAVIGATION_TIMEOUT_BODIES: RegExp[] = [
  /navigation timeout/i,
  /no internet connection/i,
];

export function classify(attempt: ProbeAttempt): ClassifiedOutcome {
  if (attempt.kind === "webdriver_unreachable") {
    return {
      classification: "webdriver-down",
      http_status: null,
      body_size: 0,
      head_chars: "",
      error: attempt.error,
    };
  }

  if (attempt.kind === "webdriver_error") {
    return {
      classification: "webdriver-down",
      http_status: null,
      body_size: 0,
      head_chars: "",
      error: `webdriver returned HTTP ${attempt.webdriver_http}: ${attempt.error}`,
    };
  }

  const { resulting_status, body } = attempt;
  const body_size = Buffer.byteLength(body, "utf8");
  const head_chars = body.slice(0, HEAD_CHARS_MAX);

  if (resulting_status === 408 || NAVIGATION_TIMEOUT_BODIES.some((re) => re.test(body))) {
    return {
      classification: "timeout",
      http_status: resulting_status,
      body_size,
      head_chars,
      error: body.length > 0 ? body.slice(0, 200) : null,
    };
  }

  if (resulting_status >= 400 && resulting_status < 500) {
    return {
      classification: "http-4xx",
      http_status: resulting_status,
      body_size,
      head_chars,
      error: null,
    };
  }
  if (resulting_status >= 500 && resulting_status < 600) {
    return {
      classification: "http-5xx",
      http_status: resulting_status,
      body_size,
      head_chars,
      error: null,
    };
  }

  if (resulting_status >= 200 && resulting_status < 400) {
    if (CAPTCHA_PATTERNS.some((re) => re.test(body))) {
      return {
        classification: "captcha",
        http_status: resulting_status,
        body_size,
        head_chars,
        error: null,
      };
    }
    if (PAYWALL_PATTERNS.some((re) => re.test(body))) {
      return {
        classification: "paywall",
        http_status: resulting_status,
        body_size,
        head_chars,
        error: null,
      };
    }
    if (body_size < OK_BODY_MIN_BYTES) {
      return {
        classification: "empty",
        http_status: resulting_status,
        body_size,
        head_chars,
        error: null,
      };
    }
    return {
      classification: "ok",
      http_status: resulting_status,
      body_size,
      head_chars,
      error: null,
    };
  }

  return {
    classification: "network-error",
    http_status: resulting_status,
    body_size,
    head_chars,
    error: `unhandled resulting-status ${resulting_status}`,
  };
}
