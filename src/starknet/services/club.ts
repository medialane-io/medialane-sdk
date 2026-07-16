import { newContract } from "../marketplace/utils.js";
import { CairoOption, CairoOptionVariant, RpcProvider, cairo, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { normalizeAddress } from "../../utils/address.js";
import { IPClubCollectionABI, IPClubFactoryABI } from "../abis/index.js";
import { getStarknetCoordinates } from "../../chains.js";
import type { CreateMembershipParams, MintMembershipsParams } from "../../types/services.js";
import type { TxResult } from "../../types/marketplace.js";

export type { CreateMembershipParams, MintMembershipsParams };

export interface MembershipRecord {
  maxSupply: bigint;
  minted: bigint;
  startTime: number | null;
  endTime: number | null;
  royaltyBps: number;
  metadataUri: string;
}

export class ClubService {
  private readonly factoryAddress?: string;
  private readonly config: ResolvedConfig;

  constructor(config: ResolvedConfig) {
    this.config = config;
    this.factoryAddress = getStarknetCoordinates(config.chain).ipClubFactory;
  }

  private _factory(account: AccountInterface, factoryAddress?: string) {
    const address = factoryAddress ?? this.factoryAddress;
    if (!address) throw new Error("IP-Club factory address not configured for this chain");
    return newContract(IPClubFactoryABI as any, normalizeAddress("STARKNET", address), account as any);
  }

  private _collection(address: string, account: AccountInterface) {
    return newContract(IPClubCollectionABI as any, normalizeAddress("STARKNET", address), account as any);
  }

  private _collectionRead(address: string) {
    const provider = new RpcProvider({ nodeUrl: this.config.rpcUrl });
    return newContract(IPClubCollectionABI as any, normalizeAddress("STARKNET", address), provider);
  }

  /**
   * Deploys a new IPClubCollection via the factory. Caller becomes owner.
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

  /** Owner-only. Creates a new membership tier inside the caller's deployed collection. */
  async createMembership(account: AccountInterface, params: CreateMembershipParams): Promise<TxResult> {
    const startTime = params.startTime != null
      ? new CairoOption(CairoOptionVariant.Some, params.startTime)
      : new CairoOption(CairoOptionVariant.None);
    const endTime = params.endTime != null
      ? new CairoOption(CairoOptionVariant.Some, params.endTime)
      : new CairoOption(CairoOptionVariant.None);
    const call = this._collection(params.collection, account).populate("create_membership", [
      cairo.uint256(params.maxSupply),
      startTime,
      endTime,
      params.royaltyBps,
      params.metadataUri,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /**
   * Owner-only. Mints `amount` of `tokenId` to `to`. The validity window
   * gates membership, never minting — future-window tiers mint fine.
   */
  async mint(account: AccountInterface, params: MintMembershipsParams): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("mint", [
      params.to,
      cairo.uint256(params.tokenId),
      cairo.uint256(params.amount),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Read — true if holder holds any tier currently inside its validity window. */
  async isMember(params: { collection: string; holder: string }): Promise<boolean> {
    const result = await this._collectionRead(params.collection).call("is_member", [
      params.holder,
    ]);
    return Boolean(result);
  }

  /** Read — true if holder holds `tokenId` and the current time is inside its window. */
  async isMemberOf(params: { collection: string; tokenId: bigint | string; holder: string }): Promise<boolean> {
    const result = await this._collectionRead(params.collection).call("is_member_of", [
      cairo.uint256(params.tokenId),
      params.holder,
    ]);
    return Boolean(result);
  }

  /** Read — returns the Membership record for a token ID. */
  async getMembership(params: {
    collection: string;
    tokenId: bigint | string;
  }): Promise<MembershipRecord> {
    const m = await this._collectionRead(params.collection).call("get_membership", [
      cairo.uint256(params.tokenId),
    ]) as any;
    return {
      maxSupply: BigInt(m.max_supply),
      minted: BigInt(m.minted),
      startTime: m.start_time?.variant === "Some" ? Number(m.start_time.values[0] ?? m.start_time.value) : null,
      endTime: m.end_time?.variant === "Some" ? Number(m.end_time.values[0] ?? m.end_time.value) : null,
      royaltyBps: Number(m.royalty_bps),
      metadataUri: m.metadata_uri as string,
    };
  }
}
