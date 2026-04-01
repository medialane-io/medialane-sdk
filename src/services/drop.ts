import { Contract, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../config.js";
import { normalizeAddress } from "../utils/address.js";
import { DropCollectionABI, DropFactoryABI } from "../abis.js";
import { DROP_FACTORY_CONTRACT_MAINNET } from "../constants.js";
import type { ClaimConditions, CreateDropParams } from "../types/services.js";
import type { TxResult } from "../types/marketplace.js";

export type { ClaimConditions, CreateDropParams };

function toContractConditions(c: ClaimConditions) {
  return {
    start_time: c.startTime,
    end_time: c.endTime,
    price: BigInt(c.price),
    payment_token: c.paymentToken,
    max_quantity_per_wallet: BigInt(c.maxQuantityPerWallet),
  };
}

export class DropService {
  private readonly factoryAddress: string;

  constructor(_config: ResolvedConfig) {
    this.factoryAddress = DROP_FACTORY_CONTRACT_MAINNET;
  }

  private _collection(address: string, account: AccountInterface) {
    return new Contract(DropCollectionABI as any, normalizeAddress(address), account as any);
  }

  async claim(
    account: AccountInterface,
    collectionAddress: string,
    quantity: bigint | string | number = 1
  ): Promise<TxResult> {
    const call = this._collection(collectionAddress, account).populate("claim", [BigInt(quantity)]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async adminMint(
    account: AccountInterface,
    params: { collection: string; recipient: string; quantity?: bigint | string | number; customUri?: string }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("admin_mint", [
      params.recipient,
      BigInt(params.quantity ?? 1),
      params.customUri ?? "",
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async setClaimConditions(
    account: AccountInterface,
    params: { collection: string; conditions: ClaimConditions }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("set_claim_conditions", [
      toContractConditions(params.conditions),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async setAllowlistEnabled(
    account: AccountInterface,
    params: { collection: string; enabled: boolean }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("set_allowlist_enabled", [params.enabled]);
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

  async setPaused(
    account: AccountInterface,
    params: { collection: string; paused: boolean }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("set_paused", [params.paused]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async withdrawPayments(
    account: AccountInterface,
    params: { collection: string }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("withdraw_payments", []);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async createDrop(account: AccountInterface, params: CreateDropParams): Promise<TxResult> {
    const factory = new Contract(DropFactoryABI as any, this.factoryAddress, account as any);
    const call = factory.populate("create_drop", [
      params.name,
      params.symbol,
      params.baseUri,
      BigInt(params.maxSupply),
      toContractConditions(params.initialConditions),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
}
