import { Contract, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../config.js";
import { normalizeAddress } from "../utils/address.js";
import { POPCollectionABI, POPFactoryABI } from "../abis.js";
import type { PopEventType } from "../types/index.js";
import type { TxResult } from "../types/marketplace.js";

const POP_FACTORY_MAINNET = "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111";

export interface CreatePopCollectionParams {
  name: string;
  symbol: string;
  baseUri: string;
  claimEndTime: number;
  eventType: PopEventType;
}

export class PopService {
  private readonly factoryAddress: string;

  constructor(_config: ResolvedConfig) {
    this.factoryAddress = POP_FACTORY_MAINNET;
  }

  async claim(account: AccountInterface, collectionAddress: string): Promise<TxResult> {
    const collection = new Contract(POPCollectionABI as any, normalizeAddress(collectionAddress), account as any);
    const call = collection.populate("claim", []);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async adminMint(
    account: AccountInterface,
    params: { collection: string; recipient: string; customUri?: string }
  ): Promise<TxResult> {
    const collection = new Contract(POPCollectionABI as any, normalizeAddress(params.collection), account as any);
    const call = collection.populate("admin_mint", [
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
    const collection = new Contract(POPCollectionABI as any, normalizeAddress(params.collection), account as any);
    const call = collection.populate("add_to_allowlist", [params.address]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async batchAddToAllowlist(
    account: AccountInterface,
    params: { collection: string; addresses: string[] }
  ): Promise<TxResult> {
    const collection = new Contract(POPCollectionABI as any, normalizeAddress(params.collection), account as any);
    const CHUNK = 200;
    const calls = [];
    for (let i = 0; i < params.addresses.length; i += CHUNK) {
      const chunk = params.addresses.slice(i, i + CHUNK);
      calls.push(collection.populate("batch_add_to_allowlist", [chunk]));
    }
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }

  async removeFromAllowlist(
    account: AccountInterface,
    params: { collection: string; address: string }
  ): Promise<TxResult> {
    const collection = new Contract(POPCollectionABI as any, normalizeAddress(params.collection), account as any);
    const call = collection.populate("remove_from_allowlist", [params.address]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async setTokenUri(
    account: AccountInterface,
    params: { collection: string; tokenId: string | bigint; uri: string }
  ): Promise<TxResult> {
    const collection = new Contract(POPCollectionABI as any, normalizeAddress(params.collection), account as any);
    const call = collection.populate("set_token_uri", [BigInt(params.tokenId), params.uri]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async setPaused(
    account: AccountInterface,
    params: { collection: string; paused: boolean }
  ): Promise<TxResult> {
    const collection = new Contract(POPCollectionABI as any, normalizeAddress(params.collection), account as any);
    const call = collection.populate("set_paused", [params.paused]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async createCollection(
    account: AccountInterface,
    params: CreatePopCollectionParams
  ): Promise<TxResult> {
    const factory = new Contract(POPFactoryABI as any, this.factoryAddress, account as any);
    const eventTypeVariant = { [params.eventType]: {} };
    const call = factory.populate("create_collection", [
      params.name,
      params.symbol,
      params.baseUri,
      params.claimEndTime,
      eventTypeVariant,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
}
