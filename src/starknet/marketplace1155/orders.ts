import {
  type AccountInterface,
  type Abi,
  type TypedData,
  Contract,
  cairo,
  shortString,
} from "starknet";
import { Medialane1155ABI } from "../abis/index.js";
import type { ResolvedConfig } from "../../config.js";
import { DEFAULT_CURRENCY } from "../../constants.js";
import { MedialaneError } from "../marketplace/errors.js";
import type {
  CreateListing1155Params,
  MakeOffer1155Params,
  FulfillOrder1155Params,
  CancelOrder1155Params,
  CartItem,
  TxResult,
  OrderDetails,
} from "../../types/marketplace.js";
import { stringifyBigInts } from "../../utils/bigint.js";
import { parseAmount } from "../../utils/token.js";
import {
  build1155OrderTypedData,
  build1155CancellationTypedData,
} from "../marketplace/signing.js";
import {
  toSignatureArray,
  getChainId,
  getProvider,
  resolveToken,
  generateSalt,
  resolveRoyaltyMaxBps,
  START_TIME_BUFFER_SECS,
} from "../marketplace/utils.js";

const _contractCache = new WeakMap<ResolvedConfig, Contract>();

function getContract(config: ResolvedConfig): Contract {
  let c = _contractCache.get(config);
  if (!c) {
    const provider = getProvider(config);
    c = new Contract(
      Medialane1155ABI as unknown as Abi,
      config.marketplace1155Contract,
      provider
    );
    _contractCache.set(config, c);
  }
  return c;
}

/**
 * Create an ERC-1155 listing on Medialane1155.
 *
 * The offerer signs `OrderParameters` off-chain via SNIP-12, then the signed
 * order is submitted to `register_order`. The ERC-1155 token approval
 * (`set_approval_for_all`) must be granted before the buyer calls `fulfill_order`.
 */
export async function createListing1155(
  account: AccountInterface,
  params: CreateListing1155Params,
  config: ResolvedConfig
): Promise<TxResult> {
  const {
    nftContract,
    tokenId,
    amount,
    pricePerUnit,
    currency = DEFAULT_CURRENCY,
    durationSeconds,
  } = params;

  const contract = getContract(config);
  const provider = getProvider(config);

  const token = resolveToken(currency);
  const priceWei = parseAmount(pricePerUnit, token.decimals);

  const now = Math.floor(Date.now() / 1000);
  const endTime = now + durationSeconds;
  const chainId = getChainId(config);

  const counter = (await contract.get_counter(account.address)).toString();
  const royaltyMaxBps = await resolveRoyaltyMaxBps(provider, nftContract, tokenId, params.royaltyMaxBps);

  const orderParams = {
    offerer: account.address,
    marketplace: config.marketplace1155Contract,
    offer: {
      item_type: "ERC1155",
      token: nftContract,
      identifier_or_criteria: tokenId,
      amount, // ERC-1155 leg amount = unit quantity
    },
    consideration: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      amount: priceWei, // payment leg amount = price PER UNIT
      recipient: account.address,
    },
    royalty_max_bps: royaltyMaxBps,
    start_time: (now + START_TIME_BUFFER_SECS).toString(),
    end_time: endTime.toString(),
    salt: generateSalt(),
    counter,
  };

  const typedData = stringifyBigInts(
    build1155OrderTypedData(orderParams, chainId)
  ) as TypedData;

  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);

  // item_type must be shortString encoded for calldata (felt252), but left as plain
  // string in orderParams used for SNIP-12 signing (typed data uses shortstring type).
  const orderPayload = stringifyBigInts({
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

  // Check if the marketplace is already approved to transfer the ERC-1155 tokens.
  let isApproved = false;
  try {
    const result = await provider.callContract({
      contractAddress: nftContract,
      entrypoint: "is_approved_for_all",
      calldata: [account.address, config.marketplace1155Contract],
    });
    // Returns a felt252: 1 = true, 0 = false
    isApproved = BigInt(result[0]) === 1n;
  } catch {
    // Cannot check — include approval call to be safe
  }

  const registerCall = contract.populate("register_order", [orderPayload]);
  const calls = isApproved
    ? [registerCall]
    : [
        {
          contractAddress: nftContract,
          entrypoint: "set_approval_for_all",
          calldata: [config.marketplace1155Contract, "1"],
        },
        registerCall,
      ];

  try {
    const tx = await account.execute(calls);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to create ERC-1155 listing", "TRANSACTION_FAILED", err);
  }
}

/**
 * Fulfill (buy) `quantity` units of an ERC-1155 order. Unsigned — the caller
 * IS the fulfiller (audit F3). The fulfiller must have approved the Medialane1155
 * contract to spend `pricePerUnit × quantity` of the payment token before calling.
 */
export async function fulfillOrder1155(
  account: AccountInterface,
  params: FulfillOrder1155Params,
  config: ResolvedConfig
): Promise<TxResult> {
  const { orderHash, paymentToken, totalPrice, quantity = "1" } = params;

  const contract = getContract(config);
  const provider = getProvider(config);

  const totalPriceU256 = cairo.uint256(totalPrice);
  const approveCall = {
    contractAddress: paymentToken,
    entrypoint: "approve",
    calldata: [
      config.marketplace1155Contract,
      totalPriceU256.low.toString(),
      totalPriceU256.high.toString(),
    ],
  };

  const fulfillCall = contract.populate("fulfill_order", [orderHash, quantity]);

  try {
    const tx = await account.execute([approveCall, fulfillCall]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to fulfill ERC-1155 order", "TRANSACTION_FAILED", err);
  }
}

/**
 * Cancel an ERC-1155 order. Only the original offerer can cancel: the offerer
 * signs `OrderCancellation` off-chain (no nonce), submitted to `cancel_order`.
 */
export async function cancelOrder1155(
  account: AccountInterface,
  params: CancelOrder1155Params,
  config: ResolvedConfig
): Promise<TxResult> {
  const { orderHash } = params;

  const contract = getContract(config);
  const provider = getProvider(config);
  const chainId = getChainId(config);

  const cancelParams = {
    order_hash: orderHash,
    offerer: account.address,
  };

  const typedData = stringifyBigInts(
    build1155CancellationTypedData(cancelParams, chainId)
  ) as TypedData;

  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);

  const cancelPayload = stringifyBigInts({
    cancelation: cancelParams,
    signature: signatureArray,
  }) as Record<string, unknown>;

  const cancelCall = contract.populate("cancel_order", [cancelPayload]);

  try {
    const tx = await account.execute(cancelCall);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to cancel ERC-1155 order", "TRANSACTION_FAILED", err);
  }
}

/**
 * Make an offer (bid) on an ERC-1155 token. The offerer offers ERC-20 and asks
 * for the specified ERC-1155 quantity. Signs `OrderParameters` off-chain via
 * SNIP-12, approves the ERC-20 spend, then submits to `register_order`.
 */
export async function makeOffer1155(
  account: AccountInterface,
  params: MakeOffer1155Params,
  config: ResolvedConfig
): Promise<TxResult> {
  const {
    nftContract,
    tokenId,
    amount,
    price,
    currency = DEFAULT_CURRENCY,
    durationSeconds,
  } = params;

  const contract = getContract(config);
  const provider = getProvider(config);
  const chainId = getChainId(config);

  const token = resolveToken(currency);
  const priceWei = parseAmount(price, token.decimals);

  const now = Math.floor(Date.now() / 1000);
  const endTime = now + durationSeconds;

  const counter = (await contract.get_counter(account.address)).toString();
  const royaltyMaxBps = await resolveRoyaltyMaxBps(provider, nftContract, tokenId, params.royaltyMaxBps);

  const orderParams = {
    offerer: account.address,
    marketplace: config.marketplace1155Contract,
    offer: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      amount: priceWei, // price PER UNIT
    },
    consideration: {
      item_type: "ERC1155",
      token: nftContract,
      identifier_or_criteria: tokenId,
      amount, // unit quantity
      recipient: account.address,
    },
    royalty_max_bps: royaltyMaxBps,
    start_time: (now + START_TIME_BUFFER_SECS).toString(),
    end_time: endTime.toString(),
    salt: generateSalt(),
    counter,
  };

  const typedData = stringifyBigInts(
    build1155OrderTypedData(orderParams, chainId)
  ) as TypedData;

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

  // Bid pays per-unit price × quantity total — approve the full amount.
  const totalWei = BigInt(priceWei) * BigInt(amount);
  const amountU256 = cairo.uint256(totalWei.toString());
  const approveCall = {
    contractAddress: token.address,
    entrypoint: "approve",
    calldata: [
      config.marketplace1155Contract,
      amountU256.low.toString(),
      amountU256.high.toString(),
    ],
  };

  const registerCall = contract.populate("register_order", [registerPayload]);

  try {
    const tx = await account.execute([approveCall, registerCall]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to make ERC-1155 offer", "TRANSACTION_FAILED", err);
  }
}

/**
 * Checkout a cart of ERC-1155 orders in a single atomic multicall. Fulfilment
 * is unsigned now — group ERC-20 approvals by token, then one `fulfill_order`
 * call per item with its quantity.
 */
export async function checkoutCart1155(
  account: AccountInterface,
  items: CartItem[],
  config: ResolvedConfig
): Promise<TxResult> {
  if (items.length === 0) throw new MedialaneError("Cart is empty", "INVALID_PARAMS");

  const contract = getContract(config);
  const provider = getProvider(config);

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
        config.marketplace1155Contract,
        amount.low.toString(),
        amount.high.toString(),
      ],
    };
  });

  const fulfillCalls = items.map((item) =>
    contract.populate("fulfill_order", [item.orderHash, item.quantity ?? "1"]),
  );

  try {
    const tx = await account.execute([...approveCalls, ...fulfillCalls]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("ERC-1155 cart checkout failed", "TRANSACTION_FAILED", err);
  }
}

export async function getOrderDetails1155(
  orderHash: string,
  config: ResolvedConfig
): Promise<OrderDetails> {
  const contract = getContract(config);
  return contract.get_order_details(orderHash) as Promise<OrderDetails>;
}

export async function getCounter1155(
  address: string,
  config: ResolvedConfig
): Promise<bigint> {
  const contract = getContract(config);
  return BigInt((await contract.get_counter(address)).toString());
}

/** Bulk-cancel on the 1155 venue: bump the caller's counter. */
export async function incrementCounter1155(
  account: AccountInterface,
  config: ResolvedConfig
): Promise<TxResult> {
  const contract = getContract(config);
  const provider = getProvider(config);
  const call = contract.populate("increment_counter", []);
  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to increment counter (1155)", "TRANSACTION_FAILED", err);
  }
}
