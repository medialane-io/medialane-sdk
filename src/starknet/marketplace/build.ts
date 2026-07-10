import { type Abi, type Call, type TypedData, Contract, cairo, shortString } from "starknet";
import { IPMarketplaceABI } from "../abis/index.js";
import type { ResolvedConfig } from "../../config.js";
import { stringifyBigInts } from "../../utils/bigint.js";
import { buildOrderTypedData, buildCancellationTypedData } from "./signing.js";
import { buildFeeCall } from "../fee/index.js";
import { getChainId, getProvider } from "./utils.js";

/**
 * Pure calldata builders for the 721 marketplace — no signing, no execution, no
 * provider *writes*. Salt, counter, and times are injected by the caller so the
 * output is deterministic and testable. Both the legacy `MarketplaceModule`
 * execute-methods and the chain-neutral `StarknetVenue` build calls through here,
 * so their calldata is identical by construction.
 */

export interface OrderLeg {
  item_type: string;
  token: string;
  identifier_or_criteria: string;
  amount: string;
  recipient?: string;
}

export interface OrderParams {
  offerer: string;
  marketplace: string;
  offer: OrderLeg;
  consideration: OrderLeg;
  royalty_max_bps: string;
  start_time: string;
  end_time: string;
  salt: string;
  counter: string;
}

export interface BuildListingInput {
  offerer: string;
  nftContract: string;
  tokenId: string;
  /** ERC-20 consideration amount, base units. */
  priceWei: string;
  paymentTokenAddress: string;
  royaltyMaxBps: string;
  startTime: number;
  endTime: number;
  salt: string;
  counter: string;
}

export type BuildOfferInput = BuildListingInput;

function contractFor(cfg: ResolvedConfig): Contract {
  return new Contract(IPMarketplaceABI as unknown as Abi, cfg.marketplaceContract, getProvider(cfg));
}

export function buildListingOrder(
  i: BuildListingInput,
  cfg: ResolvedConfig,
): { orderParams: OrderParams; typedData: TypedData } {
  const orderParams: OrderParams = {
    offerer: i.offerer,
    marketplace: cfg.marketplaceContract,
    offer: { item_type: "ERC721", token: i.nftContract, identifier_or_criteria: i.tokenId, amount: "1" },
    consideration: {
      item_type: "ERC20",
      token: i.paymentTokenAddress,
      identifier_or_criteria: "0",
      amount: i.priceWei,
      recipient: i.offerer,
    },
    royalty_max_bps: i.royaltyMaxBps,
    start_time: String(i.startTime),
    end_time: String(i.endTime),
    salt: i.salt,
    counter: i.counter,
  };
  const typedData = stringifyBigInts(buildOrderTypedData(orderParams as unknown as Record<string, unknown>, getChainId(cfg))) as TypedData;
  return { orderParams, typedData };
}

export function buildOfferOrder(
  i: BuildOfferInput,
  cfg: ResolvedConfig,
): { orderParams: OrderParams; typedData: TypedData } {
  const orderParams: OrderParams = {
    offerer: i.offerer,
    marketplace: cfg.marketplaceContract,
    offer: { item_type: "ERC20", token: i.paymentTokenAddress, identifier_or_criteria: "0", amount: i.priceWei },
    consideration: {
      item_type: "ERC721",
      token: i.nftContract,
      identifier_or_criteria: i.tokenId,
      amount: "1",
      recipient: i.offerer,
    },
    royalty_max_bps: i.royaltyMaxBps,
    start_time: String(i.startTime),
    end_time: String(i.endTime),
    salt: i.salt,
    counter: i.counter,
  };
  const typedData = stringifyBigInts(buildOrderTypedData(orderParams as unknown as Record<string, unknown>, getChainId(cfg))) as TypedData;
  return { orderParams, typedData };
}

function registerPayload(orderParams: OrderParams, signature: string[]) {
  return stringifyBigInts({
    parameters: {
      ...orderParams,
      offer: { ...orderParams.offer, item_type: shortString.encodeShortString(orderParams.offer.item_type) },
      consideration: {
        ...orderParams.consideration,
        item_type: shortString.encodeShortString(orderParams.consideration.item_type),
      },
    },
    signature,
  }) as Record<string, unknown>;
}

export function buildRegisterCalls(
  a: { orderParams: OrderParams; signature: string[]; approvalNeeded: boolean; approve: Call },
  cfg: ResolvedConfig,
): Call[] {
  const registerCall = contractFor(cfg).populate("register_order", [registerPayload(a.orderParams, a.signature)]);
  return a.approvalNeeded ? [a.approve, registerCall] : [registerCall];
}

export function buildFulfillCalls(
  a: { orderHash: string; paymentToken: string; totalPrice: string },
  cfg: ResolvedConfig,
): Call[] {
  const u = cairo.uint256(a.totalPrice);
  const approve: Call = {
    contractAddress: a.paymentToken,
    entrypoint: "approve",
    calldata: [cfg.marketplaceContract, u.low.toString(), u.high.toString()],
  };
  const fulfill = contractFor(cfg).populate("fulfill_order", [a.orderHash]);
  const fee = buildFeeCall(
    { surface: "marketplace", token: a.paymentToken, grossAmount: BigInt(a.totalPrice) },
    cfg.feeConfig,
  );
  return fee ? [approve, fulfill, fee] : [approve, fulfill];
}

export function buildCancelCalls(
  a: { orderHash: string; offerer: string; signature: string[] },
  cfg: ResolvedConfig,
): Call[] {
  const cancelRequest = stringifyBigInts({
    cancelation: { order_hash: a.orderHash, offerer: a.offerer },
    signature: a.signature,
  }) as Record<string, unknown>;
  return [contractFor(cfg).populate("cancel_order", [cancelRequest])];
}

/** SNIP-12 typed data for a cancellation (offerer signs `{ order_hash, offerer }`). */
export function buildCancelTypedData(orderHash: string, offerer: string, cfg: ResolvedConfig): TypedData {
  return stringifyBigInts(buildCancellationTypedData({ order_hash: orderHash, offerer }, getChainId(cfg))) as TypedData;
}
