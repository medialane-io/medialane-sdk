import type { ProviderInterface } from "starknet";
import { dropHref } from "../routes.js";
import { normalizeAddress } from "../utils/address.js";
import { DROP_MAX_CLAIM_QUANTITY, dropMintCost } from "./drop-calls.js";
import { encodePopClaimFragment, verifyPopProof, type PopAllowlist } from "./pop-allowlist.js";
import type { PopClaimLink } from "./pop-claim.js";

export interface DropOnchain {
  organizer: string;
  /** Unix seconds; 0 = open from creation. */
  startTime: number;
  /** Unix seconds; 0 = never closes. */
  endTime: number;
  price: bigint;
  paymentToken: string;
  /** 0 = unlimited. */
  maxPerWallet: bigint;
  /** 0x0 = open to everyone. */
  allowlistRoot: string;
  /** 0 = no cap. */
  maxSupply: bigint;
  totalMinted: bigint;
}

const hex = (v: string | undefined) => normalizeAddress("STARKNET", v ?? "0x0");
const u256 = (low: string | undefined, high: string | undefined) =>
  BigInt(low ?? "0x0") + (BigInt(high ?? "0x0") << 128n);

/** A drop's organizer, terms, allowlist root and supply, read from chain. */
export async function readDrop(provider: Pick<ProviderInterface, "callContract">, collection: string): Promise<DropOnchain> {
  const contractAddress = hex(collection);
  const read = (entrypoint: string) => provider.callContract({ contractAddress, entrypoint, calldata: [] });
  const [organizer, terms, root, max, minted] = await Promise.all([
    read("organizer"), read("terms"), read("allowlist_root"), read("max_supply"), read("total_minted"),
  ]);
  return {
    organizer: hex(organizer[0]),
    startTime: Number(BigInt(terms[0] ?? "0x0")),
    endTime: Number(BigInt(terms[1] ?? "0x0")),
    price: u256(terms[2], terms[3]),
    paymentToken: hex(terms[4]),
    maxPerWallet: u256(terms[5], terms[6]),
    allowlistRoot: root[0] ?? "0x0",
    maxSupply: u256(max[0], max[1]),
    totalMinted: u256(minted[0], minted[1]),
  };
}

/** How many tokens `wallet` has claimed from this drop (gifts not included). */
export async function dropClaimedBy(
  provider: Pick<ProviderInterface, "callContract">,
  collection: string,
  wallet: string,
): Promise<bigint> {
  const res = await provider.callContract({ contractAddress: hex(collection), entrypoint: "claimed_by", calldata: [hex(wallet)] });
  return u256(res[0], res[1]);
}

export type DropMintStateKind =
  | "loading" | "upcoming" | "ended" | "sold-out" | "no-wallet" | "no-link"
  | "not-on-list" | "limit-reached" | "insufficient-balance" | "ready";

export interface DropMintState {
  state: DropMintStateKind;
  /** Largest quantity this wallet can claim now; 0 unless `ready`. */
  maxQuantity: bigint;
}

/** What the mint button should show, decided before any transaction is sent. */
export function dropMintState(input: {
  drop: DropOnchain | null;
  wallet: string | null;
  /** `claimed_by(wallet)`; null while loading. */
  claimed: bigint | null;
  /** From the claim link; null when the page was opened without one. */
  proof: string[] | null;
  /** Wallet balance of the payment token; null while loading (ignored for free drops). */
  balance: bigint | null;
  /** Platform fee added to a mint, in basis points. */
  feeBps: number;
  /** Unix seconds. */
  now: number;
}): DropMintState {
  const none = (state: DropMintStateKind): DropMintState => ({ state, maxQuantity: 0n });
  const { drop, wallet, claimed, proof, balance, now } = input;
  if (!drop) return none("loading");
  if (drop.startTime !== 0 && now < drop.startTime) return none("upcoming");
  if (drop.endTime !== 0 && now > drop.endTime) return none("ended");
  const supplyLeft = drop.maxSupply === 0n ? null : drop.maxSupply - drop.totalMinted;
  if (supplyLeft !== null && supplyLeft <= 0n) return none("sold-out");
  if (!wallet) return none("no-wallet");
  if (BigInt(drop.allowlistRoot) !== 0n) {
    if (proof === null) return none("no-link");
    if (!verifyPopProof(drop.allowlistRoot, wallet, proof)) return none("not-on-list");
  }
  if (claimed === null) return none("loading");
  const walletLeft = drop.maxPerWallet === 0n ? null : drop.maxPerWallet - claimed;
  if (walletLeft !== null && walletLeft <= 0n) return none("limit-reached");

  let max = DROP_MAX_CLAIM_QUANTITY;
  if (supplyLeft !== null && supplyLeft < max) max = supplyLeft;
  if (walletLeft !== null && walletLeft < max) max = walletLeft;
  if (drop.price > 0n) {
    if (balance === null) return none("loading");
    while (max > 0n && dropMintCost(drop.price, max, input.feeBps).total > balance) max--;
    if (max === 0n) return none("insufficient-balance");
  }
  return { state: "ready", maxQuantity: max };
}

/** One claim link per allowlisted address: the drop page with the proof in its fragment. */
export function dropClaimLinks(origin: string, collection: string, list: PopAllowlist): PopClaimLink[] {
  const base = `${origin}${dropHref(collection)}`;
  return Object.entries(list.proofs).map(([address, proof]) => ({
    address,
    url: `${base}${encodePopClaimFragment(proof)}`,
  }));
}
