import { CairoOption, CairoOptionVariant, Contract, cairo, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../config.js";
import { normalizeAddress } from "../utils/address.js";
import { IPTicketCollectionABI, IPTicketCollectionFactoryABI } from "../abis/index.js";
import { getCoordinates } from "../chains.js";
import type { CreateTicketCollectionParams } from "../types/services.js";
import type { TxResult } from "../types/marketplace.js";

export type { CreateTicketCollectionParams };

export class TicketService {
  private readonly factoryAddress?: string;

  constructor(config: ResolvedConfig) {
    this.factoryAddress = getCoordinates(config.chain).ipTicketsFactory;
  }

  private _collection(address: string, account: AccountInterface) {
    return new Contract(IPTicketCollectionABI as any, normalizeAddress("STARKNET", address), account as any);
  }

  /** Deploys a new IPTicketCollection via the factory. Caller becomes its owner. */
  async deployTicketCollection(
    account: AccountInterface,
    params: { name: string; symbol: string; factoryAddress?: string }
  ): Promise<TxResult> {
    const factoryAddress = params.factoryAddress ?? this.factoryAddress;
    if (!factoryAddress) {
      throw new Error("IP-Tickets factory address not configured for this chain");
    }
    const factory = new Contract(IPTicketCollectionFactoryABI as any, factoryAddress, account as any);
    const call = factory.populate("deploy_ticket_collection", [params.name, params.symbol]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Owner-only. Creates a new ticket collection (event/tier) inside the caller's deployed IPTicketCollection. */
  async createTicketCollection(
    account: AccountInterface,
    params: CreateTicketCollectionParams
  ): Promise<TxResult> {
    const paymentToken = params.paymentToken
      ? new CairoOption(CairoOptionVariant.Some, params.paymentToken)
      : new CairoOption(CairoOptionVariant.None);
    const call = this._collection(params.collection, account).populate("create_ticket_collection", [
      cairo.uint256(params.price),
      cairo.uint256(params.maxSupply),
      params.expiration,
      params.royaltyBps,
      paymentToken,
      params.metadataUri,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Owner-only. Gates minting only — existing tickets keep access/transfer/redeem. */
  async setCollectionActive(
    account: AccountInterface,
    params: { collection: string; collectionId: bigint | string; active: boolean }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("set_collection_active", [
      cairo.uint256(params.collectionId),
      params.active,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Mints a ticket. Prepends an ERC-20 approve when the collection is paid. */
  async mintTicket(
    account: AccountInterface,
    params: { collection: string; collectionId: bigint | string; paymentToken?: string; price?: bigint | string }
  ): Promise<TxResult> {
    const calls = [];
    if (params.paymentToken && params.price && BigInt(params.price) > 0n) {
      const amount = cairo.uint256(params.price);
      calls.push({
        contractAddress: params.paymentToken,
        entrypoint: "approve",
        calldata: [normalizeAddress("STARKNET", params.collection), amount.low.toString(), amount.high.toString()],
      });
    }
    calls.push(this._collection(params.collection, account).populate("mint_ticket", [cairo.uint256(params.collectionId)]));
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }

  /** Only the current token owner may redeem. */
  async redeemTicket(
    account: AccountInterface,
    params: { collection: string; tokenId: bigint | string }
  ): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("redeem_ticket", [cairo.uint256(params.tokenId)]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
}
