import { CallData, byteArray, cairo, type Call, type ProviderInterface } from "starknet";
import { collectionHref } from "../routes.js";
import { normalizeAddress } from "../utils/address.js";
import { encodePopClaimFragment, verifyPopProof, type PopAllowlist } from "./pop-allowlist.js";

export interface PopClaimLink {
  address: string;
  url: string;
}

/** One claim link per allowlisted address: the collection page with the proof in its fragment. */
export function popClaimLinks(origin: string, collection: string, list: PopAllowlist): PopClaimLink[] {
  const base = `${origin}${collectionHref("STARKNET", collection)}`;
  return Object.entries(list.proofs).map(([address, proof]) => ({
    address,
    url: `${base}${encodePopClaimFragment(proof)}`,
  }));
}

export function popClaimLinksCsv(links: PopClaimLink[]): string {
  return ["address,claim_link", ...links.map((l) => `${l.address},${l.url}`)].join("\n");
}

export interface PopClaimInfo {
  /** Allowlist Merkle root; 0 when claims are closed. */
  root: string;
  /** Unix seconds; 0 = no deadline. */
  claimEndTime: number;
}

/** Reads a collection's allowlist root and claim deadline from chain. */
export async function popClaimInfo(
  provider: Pick<ProviderInterface, "callContract">,
  collection: string,
): Promise<PopClaimInfo> {
  const contractAddress = normalizeAddress("STARKNET", collection);
  const [root, end] = await Promise.all([
    provider.callContract({ contractAddress, entrypoint: "allowlist_root", calldata: [] }),
    provider.callContract({ contractAddress, entrypoint: "claim_end_time", calldata: [] }),
  ]);
  return { root: root[0] ?? "0x0", claimEndTime: Number(BigInt(end[0] ?? "0x0")) };
}

export type PopClaimState = "loading" | "claimed" | "closed" | "ended" | "no-link" | "wrong-wallet" | "ready";

/** What a claim page should show, decided before any transaction is sent. */
export function popClaimState(input: {
  hasClaimed: boolean | null;
  proof: string[] | null;
  wallet: string | null;
  /** The collection's claim settings, with `now` in Unix seconds. */
  info: (PopClaimInfo & { now: number }) | null;
}): PopClaimState {
  const { hasClaimed, proof, wallet, info } = input;
  if (hasClaimed === true) return "claimed";
  if (hasClaimed === null || info === null) return "loading";
  if (BigInt(info.root) === 0n) return "closed";
  if (info.claimEndTime !== 0 && info.now > info.claimEndTime) return "ended";
  if (proof === null) return "no-link";
  if (!wallet || !verifyPopProof(info.root, wallet, proof)) return "wrong-wallet";
  return "ready";
}

const addr = (a: string) => normalizeAddress("STARKNET", a);
const byteArrayFelts = (s: string) => CallData.compile([byteArray.byteArrayFromString(s)]);

/** Calls on a POP collection, ready for `account.execute` or a sponsored transaction. */
export const popCalls = {
  claim(collection: string, proof: string[]): Call {
    return { contractAddress: addr(collection), entrypoint: "claim", calldata: [String(proof.length), ...proof] };
  },
  /** An empty `tokenUri` uses the collection's URI. */
  issue(collection: string, recipient: string, tokenUri = ""): Call {
    return { contractAddress: addr(collection), entrypoint: "issue", calldata: [addr(recipient), ...byteArrayFelts(tokenUri)] };
  },
  /** Only the token's holder can burn it. */
  burn(collection: string, tokenId: string | bigint): Call {
    const id = cairo.uint256(BigInt(tokenId));
    return { contractAddress: addr(collection), entrypoint: "burn", calldata: [String(id.low), String(id.high)] };
  },
  setAllowlistRoot(collection: string, root: string): Call {
    return { contractAddress: addr(collection), entrypoint: "set_allowlist_root", calldata: [root] };
  },
};
