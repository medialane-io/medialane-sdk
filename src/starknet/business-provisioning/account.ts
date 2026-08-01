import { hash, num, type BigNumberish } from "starknet";
import { STARKNET_MEDIAWALLET_CLASS_HASH } from "../../constants.js";

/**
 * Account constructor calldata for a Stark-curve owner and no guardian:
 * `serialize((Signer::Starknet(owner_pubkey), Option::None))` = `[0, owner_pubkey, 1]`.
 * Verified against `medialane-contracts/contracts/MediaWallet`'s factory
 * `build_constructor_calldata`.
 */
export function ownerConstructorCalldata(ownerPubkey: BigNumberish): string[] {
  return ["0x0", num.toHex(ownerPubkey), "0x1"];
}

/**
 * Counterfactual MediaWallet account address for `(ownerPubkey, salt)` —
 * standard Starknet derivation with `deploy_from_zero` (deployer address = 0).
 * With `salt = 0` the address is a pure function of the owner key, so it can
 * be computed before anything is deployed on-chain.
 */
export function computeAccountAddress(ownerPubkey: BigNumberish, salt: BigNumberish = 0): string {
  return hash.calculateContractAddressFromHash(
    num.toHex(salt),
    STARKNET_MEDIAWALLET_CLASS_HASH,
    ownerConstructorCalldata(ownerPubkey),
    0,
  );
}
