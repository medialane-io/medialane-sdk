import { CallData, cairo, type Call } from "starknet";
import type { CreateDropParams, DropTerms } from "../types/services.js";
import { normalizeAddress } from "../utils/address.js";
import { DropCollectionABI, DropFactoryABI } from "./abis/index.js";
import { feeAmount } from "./fee/build-fee-call.js";

export const DROP_MAX_CLAIM_QUANTITY = 50n;

const addr = (a: string) => normalizeAddress("STARKNET", a);
const factoryData = new CallData(DropFactoryABI as never);
const collectionData = new CallData(DropCollectionABI as never);

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

  claim(
    collection: string,
    p: { quantity: bigint | string | number; proof?: string[]; price: bigint | string; paymentToken: string },
  ): Call[] {
    const quantity = BigInt(p.quantity);
    if (quantity < 1n || quantity > DROP_MAX_CLAIM_QUANTITY) throw new RangeError(`quantity must be 1 to ${DROP_MAX_CLAIM_QUANTITY}`);
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

  issue(collection: string, recipient: string, quantity: bigint | string | number): Call {
    const q = BigInt(quantity);
    if (q < 1n) throw new RangeError("quantity must be at least 1");
    return {
      contractAddress: addr(collection),
      entrypoint: "issue",
      calldata: collectionData.compile("issue", { recipient: addr(recipient), quantity: cairo.uint256(q) }),
    };
  },

  setAllowlistRoot(collection: string, root: string): Call {
    return { contractAddress: addr(collection), entrypoint: "set_allowlist_root", calldata: collectionData.compile("set_allowlist_root", { root }) };
  },
};

export interface DropMintCost {
  subtotal: bigint;
  fee: bigint;
  total: bigint;
}

export function dropMintCost(price: bigint | string, quantity: bigint | string | number, feeBps: number): DropMintCost {
  const subtotal = BigInt(price) * BigInt(quantity);
  const fee = feeAmount(subtotal, feeBps);
  return { subtotal, fee, total: subtotal + fee };
}
