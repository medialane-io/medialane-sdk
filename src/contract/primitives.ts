import { z } from "zod";

export const address = z.string().regex(/^0x[0-9a-fA-F]{1,64}$/, "Invalid Starknet address");

export const uint = z.string().regex(/^\d+$/, "must be a non-negative integer string");

export const felt = z.string().regex(/^0x[0-9a-fA-F]{1,64}$/, "must be a hex felt");
