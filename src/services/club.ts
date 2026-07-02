import { CairoOption, CairoOptionVariant, Contract, cairo, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../config.js";
import { normalizeAddress } from "../utils/address.js";
import { IPClubABI } from "../abis/index.js";
import { getCoordinates } from "../chains.js";
import type { CreateClubParams } from "../types/services.js";
import type { TxResult } from "../types/marketplace.js";

export type { CreateClubParams };

export class ClubService {
  private readonly registryAddress?: string;

  constructor(config: ResolvedConfig) {
    this.registryAddress = getCoordinates(config.chain).ipClubRegistry;
  }

  private _registry(account: AccountInterface, registryAddress?: string) {
    const address = registryAddress ?? this.registryAddress;
    if (!address) {
      throw new Error("IP-Club registry address not configured for this chain");
    }
    return new Contract(IPClubABI as any, normalizeAddress("STARKNET", address), account as any);
  }

  /** Permissionless — anyone may create a club. The registry deploys its own membership NFT internally. */
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

  /** Reversible — gates new joins only; existing members are never affected. */
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

  /** Prepends an ERC-20 approve when the club has an entry fee. */
  async joinClub(
    account: AccountInterface,
    params: { clubId: bigint | string; entryFee?: bigint | string; paymentToken?: string; registryAddress?: string }
  ): Promise<TxResult> {
    const registryAddress = params.registryAddress ?? this.registryAddress;
    if (!registryAddress) {
      throw new Error("IP-Club registry address not configured for this chain");
    }
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

  /** Always allowed, open or closed. No fee refund. Burns the caller's membership NFT. */
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
