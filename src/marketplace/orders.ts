import {
  type AccountInterface,
  type Abi,
  Contract,
  cairo,
  shortString,
  type TypedData,
} from "starknet";
import { encodeByteArray } from "../utils/bytearray.js";
import { IPMarketplaceABI } from "../abis.js";
import type { ResolvedConfig } from "../config.js";
import { DEFAULT_CURRENCY } from "../constants.js";
import type {
  CreateListingParams,
  MakeOfferParams,
  FulfillOrderParams,
  CancelOrderParams,
  CartItem,
  MintParams,
  CreateCollectionParams,
  TxResult,
  OrderDetails,
} from "../types/marketplace.js";
import { stringifyBigInts } from "../utils/bigint.js";
import { parseAmount } from "../utils/token.js";
import {
  buildOrderTypedData,
  buildFulfillmentTypedData,
  buildCancellationTypedData,
} from "./signing.js";
import { MedialaneError } from "./errors.js";
import {
  toSignatureArray,
  getChainId,
  getProvider,
  resolveToken,
  START_TIME_BUFFER_SECS,
} from "./utils.js";

const _contractCache = new WeakMap<ResolvedConfig, { contract: Contract }>();

function makeContract(config: ResolvedConfig): { contract: Contract; provider: ReturnType<typeof getProvider> } {
  const cached = _contractCache.get(config);
  const provider = getProvider(config);
  if (cached) return { ...cached, provider };

  const contract = new Contract(
    IPMarketplaceABI as unknown as Abi,
    config.marketplaceContract,
    provider
  );
  _contractCache.set(config, { contract });
  return { contract, provider };
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
  const startTime = now + START_TIME_BUFFER_SECS;
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
    throw new MedialaneError("Failed to create listing", "TRANSACTION_FAILED", err);
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
  const startTime = now + START_TIME_BUFFER_SECS;
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
    throw new MedialaneError("Failed to make offer", "TRANSACTION_FAILED", err);
  }
}

/**
 * Fulfill (buy) a single order.
 * Approves the payment token then calls fulfill_order atomically.
 */
export async function fulfillOrder(
  account: AccountInterface,
  params: FulfillOrderParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { orderHash, paymentToken, totalPrice } = params;
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

  const totalPriceU256 = cairo.uint256(totalPrice);
  const approveCall = {
    contractAddress: paymentToken,
    entrypoint: "approve",
    calldata: [
      config.marketplaceContract,
      totalPriceU256.low.toString(),
      totalPriceU256.high.toString(),
    ],
  };

  const fulfillCall = contract.populate("fulfill_order", [fulfillPayload]);

  try {
    const tx = await account.execute([approveCall, fulfillCall]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to fulfill order", "TRANSACTION_FAILED", err);
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
    throw new MedialaneError("Failed to cancel order", "TRANSACTION_FAILED", err);
  }
}


/**
 * Mint an NFT into a Medialane collection.
 * Calls `mint(collection_id, recipient, token_uri)` — no SNIP-12 signing required.
 */
export async function mint(
  account: AccountInterface,
  params: MintParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { collectionId, recipient, tokenUri, collectionContract } = params;
  const provider = getProvider(config);
  const contractAddress = collectionContract ?? config.collectionContract;

  const id = cairo.uint256(collectionId);
  const calldata = [id.low.toString(), id.high.toString(), recipient, ...encodeByteArray(tokenUri)];

  try {
    const tx = await account.execute([{ contractAddress, entrypoint: "mint", calldata }]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to mint NFT", "TRANSACTION_FAILED", err);
  }
}

/**
 * Create a new collection on the Medialane collection registry.
 * Calls `create_collection(name, symbol, base_uri)` — no SNIP-12 signing required.
 * Returns the transaction hash; listen for the CollectionCreated event to get the collection_id.
 */
export async function createCollection(
  account: AccountInterface,
  params: CreateCollectionParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { name, symbol, baseUri, collectionContract } = params;
  const provider = getProvider(config);
  const contractAddress = collectionContract ?? config.collectionContract;

  const calldata = [
    ...encodeByteArray(name),
    ...encodeByteArray(symbol),
    ...encodeByteArray(baseUri),
  ];

  try {
    const tx = await account.execute([{ contractAddress, entrypoint: "create_collection", calldata }]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to create collection", "TRANSACTION_FAILED", err);
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
  if (items.length === 0) throw new MedialaneError("Cart is empty", "INVALID_PARAMS");

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
    // Nonces are sequential (baseNonce + i) because all fulfill calls land in one atomic tx.
    // The contract increments its nonce after each fulfill_order call within the multicall.
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
    throw new MedialaneError("Cart checkout failed", "TRANSACTION_FAILED", err);
  }
}

export async function getOrderDetails(
  orderHash: string,
  config: ResolvedConfig
): Promise<OrderDetails> {
  const { contract } = makeContract(config);
  return contract.get_order_details(orderHash) as Promise<OrderDetails>;
}

export async function getNonce(
  address: string,
  config: ResolvedConfig
): Promise<bigint> {
  const { contract } = makeContract(config);
  return BigInt((await contract.nonces(address)).toString());
}
