import { RpcProvider, constants } from "starknet";
import type { ResolvedConfig } from "../config.js";
import { SUPPORTED_TOKENS } from "../constants.js";
import { MedialaneError } from "./errors.js";

/** Seconds added to current unix time when setting order start_time.
 *  Provides buffer for Starknet tx inclusion (~6s blocks). */
export const START_TIME_BUFFER_SECS = 30;

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
    p = new RpcProvider({ nodeUrl: config.rpcUrl });
    _providerCache.set(config, p);
  }
  return p;
}
