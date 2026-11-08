import { cairo } from "starknet";
import { STARKNET_GENESIS_MINT_CONTRACT, STARKNET_GENESIS_NFT_URI } from "../../constants.js";
import { normalizeAddress } from "../../utils/address.js";
import { encodeByteArray } from "../bytearray.js";
import type { IntentDefinition } from "./build.js";

export interface TransferNftIntentParams {
  owner: string;
  contractAddress: string;
  tokenId: string;
  recipient: string;
  tokenStandard: "ERC721" | "ERC1155";
}

export interface GenesisMintIntentParams {
  owner: string;
  recipient: string;
}

const address = (value: string) => normalizeAddress("STARKNET", value);
const withoutInputs = async () => undefined;

export const transferNftIntent: IntentDefinition<TransferNftIntentParams, undefined> = {
  inputs: withoutInputs,
  build(p) {
    const id = cairo.uint256(BigInt(p.tokenId));
    const token = [String(id.low), String(id.high)];
    const [from, to] = [address(p.owner), address(p.recipient)];
    const call =
      p.tokenStandard === "ERC1155"
        ? { entrypoint: "safe_transfer_from", calldata: [from, to, ...token, "1", "0", "0"] }
        : { entrypoint: "transfer_from", calldata: [from, to, ...token] };
    return { calls: [{ contractAddress: address(p.contractAddress), ...call }] };
  },
};

export const genesisMintIntent: IntentDefinition<GenesisMintIntentParams, undefined> = {
  inputs: withoutInputs,
  build(p) {
    return {
      calls: [
        {
          contractAddress: STARKNET_GENESIS_MINT_CONTRACT,
          entrypoint: "mint_item",
          calldata: [address(p.recipient), ...encodeByteArray(STARKNET_GENESIS_NFT_URI)],
        },
      ],
    };
  },
};
