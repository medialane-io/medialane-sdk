import type { PublicClient, WalletClient } from "viem";
import { parseEventLogs } from "viem";
import type { Chain } from "../chains.js";
import { getCoordinates, type EvmCoordinates } from "../chains.js";
import type { AdapterTxResult, CreateCollectionInput, IssuanceAdapter, MintInput } from "../adapters/types.js";
import { EvmMipCollectionABI, EvmMipRegistryABI } from "./abis.js";
import type { EvmChain } from "./venue.js";

export interface EvmIssuanceOptions {
  chain: EvmChain;
  publicClient: PublicClient;
  /** Defaults to the chain registry's MIP registry (populated at deploy). */
  registry?: `0x${string}`;
}

/** The Mediolano issuance adapter for EVM chains. */
export class EvmIssuance implements IssuanceAdapter<WalletClient> {
  readonly chain: Chain;
  private readonly registry: `0x${string}`;
  private readonly publicClient: PublicClient;

  constructor(opts: EvmIssuanceOptions) {
    this.chain = opts.chain;
    this.publicClient = opts.publicClient;
    const registry = opts.registry ?? maybeCoords(opts.chain)?.mipRegistry;
    if (!registry) throw new Error(`No MIP registry configured for ${opts.chain}`);
    this.registry = registry;
  }

  async createCollection(
    signer: WalletClient,
    params: CreateCollectionInput,
  ): Promise<AdapterTxResult & { collection: string }> {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: this.registry,
      abi: EvmMipRegistryABI,
      functionName: "createCollection",
      args: [params.name, params.symbol, params.baseUri, BigInt(params.royaltyBps)],
    });
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    const [created] = parseEventLogs({
      abi: EvmMipRegistryABI,
      eventName: "CollectionCreated",
      logs: receipt.logs,
    });
    return { txHash, collection: created?.args.collection ?? "" };
  }

  async mint(signer: WalletClient, params: MintInput): Promise<AdapterTxResult & { tokenId: string }> {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: params.collection as `0x${string}`,
      abi: EvmMipCollectionABI,
      functionName: "mint",
      args: [params.recipient as `0x${string}`, params.tokenUri],
    });
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    const [minted] = parseEventLogs({
      abi: EvmMipCollectionABI,
      eventName: "TokenMinted",
      logs: receipt.logs,
    });
    return { txHash, tokenId: (minted?.args.tokenId ?? 0n).toString() };
  }

  async batchMint(
    signer: WalletClient,
    params: { collection: string; recipients: string[]; tokenUris: string[] },
  ): Promise<AdapterTxResult> {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: params.collection as `0x${string}`,
      abi: EvmMipCollectionABI,
      functionName: "batchMint",
      args: [params.recipients as `0x${string}`[], params.tokenUris],
    });
    return { txHash };
  }
}

function maybeCoords(chain: EvmChain): EvmCoordinates | undefined {
  try {
    return getCoordinates(chain);
  } catch {
    return undefined;
  }
}
