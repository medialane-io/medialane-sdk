import { describe, it, expect } from "bun:test";
import { resolveConfig } from "../../config.js";
import {
  buildListing1155Order,
  buildOffer1155Order,
  buildRegister1155Calls,
  buildFulfill1155Calls,
  buildCancel1155Calls,
} from "./build.js";
import type { Call } from "starknet";

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

describe("1155 builders", () => {
  it("listing carries per-unit price and ERC1155 offer amount = quantity", () => {
    const { orderParams } = buildListing1155Order(
      {
        offerer: OFFERER,
        nftContract: "0xbeef",
        tokenId: "3",
        quantity: "10",
        priceWeiPerUnit: "500",
        paymentTokenAddress: "0xda1a",
        royaltyMaxBps: "0",
        startTime: 1,
        endTime: 2,
        salt: "0x1",
        counter: "0",
      },
      CFG,
    );
    expect(orderParams.marketplace).toBe("0x101");
    expect(orderParams.offer).toEqual({
      item_type: "ERC1155",
      token: "0xbeef",
      identifier_or_criteria: "3",
      amount: "10",
    });
    expect(orderParams.consideration.amount).toBe("500");
  });

  it("offer offers ERC20 per-unit and asks for the ERC1155 quantity", () => {
    const { orderParams } = buildOffer1155Order(
      {
        offerer: OFFERER,
        nftContract: "0xbeef",
        tokenId: "3",
        quantity: "10",
        priceWeiPerUnit: "500",
        paymentTokenAddress: "0xda1a",
        royaltyMaxBps: "0",
        startTime: 1,
        endTime: 2,
        salt: "0x1",
        counter: "0",
      },
      CFG,
    );
    expect(orderParams.offer).toEqual({
      item_type: "ERC20",
      token: "0xda1a",
      identifier_or_criteria: "0",
      amount: "500",
    });
    expect(orderParams.consideration).toEqual({
      item_type: "ERC1155",
      token: "0xbeef",
      identifier_or_criteria: "3",
      amount: "10",
      recipient: OFFERER,
    });
  });

  it("buildRegister1155Calls prepends approve only when needed", () => {
    const { orderParams } = buildListing1155Order(
      {
        offerer: OFFERER,
        nftContract: "0xbeef",
        tokenId: "3",
        quantity: "10",
        priceWeiPerUnit: "500",
        paymentTokenAddress: "0xda1a",
        royaltyMaxBps: "0",
        startTime: 1,
        endTime: 2,
        salt: "0x1",
        counter: "0",
      },
      CFG,
    );
    const approve: Call = { contractAddress: "0xbeef", entrypoint: "set_approval_for_all", calldata: ["0x101", "1"] };
    expect(buildRegister1155Calls({ orderParams, signature: ["0x1"], approvalNeeded: true, approve }, CFG)).toHaveLength(2);
    expect(buildRegister1155Calls({ orderParams, signature: ["0x1"], approvalNeeded: false, approve }, CFG)).toHaveLength(1);
  });

  it("fulfill passes [orderHash, quantity] and composes the fee when configured", () => {
    const noFee = buildFulfill1155Calls(
      { orderHash: "0xc0de", paymentToken: "0xda1a", totalPrice: "5000", quantity: "10" },
      CFG,
    );
    expect(noFee).toHaveLength(2);
    expect(noFee[1].entrypoint).toBe("fulfill_order");
    // populate normalizes the felt order hash to decimal; quantity is a plain felt.
    expect(noFee[1].calldata).toEqual([String(0xc0de), "10"]);

    const feeCfg = resolveConfig({
      backendUrl: "https://api.example.com",
      rpcUrl: "https://rpc.example.com",
      marketplaceContract: "0x100",
      collectionContract: "0x200",
      marketplace1155Contract: "0x101",
      collection1155Contract: "0x201",
      chain: "STARKNET",
      feeConfig: { enabled: true, fundAddress: "0xfund", marketplaceBps: 100, launchpadBps: 100 },
    });
    const withFee = buildFulfill1155Calls(
      { orderHash: "0xc0de", paymentToken: "0xda1a", totalPrice: "10000", quantity: "10" },
      feeCfg,
    );
    expect(withFee).toHaveLength(3);
    expect(withFee[2].entrypoint).toBe("transfer");
    expect(withFee[2].calldata?.[0]).toBe("0xfund");
  });

  it("buildCancel1155Calls = [cancel_order]", () => {
    const calls = buildCancel1155Calls({ orderHash: "0xc0de", offerer: OFFERER, signature: ["0x1"] }, CFG);
    expect(calls).toHaveLength(1);
    expect(calls[0].entrypoint).toBe("cancel_order");
  });
});
