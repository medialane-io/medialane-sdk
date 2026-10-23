import { z } from "zod";

export const DEFAULT_BATCH_SIZE = 25;
export const MAX_RECIPIENTS = 500;

export const emissionSchema = z
  .object({
    chain: z.enum(["STARKNET"]).default("STARKNET"),
    service: z.string().min(1),
    owner: z.string().min(1),
    recipients: z.array(z.string().min(1)).min(1).max(MAX_RECIPIENTS),
    tokenUri: z.string().optional(),
    collectionId: z.string().optional(),
    collectionContract: z.string().optional(),
    tokenId: z.string().optional(),
    amount: z.string().optional(),
    batchSize: z.number().int().min(1).max(100).default(DEFAULT_BATCH_SIZE),
  })
  .refine((v) => v.collectionId || v.collectionContract, {
    message: "collectionId or collectionContract is required",
  })
  .refine((v) => v.tokenUri || (v.tokenId && v.amount), {
    message: "tokenUri, or tokenId and amount, is required",
  });
