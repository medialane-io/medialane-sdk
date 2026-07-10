import {
  type AccountInterface,
  type Abi,
  type Call,
  Contract,
  cairo,
} from "starknet";
import { encodeByteArray } from "../bytearray.js";
import { IPMarketplaceABI } from "../abis/index.js";
import type { ResolvedConfig } from "../../config.js";
import { DEFAULT_CURRENCY } from "../../constants.js";
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
} from "../../types/marketplace.js";
import { parseAmount } from "../../utils/token.js";
import { MedialaneError } from "./errors.js";
import { buildFeeCall } from "../fee/index.js";
import {
  buildListingOrder,
  buildOfferOrder,
  buildRegisterCalls,
  buildFulfillCalls,
  buildCancelCalls,
  buildCancelTypedData,
} from "./build.js";
import {
  toSignatureArray,
  getProvider,
  resolveToken,
  generateSalt,
  resolveRoyaltyMaxBps,
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

  const counter = (await contract.get_counter(account.address)).toString();
  const royaltyMaxBps = await resolveRoyaltyMaxBps(provider, nftContract, tokenId, params.royaltyMaxBps);

  const { orderParams, typedData } = buildListingOrder(
    {
      offerer: account.address,
      nftContract,
      tokenId,
      priceWei,
      paymentTokenAddress: token.address,
      royaltyMaxBps,
      startTime,
      endTime,
      salt: generateSalt(),
      counter,
    },
    config,
  );

  const signatureArray = toSignatureArray(await account.signMessage(typedData));

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

  const approve: Call = {
    contractAddress: nftContract,
    entrypoint: "approve",
    calldata: [
      config.marketplaceContract,
      tokenIdUint256.low.toString(),
      tokenIdUint256.high.toString(),
    ],
  };
  const calls = buildRegisterCalls(
    { orderParams, signature: signatureArray, approvalNeeded: !isAlreadyApproved, approve },
    config,
  );

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

  const counter = (await contract.get_counter(account.address)).toString();
  const royaltyMaxBps = await resolveRoyaltyMaxBps(provider, nftContract, tokenId, params.royaltyMaxBps);

  const { orderParams, typedData } = buildOfferOrder(
    {
      offerer: account.address,
      nftContract,
      tokenId,
      priceWei,
      paymentTokenAddress: token.address,
      royaltyMaxBps,
      startTime,
      endTime,
      salt: generateSalt(),
      counter,
    },
    config,
  );

  const signatureArray = toSignatureArray(await account.signMessage(typedData));

  const amountUint256 = cairo.uint256(priceWei);
  const approveCall: Call = {
    contractAddress: token.address,
    entrypoint: "approve",
    calldata: [
      config.marketplaceContract,
      amountUint256.low.toString(),
      amountUint256.high.toString(),
    ],
  };

  const calls = buildRegisterCalls(
    { orderParams, signature: signatureArray, approvalNeeded: true, approve: approveCall },
    config,
  );

  try {
    const tx = await account.execute(calls);
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
  const { provider } = makeContract(config);

  // Fulfilment is unsigned — the caller IS the fulfiller (audit F3).
  const calls = buildFulfillCalls({ orderHash, paymentToken, totalPrice }, config);

  try {
    const tx = await account.execute(calls);
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
  const { provider } = makeContract(config);

  const typedData = buildCancelTypedData(orderHash, account.address, config);
  const signatureArray = toSignatureArray(await account.signMessage(typedData));

  const calls = buildCancelCalls({ orderHash, offerer: account.address, signature: signatureArray }, config);

  try {
    const tx = await account.execute(calls);
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
  const { collectionId, recipient, tokenUri, royaltyBps, collectionContract } = params;
  const provider = getProvider(config);
  const contractAddress = collectionContract ?? config.collectionContract;

  const id = cairo.uint256(collectionId);
  // mint(collection_id: u256, recipient, token_uri: ByteArray, royalty_bps: u128)
  const calldata = [
    id.low.toString(),
    id.high.toString(),
    recipient,
    ...encodeByteArray(tokenUri),
    royaltyBps.toString(),
  ];

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

  // Fulfilment is unsigned now — each fulfill is just a call; no per-item signing.
  const fulfillCalls = items.map((item) =>
    contract.populate("fulfill_order", [item.orderHash]),
  );

  const feeCalls = Array.from(tokenTotals.entries())
    .map(([tokenAddr, totalWei]) =>
      buildFeeCall(
        { surface: "marketplace", token: tokenAddr, grossAmount: totalWei },
        config.feeConfig
      )
    )
    .filter((c): c is NonNullable<typeof c> => c !== null);

  try {
    const tx = await account.execute([...approveCalls, ...fulfillCalls, ...feeCalls]);
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

export async function getCounter(
  address: string,
  config: ResolvedConfig
): Promise<bigint> {
  const { contract } = makeContract(config);
  return BigInt((await contract.get_counter(address)).toString());
}

/** Bulk-cancel: bump the caller's counter, invalidating all their open orders. */
export async function incrementCounter(
  account: AccountInterface,
  config: ResolvedConfig
): Promise<TxResult> {
  const { contract, provider } = makeContract(config);
  const call = contract.populate("increment_counter", []);
  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to increment counter", "TRANSACTION_FAILED", err);
  }
}
