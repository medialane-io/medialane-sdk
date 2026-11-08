import { describe, expect, test } from "bun:test";
import { resolveConfig } from "../../config.js";
import { STARKNET_GENESIS_MINT_CONTRACT, STARKNET_GENESIS_NFT_URI } from "../../constants.js";
import { encodeByteArray } from "../bytearray.js";
import { buildIntent, canBuildIntent, resolveIntentInputs, type IntentReaders } from "./build.js";

const config = resolveConfig({});
const OWNER = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const OTHER = "0x0fedcba9876543210fedcba9876543210fedcba9876543210fedcba987654321";
const NFT = "0x0222222222222222222222222222222222222222222222222222222222222222";

const readers: IntentReaders = {
  counterOf: async () => {
    throw new Error("unexpected read");
  },
  royaltyCapOf: async () => {
    throw new Error("unexpected read");
  },
  orderOf: async () => {
    throw new Error("unexpected read");
  },
};

const calldataOf = (built: { calls: Array<{ calldata?: unknown }> }) => built.calls[0]!.calldata as string[];

const transfer = (tokenStandard: "ERC721" | "ERC1155", tokenId = "7") =>
  buildIntent("transfer-nft", { owner: OWNER, contractAddress: NFT, tokenId, recipient: OTHER, tokenStandard }, undefined, config);

describe("transfer and genesis mint intents", () => {
  test("both kinds are built locally", () => {
    expect(canBuildIntent("transfer-nft")).toBe(true);
    expect(canBuildIntent("genesis-mint")).toBe(true);
  });

  test("they need nothing read from the chain or the orders API", async () => {
    expect(await resolveIntentInputs("transfer-nft", {}, readers)).toBeUndefined();
    expect(await resolveIntentInputs("genesis-mint", {}, readers)).toBeUndefined();
  });

  test("an ERC-721 transfer is transfer_from the owner to the recipient", () => {
    expect(transfer("ERC721").calls).toEqual([{ contractAddress: NFT, entrypoint: "transfer_from", calldata: [OWNER, OTHER, "7", "0"] }]);
  });

  test("an ERC-1155 transfer moves one unit with empty data", () => {
    expect(transfer("ERC1155").calls).toEqual([
      { contractAddress: NFT, entrypoint: "safe_transfer_from", calldata: [OWNER, OTHER, "7", "0", "1", "0", "0"] },
    ]);
  });

  test("a token id above 128 bits is split into low and high", () => {
    const id = (1n << 128n) + 5n;
    expect(calldataOf(transfer("ERC721", id.toString())).slice(2)).toEqual(["5", "1"]);
    expect(calldataOf(transfer("ERC721", "0x" + id.toString(16))).slice(2)).toEqual(["5", "1"]);
  });

  test("addresses are written in their canonical form", () => {
    const built = buildIntent("transfer-nft", { owner: "0x1", contractAddress: "0x2", tokenId: "1", recipient: "0x3", tokenStandard: "ERC721" }, undefined, config);
    expect(built.calls[0]!.contractAddress).toBe("0x" + "2".padStart(64, "0"));
    expect(calldataOf(built).slice(0, 2)).toEqual(["0x" + "1".padStart(64, "0"), "0x" + "3".padStart(64, "0")]);
  });

  test("a genesis mint mints the genesis item to the recipient", () => {
    expect(buildIntent("genesis-mint", { owner: OWNER, recipient: OWNER }, undefined, config).calls).toEqual([
      { contractAddress: STARKNET_GENESIS_MINT_CONTRACT, entrypoint: "mint_item", calldata: [OWNER, ...encodeByteArray(STARKNET_GENESIS_NFT_URI)] },
    ]);
  });
});
