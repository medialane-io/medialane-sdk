import { type Abi, type Call, type TypedData, Contract, cairo, shortString } from "starknet";
import { Medialane1155ABI } from "../abis/index.js";
import type { ResolvedConfig } from "../../config.js";
import { stringifyBigInts } from "../../utils/bigint.js";
import { build1155OrderTypedData, build1155CancellationTypedData } from "../marketplace/signing.js";
import { buildFeeCall } from "../fee/index.js";
import { getChainId, getProvider, newContract } from "../marketplace/utils.js";
import type { OrderParams } from "../marketplace/build.js";

/**
 * Pure calldata builders for the ERC-1155 marketplace — the 1155 mirror of
 * `marketplace/build.ts`. Salt/counter/times are injected so output is
 * deterministic. Both the legacy `Medialane1155Module` and `StarknetVenue` build
 * through here, so their calldata is identical by construction — except that
 * `buildFulfill1155Calls` now composes the platform fee (the legacy
 * `fulfillOrder1155` did not; this closes the 1155 fee-parity gap so 721 and 1155
 * buys charge the creators-fund fee uniformly).
 */

export interface Build1155ListingInput {
  offerer: string;
  nftContract: string;
  tokenId: string;
  /** ERC-1155 unit quantity offered. */
  quantity: string;
  /** ERC-20 consideration amount PER UNIT, base units. */
  priceWeiPerUnit: string;
  paymentTokenAddress: string;
  royaltyMaxBps: string;
  startTime: number;
  endTime: number;
  salt: string;
  counter: string;
}

export type Build1155OfferInput = Build1155ListingInput;

function contractFor(cfg: ResolvedConfig): Contract {
  return newContract(Medialane1155ABI as unknown as Abi, cfg.marketplace1155Contract, getProvider(cfg));
}

export function buildListing1155Order(
  i: Build1155ListingInput,
  cfg: ResolvedConfig,
): { orderParams: OrderParams; typedData: TypedData } {
  const orderParams: OrderParams = {
    offerer: i.offerer,
    marketplace: cfg.marketplace1155Contract,
    offer: { item_type: "ERC1155", token: i.nftContract, identifier_or_criteria: i.tokenId, amount: i.quantity },
    consideration: {
      item_type: "ERC20",
      token: i.paymentTokenAddress,
      identifier_or_criteria: "0",
      amount: i.priceWeiPerUnit,
      recipient: i.offerer,
    },
    royalty_max_bps: i.royaltyMaxBps,
    start_time: String(i.startTime),
    end_time: String(i.endTime),
    salt: i.salt,
    counter: i.counter,
  };
  const typedData = stringifyBigInts(
    build1155OrderTypedData(orderParams as unknown as Record<string, unknown>, getChainId(cfg)),
  ) as TypedData;
  return { orderParams, typedData };
}

export function buildOffer1155Order(
  i: Build1155OfferInput,
  cfg: ResolvedConfig,
): { orderParams: OrderParams; typedData: TypedData } {
  const orderParams: OrderParams = {
    offerer: i.offerer,
    marketplace: cfg.marketplace1155Contract,
    offer: { item_type: "ERC20", token: i.paymentTokenAddress, identifier_or_criteria: "0", amount: i.priceWeiPerUnit },
    consideration: {
      item_type: "ERC1155",
      token: i.nftContract,
      identifier_or_criteria: i.tokenId,
      amount: i.quantity,
      recipient: i.offerer,
    },
    royalty_max_bps: i.royaltyMaxBps,
    start_time: String(i.startTime),
    end_time: String(i.endTime),
    salt: i.salt,
    counter: i.counter,
  };
  const typedData = stringifyBigInts(
    build1155OrderTypedData(orderParams as unknown as Record<string, unknown>, getChainId(cfg)),
  ) as TypedData;
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

export function buildRegister1155Calls(
  a: { orderParams: OrderParams; signature: string[]; approvalNeeded: boolean; approve: Call },
  cfg: ResolvedConfig,
): Call[] {
  const registerCall = contractFor(cfg).populate("register_order", [registerPayload(a.orderParams, a.signature)]);
  return a.approvalNeeded ? [a.approve, registerCall] : [registerCall];
}

export function buildFulfill1155Calls(
  a: { orderHash: string; paymentToken: string; totalPrice: string; quantity: string },
  cfg: ResolvedConfig,
): Call[] {
  const u = cairo.uint256(a.totalPrice);
  const approve: Call = {
    contractAddress: a.paymentToken,
    entrypoint: "approve",
    calldata: [cfg.marketplace1155Contract, u.low.toString(), u.high.toString()],
  };
  const fulfill = contractFor(cfg).populate("fulfill_order", [a.orderHash, a.quantity]);
  const fee = buildFeeCall(
    { surface: "marketplace", token: a.paymentToken, grossAmount: BigInt(a.totalPrice) },
    cfg.feeConfig,
  );
  return fee ? [approve, fulfill, fee] : [approve, fulfill];
}

export function buildCancel1155Calls(
  a: { orderHash: string; offerer: string; signature: string[] },
  cfg: ResolvedConfig,
): Call[] {
  const cancelPayload = stringifyBigInts({
    cancelation: { order_hash: a.orderHash, offerer: a.offerer },
    signature: a.signature,
  }) as Record<string, unknown>;
  return [contractFor(cfg).populate("cancel_order", [cancelPayload])];
}

/** SNIP-12 typed data for a 1155 cancellation (offerer signs `{ order_hash, offerer }`). */
export function buildCancel1155TypedData(orderHash: string, offerer: string, cfg: ResolvedConfig): TypedData {
  return stringifyBigInts(
    build1155CancellationTypedData({ order_hash: orderHash, offerer }, getChainId(cfg)),
  ) as TypedData;
}
