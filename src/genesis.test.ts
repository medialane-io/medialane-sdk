import { test, expect } from "bun:test";
import { STARKNET_GENESIS_MINT_CONTRACT, STARKNET_GENESIS_NFT_URI } from "./constants.js";
import { IPGenesisABI } from "./starknet/abis/index.js";

test("genesis mints go to the launch contract", () => {
  expect(STARKNET_GENESIS_MINT_CONTRACT).toBe(
    "0x06ed61abba98a44d45bed2c4b1a456df15053c3321cfd6e007afb33b7226c9f0",
  );
});

test("genesis URI is ipfs:// plus one bare CID", () => {
  expect(STARKNET_GENESIS_NFT_URI).toMatch(/^ipfs:\/\/(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58})$/);
});

test("the genesis ABI declares exactly the deployed contract's functions", () => {
  const names = new Set<string>();
  for (const entry of IPGenesisABI as readonly { type: string; name: string; items?: readonly { name: string }[] }[]) {
    if (entry.type === "interface") for (const item of entry.items ?? []) names.add(item.name);
    if (entry.type === "function") names.add(entry.name);
  }
  expect([...names].sort()).toEqual([
    "approve", "balanceOf", "balance_of", "getApproved", "get_approved", "get_collection_creator",
    "get_token_creator", "get_token_data", "get_token_registered_at", "isApprovedForAll",
    "is_approved_for_all", "mint_item", "name", "ownerOf", "owner_of", "safeTransferFrom",
    "safe_transfer_from", "setApprovalForAll", "set_approval_for_all", "supports_interface",
    "symbol", "tokenURI", "token_by_index", "token_of_owner_by_index", "token_uri",
    "total_supply", "transferFrom", "transfer_from",
  ]);
});
