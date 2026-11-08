import { STARKNET_GENESIS_MINT_CONTRACT, STARKNET_GENESIS_NFT_URI } from "../../constants.js";
import { normalizeAddress } from "../../utils/address.js";
import { encodeByteArray } from "../bytearray.js";
import type { IntentDefinition } from "./build.js";

export interface GenesisMintIntentParams {
  owner: string;
  recipient: string;
}

export const genesisMintIntent: IntentDefinition<GenesisMintIntentParams, Record<string, never>> = {
  inputs: async () => ({}),
  build(p) {
    return {
      calls: [
        {
          contractAddress: STARKNET_GENESIS_MINT_CONTRACT,
          entrypoint: "mint_item",
          calldata: [normalizeAddress("STARKNET", p.recipient), ...encodeByteArray(STARKNET_GENESIS_NFT_URI)],
        },
      ],
    };
  },
};
