import { newContract } from "../marketplace/utils.js";
import { CairoOption, CairoOptionVariant, RpcProvider, cairo, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { normalizeAddress } from "../../utils/address.js";
import { IPTicketCollectionABI, IPTicketCollectionFactoryABI } from "../abis/index.js";
import { getStarknetCoordinates } from "../../chains.js";
import type { CreateTicketParams, MintTicketsParams } from "../../types/services.js";
import type { TxResult } from "../../types/marketplace.js";

export type { CreateTicketParams, MintTicketsParams };

export interface TicketRecord {
  maxSupply: bigint;
  minted: bigint;
  startTime: number | null;
  endTime: number | null;
  royaltyBps: number;
  metadataUri: string;
}

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

  /**
   * Deploys a new IPTicketCollection via the factory. Caller becomes owner.
   * `baseUri` is the collection-level metadata URI, embedded on-chain in the
   * deploy transaction.
   */
  async deployCollection(
    account: AccountInterface,
    params: { name: string; symbol: string; baseUri: string; factoryAddress?: string }
  ): Promise<TxResult> {
    const call = this._factory(account, params.factoryAddress).populate("deploy_collection", [
      params.name,
      params.symbol,
      params.baseUri,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Owner-only. Creates a new ticket inside the caller's deployed collection. */
  async createTicket(account: AccountInterface, params: CreateTicketParams): Promise<TxResult> {
    const startTime = params.startTime != null
      ? new CairoOption(CairoOptionVariant.Some, params.startTime)
      : new CairoOption(CairoOptionVariant.None);
    const endTime = params.endTime != null
      ? new CairoOption(CairoOptionVariant.Some, params.endTime)
      : new CairoOption(CairoOptionVariant.None);
    const call = this._collection(params.collection, account).populate("create_ticket", [
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

  /** Read — true if holder has balance > 0 and current time is within the ticket window. */
  async isValid(params: { collection: string; tokenId: bigint | string; holder: string }): Promise<boolean> {
    const result = await this._collectionRead(params.collection).call("is_valid", [
      cairo.uint256(params.tokenId),
      params.holder,
    ]);
    return Boolean(result);
  }

  /** Read — number of tickets created so far (ids are sequential from 1). */
  async getTicketCount(params: { collection: string }): Promise<bigint> {
    const result = await this._collectionRead(params.collection).call("ticket_count", []);
    return BigInt(result as any);
  }

  /** Read — returns the Ticket record for a token ID. */
  async getTicket(params: {
    collection: string;
    tokenId: bigint | string;
  }): Promise<TicketRecord> {
    const t = await this._collectionRead(params.collection).call("get_ticket", [
      cairo.uint256(params.tokenId),
    ]) as any;
    return {
      maxSupply: BigInt(t.max_supply),
      minted: BigInt(t.minted),
      startTime: t.start_time?.variant === "Some" ? Number(t.start_time.values[0] ?? t.start_time.value) : null,
      endTime: t.end_time?.variant === "Some" ? Number(t.end_time.values[0] ?? t.end_time.value) : null,
      royaltyBps: Number(t.royalty_bps),
      metadataUri: t.metadata_uri as string,
    };
  }
}
