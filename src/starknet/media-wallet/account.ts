import { hash, num, type BigNumberish } from "starknet";
import { STARKNET_MEDIAWALLET_CLASS_HASH } from "../../constants.js";

export function ownerConstructorCalldata(ownerPubkey: BigNumberish): string[] {
  return ["0x0", num.toHex(ownerPubkey), "0x1"];
}

export function computeAccountAddress(ownerPubkey: BigNumberish, salt: BigNumberish = 0): string {
  return hash.calculateContractAddressFromHash(
    num.toHex(salt),
    STARKNET_MEDIAWALLET_CLASS_HASH,
    ownerConstructorCalldata(ownerPubkey),
    0,
  );
}
