import { type Call, cairo, hash, num, type ProviderInterface } from "starknet";
import type {
  VenueAdapter,
  RegisterOrderParams,
  OrderRef,
  AdapterTxResult,
} from "../adapters/types.js";
import type { StarknetVenueSigner } from "./index.js";
import type { ResolvedConfig } from "../config.js";
import { getOrderDetails } from "./marketplace/orders.js";
import { resolveToken, START_TIME_BUFFER_SECS } from "./marketplace/utils.js";
import {
  buildListingOrder,
  buildOfferOrder,
  buildRegisterCalls,
  buildFulfillCalls,
  buildCancelCalls,
  buildCancelTypedData,
} from "./marketplace/build.js";
import {
  buildListing1155Order,
  buildOffer1155Order,
  buildRegister1155Calls,
  buildFulfill1155Calls,
  buildCancel1155Calls,
  buildCancel1155TypedData,
} from "./marketplace1155/build.js";

const NO_EXPIRY_SECONDS = 100 * 365 * 24 * 3600;

export interface ResolvedOrder {

  paymentToken: string;

  unitPrice: string;

  standard: "ERC721" | "ERC1155";
}

export interface StarknetVenueDeps {
  config: ResolvedConfig;

  provider: ProviderInterface;

  resolveOrder: (orderRef: OrderRef) => Promise<ResolvedOrder>;

  resolveStandard: (contract: string) => Promise<"ERC721" | "ERC1155">;
}

export class StarknetVenue implements VenueAdapter<StarknetVenueSigner> {
  readonly chain = "STARKNET" as const;

  constructor(private readonly deps: StarknetVenueDeps) {}

  async incrementCounter(signer: StarknetVenueSigner): Promise<AdapterTxResult> {
    return signer.execute([
      { contractAddress: this.deps.config.marketplaceContract, entrypoint: "increment_counter", calldata: [] },
    ]);
  }

  getOrderDetails(orderRef: OrderRef): Promise<unknown> {
    return getOrderDetails(orderRef, this.deps.config);
  }

  async getCounter(address: string): Promise<bigint> {
    return this.readCounter(this.deps.config.marketplaceContract, address);
  }

  async fulfillOrder(
    signer: StarknetVenueSigner,
    orderRef: OrderRef,
    opts?: { quantity?: string } & Record<string, string | undefined>,
  ): Promise<AdapterTxResult> {
    const o = await this.deps.resolveOrder(orderRef);
    const quantity = opts?.quantity ?? "1";

    const totalPrice = (BigInt(o.unitPrice) * BigInt(quantity)).toString();
    const calls =
      o.standard === "ERC1155"
        ? buildFulfill1155Calls({ orderHash: orderRef, paymentToken: o.paymentToken, totalPrice, quantity }, this.deps.config)
        : buildFulfillCalls({ orderHash: orderRef, paymentToken: o.paymentToken, totalPrice }, this.deps.config);
    return signer.execute(calls);
  }

  async cancelOrder(signer: StarknetVenueSigner, orderRef: OrderRef): Promise<AdapterTxResult> {
    const o = await this.deps.resolveOrder(orderRef);
    const typedData =
      o.standard === "ERC1155"
        ? buildCancel1155TypedData(orderRef, signer.address, this.deps.config)
        : buildCancelTypedData(orderRef, signer.address, this.deps.config);
    const signature = await signer.signTypedData(typedData);
    const calls =
      o.standard === "ERC1155"
        ? buildCancel1155Calls({ orderHash: orderRef, offerer: signer.address, signature }, this.deps.config)
        : buildCancelCalls({ orderHash: orderRef, offerer: signer.address, signature }, this.deps.config);
    return signer.execute(calls);
  }

  async registerOrder(
    signer: StarknetVenueSigner,
    p: RegisterOrderParams,
  ): Promise<AdapterTxResult & { orderRef: OrderRef }> {
    const standard = await this.deps.resolveStandard(p.asset.contract);
    const paymentTokenAddress = resolveToken(p.paymentToken).address;
    const royaltyMaxBps = String(p.royaltyMaxBps);
    const startTime = Math.floor(Date.now() / 1000) + START_TIME_BUFFER_SECS;
    const endTime = p.endTime && p.endTime > 0 ? p.endTime : startTime + NO_EXPIRY_SECONDS;
    const quantity = p.quantity ?? "1";
    const marketplace =
      standard === "ERC1155" ? this.deps.config.marketplace1155Contract : this.deps.config.marketplaceContract;
    const counter = String(await this.readCounter(marketplace, signer.address));

    let typedData;
    let buildCalls: (sig: string[]) => Call[];

    if (standard === "ERC1155") {

      const built = (p.side === "listing" ? buildListing1155Order : buildOffer1155Order)(
        {
          offerer: signer.address,
          nftContract: p.asset.contract,
          tokenId: p.asset.tokenId,
          quantity,
          priceWeiPerUnit: p.amount,
          paymentTokenAddress,
          royaltyMaxBps,
          startTime,
          endTime,
          salt: p.salt,
          counter,
        },
        this.deps.config,
      );
      typedData = built.typedData;
      const approval =
        p.side === "listing"
          ? await this.approval1155ForListing(signer.address, p.asset.contract)
          : this.approvalForErc20(paymentTokenAddress, (BigInt(p.amount) * BigInt(quantity)).toString(), marketplace);
      buildCalls = (sig) =>
        buildRegister1155Calls({ orderParams: built.orderParams, signature: sig, ...approval }, this.deps.config);
    } else {
      const built = (p.side === "listing" ? buildListingOrder : buildOfferOrder)(
        {
          offerer: signer.address,
          nftContract: p.asset.contract,
          tokenId: p.asset.tokenId,
          priceWei: p.amount,
          paymentTokenAddress,
          royaltyMaxBps,
          startTime,
          endTime,
          salt: p.salt,
          counter,
        },
        this.deps.config,
      );
      typedData = built.typedData;
      const approval =
        p.side === "listing"
          ? await this.approval721ForListing(signer.address, p.asset.contract, p.asset.tokenId)
          : this.approvalForErc20(paymentTokenAddress, p.amount, marketplace);
      buildCalls = (sig) =>
        buildRegisterCalls({ orderParams: built.orderParams, signature: sig, ...approval }, this.deps.config);
    }

    const signature = await signer.signTypedData(typedData);
    const { txHash } = await signer.execute(buildCalls(signature));
    const orderRef = await this.orderRefFromReceipt(txHash);
    return { txHash, orderRef };
  }

  private async readCounter(marketplace: string, address: string): Promise<bigint> {
    const res = await this.deps.provider.callContract({
      contractAddress: marketplace,
      entrypoint: "get_counter",
      calldata: [address],
    });
    return BigInt(res[0] ?? "0");
  }

  private async approval721ForListing(
    _owner: string,
    nftContract: string,
    tokenId: string,
  ): Promise<{ approvalNeeded: boolean; approve: Call }> {
    const id = cairo.uint256(tokenId);
    const approve: Call = {
      contractAddress: nftContract,
      entrypoint: "approve",
      calldata: [this.deps.config.marketplaceContract, id.low.toString(), id.high.toString()],
    };
    let approved = false;
    try {
      const res = await this.deps.provider.callContract({
        contractAddress: nftContract,
        entrypoint: "get_approved",
        calldata: [id.low.toString(), id.high.toString()],
      });
      approved = BigInt(res[0]).toString() === BigInt(this.deps.config.marketplaceContract).toString();
    } catch {

    }
    return { approvalNeeded: !approved, approve };
  }

  private async approval1155ForListing(
    owner: string,
    nftContract: string,
  ): Promise<{ approvalNeeded: boolean; approve: Call }> {
    const approve: Call = {
      contractAddress: nftContract,
      entrypoint: "set_approval_for_all",
      calldata: [this.deps.config.marketplace1155Contract, "1"],
    };
    let approved = false;
    try {
      const res = await this.deps.provider.callContract({
        contractAddress: nftContract,
        entrypoint: "is_approved_for_all",
        calldata: [owner, this.deps.config.marketplace1155Contract],
      });
      approved = BigInt(res[0]) === 1n;
    } catch {

    }
    return { approvalNeeded: !approved, approve };
  }

  private approvalForErc20(
    token: string,
    amountWei: string,
    marketplace: string,
  ): { approvalNeeded: boolean; approve: Call } {
    const u = cairo.uint256(amountWei);
    return {
      approvalNeeded: true,
      approve: {
        contractAddress: token,
        entrypoint: "approve",
        calldata: [marketplace, u.low.toString(), u.high.toString()],
      },
    };
  }

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
