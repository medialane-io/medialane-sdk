import { test, expect } from "bun:test";
import { STARKNET_GENESIS_MINT_CONTRACT, STARKNET_GENESIS_NFT_URI } from "./constants.js";

test("genesis mints go to the launch contract", () => {
  expect(STARKNET_GENESIS_MINT_CONTRACT).toBe(
    "0x06ed61abba98a44d45bed2c4b1a456df15053c3321cfd6e007afb33b7226c9f0",
  );
});

test("genesis URI is ipfs:// plus one bare CID", () => {
  expect(STARKNET_GENESIS_NFT_URI).toMatch(/^ipfs:\/\/(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{58})$/);
});
