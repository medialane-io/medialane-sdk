import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { RpcProvider } from "starknet";
import { resolveConfig } from "../../config.js";
import { createListing1155, makeOffer1155, fulfillOrder1155, cancelOrder1155 } from "./orders.js";

/**
 * Legacy-wiring equivalence guard for the 1155 venue. Same shape as the 721 guard,
 * plus the ONE intended behavior change: `fulfillOrder1155` now appends the
 * platform fee (it did not before), so a fee-configured fulfil emits three calls.
 */

const CFG = resolveConfig({
  backendUrl: "https://api.example.com",
  rpcUrl: "https://rpc.example.com",
  marketplaceContract: "0x100",
  collectionContract: "0x200",
  marketplace1155Contract: "0x101",
  collection1155Contract: "0x201",
  chain: "STARKNET",
});
const FEE_CFG = resolveConfig({
  backendUrl: "https://api.example.com",
  rpcUrl: "https://rpc.example.com",
  marketplaceContract: "0x100",
  collectionContract: "0x200",
  marketplace1155Contract: "0x101",
  collection1155Contract: "0x201",
  chain: "STARKNET",
  feeConfig: { enabled: true, fundAddress: "0xfund", marketplaceBps: 100, launchpadBps: 100 },
});
const OFFERER = "0xa11ce";

function captureAccount(sink: any[]) {
  return {
    address: OFFERER,
    signMessage: mock(async () => ["0x1", "0x2"]),
    execute: mock(async (calls: any) => {
      sink.push(Array.isArray(calls) ? calls : [calls]);
      return { transaction_hash: "0xtx" };
    }),
  } as any;
}

let origCall: any;
let origWait: any;
beforeEach(() => {
  origCall = RpcProvider.prototype.callContract;
  origWait = RpcProvider.prototype.waitForTransaction;
  (RpcProvider.prototype as any).callContract = mock(async (req: any) => {
    if (req?.entrypoint === "get_counter") return ["0x3"];
    return ["0x0"]; // is_approved_for_all → false ⇒ approval needed
  });
  (RpcProvider.prototype as any).waitForTransaction = mock(async () => ({}));
});
afterEach(() => {
  (RpcProvider.prototype as any).callContract = origCall;
  (RpcProvider.prototype as any).waitForTransaction = origWait;
});

describe("legacy 1155 execute-methods emit the split-builder call shape", () => {
  it("createListing1155 → [set_approval_for_all, register_order]", async () => {
    const sink: any[] = [];
    await createListing1155(
      captureAccount(sink),
      { nftContract: "0xbeef", tokenId: "3", amount: "10", pricePerUnit: "1", currency: "USDC", durationSeconds: 3600, royaltyMaxBps: "0" },
      CFG,
    );
    const calls = sink[0];
    expect(calls.map((c: any) => c.entrypoint)).toEqual(["set_approval_for_all", "register_order"]);
  });

  it("makeOffer1155 → [approve, register_order]", async () => {
    const sink: any[] = [];
    await makeOffer1155(
      captureAccount(sink),
      { nftContract: "0xbeef", tokenId: "3", amount: "10", price: "1", currency: "USDC", durationSeconds: 3600, royaltyMaxBps: "0" },
      CFG,
    );
    const calls = sink[0];
    expect(calls.map((c: any) => c.entrypoint)).toEqual(["approve", "register_order"]);
  });

  it("fulfillOrder1155 → [approve, fulfill_order] without fee, [approve, fulfill_order, transfer] with fee", async () => {
    const noFee: any[] = [];
    await fulfillOrder1155(captureAccount(noFee), { orderHash: "0xc0de", paymentToken: "0xda1a", totalPrice: "1000", quantity: "2" }, CFG);
    expect(noFee[0].map((c: any) => c.entrypoint)).toEqual(["approve", "fulfill_order"]);

    const withFee: any[] = [];
    await fulfillOrder1155(captureAccount(withFee), { orderHash: "0xc0de", paymentToken: "0xda1a", totalPrice: "10000", quantity: "2" }, FEE_CFG);
    expect(withFee[0].map((c: any) => c.entrypoint)).toEqual(["approve", "fulfill_order", "transfer"]);
  });

  it("cancelOrder1155 → [cancel_order]", async () => {
    const sink: any[] = [];
    await cancelOrder1155(captureAccount(sink), { orderHash: "0xc0de" }, CFG);
    expect(sink[0]).toHaveLength(1);
    expect(sink[0][0].entrypoint).toBe("cancel_order");
  });
});
