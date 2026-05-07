import { z } from "zod";

const stringOrStringified = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess((v) => {
    if (typeof v !== "string") return v;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }, inner);

const numberFromString = z.preprocess((v) => {
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number());

export const gammaTagSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    slug: z.string().optional(),
    label: z.string().optional(),
  })
  .passthrough();

export const gammaRawMarketSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)),
    conditionId: z.string().nullish(),
    question: z.string(),
    slug: z.string(),
    description: z.string().nullish(),
    endDate: z.string(),
    startDate: z.string().nullish(),
    closed: z.boolean(),
    active: z.boolean(),
    archived: z.boolean(),
    outcomes: stringOrStringified(z.array(z.string())).nullish(),
    outcomePrices: stringOrStringified(z.array(z.string())).nullish(),
    volume: z.union([z.string(), z.number()]).nullish(),
    volumeNum: z.number().nullish(),
    liquidity: z.union([z.string(), z.number()]).nullish(),
    liquidityNum: z.number().nullish(),
    createdAt: z.string().nullish(),
    updatedAt: z.string().nullish(),
    umaResolutionStatuses: stringOrStringified(z.array(z.unknown())).nullish(),
    marketType: z.string().nullish(),
  })
  .passthrough();

export const gammaRawEventSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)),
    title: z.string().nullish(),
    slug: z.string().nullish(),
    resolutionSource: z.string().nullish(),
    endDate: z.string().nullish(),
    closed: z.boolean().nullish(),
    archived: z.boolean().nullish(),
    active: z.boolean().nullish(),
    markets: z.array(gammaRawMarketSchema).nullish(),
    tags: z.array(gammaTagSchema).nullish(),
  })
  .passthrough();

export const gammaEventsListSchema = z.array(gammaRawEventSchema);

export type GammaRawMarket = z.infer<typeof gammaRawMarketSchema>;
export type GammaRawEvent = z.infer<typeof gammaRawEventSchema>;

export { numberFromString };
