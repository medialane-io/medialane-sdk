import { hash, num, type BigNumberish, type Call, type TypedData } from "starknet";

const STARKNET_SIGNER_TYPE = "0x537461726b6e6574205369676e6572";
const OPTION_NONE = "0x1";
const OPTION_SOME = "0x0";
const SIGNER_STARKNET = "0x0";

export function computeOwnerGuid(ownerPubkey: BigNumberish): string {
  return hash.computePoseidonHash(STARKNET_SIGNER_TYPE, num.toHex(ownerPubkey));
}

function changeOwners(
  accountAddress: string,
  guidsToRemove: string[],
  pubkeysToAdd: BigNumberish[],
  ownerAlive?: OwnerAliveProof,
): Call {
  return {
    contractAddress: accountAddress,
    entrypoint: "change_owners",
    calldata: [
      num.toHex(guidsToRemove.length),
      ...guidsToRemove,
      num.toHex(pubkeysToAdd.length),
      ...pubkeysToAdd.flatMap((p) => [SIGNER_STARKNET, num.toHex(p)]),
      ...(ownerAlive ? ownerAliveCalldata(ownerAlive) : [OPTION_NONE]),
    ],
  };
}

export interface OwnerAliveProof {
  newOwnerPubkey: BigNumberish;
  signature: string[];
  expiration: number;
}

export function ownerAliveTypedData(
  newOwnerGuid: string,
  expiration: number,
  chainId: string,
): TypedData {
  return {
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
      ],
      "Owner Alive": [
        { name: "Owner GUID", type: "felt" },
        { name: "Signature expiration", type: "timestamp" },
      ],
    },
    primaryType: "Owner Alive",
    domain: { name: "Owner Alive", version: "1", chainId, revision: "1" },
    message: { "Owner GUID": newOwnerGuid, "Signature expiration": expiration },
  };
}

function ownerAliveCalldata(proof: OwnerAliveProof): string[] {
  if (proof.signature.length !== 2) {
    throw new Error("owner-alive proof needs an r and s from the incoming owner");
  }
  return [
    OPTION_SOME,
    SIGNER_STARKNET,
    num.toHex(proof.newOwnerPubkey),
    num.toHex(proof.signature[0]),
    num.toHex(proof.signature[1]),
    num.toHex(proof.expiration),
  ];
}

export function buildChangeOwnersCall(
  accountAddress: string,
  removeOwnerPubkey: BigNumberish,
  addOwnerPubkey: BigNumberish,
  ownerAlive?: OwnerAliveProof,
): Call {
  if (!ownerAlive) {
    throw new Error(
      "Handing an account over removes the signing owner, so the account requires an owner-alive proof from the incoming owner. Sign ownerAliveTypedData with the new owner key and pass it here.",
    );
  }
  return changeOwners(
    accountAddress,
    [computeOwnerGuid(removeOwnerPubkey)],
    [addOwnerPubkey],
    ownerAlive,
  );
}

export function buildAddOwnerCall(accountAddress: string, addOwnerPubkey: BigNumberish): Call {
  return changeOwners(accountAddress, [], [addOwnerPubkey]);
}

export function buildRemoveOwnerCall(accountAddress: string, removeOwnerPubkey: BigNumberish): Call {
  return changeOwners(accountAddress, [computeOwnerGuid(removeOwnerPubkey)], []);
}

export function buildRemoveOwnerByGuidCall(accountAddress: string, ownerGuid: BigNumberish): Call {
  return changeOwners(accountAddress, [num.toHex(ownerGuid)], []);
}
