import { cairo } from "starknet";
import { normalizeAddress } from "../../utils/address.js";
import type { IntentDefinition } from "./build.js";

export interface ArchiveNftIntentParams {
  owner: string;
  collectionId: string;
  tokenId: string;
}

type NoInputs = Record<string, never>;

const u256 = (value: string): [string, string] => {
  const u = cairo.uint256(value);
  return [u.low.toString(), u.high.toString()];
};

export const archiveNftIntent: IntentDefinition<ArchiveNftIntentParams, NoInputs> = {
  inputs: async () => ({}),
  build(p, _inputs, config) {
    return {
      calls: [
        {
          contractAddress: normalizeAddress("STARKNET", config.collection721Contract),
          entrypoint: "archive",
          calldata: [...u256(p.collectionId), ...u256(p.tokenId)],
        },
      ],
    };
  },
};
