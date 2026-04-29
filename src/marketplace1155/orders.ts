import {
  type AccountInterface,
  type Abi,
  type TypedData,
  Contract,
  RpcProvider,
  cairo,
  constants,
} from "starknet";
import { Medialane1155ABI } from "../abis.js";
import type { ResolvedConfig } from "../config.js";
import { SUPPORTED_TOKENS, DEFAULT_CURRENCY } from "../constants.js";
import { MedialaneError } from "../marketplace/orders.js";
import type {
  CreateListing1155Params,
  FulfillOrder1155Params,
  CancelOrder1155Params,
  TxResult,
} from "../types/marketplace.js";
import { stringifyBigInts } from "../utils/bigint.js";
import { parseAmount } from "../utils/token.js";
import {
  build1155OrderTypedData,
  build1155FulfillmentTypedData,
  build1155CancellationTypedData,
} from "./signing.js";

function toSignatureArray(sig: unknown): string[] {
  if (Array.isArray(sig)) return sig as string[];
  const s = sig as { r: bigint | string; s: bigint | string };
  return [s.r.toString(), s.s.toString()];
}

function getChainId(_config: ResolvedConfig): constants.StarknetChainId {
  return constants.StarknetChainId.SN_MAIN;
}

const _providerCache = new WeakMap<ResolvedConfig, RpcProvider>();
const _contractCache = new WeakMap<ResolvedConfig, Contract>();

function getProvider(config: ResolvedConfig): RpcProvider {
  let p = _providerCache.get(config);
  if (!p) {
    p = new RpcProvider({ nodeUrl: config.rpcUrl });
    _providerCache.set(config, p);
  }
  return p;
}

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

function resolveToken(currency: string) {
  const token = SUPPORTED_TOKENS.find(
    (t) => t.symbol === currency.toUpperCase() || t.address.toLowerCase() === currency.toLowerCase()
  );
  if (!token) throw new MedialaneError(`Unsupported currency: ${currency}`, "INVALID_PARAMS");
  return token;
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

  const saltBytes = new Uint8Array(4);
  crypto.getRandomValues(saltBytes);
  const salt = new DataView(saltBytes.buffer).getUint32(0).toString();

  const currentNonce = await contract.nonces(account.address);
  const chainId = getChainId(config);

  const orderParams = {
    offerer: account.address,
    offer: {
      item_type: "ERC1155",
      token: nftContract,
      identifier_or_criteria: tokenId,
      start_amount: amount,
      end_amount: amount,
    },
    consideration: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      start_amount: priceWei,
      end_amount: priceWei,
      recipient: account.address,
    },
    start_time: now.toString(),
    end_time: endTime.toString(),
    salt,
    nonce: currentNonce.toString(),
  };

  const typedData = stringifyBigInts(
    build1155OrderTypedData(orderParams, chainId)
  ) as TypedData;

  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);

  const orderPayload = stringifyBigInts({
    parameters: orderParams,
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
 * Fulfill (buy) an ERC-1155 order.
 *
 * The fulfiller signs `OrderFulfillment` off-chain, then the signed
 * fulfillment is submitted to `fulfill_order`. The fulfiller must have
 * approved the Medialane1155 contract to spend `pricePerUnit × amount`
 * of the payment token before calling this.
 */
export async function fulfillOrder1155(
  account: AccountInterface,
  params: FulfillOrder1155Params,
  config: ResolvedConfig
): Promise<TxResult> {
  const { orderHash, paymentToken, totalPrice, quantity = "1" } = params;

  const contract = getContract(config);
  const provider = getProvider(config);
  const chainId = getChainId(config);

  const currentNonce = await contract.nonces(account.address);

  const fulfillmentParams = {
    order_hash: orderHash,
    fulfiller: account.address,
    quantity,
    nonce: currentNonce.toString(),
  };

  const typedData = stringifyBigInts(
    build1155FulfillmentTypedData(fulfillmentParams, chainId)
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
      config.marketplace1155Contract,
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
    throw new MedialaneError("Failed to fulfill ERC-1155 order", "TRANSACTION_FAILED", err);
  }
}

/**
 * Cancel an ERC-1155 order.
 *
 * Only the original offerer can cancel. The offerer signs `OrderCancellation`
 * off-chain, then the signed cancellation is submitted to `cancel_order`.
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

  const currentNonce = await contract.nonces(account.address);

  const cancelParams = {
    order_hash: orderHash,
    offerer: account.address,
    nonce: currentNonce.toString(),
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
