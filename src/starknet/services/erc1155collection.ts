import { newContract } from "../marketplace/utils.js";
import { type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { normalizeAddress } from "../../utils/address.js";
import { IPCollection1155FactoryABI, IPCollection1155ABI } from "../abis/index.js";
import { getStarknetCoordinates } from "../../chains.js";
import type { TxResult } from "../../types/marketplace.js";

export interface DeployCollectionParams {

  name: string;

  symbol: string;

  baseUri: string;
}

export interface MintEditionParams {

  collection: string;

  to: string;

  value: bigint | string;

  tokenUri: string;
}

export interface BatchMintEditionParams {

  collection: string;

  to: string;

  items: Array<{
    value: bigint | string;
    tokenUri: string;
  }>;
}

export interface AddSupplyParams {

  collection: string;

  to: string;

  tokenId: bigint | string;

  value: bigint | string;
}

export class ERC1155CollectionService {
  private readonly factoryAddress: string;

  constructor(config: ResolvedConfig) {
    this.factoryAddress = config.collection1155Contract ?? getStarknetCoordinates(config.chain).collection1155!;
  }

  private _factory(account: AccountInterface) {
    return newContract(
      IPCollection1155FactoryABI as any,
      normalizeAddress("STARKNET",this.factoryAddress),
      account as any
    );
  }

  private _collection(address: string, account: AccountInterface) {
    return newContract(
      IPCollection1155ABI as any,
      normalizeAddress("STARKNET",address),
      account as any
    );
  }

  async deployCollection(
    account: AccountInterface,
    params: DeployCollectionParams
  ): Promise<TxResult> {
    const factory = this._factory(account);
    const call = factory.populate("deploy_collection", [params.name, params.symbol, params.baseUri]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async mintEdition(
    account: AccountInterface,
    params: MintEditionParams
  ): Promise<TxResult> {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("mint_edition", [
      params.to,
      BigInt(params.value),
      params.tokenUri,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async batchMintEdition(
    account: AccountInterface,
    params: BatchMintEditionParams
  ): Promise<TxResult> {
    const collection = this._collection(params.collection, account);
    const values = params.items.map((i) => BigInt(i.value));
    const tokenUris = params.items.map((i) => i.tokenUri);
    const call = collection.populate("batch_mint_edition", [
      params.to,
      values,
      tokenUris,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async addSupply(
    account: AccountInterface,
    params: AddSupplyParams
  ): Promise<TxResult> {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("add_supply", [
      params.to,
      BigInt(params.tokenId),
      BigInt(params.value),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async setDefaultRoyalty(
    account: AccountInterface,
    params: { collection: string; receiver: string; feeNumerator: number }
  ): Promise<TxResult> {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("set_default_royalty", [
      params.receiver,
      BigInt(params.feeNumerator),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async setTokenRoyalty(
    account: AccountInterface,
    params: { collection: string; tokenId: bigint | string; receiver: string; feeNumerator: number }
  ): Promise<TxResult> {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("set_token_royalty", [
      BigInt(params.tokenId),
      params.receiver,
      BigInt(params.feeNumerator),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async setApprovalForAll(
    account: AccountInterface,
    params: { collection: string; operator: string; approved: boolean }
  ): Promise<TxResult> {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("set_approval_for_all", [
      params.operator,
      params.approved,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
}
