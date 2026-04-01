import { Contract, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../config.js";
import { normalizeAddress } from "../utils/address.js";
import { POPCollectionABI, POPFactoryABI } from "../abis.js";
import { POP_FACTORY_CONTRACT_MAINNET } from "../constants.js";
import type { CreatePopCollectionParams } from "../types/services.js";
import type { TxResult } from "../types/marketplace.js";

export type { CreatePopCollectionParams };

export class PopService {
  private readonly factoryAddress: string;

  constructor(_config: ResolvedConfig) {
    this.factoryAddress = POP_FACTORY_CONTRACT_MAINNET;
  }

  private _collection(address: string, account: AccountInterface) {
    return new Contract(POPCollectionABI as any, normalizeAddress(address), account as any);
  }

  async claim(account: AccountInterface, collectionAddress: string): Promise<TxResult> {
    const call = this._collection(collectionAddress, account).populate("claim", []);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async adminMint(
    account: AccountInterface,
    params: { collection: string; recipient: string; customUri?: string }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("admin_mint", [
      params.recipient,
      params.customUri ?? "",
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async addToAllowlist(
    account: AccountInterface,
    params: { collection: string; address: string }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("add_to_allowlist", [params.address]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async batchAddToAllowlist(
    account: AccountInterface,
    params: { collection: string; addresses: string[] }
  ): Promise<TxResult> {
    const collection = this._collection(params.collection, account);
    const CHUNK = 200;
    const calls = [];
    for (let i = 0; i < params.addresses.length; i += CHUNK) {
      calls.push(collection.populate("batch_add_to_allowlist", [params.addresses.slice(i, i + CHUNK)]));
    }
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }

  async removeFromAllowlist(
    account: AccountInterface,
    params: { collection: string; address: string }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("remove_from_allowlist", [params.address]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async setTokenUri(
    account: AccountInterface,
    params: { collection: string; tokenId: string | bigint; uri: string }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("set_token_uri", [
      BigInt(params.tokenId),
      params.uri,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async setPaused(
    account: AccountInterface,
    params: { collection: string; paused: boolean }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("set_paused", [params.paused]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async createCollection(
    account: AccountInterface,
    params: CreatePopCollectionParams
  ): Promise<TxResult> {
    const factory = new Contract(POPFactoryABI as any, this.factoryAddress, account as any);
    const call = factory.populate("create_collection", [
      params.name,
      params.symbol,
      params.baseUri,
      params.claimEndTime,
      { [params.eventType]: {} },
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
}
