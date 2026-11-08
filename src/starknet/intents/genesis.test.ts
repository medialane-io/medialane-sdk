import { describe, expect, test } from "bun:test";
import { resolveConfig } from "../../config.js";
import { STARKNET_GENESIS_MINT_CONTRACT, STARKNET_GENESIS_NFT_URI } from "../../constants.js";
import { encodeByteArray } from "../bytearray.js";
import { buildIntent, canBuildIntent } from "./build.js";

const OWNER = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("genesis mint", () => {
  test("is built locally", () => {
    expect(canBuildIntent("genesis-mint")).toBe(true);
  });

  test("mints the genesis item to the recipient", () => {
    expect(buildIntent("genesis-mint", { owner: OWNER, recipient: OWNER }, {}, resolveConfig({})).calls).toEqual([
      { contractAddress: STARKNET_GENESIS_MINT_CONTRACT, entrypoint: "mint_item", calldata: [OWNER, ...encodeByteArray(STARKNET_GENESIS_NFT_URI)] },
    ]);
  });

  test("writes the recipient in its canonical form", () => {
    const [call] = buildIntent("genesis-mint", { owner: "0x1", recipient: "0x3" }, {}, resolveConfig({})).calls;
    expect((call!.calldata as string[])[0]).toBe("0x" + "3".padStart(64, "0"));
  });
});
