import { z } from "zod";

export const provisioningRegisterSchema = z.object({
  chain: z.enum(["STARKNET"]).default("STARKNET"),
  email: z.string().email(),
});
