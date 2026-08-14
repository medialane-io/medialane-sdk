import { hash, num, type BigNumberish, type Call } from "starknet";

const STARKNET_SIGNER_TYPE = "0x537461726b6e6574205369676e6572";

export function computeOwnerGuid(ownerPubkey: BigNumberish): string {
  return hash.computePoseidonHash(STARKNET_SIGNER_TYPE, num.toHex(ownerPubkey));
}

export function buildChangeOwnersCall(
  accountAddress: string,
  removeOwnerPubkey: BigNumberish,
  addOwnerPubkey: BigNumberish,
): Call {
  const guidToRemove = computeOwnerGuid(removeOwnerPubkey);
  return {
    contractAddress: accountAddress,
    entrypoint: "change_owners",
    calldata: ["0x1", guidToRemove, "0x1", "0x0", num.toHex(addOwnerPubkey)],
  };
}
