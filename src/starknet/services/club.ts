import { newContract } from "../marketplace/utils.js";
import { CairoOption, CairoOptionVariant, cairo, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { normalizeAddress } from "../../utils/address.js";
import { IPClubABI, IPClubFactoryABI, IPClubCollectionABI } from "../abis/index.js";
import { getStarknetCoordinates } from "../../chains.js";
import type { CreateClubParams, DeployClubParams } from "../../types/services.js";
import type { TxResult } from "../../types/marketplace.js";

export type { CreateClubParams, DeployClubParams };

export class ClubService {
  private readonly registryAddress?: string;
  private readonly factoryAddress?: string;

  constructor(config: ResolvedConfig) {
    const coords = getStarknetCoordinates(config.chain);
    this.registryAddress = coords.ipClubRegistry;
    this.factoryAddress = coords.ipClubFactory;
  }

  private _registry(account: AccountInterface, registryAddress?: string) {
    const address = registryAddress ?? this.registryAddress;
    if (!address) throw new Error("IP-Club registry address not configured for this chain");
    return newContract(IPClubABI as any, normalizeAddress("STARKNET", address), account as any);
  }

  private _factory(account: AccountInterface, factoryAddress?: string) {
    const address = factoryAddress ?? this.factoryAddress;
    if (!address) throw new Error("IP-Club factory address not configured for this chain");
    return newContract(IPClubFactoryABI as any, normalizeAddress("STARKNET", address), account as any);
  }

  private _collection(account: AccountInterface, collectionAddress: string) {
    return newContract(IPClubCollectionABI as any, normalizeAddress("STARKNET", collectionAddress), account as any);
  }

  /** Deploy a new per-creator membership ERC-721 collection via the factory. */
  async deployClub(
    account: AccountInterface,
    params: DeployClubParams
  ): Promise<TxResult> {
    const maxSupply = cairo.uint256(params.maxSupply ?? 0xffffffffffffffffn);
    const entryFee = cairo.uint256(params.entryFee ?? 0n);
    const paymentToken = params.paymentToken
      ? new CairoOption(CairoOptionVariant.Some, params.paymentToken)
      : new CairoOption(CairoOptionVariant.None);
    const royaltyBps = cairo.uint256(params.royaltyBps ?? 0n);
    const call = this._factory(account, params.factoryAddress).populate("deploy_club", [
      params.name,
      params.symbol,
      params.baseUri,
      maxSupply,
      entryFee,
      paymentToken,
      royaltyBps,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Owner-only — pause or resume new mints on a club collection. */
  async setOpen(
    account: AccountInterface,
    params: { collectionAddress: string; open: boolean }
  ): Promise<TxResult> {
    const call = this._collection(account, params.collectionAddress).populate("set_open", [params.open]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** Public mint — caller pays entry fee (if any) and receives the membership NFT. */
  async mintMembership(
    account: AccountInterface,
    params: { collectionAddress: string; to?: string; entryFee?: bigint | string; paymentToken?: string }
  ): Promise<TxResult> {
    const calls = [];
    if (params.entryFee && params.paymentToken && BigInt(params.entryFee) > 0n) {
      const amount = cairo.uint256(params.entryFee);
      calls.push({
        contractAddress: params.paymentToken,
        entrypoint: "approve",
        calldata: [
          normalizeAddress("STARKNET", params.collectionAddress),
          amount.low.toString(),
          amount.high.toString(),
        ],
      });
    }
    calls.push(
      this._collection(account, params.collectionAddress).populate("mint", [
        params.to ?? account.address,
      ])
    );
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }

  // ── Legacy registry methods (retained for backward compatibility) ──────────────

  /** @deprecated Use deployClub — the factory pattern replaced the registry. */
  async createClub(
    account: AccountInterface,
    params: CreateClubParams & { registryAddress?: string }
  ): Promise<TxResult> {
    const maxMembers = params.maxMembers != null
      ? new CairoOption(CairoOptionVariant.Some, params.maxMembers)
      : new CairoOption(CairoOptionVariant.None);
    const entryFee = params.entryFee != null
      ? new CairoOption(CairoOptionVariant.Some, cairo.uint256(params.entryFee))
      : new CairoOption(CairoOptionVariant.None);
    const paymentToken = params.paymentToken
      ? new CairoOption(CairoOptionVariant.Some, params.paymentToken)
      : new CairoOption(CairoOptionVariant.None);
    const call = this._registry(account, params.registryAddress).populate("create_club", [
      params.name,
      params.symbol,
      params.metadataUri,
      maxMembers,
      entryFee,
      paymentToken,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** @deprecated Legacy registry — use factory-deployed collection methods. */
  async setClubOpen(
    account: AccountInterface,
    params: { clubId: bigint | string; open: boolean; registryAddress?: string }
  ): Promise<TxResult> {
    const call = this._registry(account, params.registryAddress).populate("set_club_open", [
      cairo.uint256(params.clubId),
      params.open,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /** @deprecated Legacy registry — use mintMembership with factory-deployed collections. */
  async joinClub(
    account: AccountInterface,
    params: { clubId: bigint | string; entryFee?: bigint | string; paymentToken?: string; registryAddress?: string }
  ): Promise<TxResult> {
    const registryAddress = params.registryAddress ?? this.registryAddress;
    if (!registryAddress) throw new Error("IP-Club registry address not configured for this chain");
    const calls = [];
    if (params.paymentToken && params.entryFee && BigInt(params.entryFee) > 0n) {
      const amount = cairo.uint256(params.entryFee);
      calls.push({
        contractAddress: params.paymentToken,
        entrypoint: "approve",
        calldata: [normalizeAddress("STARKNET", registryAddress), amount.low.toString(), amount.high.toString()],
      });
    }
    calls.push(this._registry(account, registryAddress).populate("join_club", [cairo.uint256(params.clubId)]));
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }

  /** @deprecated Legacy registry — use factory-deployed collection burn. */
  async leaveClub(
    account: AccountInterface,
    params: { clubId: bigint | string; tokenId: bigint | string; registryAddress?: string }
  ): Promise<TxResult> {
    const call = this._registry(account, params.registryAddress).populate("leave_club", [
      cairo.uint256(params.clubId),
      cairo.uint256(params.tokenId),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
}
