import { hash, num, type BigNumberish, type Call } from "starknet";

const STARKNET_SIGNER_TYPE = "0x537461726b6e6574205369676e6572";
const OPTION_NONE = "0x1";
const SIGNER_STARKNET = "0x0";

export function computeOwnerGuid(ownerPubkey: BigNumberish): string {
  return hash.computePoseidonHash(STARKNET_SIGNER_TYPE, num.toHex(ownerPubkey));
}

function changeOwners(
  accountAddress: string,
  guidsToRemove: string[],
  pubkeysToAdd: BigNumberish[],
): Call {
  return {
    contractAddress: accountAddress,
    entrypoint: "change_owners",
    calldata: [
      num.toHex(guidsToRemove.length),
      ...guidsToRemove,
      num.toHex(pubkeysToAdd.length),
      ...pubkeysToAdd.flatMap((p) => [SIGNER_STARKNET, num.toHex(p)]),
      OPTION_NONE,
    ],
  };
}

export function buildChangeOwnersCall(
  accountAddress: string,
  removeOwnerPubkey: BigNumberish,
  addOwnerPubkey: BigNumberish,
): Call {
  return changeOwners(accountAddress, [computeOwnerGuid(removeOwnerPubkey)], [addOwnerPubkey]);
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
