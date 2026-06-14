import { Contract, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../config.js";
import { normalizeAddress } from "../utils/address.js";
import { IPCollection1155FactoryABI, IPCollection1155ABI } from "../abis/index.js";
import { COLLECTION_1155_CONTRACT_MAINNET } from "../constants.js";
import type { TxResult } from "../types/marketplace.js";

export interface DeployCollectionParams {
  /** Human-readable collection name (e.g. "My IP Collection") */
  name: string;
  /** Short ticker symbol (e.g. "MIP") */
  symbol: string;
  /**
   * Collection-level metadata URI (e.g. "ipfs://Qm…/collection.json").
   * Should point to a JSON containing `name`, `description`, `image`, and `external_link`.
   * Stored on-chain at deploy time. Pass an empty string if not available.
   */
  baseUri: string;
}

export interface MintEditionParams {
  /** ERC-1155 collection contract address */
  collection: string;
  /** Recipient wallet address */
  to: string;
  /** Number of copies of this new edition to mint */
  value: bigint | string;
  /**
   * Metadata URI — must start with `ipfs://` or `ar://`.
   * Immutable: validated and stored at mint. The token id is assigned on-chain
   * (sequential from 1); read it from the `IPMinted` event of the returned tx.
   */
  tokenUri: string;
}

export interface BatchMintEditionParams {
  /** ERC-1155 collection contract address */
  collection: string;
  /** Recipient wallet address */
  to: string;
  /** New editions to create; ids are assigned sequentially on-chain. */
  items: Array<{
    value: bigint | string;
    tokenUri: string;
  }>;
}

export interface AddSupplyParams {
  /** ERC-1155 collection contract address */
  collection: string;
  /** Recipient wallet address */
  to: string;
  /** Existing edition id to mint more copies of (reverts if it doesn't exist) */
  tokenId: bigint | string;
  /** Number of additional copies */
  value: bigint | string;
}

export class ERC1155CollectionService {
  private readonly factoryAddress: string;

  constructor(config: ResolvedConfig) {
    this.factoryAddress = config.collection1155Contract ?? COLLECTION_1155_CONTRACT_MAINNET;
  }

  private _factory(account: AccountInterface) {
    return new Contract(
      IPCollection1155FactoryABI as any,
      normalizeAddress("STARKNET",this.factoryAddress),
      account as any
    );
  }

  private _collection(address: string, account: AccountInterface) {
    return new Contract(
      IPCollection1155ABI as any,
      normalizeAddress("STARKNET",address),
      account as any
    );
  }

  /**
   * Deploy a new ERC-1155 IP collection.
   * Caller becomes the collection owner and can mint items.
   * Returns the transaction hash; the deployed collection address is emitted
   * in the `CollectionDeployed` event of the factory.
   */
  async deployCollection(
    account: AccountInterface,
    params: DeployCollectionParams
  ): Promise<TxResult> {
    const factory = this._factory(account);
    const call = factory.populate("deploy_collection", [params.name, params.symbol, params.baseUri]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /**
   * Mint a new edition into an existing ERC-1155 collection.
   * Caller must be the collection owner. The token id is assigned on-chain
   * (sequential from 1) — read it from the `IPMinted` event of the returned tx.
   * The `tokenUri` is immutable.
   */
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

  /**
   * Batch-mint multiple new editions into an existing ERC-1155 collection.
   * All editions go to the same `to` address; ids are assigned sequentially
   * on-chain. Caller must be the collection owner.
   */
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

  /**
   * Mint additional copies of an EXISTING edition into an ERC-1155 collection.
   * Reverts on-chain if `tokenId` has never been minted. Provenance/URI unchanged.
   * Caller must be the collection owner.
   */
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

  /**
   * Set the default ERC-2981 royalty for the entire collection.
   * `feeNumerator` is out of 10 000 (e.g. 500 = 5%).
   * Caller must be the collection owner.
   */
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

  /**
   * Set a per-token ERC-2981 royalty override.
   * `feeNumerator` is out of 10 000. Caller must be the collection owner.
   */
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

  /**
   * Approve the Medialane1155 marketplace (or any operator) to transfer
   * all tokens on behalf of `account`. Required before listing.
   */
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
