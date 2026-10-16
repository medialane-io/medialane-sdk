import { newContract } from "../marketplace/utils.js";
import { CairoOption, CairoOptionVariant, cairo, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { normalizeAddress } from "../../utils/address.js";
import { IPClubCollectionABI, IPClubFactoryABI } from "../abis/index.js";
import { getStarknetCoordinates } from "../../chains.js";
import type { CreateMembershipParams, MintMembershipsParams } from "../../types/services.js";
import type { TxResult } from "../../types/marketplace.js";

export type { CreateMembershipParams, MintMembershipsParams };

export class ClubService {
  private readonly factoryAddress?: string;

  constructor(config: ResolvedConfig) {
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

  async mint(account: AccountInterface, params: MintMembershipsParams): Promise<TxResult> {
    const call = this._collection(params.collection, account).populate("mint", [
      params.to,
      cairo.uint256(params.tokenId),
      cairo.uint256(params.amount),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
}
