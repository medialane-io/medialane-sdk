import {
  type AccountInterface,
  type Abi,
  Contract,
  RpcProvider,
  cairo,
  shortString,
  constants,
  type TypedData,
} from "starknet";
import { IPMarketplaceABI } from "../abis.js";
import type { ResolvedConfig } from "../config.js";
import { SUPPORTED_TOKENS, DEFAULT_CURRENCY } from "../constants.js";
import type {
  CreateListingParams,
  MakeOfferParams,
  FulfillOrderParams,
  CancelOrderParams,
  CartItem,
  TxResult,
} from "../types/marketplace.js";
import { stringifyBigInts } from "../utils/bigint.js";
import { parseAmount } from "../utils/token.js";
import {
  buildOrderTypedData,
  buildFulfillmentTypedData,
  buildCancellationTypedData,
} from "./signing.js";

export class MedialaneError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "MedialaneError";
  }
}

function toSignatureArray(sig: unknown): string[] {
  if (Array.isArray(sig)) return sig as string[];
  const s = sig as { r: bigint | string; s: bigint | string };
  return [s.r.toString(), s.s.toString()];
}

function getChainId(config: ResolvedConfig): constants.StarknetChainId {
  return config.network === "mainnet"
    ? constants.StarknetChainId.SN_MAIN
    : constants.StarknetChainId.SN_SEPOLIA;
}

const _contractCache = new WeakMap<ResolvedConfig, { contract: Contract; provider: RpcProvider }>();

function makeContract(config: ResolvedConfig): { contract: Contract; provider: RpcProvider } {
  const cached = _contractCache.get(config);
  if (cached) return cached;

  const provider = new RpcProvider({ nodeUrl: config.rpcUrl });
  const contract = new Contract(
    IPMarketplaceABI as unknown as Abi,
    config.marketplaceContract,
    provider
  );
  const result = { contract, provider };
  _contractCache.set(config, result);
  return result;
}

function resolveToken(currency: string) {
  const token = SUPPORTED_TOKENS.find(
    (t) => t.symbol === currency.toUpperCase() || t.address.toLowerCase() === currency.toLowerCase()
  );
  if (!token) throw new MedialaneError(`Unsupported currency: ${currency}`);
  return token;
}


/**
 * Create a listing — offerer offers ERC721, asks for ERC20.
 */
export async function createListing(
  account: AccountInterface,
  params: CreateListingParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { nftContract, tokenId, price, currency = DEFAULT_CURRENCY, durationSeconds } = params;
  const { contract, provider } = makeContract(config);

  const token = resolveToken(currency);
  const priceWei = parseAmount(price, token.decimals);

  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 300;
  const endTime = now + durationSeconds;
  const saltBytes = new Uint8Array(4);
  crypto.getRandomValues(saltBytes);
  const salt = new DataView(saltBytes.buffer).getUint32(0).toString();

  const currentNonce = await contract.nonces(account.address);

  const orderParams = {
    offerer: account.address,
    offer: {
      item_type: "ERC721",
      token: nftContract,
      identifier_or_criteria: tokenId,
      start_amount: "1",
      end_amount: "1",
    },
    consideration: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      start_amount: priceWei,
      end_amount: priceWei,
      recipient: account.address,
    },
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    salt,
    nonce: currentNonce.toString(),
  };

  const chainId = getChainId(config);
  const typedData = stringifyBigInts(buildOrderTypedData(orderParams, chainId)) as TypedData;

  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);

  const registerPayload = stringifyBigInts({
    parameters: {
      ...orderParams,
      offer: {
        ...orderParams.offer,
        item_type: shortString.encodeShortString(orderParams.offer.item_type),
      },
      consideration: {
        ...orderParams.consideration,
        item_type: shortString.encodeShortString(orderParams.consideration.item_type),
      },
    },
    signature: signatureArray,
  }) as Record<string, unknown>;

  const tokenIdUint256 = cairo.uint256(tokenId);

  // Check approval status before adding approve call
  let isAlreadyApproved = false;
  try {
    const result = await provider.callContract({
      contractAddress: nftContract,
      entrypoint: "get_approved",
      calldata: [tokenIdUint256.low.toString(), tokenIdUint256.high.toString()],
    });
    isAlreadyApproved =
      BigInt(result[0]).toString() === BigInt(config.marketplaceContract).toString();
  } catch {
    // Cannot check — include approve to be safe
  }

  const registerCall = contract.populate("register_order", [registerPayload]);
  const calls = isAlreadyApproved
    ? [registerCall]
    : [
        {
          contractAddress: nftContract,
          entrypoint: "approve",
          calldata: [
            config.marketplaceContract,
            tokenIdUint256.low.toString(),
            tokenIdUint256.high.toString(),
          ],
        },
        registerCall,
      ];

  try {
    const tx = await account.execute(calls);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to create listing", err);
  }
}

/**
 * Make an offer — offerer offers ERC20, asks for ERC721.
 */
export async function makeOffer(
  account: AccountInterface,
  params: MakeOfferParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { nftContract, tokenId, price, currency = DEFAULT_CURRENCY, durationSeconds } = params;
  const { contract, provider } = makeContract(config);

  const token = resolveToken(currency);
  const priceWei = parseAmount(price, token.decimals);

  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 300;
  const endTime = now + durationSeconds;
  const saltBytes = new Uint8Array(4);
  crypto.getRandomValues(saltBytes);
  const salt = new DataView(saltBytes.buffer).getUint32(0).toString();

  const currentNonce = await contract.nonces(account.address);

  const orderParams = {
    offerer: account.address,
    offer: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      start_amount: priceWei,
      end_amount: priceWei,
    },
    consideration: {
      item_type: "ERC721",
      token: nftContract,
      identifier_or_criteria: tokenId,
      start_amount: "1",
      end_amount: "1",
      recipient: account.address,
    },
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    salt,
    nonce: currentNonce.toString(),
  };

  const chainId = getChainId(config);
  const typedData = stringifyBigInts(buildOrderTypedData(orderParams, chainId)) as TypedData;

  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);

  const registerPayload = stringifyBigInts({
    parameters: {
      ...orderParams,
      offer: {
        ...orderParams.offer,
        item_type: shortString.encodeShortString(orderParams.offer.item_type),
      },
      consideration: {
        ...orderParams.consideration,
        item_type: shortString.encodeShortString(orderParams.consideration.item_type),
      },
    },
    signature: signatureArray,
  }) as Record<string, unknown>;

  const amountUint256 = cairo.uint256(priceWei);
  const approveCall = {
    contractAddress: token.address,
    entrypoint: "approve",
    calldata: [
      config.marketplaceContract,
      amountUint256.low.toString(),
      amountUint256.high.toString(),
    ],
  };

  const registerCall = contract.populate("register_order", [registerPayload]);

  try {
    const tx = await account.execute([approveCall, registerCall]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to make offer", err);
  }
}

/**
 * Fulfill (buy) a single order.
 */
export async function fulfillOrder(
  account: AccountInterface,
  params: FulfillOrderParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { orderHash } = params;
  const { contract, provider } = makeContract(config);

  const currentNonce = await contract.nonces(account.address);
  const chainId = getChainId(config);

  const fulfillmentParams = {
    order_hash: orderHash,
    fulfiller: account.address,
    nonce: currentNonce.toString(),
  };

  const typedData = stringifyBigInts(
    buildFulfillmentTypedData(fulfillmentParams, chainId)
  ) as TypedData;

  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);

  const fulfillPayload = stringifyBigInts({
    fulfillment: fulfillmentParams,
    signature: signatureArray,
  }) as Record<string, unknown>;

  const call = contract.populate("fulfill_order", [fulfillPayload]);

  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to fulfill order", err);
  }
}

/**
 * Cancel an order.
 */
export async function cancelOrder(
  account: AccountInterface,
  params: CancelOrderParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { orderHash } = params;
  const { contract, provider } = makeContract(config);

  const currentNonce = await contract.nonces(account.address);
  const chainId = getChainId(config);

  const cancelParams = {
    order_hash: orderHash,
    offerer: account.address,
    nonce: currentNonce.toString(),
  };

  const typedData = stringifyBigInts(
    buildCancellationTypedData(cancelParams, chainId)
  ) as TypedData;

  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);

  const cancelRequest = stringifyBigInts({
    cancelation: cancelParams,
    signature: signatureArray,
  }) as Record<string, unknown>;

  const call = contract.populate("cancel_order", [cancelRequest]);

  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to cancel order", err);
  }
}

/**
 * Checkout a cart of multiple orders in a single atomic multicall.
 * Prompts wallet signatures sequentially (one per item), then executes
 * all approve + fulfill calls atomically.
 */
export async function checkoutCart(
  account: AccountInterface,
  items: CartItem[],
  config: ResolvedConfig
): Promise<TxResult> {
  if (items.length === 0) throw new MedialaneError("Cart is empty");

  const { contract, provider } = makeContract(config);

  // Group total ERC20 approval amounts by token
  const tokenTotals = new Map<string, bigint>();
  for (const item of items) {
    const prev = tokenTotals.get(item.considerationToken) ?? 0n;
    tokenTotals.set(item.considerationToken, prev + BigInt(item.considerationAmount));
  }

  const approveCalls = Array.from(tokenTotals.entries()).map(([tokenAddr, totalWei]) => {
    const amount = cairo.uint256(totalWei.toString());
    return {
      contractAddress: tokenAddr,
      entrypoint: "approve",
      calldata: [
        config.marketplaceContract,
        amount.low.toString(),
        amount.high.toString(),
      ],
    };
  });

  const currentNonce = await contract.nonces(account.address);
  const baseNonce = BigInt(currentNonce.toString());
  const chainId = getChainId(config);

  const fulfillCalls = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const nonce = (baseNonce + BigInt(i)).toString();

    const fulfillmentParams = {
      order_hash: item.orderHash,
      fulfiller: account.address,
      nonce,
    };

    const typedData = stringifyBigInts(
      buildFulfillmentTypedData(fulfillmentParams, chainId)
    ) as TypedData;

    const signature = await account.signMessage(typedData);
    const signatureArray = toSignatureArray(signature);

    const fulfillPayload = stringifyBigInts({
      fulfillment: fulfillmentParams,
      signature: signatureArray,
    }) as Record<string, unknown>;

    fulfillCalls.push(contract.populate("fulfill_order", [fulfillPayload]));
  }

  try {
    const tx = await account.execute([...approveCalls, ...fulfillCalls]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Cart checkout failed", err);
  }
}
