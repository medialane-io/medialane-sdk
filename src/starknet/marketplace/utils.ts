import { Contract, RpcProvider, cairo, constants, num, type Abi } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { SUPPORTED_TOKENS } from "../../constants.js";
import { MedialaneError } from "./errors.js";
import { createFailoverFetch, PUBLIC_RPC_FALLBACKS } from "../../utils/rpc.js";

export const START_TIME_BUFFER_SECS = 30;

export function generateSalt(): string {
  const bytes = new Uint8Array(31);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return num.toHex(BigInt("0x" + hex));
}

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

export function newContract(abi: Abi, address: string, providerOrAccount?: unknown): Contract {
  const C = Contract as unknown as { length: number };
  return C.length === 1
    ? new (Contract as unknown as new (opts: unknown) => Contract)({ abi, address, providerOrAccount })
    : new (Contract as unknown as new (a: Abi, addr: string, p?: unknown) => Contract)(
        abi,
        address,
        providerOrAccount,
      );
}

export function getChainId(config: ResolvedConfig): constants.StarknetChainId {

  if (config.chain !== "STARKNET") {
    throw new Error(`SNIP-12 signing is Starknet-only; got chain "${config.chain}"`);
  }
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

    const urls = Array.from(new Set([config.rpcUrl, ...PUBLIC_RPC_FALLBACKS]));
    p = new RpcProvider({ nodeUrl: urls[0], baseFetch: createFailoverFetch(urls) });
    _providerCache.set(config, p);
  }
  return p;
}
