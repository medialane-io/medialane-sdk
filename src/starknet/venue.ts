import { hash, num, type AccountInterface, type ProviderInterface } from "starknet";
import type {
  VenueAdapter,
  RegisterOrderParams,
  OrderRef,
  AdapterTxResult,
} from "../adapters/types.js";
import type { ResolvedConfig } from "../config.js";
import { formatAmount } from "../utils/token.js";
import { MarketplaceModule } from "./marketplace/index.js";
import { Medialane1155Module } from "./marketplace1155/index.js";
import { resolveToken } from "./marketplace/utils.js";

/** Default listing duration when the caller specifies no expiry (endTime 0). */
const NO_EXPIRY_SECONDS = 100 * 365 * 24 * 3600;

/** What a stored/registered order resolves to for fulfilment/cancellation. */
export interface ResolvedOrder {
  /** ERC-20 consideration token address. */
  paymentToken: string;
  /** Total price in raw token units, as a decimal string. */
  totalPrice: string;
  /** Which venue the order lives on. */
  standard: "ERC721" | "ERC1155";
}

/**
 * Dependencies for {@link StarknetVenue}. The token standard is resolved through
 * injected reads (the backend already tracks it per collection) rather than an
 * on-chain interface probe — Starknet has no single canonical ERC-1155 interface
 * id and the app already carries the standard from the indexer.
 */
export interface StarknetVenueDeps {
  config: ResolvedConfig;
  provider: ProviderInterface;
  /** Resolve a registered order (payment token, total, venue) from its digest. */
  resolveOrder: (orderRef: OrderRef) => Promise<ResolvedOrder>;
  /** Resolve a collection's token standard (from the indexer). */
  resolveStandard: (contract: string) => Promise<"ERC721" | "ERC1155">;
}

/**
 * First-class Starknet venue adapter. Wraps the maintained `MarketplaceModule`
 * (721) and `Medialane1155Module` (1155) — it does not reimplement SNIP-12
 * signing or calldata. `Signer` is a starknet.js `AccountInterface`.
 */
export class StarknetVenue implements VenueAdapter<AccountInterface> {
  readonly chain = "STARKNET" as const;
  private readonly m721: MarketplaceModule;
  private readonly m1155: Medialane1155Module;

  constructor(private readonly deps: StarknetVenueDeps) {
    this.m721 = new MarketplaceModule(deps.config);
    this.m1155 = new Medialane1155Module(deps.config);
  }

  incrementCounter(signer: AccountInterface): Promise<AdapterTxResult> {
    return this.m721.incrementCounter(signer);
  }

  getOrderDetails(orderRef: OrderRef): Promise<unknown> {
    return this.m721.getOrderDetails(orderRef);
  }

  getCounter(address: string): Promise<bigint> {
    return this.m721.getCounter(address);
  }

  async fulfillOrder(
    signer: AccountInterface,
    orderRef: OrderRef,
    opts?: { quantity?: string } & Record<string, string | undefined>,
  ): Promise<AdapterTxResult> {
    const o = await this.deps.resolveOrder(orderRef);
    if (o.standard === "ERC1155") {
      return this.m1155.fulfillOrder(signer, {
        orderHash: orderRef,
        paymentToken: o.paymentToken,
        totalPrice: o.totalPrice,
        quantity: opts?.quantity ?? "1",
      });
    }
    return this.m721.fulfillOrder(signer, {
      orderHash: orderRef,
      paymentToken: o.paymentToken,
      totalPrice: o.totalPrice,
    });
  }

  async cancelOrder(signer: AccountInterface, orderRef: OrderRef): Promise<AdapterTxResult> {
    const o = await this.deps.resolveOrder(orderRef);
    if (o.standard === "ERC1155") {
      return this.m1155.cancelOrder(signer, { orderHash: orderRef });
    }
    return this.m721.cancelOrder(signer, { orderHash: orderRef });
  }

  async registerOrder(
    signer: AccountInterface,
    p: RegisterOrderParams,
  ): Promise<AdapterTxResult & { orderRef: OrderRef }> {
    const standard = await this.deps.resolveStandard(p.asset.contract);
    // Raw per-unit amount → human price, using the same token resolution the
    // legacy module uses (accepts symbol OR address) so decimals match exactly.
    const token = resolveToken(p.paymentToken);
    const humanPrice = formatAmount(p.amount, token.decimals);
    const durationSeconds = this.durationSeconds(p.endTime);
    const royaltyMaxBps = String(p.royaltyMaxBps);

    const quantity = p.quantity ?? "1";
    let txHash: string;
    if (standard === "ERC1155") {
      if (p.side === "listing") {
        // Listing carries the per-unit price.
        const res = await this.m1155.createListing(signer, {
          nftContract: p.asset.contract,
          tokenId: p.asset.tokenId,
          amount: quantity,
          pricePerUnit: humanPrice,
          currency: p.paymentToken,
          durationSeconds,
          royaltyMaxBps,
        });
        txHash = res.txHash;
      } else {
        // Offer carries the total price (per-unit × quantity).
        const totalHuman = formatAmount((BigInt(p.amount) * BigInt(quantity)).toString(), token.decimals);
        const res = await this.m1155.makeOffer(signer, {
          nftContract: p.asset.contract,
          tokenId: p.asset.tokenId,
          amount: quantity,
          price: totalHuman,
          currency: p.paymentToken,
          durationSeconds,
          royaltyMaxBps,
        });
        txHash = res.txHash;
      }
    } else {
      const params = {
        nftContract: p.asset.contract,
        tokenId: p.asset.tokenId,
        price: humanPrice,
        currency: p.paymentToken,
        durationSeconds,
        royaltyMaxBps,
      };
      const res =
        p.side === "listing"
          ? await this.m721.createListing(signer, params)
          : await this.m721.makeOffer(signer, params);
      txHash = res.txHash;
    }

    const orderRef = await this.orderRefFromReceipt(txHash);
    return { txHash, orderRef };
  }

  private durationSeconds(endTime: number): number {
    if (!endTime) return NO_EXPIRY_SECONDS;
    return Math.max(1, endTime - Math.floor(Date.now() / 1000));
  }

  /** The canonical Starknet order id = the contract-emitted `OrderCreated`
   *  hash (`keys[1]`), which is exactly what the indexer stores. */
  private async orderRefFromReceipt(txHash: string): Promise<OrderRef> {
    const receipt = (await this.deps.provider.getTransactionReceipt(txHash)) as {
      events?: { from_address?: string; keys?: string[] }[];
    };
    const selector = hash.getSelectorFromName("OrderCreated");
    for (const ev of receipt.events ?? []) {
      if (ev.keys?.[0] && BigInt(ev.keys[0]) === BigInt(selector)) {
        return num.toHex(ev.keys[1]);
      }
    }
    throw new Error("StarknetVenue.registerOrder: OrderCreated event not found in receipt");
  }
}
