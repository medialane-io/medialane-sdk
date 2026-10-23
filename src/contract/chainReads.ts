import { z } from "zod";
import { uint } from "./primitives.js";

export const dropStateWireSchema = z.object({
  organizer: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  price: uint,
  paymentToken: z.string(),
  maxPerWallet: uint,
  allowlistRoot: z.string(),
  maxSupply: uint,
  totalMinted: uint,
});

export type DropStateWire = z.output<typeof dropStateWireSchema>;

export interface DropStateAmounts {
  organizer: string;
  startTime: number;
  endTime: number;
  price: bigint;
  paymentToken: string;
  maxPerWallet: bigint;
  allowlistRoot: string;
  maxSupply: bigint;
  totalMinted: bigint;
}

export function dropStateToWire(state: DropStateAmounts): DropStateWire {
  return {
    ...state,
    price: state.price.toString(),
    maxPerWallet: state.maxPerWallet.toString(),
    maxSupply: state.maxSupply.toString(),
    totalMinted: state.totalMinted.toString(),
  };
}

export function dropStateFromWire(wire: DropStateWire): DropStateAmounts {
  return {
    ...wire,
    price: BigInt(wire.price),
    maxPerWallet: BigInt(wire.maxPerWallet),
    maxSupply: BigInt(wire.maxSupply),
    totalMinted: BigInt(wire.totalMinted),
  };
}

export const tierOnchainSchema = z.object({
  maxSupply: z.string(),
  minted: z.string(),
  startTime: z.number().nullable(),
  endTime: z.number().nullable(),
  royaltyBps: z.number(),
});

export const ipNftTokenDataSchema = z.object({
  owner: z.string(),
  metadataUri: z.string(),
  originalCreator: z.string(),
  registeredAt: z.number(),
});

export const popClaimInfoSchema = z.object({
  root: z.string(),
  claimEndTime: z.number(),
});

export const creatorCoinGuaranteesSchema = z.object({
  isLaunched: z.boolean(),
  launchedAtBlock: z.number().nullable(),
  totalSupplyRaw: z.string(),
  teamAllocationRaw: z.string(),
  teamAllocationPercent: z.number().nullable(),
  liquidityPositionId: z.string().nullable(),
});

export const dataEnvelope = <T extends z.ZodTypeAny>(schema: T) => z.object({ data: schema });

export const apiErrorBodySchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});

export type ApiErrorBody = z.output<typeof apiErrorBodySchema>;
