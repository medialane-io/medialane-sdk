import { num, type BigNumberish, type DeployAccountContractPayload } from "starknet";
import { STARKNET_MEDIAWALLET_CLASS_HASH } from "../../constants.js";
import { ownerConstructorCalldata, computeAccountAddress } from "./account.js";

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
