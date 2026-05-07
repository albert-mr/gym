import { z } from "zod";

export const SCHEMA_VERSION = "1.0.0" as const;

export const polledMarketSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  polled_at: z.string().datetime(),

  id: z.string(),
  conditionId: z.string().nullable(),
  question: z.string(),
  slug: z.string(),
  description: z.string().nullable(),

  endDate: z.string().datetime(),
  startDate: z.string().datetime().nullable(),
  closed: z.boolean(),
  active: z.boolean(),
  archived: z.boolean(),

  outcomes: z.array(z.string()),
  outcomePrices: z.array(z.number()).nullable(),

  volumeNum: z.number().nullable(),
  liquidityNum: z.number().nullable(),

  createdAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),

  umaResolutionStatuses: z.array(z.unknown()).nullable(),
  marketType: z.string().nullable(),

  eventId: z.string().nullable(),
  eventTitle: z.string().nullable(),
  eventEndDate: z.string().datetime().nullable(),
  eventResolutionSource: z.string().nullable(),

  tags: z.array(z.string()).nullable(),
});

export type PolledMarket = z.infer<typeof polledMarketSchema>;
