import { cairo, type Call } from "starknet";
import { buildFeeCall } from "../fee/index.js";
import type { IntentDefinition, IntentOrder } from "./build.js";

export interface FulfillIntentParams {
  fulfiller: string;
  orderHash: string;
  tokenStandard?: "ERC721" | "ERC1155";
  quantity?: string;
}

export interface FulfillInputs {
  order: IntentOrder | null;
  is1155: boolean;
}

const isNft = (itemType: string | undefined) => itemType === "ERC721" || itemType === "ERC1155";

function uint256Calldata(value: bigint | string): string[] {
  const u = cairo.uint256(value.toString());
  return [u.low.toString(), u.high.toString()];
}

export const fulfillIntent: IntentDefinition<FulfillIntentParams, FulfillInputs> = {
  async inputs(p, readers) {
    const order = await readers.orderOf(p.orderHash);
    const is1155 =
      p.tokenStandard === "ERC1155" || order?.offer.itemType === "ERC1155" || order?.consideration.itemType === "ERC1155";
    return { order, is1155 };
  },
  build(p, { order, is1155 }, config) {
    const marketplace = is1155 ? config.marketplace1155Contract : config.marketplace721Contract;
    const quantity = is1155 ? BigInt(p.quantity ?? "1") : 1n;
    const consideration = order?.consideration;
    const isListing = isNft(order?.offer.itemType);
    const calls: Call[] = [];
    let gross: bigint | null = null;

    if (isListing && consideration?.token && consideration.startAmount) {
      gross = BigInt(consideration.startAmount) * quantity;
      calls.push({ contractAddress: consideration.token, entrypoint: "approve", calldata: [marketplace, ...uint256Calldata(gross)] });
    } else if (isNft(consideration?.itemType) && consideration?.token && consideration.identifier) {
      calls.push(
        is1155
          ? { contractAddress: consideration.token, entrypoint: "set_approval_for_all", calldata: [marketplace, "0x1"] }
          : { contractAddress: consideration.token, entrypoint: "approve", calldata: [marketplace, ...uint256Calldata(consideration.identifier)] },
      );
    }

    calls.push({
      contractAddress: marketplace,
      entrypoint: "fulfill_order",
      calldata: is1155 ? [p.orderHash, `0x${quantity.toString(16)}`] : [p.orderHash],
    });

    if (gross !== null) {
      const fee = buildFeeCall({ surface: "marketplace", token: consideration!.token, grossAmount: gross }, config.feeConfig);
      if (fee) calls.push(fee);
    }
    return { calls };
  },
};
