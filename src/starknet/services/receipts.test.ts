import { test, expect } from "bun:test";
import { hash } from "starknet";
import { getService } from "../../services/registry.js";
import { deployedCollectionFromReceipt, mintedTokenIdFromReceipt } from "./receipts.js";

const sel = (name: string) => hash.getSelectorFromName(name);
const factoryOf = (id: string) => getService(id)!.onchain!.STARKNET!.factoryAddress!;
const COLLECTION = "0x3d58b9f6fa0000000000000000000000000000000000000000000000000000a1";
const STRK = "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const feeTransfer = { from_address: STRK, keys: [sel("Transfer"), "0xabc", "0xdef"], data: ["0x10", "0x0"] };

test("reads the collection an NFT Editions factory deployed", () => {
  const receipt = {
    events: [
      feeTransfer,
      { from_address: factoryOf("mip-erc1155"), keys: [sel("CollectionDeployed"), "0x5a1", "0xowner"], data: [] },
    ],
  };
  expect(deployedCollectionFromReceipt(receipt, "mip-erc1155")).toBe(
    "0x00000000000000000000000000000000000000000000000000000000000005a1",
  );
});

test("reads the club a club factory deployed from its ClubDeployed event", () => {
  const receipt = { events: [{ from_address: factoryOf("ip-club"), keys: [sel("ClubDeployed"), "0xc1ab", "0xowner"], data: [] }] };
  expect(deployedCollectionFromReceipt(receipt, "ip-club")).toBe(
    "0x000000000000000000000000000000000000000000000000000000000000c1ab",
  );
});

test("reads a drop's collection from the data of DropCreated", () => {
  const receipt = {
    events: [{ from_address: factoryOf("drop-collection"), keys: [sel("DropCreated"), "0x1", "0x0", "0xorganizer"], data: ["0xd409"] }],
  };
  expect(deployedCollectionFromReceipt(receipt, "drop-collection")).toBe(
    "0x000000000000000000000000000000000000000000000000000000000000d409",
  );
});

test("matches a selector whatever its hex padding", () => {
  const padded = "0x" + BigInt(sel("CollectionDeployed")).toString(16).padStart(64, "0");
  const receipt = { events: [{ from_address: factoryOf("ip-tickets"), keys: [padded, "0x71c", "0xowner"], data: [] }] };
  expect(deployedCollectionFromReceipt(receipt, "ip-tickets")).toBe(
    "0x000000000000000000000000000000000000000000000000000000000000071c",
  );
});

test("ignores a deploy event emitted by another contract", () => {
  const receipt = { events: [{ from_address: "0x999", keys: [sel("CollectionDeployed"), "0x5a1", "0xowner"], data: [] }] };
  expect(deployedCollectionFromReceipt(receipt, "mip-erc1155")).toBeNull();
});

test("reads the edition id an NFT Editions collection minted", () => {
  const receipt = { events: [feeTransfer, { from_address: COLLECTION, keys: [sel("IPMinted"), "0x7", "0x0", "0xrecipient"], data: ["0xa", "0x0"] }] };
  expect(mintedTokenIdFromReceipt(receipt, COLLECTION)).toBe("7");
});

test("reads the token id of an IP Collection mint from its ERC-721 Transfer", () => {
  const receipt = {
    events: [
      { from_address: COLLECTION, keys: [sel("Transfer"), "0x0", "0xrecipient", "0x2", "0x0"], data: [] },
      { from_address: "0x225c3ae09506b8d97adc39649ca740dad5aac195b7f5f0441cc1852947acaea", keys: [sel("TokenMinted"), "0x1", "0x0", "0x2", "0x0"], data: [] },
      feeTransfer,
    ],
  };
  expect(mintedTokenIdFromReceipt(receipt, COLLECTION)).toBe("2");
});

test("combines both halves of a u256 token id", () => {
  const receipt = { events: [{ from_address: COLLECTION, keys: [sel("IPMinted"), "0x1", "0x1", "0xrecipient"], data: [] }] };
  expect(mintedTokenIdFromReceipt(receipt, COLLECTION)).toBe(((1n << 128n) + 1n).toString());
});

test("a transfer between holders is not a mint", () => {
  const receipt = { events: [{ from_address: COLLECTION, keys: [sel("Transfer"), "0xholder", "0xrecipient", "0x2", "0x0"], data: [] }] };
  expect(mintedTokenIdFromReceipt(receipt, COLLECTION)).toBeNull();
});

test("the fee token's transfer never reads as a mint", () => {
  expect(mintedTokenIdFromReceipt({ events: [feeTransfer] }, STRK)).toBeNull();
});
