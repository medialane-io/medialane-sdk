import { hash, num, type BigNumberish, type Call } from "starknet";

const STARKNET_SIGNER_TYPE = "0x537461726b6e6574205369676e6572"; // "Starknet Signer" shortstring

/**
 * GUID of a Stark-curve owner, matching MediaWallet's
 * `SignerTrait::into_guid` for `Signer::Starknet` — `poseidon_2("Starknet
 * Signer", pubkey)`. `change_owners` removes owners by GUID, not by raw
 * pubkey.
 */
export function computeOwnerGuid(ownerPubkey: BigNumberish): string {
  return hash.computePoseidonHash(STARKNET_SIGNER_TYPE, num.toHex(ownerPubkey));
}

/**
 * The `change_owners` call that hands a provisioned account off to its real
 * owner: removes the business-derived interim owner (by GUID) and adds the
 * recipient's own new owner key (by pubkey) — one call, immediate, no
 * timelock. Must be signed by a *current* owner (the interim key) to
 * succeed on-chain.
 */
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
