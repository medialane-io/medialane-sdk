import type { PublicClient, WalletClient } from "viem";
import type { Chain } from "../chains.js";
import { getCoordinates, type EvmCoordinates } from "../chains.js";
import type {
  AdapterTxResult,
  OrderRef,
  RegisterOrderParams,
  VenueAdapter,
} from "../adapters/types.js";
import { EvmVenueABI, EvmVenue1155ABI } from "./abis.js";
import {
  EVM_ORDER_TYPES,
  evmOrderDigest,
  evmOrderDomain,
  type EvmOrderParameters,
} from "./typedData.js";

export type EvmChain = "ETHEREUM" | "BASE";

export interface EvmVenueOptions {
  chain: EvmChain;
  chainId: number;
  publicClient: PublicClient;
  /** "721" (unique assets) or "1155" (partial fills). */
  variant: "721" | "1155";
  /** Defaults to the chain registry's venue address (populated at deploy). */
  contract?: `0x${string}`;
}

/** The Medialane venue adapter for EVM chains — one implementation serves
 *  Ethereum and Base (same bytecode; the EIP-712 domain separates them). */
export class EvmVenue implements VenueAdapter<WalletClient> {
  readonly chain: Chain;
  private readonly chainId: number;
  private readonly contract: `0x${string}`;
  private readonly publicClient: PublicClient;
  private readonly variant: "721" | "1155";

  constructor(opts: EvmVenueOptions) {
    this.chain = opts.chain;
    this.chainId = opts.chainId;
    this.publicClient = opts.publicClient;
    this.variant = opts.variant;
    const coords = maybeCoords(opts.chain);
    const contract =
      opts.contract ?? (opts.variant === "721" ? coords?.marketplace721 : coords?.marketplace1155);
    if (!contract) throw new Error(`No ${opts.variant} venue configured for ${opts.chain}`);
    this.contract = contract;
  }

  /** Builds the order struct, signs the EIP-712 digest, and registers it.
   *  The digest is the canonical order id on EVM chains. */
  async registerOrder(
    signer: WalletClient,
    params: RegisterOrderParams,
  ): Promise<AdapterTxResult & { orderRef: OrderRef }> {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const counter = await this.getCounter(account.address);
    const nft = {
      itemType: 2 as const,
      token: params.asset.contract as `0x${string}`,
      identifier: BigInt(params.asset.tokenId),
      amount: 1n,
    };
    const payment = {
      itemType: (params.paymentToken === NATIVE_SENTINEL ? 0 : 1) as 0 | 1,
      token: (params.paymentToken === NATIVE_SENTINEL
        ? "0x0000000000000000000000000000000000000000"
        : params.paymentToken) as `0x${string}`,
      identifier: 0n,
      amount: BigInt(params.amount),
    };
    const order: EvmOrderParameters =
      params.side === "listing"
        ? {
            offerer: account.address,
            offer: nft,
            consideration: { ...payment, recipient: account.address },
            ...commonFields(params),
          }
        : {
            offerer: account.address,
            offer: payment,
            consideration: { ...nft, recipient: account.address },
            ...commonFields(params),
          };
    order.counter = counter;

    const signature = await signer.signTypedData({
      account,
      domain: evmOrderDomain(this.chainId, this.contract),
      types: EVM_ORDER_TYPES,
      primaryType: "OrderParameters",
      message: order,
    });
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: this.contract,
      abi: EvmVenueABI,
      functionName: "registerOrder",
      args: [order, signature],
    });
    return { txHash, orderRef: evmOrderDigest(this.chainId, this.contract, order) };
  }

  async fulfillOrder(
    signer: WalletClient,
    orderRef: OrderRef,
    opts?: { quantity?: string; value?: string },
  ): Promise<AdapterTxResult> {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const value = opts?.value ? BigInt(opts.value) : undefined;
    const txHash =
      this.variant === "1155"
        ? await signer.writeContract({
            account,
            chain: signer.chain,
            address: this.contract,
            abi: EvmVenue1155ABI,
            functionName: "fulfillOrder",
            args: [orderRef as `0x${string}`, BigInt(opts?.quantity ?? "1")],
            value,
          })
        : await signer.writeContract({
            account,
            chain: signer.chain,
            address: this.contract,
            abi: EvmVenueABI,
            functionName: "fulfillOrder",
            args: [orderRef as `0x${string}`],
            value,
          });
    return { txHash };
  }

  async cancelOrder(signer: WalletClient, orderRef: OrderRef): Promise<AdapterTxResult> {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: this.contract,
      abi: EvmVenueABI,
      functionName: "cancelOrder",
      args: [orderRef as `0x${string}`],
    });
    return { txHash };
  }

  async incrementCounter(signer: WalletClient): Promise<AdapterTxResult> {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: this.contract,
      abi: EvmVenueABI,
      functionName: "incrementCounter",
      args: [],
    });
    return { txHash };
  }

  async getOrderDetails(orderRef: OrderRef): Promise<unknown> {
    return this.publicClient.readContract({
      address: this.contract,
      abi: [
        {
          type: "function",
          name: "getOrderDetails",
          stateMutability: "view",
          inputs: [{ name: "orderHash", type: "bytes32" }],
          outputs: [{ name: "", type: "bytes" }],
        },
      ] as const,
      functionName: "getOrderDetails",
      args: [orderRef as `0x${string}`],
    });
  }

  async getCounter(address: string): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.contract,
      abi: EvmVenueABI,
      functionName: "getCounter",
      args: [address as `0x${string}`],
    });
  }
}

/** Payment-token sentinel for native ETH (spec §3.2b currency encoding). */
export const NATIVE_SENTINEL = "native";

function commonFields(params: RegisterOrderParams) {
  return {
    royaltyMaxBps: BigInt(params.royaltyMaxBps),
    startTime: BigInt(params.startTime),
    endTime: BigInt(params.endTime),
    salt: BigInt(params.salt),
    counter: 0n,
  };
}

function maybeCoords(chain: EvmChain): EvmCoordinates | undefined {
  try {
    return getCoordinates(chain);
  } catch {
    return undefined;
  }
}
