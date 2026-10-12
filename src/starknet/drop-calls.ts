import { CallData, cairo, type Call } from "starknet";
import type { ResolvedFeeConfig } from "../fee/config.js";
import type { CreateDropParams, DropTerms } from "../types/services.js";
import { normalizeAddress } from "../utils/address.js";
import { DropCollectionABI, DropFactoryABI } from "./abis/index.js";
import { feeAmount, feeBps } from "./fee/build-fee-call.js";

const addr = (a: string) => normalizeAddress("STARKNET", a);
const factoryData = new CallData(DropFactoryABI as never);
const collectionData = new CallData(DropCollectionABI as never);

/** Sale terms as the contract's `SaleTerms` struct. A free drop names no token. */
export function toContractTerms(t: DropTerms) {
  const price = BigInt(t.price);
  return {
    start_time: t.startTime,
    end_time: t.endTime,
    price: cairo.uint256(price),
    payment_token: price === 0n ? "0x0" : addr(t.paymentToken),
    max_per_wallet: cairo.uint256(BigInt(t.maxPerWallet)),
  };
}

/** Calls on the drop factory and drop collections, ready for `account.execute` or an intent. */
export const dropCalls = {
  create(factory: string, p: CreateDropParams): Call {
    return {
      contractAddress: addr(factory),
      entrypoint: "create_drop",
      calldata: factoryData.compile("create_drop", {
        name: p.name,
        symbol: p.symbol,
        base_uri: p.baseUri,
        max_supply: cairo.uint256(BigInt(p.maxSupply)),
        terms: toContractTerms(p.terms),
        allowlist_root: p.allowlistRoot ?? "0x0",
      }),
    };
  },

  /** Approve (paid drops) and claim. The platform fee call is added by the caller. */
  claim(
    collection: string,
    p: { quantity: bigint | string | number; proof?: string[]; price: bigint | string; paymentToken: string },
  ): Call[] {
    const quantity = BigInt(p.quantity);
    const total = BigInt(p.price) * quantity;
    const calls: Call[] = [];
    if (total > 0n) {
      calls.push({
        contractAddress: addr(p.paymentToken),
        entrypoint: "approve",
        calldata: CallData.compile([addr(collection), cairo.uint256(total)]),
      });
    }
    calls.push({
      contractAddress: addr(collection),
      entrypoint: "claim",
      calldata: collectionData.compile("claim", { quantity: cairo.uint256(quantity), proof: p.proof ?? [] }),
    });
    return calls;
  },

  /** Organizer only: free mint within the supply cap. */
  issue(collection: string, recipient: string, quantity: bigint | string | number): Call {
    return {
      contractAddress: addr(collection),
      entrypoint: "issue",
      calldata: collectionData.compile("issue", { recipient: addr(recipient), quantity: cairo.uint256(BigInt(quantity)) }),
    };
  },

  /** Organizer only. 0 opens the drop to everyone. */
  setAllowlistRoot(collection: string, root: string): Call {
    return { contractAddress: addr(collection), entrypoint: "set_allowlist_root", calldata: collectionData.compile("set_allowlist_root", { root }) };
  },
};

export interface DropMintCost {
  /** price × quantity — paid to the organizer. */
  subtotal: bigint;
  /** Platform fee on the subtotal. */
  fee: bigint;
  total: bigint;
}

export function dropMintCost(price: bigint | string, quantity: bigint | string | number, cfg: ResolvedFeeConfig): DropMintCost {
  const subtotal = BigInt(price) * BigInt(quantity);
  const fee = feeAmount(subtotal, feeBps("launchpad", cfg));
  return { subtotal, fee, total: subtotal + fee };
}
