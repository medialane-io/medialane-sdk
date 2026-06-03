import { RpcProvider, cairo, constants, num } from "starknet";
import type { ResolvedConfig } from "../config.js";
import { SUPPORTED_TOKENS } from "../constants.js";
import { MedialaneError } from "./errors.js";
import { createFailoverFetch, PUBLIC_RPC_FALLBACKS } from "../utils/rpc.js";

/** Seconds added to current unix time when setting order start_time.
 *  Provides buffer for Starknet tx inclusion (~6s blocks). */
export const START_TIME_BUFFER_SECS = 30;

/** Full-felt (248-bit) random salt. With the redesigned schema, salt is the
 *  sole order-hash uniqueness source (nonce was removed), so it must be wide. */
export function generateSalt(): string {
  const bytes = new Uint8Array(31);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return num.toHex(BigInt("0x" + hex));
}

/** The signed EIP-2981 royalty cap (bps) for an order. Reads the NFT's live
 *  2981 rate via `royalty_info(tokenId, 10000)` — the returned amount equals the
 *  bps when salePrice is 10000. Any non-2981 NFT or failure yields "0" (no
 *  royalty — never over-pay). An explicit override short-circuits the read. */
export async function resolveRoyaltyMaxBps(
  provider: RpcProvider,
  nft: string,
  tokenId: string,
  override?: string,
): Promise<string> {
  if (override !== undefined) return override;
  try {
    const id = cairo.uint256(tokenId);
    const res = await provider.callContract({
      contractAddress: nft,
      entrypoint: "royalty_info",
      calldata: [id.low.toString(), id.high.toString(), "10000", "0"],
    });
    // returns [receiver, amount.low, amount.high]; amount == bps at salePrice 10000
    return BigInt(res[1] ?? "0").toString();
  } catch {
    return "0";
  }
}

export function toSignatureArray(sig: unknown): string[] {
  if (Array.isArray(sig)) return sig as string[];
  const s = sig as { r: bigint | string; s: bigint | string };
  return [s.r.toString(), s.s.toString()];
}

export function getChainId(_config: ResolvedConfig): constants.StarknetChainId {
  return constants.StarknetChainId.SN_MAIN;
}

export function resolveToken(currency: string) {
  const token = SUPPORTED_TOKENS.find(
    (t) => t.symbol === currency.toUpperCase() || t.address.toLowerCase() === currency.toLowerCase()
  );
  if (!token) throw new MedialaneError(`Unsupported currency: ${currency}`, "INVALID_PARAMS");
  return token;
}

const _providerCache = new WeakMap<ResolvedConfig, RpcProvider>();

export function getProvider(config: ResolvedConfig): RpcProvider {
  let p = _providerCache.get(config);
  if (!p) {
    // Fail over to public endpoints when the configured RPC (often Alchemy)
    // returns a transient error — e.g. the intermittent 503 / -32001 that
    // stalls reads (get_counter, royalty_info) and waitForTransaction loops.
    const urls = Array.from(new Set([config.rpcUrl, ...PUBLIC_RPC_FALLBACKS]));
    p = new RpcProvider({ nodeUrl: urls[0], baseFetch: createFailoverFetch(urls) });
    _providerCache.set(config, p);
  }
  return p;
}
