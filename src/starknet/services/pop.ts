import { newContract } from "../marketplace/utils.js";
import { type AccountInterface, type ProviderInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { normalizeAddress } from "../../utils/address.js";
import { POPCollectionABI, POPFactoryABI } from "../abis/index.js";
import { getStarknetCoordinates } from "../../chains.js";
import type { CreatePopCollectionParams } from "../../types/services.js";
import type { TxResult } from "../../types/marketplace.js";

export type { CreatePopCollectionParams };

export class PopService {
  private readonly factoryAddress: string;

  constructor(config: ResolvedConfig) {
    this.factoryAddress = getStarknetCoordinates(config.chain).popFactory!;
  }

  private _collection(address: string, account: AccountInterface) {
    return newContract(POPCollectionABI as any, normalizeAddress("STARKNET", address), account as any);
  }

  async createCollection(account: AccountInterface, params: CreatePopCollectionParams): Promise<TxResult> {
    const factory = newContract(POPFactoryABI as any, this.factoryAddress, account as any);
    const call = factory.populate("create_collection", [params.name, params.symbol, params.baseUri, params.claimEndTime]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async setAllowlistRoot(account: AccountInterface, params: { collection: string; root: string }): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("set_allowlist_root", [params.root]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async claim(account: AccountInterface, params: { collection: string; proof: string[] }): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("claim", [params.proof]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async issue(
    account: AccountInterface,
    params: { collection: string; recipient: string; tokenUri?: string },
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("issue", [params.recipient, params.tokenUri ?? ""]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Destroys the caller's own credential; the address cannot receive another from this collection. */
  async burn(account: AccountInterface, params: { collection: string; tokenId: string | bigint }): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("burn", [BigInt(params.tokenId)]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
}

/** Whether `address` already holds this collection's credential (read from chain). */
export async function popHasClaimed(
  provider: Pick<ProviderInterface, "callContract">,
  collection: string,
  address: string,
): Promise<boolean> {
  const res = await provider.callContract({
    contractAddress: normalizeAddress("STARKNET", collection),
    entrypoint: "has_claimed",
    calldata: [normalizeAddress("STARKNET", address)],
  });
  return BigInt(res[0] ?? "0x0") !== 0n;
}
