import { num, type BigNumberish, type DeployAccountContractPayload } from "starknet";
import { STARKNET_MEDIAWALLET_CLASS_HASH } from "../../constants.js";
import { ownerConstructorCalldata, computeAccountAddress } from "./account.js";

/**
 * The exact payload starknet.js's `Account.deployAccount()` expects — the
 * caller constructs a signing `Account` from the derived private key
 * (`deriveOwnerKeyPair`) against a **pre-funded** counterfactual address
 * (`computeAccountAddress`) and calls
 * `account.deployAccount(buildDeployAccountParams(ownerPubkey))` directly.
 * This function only builds the payload — it never signs or submits
 * anything itself.
 */
export function buildDeployAccountParams(
  ownerPubkey: BigNumberish,
  salt: BigNumberish = 0,
): DeployAccountContractPayload {
  return {
    classHash: STARKNET_MEDIAWALLET_CLASS_HASH,
    constructorCalldata: ownerConstructorCalldata(ownerPubkey),
    addressSalt: num.toHex(salt),
    contractAddress: computeAccountAddress(ownerPubkey, salt),
  };
}
