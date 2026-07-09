import type { AccountInterface, ProviderInterface } from "starknet";
import type {
  VenueAdapter,
  RegisterOrderParams,
  OrderRef,
  AdapterTxResult,
} from "../adapters/types.js";
import type { ResolvedConfig } from "../config.js";
import { MarketplaceModule } from "./marketplace/index.js";
import { Medialane1155Module } from "./marketplace1155/index.js";

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

  // registerOrder needs the contract-emitted order hash (indexer stores
  // OrderCreated.keys[1]) as its OrderRef return — see receipt-parsing decision
  // pending before touching the shared orders.ts. Implemented next.
  registerOrder(
    _signer: AccountInterface,
    _params: RegisterOrderParams,
  ): Promise<AdapterTxResult & { orderRef: OrderRef }> {
    throw new Error("StarknetVenue.registerOrder: pending orderRef-from-receipt decision");
  }
}
