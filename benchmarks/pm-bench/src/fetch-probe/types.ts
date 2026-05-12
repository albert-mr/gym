import { z } from "zod";

export const FETCH_PROBE_SCHEMA_VERSION = "1.0.0" as const;

export const classifications = [
  "ok",
  "empty",
  "paywall",
  "captcha",
  "http-4xx",
  "http-5xx",
  "timeout",
  "webdriver-down",
  "network-error",
] as const;
export type Classification = (typeof classifications)[number];

export const probeRecordSchema = z.object({
  schema_version: z.literal(FETCH_PROBE_SCHEMA_VERSION),
  probed_at: z.string().datetime(),
  market_id: z.string(),
  url: z.string(),
  url_source: z.literal("eventResolutionSource"),
  webdriver_url: z.string(),
  mode: z.enum(["text", "html"]),
  http_status: z.number().int().nullable(),
  classification: z.enum(classifications),
  body_size: z.number().int().nonnegative(),
  head_chars: z.string(),
  elapsed_ms: z.number().int().nonnegative(),
  error: z.string().nullable(),
});
export type ProbeRecord = z.infer<typeof probeRecordSchema>;
