import { newContract } from "../marketplace/utils.js";
import { CairoOption, CairoOptionVariant, RpcProvider, cairo, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { normalizeAddress } from "../../utils/address.js";
import { IPTicketCollectionABI, IPTicketCollectionFactoryABI } from "../abis/index.js";
import { getStarknetCoordinates } from "../../chains.js";
import type { CreateEventParams, MintTicketsParams } from "../../types/services.js";
import type { TxResult } from "../../types/marketplace.js";

export type { CreateEventParams, MintTicketsParams };

export class TicketService {
  private readonly factoryAddress?: string;
  private readonly config: ResolvedConfig;

  constructor(config: ResolvedConfig) {
    this.config = config;
    this.factoryAddress = getStarknetCoordinates(config.chain).ipTicketsFactory;
  }

  private _factory(account: AccountInterface, factoryAddress?: string) {
    const address = factoryAddress ?? this.factoryAddress;
    if (!address) throw new Error("IP-Tickets factory address not configured for this chain");
    return newContract(IPTicketCollectionFactoryABI as any, normalizeAddress("STARKNET", address), account as any);
  }

  private _collection(address: string, account: AccountInterface) {
    return newContract(IPTicketCollectionABI as any, normalizeAddress("STARKNET", address), account as any);
  }

  private _collectionRead(address: string) {
    const provider = new RpcProvider({ nodeUrl: this.config.rpcUrl });
    return newContract(IPTicketCollectionABI as any, normalizeAddress("STARKNET", address), provider);
  }

  /** Deploys a new IPTicketCollection via the factory. Caller becomes owner. */
  async deployCollection(
    account: AccountInterface,
    params: { name: string; symbol: string; factoryAddress?: string }
  ): Promise<TxResult> {
    const call = this._factory(account, params.factoryAddress).populate("deploy_collection", [params.name, params.symbol]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Owner-only. Creates a new event inside the caller's deployed collection. */
  async createEvent(account: AccountInterface, params: CreateEventParams): Promise<TxResult> {
    const startTime = params.startTime != null
      ? new CairoOption(CairoOptionVariant.Some, params.startTime)
      : new CairoOption(CairoOptionVariant.None);
    const endTime = params.endTime != null
      ? new CairoOption(CairoOptionVariant.Some, params.endTime)
      : new CairoOption(CairoOptionVariant.None);
    const call = this._collection(params.collection, account).populate("create_event", [
      cairo.uint256(params.maxSupply),
      startTime,
      endTime,
      params.royaltyBps,
      params.metadataUri,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Owner-only. Mints `amount` of `tokenId` to `to`. */
  async mint(account: AccountInterface, params: MintTicketsParams): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("mint", [
      params.to,
      cairo.uint256(params.tokenId),
      cairo.uint256(params.amount),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Owner-only. Pauses or resumes minting for one event. */
  async pauseEvent(
    account: AccountInterface,
    params: { collection: string; tokenId: bigint | string; active: boolean }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("pause_event", [
      cairo.uint256(params.tokenId),
      params.active,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Read — true if holder has balance > 0 and current time is within the event window. */
  async isValid(params: { collection: string; tokenId: bigint | string; holder: string }): Promise<boolean> {
    const result = await this._collectionRead(params.collection).call("is_valid", [
      cairo.uint256(params.tokenId),
      params.holder,
    ]);
    return Boolean(result);
  }

  /** Read — returns the EventRecord for a token ID. */
  async getEvent(params: {
    collection: string;
    tokenId: bigint | string;
  }): Promise<{
    creator: string;
    maxSupply: bigint;
    minted: bigint;
    startTime: number | null;
    endTime: number | null;
    royaltyBps: number;
    metadataUri: string;
    active: boolean;
  }> {
    const ev = await this._collectionRead(params.collection).call("get_event", [
      cairo.uint256(params.tokenId),
    ]) as any;
    return {
      creator: ev.creator as string,
      maxSupply: BigInt(ev.max_supply),
      minted: BigInt(ev.minted),
      startTime: ev.start_time?.variant === "Some" ? Number(ev.start_time.values[0] ?? ev.start_time.value) : null,
      endTime: ev.end_time?.variant === "Some" ? Number(ev.end_time.values[0] ?? ev.end_time.value) : null,
      royaltyBps: Number(ev.royalty_bps),
      metadataUri: ev.metadata_uri as string,
      active: Boolean(ev.active),
    };
  }
}
