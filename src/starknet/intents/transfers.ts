import { cairo, type Call } from "starknet";
import { normalizeAddress } from "../../utils/address.js";
import { getTokenByAddress } from "../../utils/token.js";
import type { IntentDefinition } from "./build.js";

export interface TransferTokenIntentParams {
  owner: string;
  token: string;
  recipient: string;
  amount: string;
}

export interface TransferNftIntentParams {
  owner: string;
  contractAddress: string;
  tokenId: string;
  recipient: string;
  tokenStandard: "ERC721" | "ERC1155";
}

export interface TransferCollectionOwnershipIntentParams {
  owner: string;
  collectionId: string;
  newOwner: string;
}

export interface FundingTransferIntentParams {
  owner: string;
  asset: string;
  amountAtomic: string;
}

type NoInputs = Record<string, never>;

const addr = (address: string) => normalizeAddress("STARKNET", address);

function u256(value: string | bigint): [string, string] {
  const u = cairo.uint256(value.toString());
  return [u.low.toString(), u.high.toString()];
}

const noInputs = async (): Promise<NoInputs> => ({});

const tokenTransfer = (token: string, recipient: string, amount: string): Call => ({
  contractAddress: addr(token),
  entrypoint: "transfer",
  calldata: [addr(recipient), ...u256(amount)],
});

export const transferTokenIntent: IntentDefinition<TransferTokenIntentParams, NoInputs> = {
  inputs: noInputs,
  build(p) {
    const token = getTokenByAddress(p.token);
    if (!token) throw new Error("That token is not supported");
    return { calls: [tokenTransfer(token.address, p.recipient, p.amount)] };
  },
};

export const transferNftIntent: IntentDefinition<TransferNftIntentParams, NoInputs> = {
  inputs: noInputs,
  build(p) {
    const [low, high] = u256(p.tokenId);
    const from = addr(p.owner);
    const to = addr(p.recipient);
    return {
      calls: [
        p.tokenStandard === "ERC1155"
          ? { contractAddress: addr(p.contractAddress), entrypoint: "safe_transfer_from", calldata: [from, to, low, high, "1", "0", "0"] }
          : { contractAddress: addr(p.contractAddress), entrypoint: "transfer_from", calldata: [from, to, low, high] },
      ],
    };
  },
};

export const transferCollectionOwnershipIntent: IntentDefinition<TransferCollectionOwnershipIntentParams, NoInputs> = {
  inputs: noInputs,
  build(p, _inputs, config) {
    return {
      calls: [
        {
          contractAddress: config.collection721Contract,
          entrypoint: "transfer_collection_ownership",
          calldata: [...u256(p.collectionId), addr(p.newOwner)],
        },
      ],
    };
  },
};

export const fundingTransferIntent: IntentDefinition<FundingTransferIntentParams, NoInputs> = {
  inputs: noInputs,
  build(p, _inputs, config) {
    const fund = config.feeConfig.fundAddress;
    if (!fund) throw new Error("Funding is not configured");
    return { calls: [tokenTransfer(p.asset, fund, p.amountAtomic)] };
  },
};
