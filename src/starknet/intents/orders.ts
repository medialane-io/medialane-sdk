import { cairo, type Call } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { getTokenByAddress, parseAmount } from "../../utils/token.js";
import { buildCancelTypedData, buildListingOrder, buildOfferOrder } from "../marketplace/build.js";
import { buildCancel1155TypedData, buildListing1155Order, buildOffer1155Order } from "../marketplace1155/build.js";
import type { BuiltIntent, IntentDefinition } from "./build.js";

export const ORDER_START_WINDOW_SECONDS = 300;
export const ORDER_START_DELAY_SECONDS = 30;

type TokenStandard = "ERC721" | "ERC1155";

interface OrderTiming {
  salt: string;
  startTime: number;
}

export interface ListingIntentParams extends OrderTiming {
  offerer: string;
  nftContract: string;
  tokenId: string;
  currency: string;
  price: string;
  endTime: number;
  amount?: string;
}

export interface OfferIntentParams extends ListingIntentParams {
  tokenStandard?: TokenStandard;
  quantity?: string;
}

export interface CancelIntentParams {
  offerer: string;
  orderHash: string;
  tokenStandard?: TokenStandard;
}

export interface CounterOfferIntentParams extends OrderTiming {
  sellerAddress: string;
  originalOrderHash: string;
  durationSeconds: number;
  priceRaw: string;
  message?: string;
}

export interface OrderInputs {
  counter: string;
  royaltyMaxBps: string;
}

export interface CounterOfferInputs extends OrderInputs {
  nftContract: string;
  tokenId: string;
  currency: string;
}

function priceInWei(price: string, currency: string): string {
  const token = getTokenByAddress(currency);
  if (!token) throw new Error(`Unsupported currency: ${currency}`);
  return parseAmount(price, token.decimals);
}

function atLeastOne(value: string | undefined, name: string): string {
  const n = BigInt(value ?? "1");
  if (n < 1n) throw new Error(`${name} must be at least 1`);
  return n.toString();
}

const registerOrder = (marketplace: string): Call => ({ contractAddress: marketplace, entrypoint: "register_order", calldata: [] });

function approveToken(token: string, spender: string, amount: string): Call {
  const value = cairo.uint256(amount);
  return { contractAddress: token, entrypoint: "approve", calldata: [spender, value.low.toString(), value.high.toString()] };
}

function approveNft(nftContract: string, marketplace: string, tokenId: string): Call {
  const id = cairo.uint256(tokenId);
  return { contractAddress: nftContract, entrypoint: "approve", calldata: [marketplace, id.low.toString(), id.high.toString()] };
}

async function orderInputs(
  offerer: string,
  standard: TokenStandard,
  nftContract: string,
  tokenId: string,
  readers: Parameters<IntentDefinition["inputs"]>[1],
): Promise<OrderInputs> {
  return { counter: await readers.counterOf(offerer, standard), royaltyMaxBps: await readers.royaltyCapOf(nftContract, tokenId) };
}

function listing721(
  p: Omit<ListingIntentParams, "price" | "currency"> & { priceWei: string; currency: string },
  inputs: OrderInputs,
  config: ResolvedConfig,
): BuiltIntent {
  const marketplace = config.marketplace721Contract;
  const { typedData } = buildListingOrder(
    {
      offerer: p.offerer,
      nftContract: p.nftContract,
      tokenId: p.tokenId,
      priceWei: p.priceWei,
      paymentTokenAddress: p.currency,
      royaltyMaxBps: inputs.royaltyMaxBps,
      startTime: p.startTime,
      endTime: p.endTime,
      salt: p.salt,
      counter: inputs.counter,
    },
    config,
  );
  return { typedData, calls: [approveNft(p.nftContract, marketplace, p.tokenId), registerOrder(marketplace)] };
}

export const listingIntent: IntentDefinition<ListingIntentParams, OrderInputs> = {
  inputs: (p, readers) => orderInputs(p.offerer, p.amount != null ? "ERC1155" : "ERC721", p.nftContract, p.tokenId, readers),
  build(p, inputs, config) {
    const priceWei = priceInWei(p.price, p.currency);
    if (p.amount == null) return listing721({ ...p, priceWei }, inputs, config);
    const marketplace = config.marketplace1155Contract;
    const { typedData } = buildListing1155Order(
      {
        offerer: p.offerer,
        nftContract: p.nftContract,
        tokenId: p.tokenId,
        quantity: atLeastOne(p.amount, "amount"),
        priceWeiPerUnit: priceWei,
        paymentTokenAddress: p.currency,
        royaltyMaxBps: inputs.royaltyMaxBps,
        startTime: p.startTime,
        endTime: p.endTime,
        salt: p.salt,
        counter: inputs.counter,
      },
      config,
    );
    return {
      typedData,
      calls: [
        { contractAddress: p.nftContract, entrypoint: "set_approval_for_all", calldata: [marketplace, "0x1"] },
        registerOrder(marketplace),
      ],
    };
  },
};

export const offerIntent: IntentDefinition<OfferIntentParams, OrderInputs> = {
  inputs: (p, readers) => orderInputs(p.offerer, p.tokenStandard === "ERC1155" ? "ERC1155" : "ERC721", p.nftContract, p.tokenId, readers),
  build(p, inputs, config) {
    const priceWei = priceInWei(p.price, p.currency);
    const is1155 = p.tokenStandard === "ERC1155";
    const marketplace = is1155 ? config.marketplace1155Contract : config.marketplace721Contract;
    const order = {
      offerer: p.offerer,
      nftContract: p.nftContract,
      tokenId: p.tokenId,
      paymentTokenAddress: p.currency,
      royaltyMaxBps: inputs.royaltyMaxBps,
      startTime: p.startTime,
      endTime: p.endTime,
      salt: p.salt,
      counter: inputs.counter,
    };
    const { typedData } = is1155
      ? buildOffer1155Order({ ...order, quantity: atLeastOne(p.quantity, "quantity"), priceWeiPerUnit: priceWei }, config)
      : buildOfferOrder({ ...order, priceWei }, config);
    return { typedData, calls: [approveToken(p.currency, marketplace, priceWei), registerOrder(marketplace)] };
  },
};

export const cancelIntent: IntentDefinition<CancelIntentParams, { is1155: boolean }> = {
  async inputs(p, readers) {
    if (p.tokenStandard === "ERC1155") return { is1155: true };
    const order = await readers.orderOf(p.orderHash);
    return { is1155: order?.offer.itemType === "ERC1155" || order?.consideration.itemType === "ERC1155" };
  },
  build(p, { is1155 }, config) {
    const marketplace = is1155 ? config.marketplace1155Contract : config.marketplace721Contract;
    const typedData = is1155
      ? buildCancel1155TypedData(p.orderHash, p.offerer, config)
      : buildCancelTypedData(p.orderHash, p.offerer, config);
    return { typedData, calls: [{ contractAddress: marketplace, entrypoint: "cancel_order", calldata: [] }] };
  },
};

export const counterOfferIntent: IntentDefinition<CounterOfferIntentParams, CounterOfferInputs> = {
  async inputs(p, readers) {
    const original = await readers.orderOf(p.originalOrderHash);
    if (!original) throw new Error("The original order can't be found");
    const nftContract = original.consideration.token;
    const tokenId = original.consideration.identifier;
    return { nftContract, tokenId, currency: original.offer.token, ...(await orderInputs(p.sellerAddress, "ERC721", nftContract, tokenId, readers)) };
  },
  build(p, inputs, config) {
    return listing721(
      {
        offerer: p.sellerAddress,
        nftContract: inputs.nftContract,
        tokenId: inputs.tokenId,
        currency: inputs.currency,
        priceWei: p.priceRaw,
        endTime: p.startTime + p.durationSeconds,
        salt: p.salt,
        startTime: p.startTime,
      },
      inputs,
      config,
    );
  },
};
