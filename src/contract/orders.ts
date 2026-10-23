import { z } from "zod";

export const ordersListQuery = z.object({
  status: z.enum(["ACTIVE", "FULFILLED", "CANCELLED", "EXPIRED"]).optional(),
  collection: z.string().optional(),
  currency: z.string().optional(),
  sort: z.enum(["price_asc", "price_desc", "recent"]).default("recent"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  offerer: z.string().optional(),
  minPrice: z.string().regex(/^\d+$/).optional(),
  maxPrice: z.string().regex(/^\d+$/).optional(),
}).refine(
  (data) => {
    if (data.minPrice !== undefined && data.maxPrice !== undefined) {
      try {
        return BigInt(data.minPrice) <= BigInt(data.maxPrice);
      } catch {
        return false;
      }
    }
    return true;
  },
  { message: "minPrice must be less than or equal to maxPrice", path: ["minPrice"] }
);
