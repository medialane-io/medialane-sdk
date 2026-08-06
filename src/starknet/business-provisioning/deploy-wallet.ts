import { CallData, num, type BigNumberish, type Call } from "starknet";

/**
 * The permissionless `MediaWalletFactory.deploy_wallet(ownerPubkey, salt)` call —
 * anyone can submit this on behalf of any owner pubkey (delta-audit-confirmed
 * harmless: it only ever gives that pubkey its own counterfactual wallet). This
 * is distinct from `buildDeployAccountParams` (self-deploy via
 * `account.deployAccount()`, requires the account to already hold funds) — this
 * is for a relayer paying gas on someone else's behalf.
 */
export function buildDeployWalletCall(
  factoryAddress: string,
  ownerPubkey: BigNumberish,
  salt: BigNumberish = 0,
): Call {
  return {
    contractAddress: factoryAddress,
    entrypoint: "deploy_wallet",
    calldata: CallData.compile([num.toHex(ownerPubkey), num.toHex(salt)]),
  };
}
