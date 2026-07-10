import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { RpcProvider } from "starknet";
import { resolveConfig } from "../../config.js";
import { createListing, makeOffer, fulfillOrder, cancelOrder } from "./orders.js";

/**
 * Legacy-wiring equivalence guard: after the build/execute split, the legacy
 * MarketplaceModule execute-methods must still emit the same call shape they did
 * before — an `approve` (when needed) plus the marketplace mutation — now sourced
 * from the shared builders. We stub the provider reads (get_counter / get_approved
 * / waitForTransaction) and capture what `account.execute` receives.
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
  // get_counter → 3 (via Contract view → callContract); get_approved → 0x0 (≠ marketplace ⇒ approve needed).
  (RpcProvider.prototype as any).callContract = mock(async (req: any) => {
    if (req?.entrypoint === "get_counter") return ["0x3"];
    return ["0x0"];
  });
  (RpcProvider.prototype as any).waitForTransaction = mock(async () => ({}));
});
afterEach(() => {
  (RpcProvider.prototype as any).callContract = origCall;
  (RpcProvider.prototype as any).waitForTransaction = origWait;
});

describe("legacy 721 execute-methods still emit the split-builder call shape", () => {
  it("createListing → [approve(nft), register_order(marketplace)]", async () => {
    const sink: any[] = [];
    await createListing(
      captureAccount(sink),
      { nftContract: "0xbeef", tokenId: "5", price: "1", currency: "USDC", durationSeconds: 3600, royaltyMaxBps: "0" },
      CFG,
    );
    const calls = sink[0];
    expect(calls).toHaveLength(2);
    expect(calls[0].entrypoint).toBe("approve");
    expect(calls[0].contractAddress).toBe("0xbeef");
    expect(calls[1].entrypoint).toBe("register_order");
  });

  it("makeOffer → [approve(erc20), register_order]", async () => {
    const sink: any[] = [];
    await makeOffer(
      captureAccount(sink),
      { nftContract: "0xbeef", tokenId: "5", price: "1", currency: "USDC", durationSeconds: 3600, royaltyMaxBps: "0" },
      CFG,
    );
    const calls = sink[0];
    expect(calls).toHaveLength(2);
    expect(calls[0].entrypoint).toBe("approve");
    expect(calls[1].entrypoint).toBe("register_order");
  });

  it("fulfillOrder → [approve, fulfill_order] (no fee config)", async () => {
    const sink: any[] = [];
    await fulfillOrder(
      captureAccount(sink),
      { orderHash: "0xc0de", paymentToken: "0xda1a", totalPrice: "1000" },
      CFG,
    );
    const calls = sink[0];
    expect(calls.map((c: any) => c.entrypoint)).toEqual(["approve", "fulfill_order"]);
  });

  it("cancelOrder → [cancel_order]", async () => {
    const sink: any[] = [];
    await cancelOrder(captureAccount(sink), { orderHash: "0xc0de" }, CFG);
    const calls = sink[0];
    expect(calls).toHaveLength(1);
    expect(calls[0].entrypoint).toBe("cancel_order");
  });
});
