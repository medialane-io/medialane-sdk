import { describe, it, expect } from "bun:test";
import { resolveConfig } from "../../config.js";
import {
  buildListingOrder,
  buildOfferOrder,
  buildRegisterCalls,
  buildFulfillCalls,
  buildCancelCalls,
  buildCancelTypedData,
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
const OFFERER = "0xoff";

describe("721 builders", () => {
  it("buildListingOrder assembles the 721 order + typed data", () => {
    const { orderParams, typedData } = buildListingOrder(
      {
        offerer: OFFERER,
        nftContract: "0xnft",
        tokenId: "5",
        priceWei: "1000",
        paymentTokenAddress: "0xusdc",
        royaltyMaxBps: "500",
        startTime: 100,
        endTime: 200,
        salt: "0xsalt",
        counter: "7",
      },
      CFG,
    );
    expect(orderParams.offerer).toBe(OFFERER);
    expect(orderParams.marketplace).toBe("0x100");
    expect(orderParams.offer).toEqual({
      item_type: "ERC721",
      token: "0xnft",
      identifier_or_criteria: "5",
      amount: "1",
    });
    expect(orderParams.consideration).toEqual({
      item_type: "ERC20",
      token: "0xusdc",
      identifier_or_criteria: "0",
      amount: "1000",
      recipient: OFFERER,
    });
    expect(orderParams.royalty_max_bps).toBe("500");
    expect(orderParams.start_time).toBe("100");
    expect(orderParams.end_time).toBe("200");
    expect(orderParams.salt).toBe("0xsalt");
    expect(orderParams.counter).toBe("7");
    expect(typedData.primaryType).toBeDefined();
    expect(typedData.domain).toBeDefined();
  });

  it("buildOfferOrder flips offer/consideration (ERC20 offered for ERC721)", () => {
    const { orderParams } = buildOfferOrder(
      {
        offerer: OFFERER,
        nftContract: "0xnft",
        tokenId: "5",
        priceWei: "1000",
        paymentTokenAddress: "0xusdc",
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
      token: "0xusdc",
      identifier_or_criteria: "0",
      amount: "1000",
    });
    expect(orderParams.consideration).toEqual({
      item_type: "ERC721",
      token: "0xnft",
      identifier_or_criteria: "5",
      amount: "1",
      recipient: OFFERER,
    });
  });

  it("buildRegisterCalls prepends approve only when needed", () => {
    const { orderParams } = buildListingOrder(
      {
        offerer: OFFERER,
        nftContract: "0xnft",
        tokenId: "5",
        priceWei: "1000",
        paymentTokenAddress: "0xusdc",
        royaltyMaxBps: "0",
        startTime: 1,
        endTime: 2,
        salt: "0x1",
        counter: "0",
      },
      CFG,
    );
    const approve: Call = { contractAddress: "0xnft", entrypoint: "approve", calldata: ["0x100", "5", "0"] };

    const withApprove = buildRegisterCalls({ orderParams, signature: ["0xa"], approvalNeeded: true, approve }, CFG);
    expect(withApprove).toHaveLength(2);
    expect(withApprove[0]).toEqual(approve);
    expect(withApprove[1].entrypoint).toBe("register_order");

    const withoutApprove = buildRegisterCalls({ orderParams, signature: ["0xa"], approvalNeeded: false, approve }, CFG);
    expect(withoutApprove).toHaveLength(1);
    expect(withoutApprove[0].entrypoint).toBe("register_order");
  });

  it("buildFulfillCalls = [approve, fulfill_order] with no fee config", () => {
    const calls = buildFulfillCalls({ orderHash: "0xorder", paymentToken: "0xusdc", totalPrice: "1000" }, CFG);
    expect(calls).toHaveLength(2);
    expect(calls[0].entrypoint).toBe("approve");
    expect(calls[0].contractAddress).toBe("0xusdc");
    expect(calls[0].calldata).toEqual(["0x100", "1000", "0"]);
    expect(calls[1].entrypoint).toBe("fulfill_order");
  });

  it("buildFulfillCalls appends a fee transfer when fee config is enabled", () => {
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
    const calls = buildFulfillCalls({ orderHash: "0xorder", paymentToken: "0xusdc", totalPrice: "10000" }, feeCfg);
    expect(calls).toHaveLength(3);
    expect(calls[1].entrypoint).toBe("fulfill_order");
    expect(calls[2].entrypoint).toBe("transfer");
    expect(calls[2].contractAddress).toBe("0xusdc");
    // 1% of 10000 = 100 to the fund.
    expect(calls[2].calldata?.[0]).toBe("0xfund");
  });

  it("buildCancelCalls = [cancel_order]; buildCancelTypedData signs {order_hash, offerer}", () => {
    const calls = buildCancelCalls({ orderHash: "0xorder", offerer: OFFERER, signature: ["0xa"] }, CFG);
    expect(calls).toHaveLength(1);
    expect(calls[0].entrypoint).toBe("cancel_order");
    const td = buildCancelTypedData("0xorder", OFFERER, CFG);
    expect(td.primaryType).toBeDefined();
  });
});
