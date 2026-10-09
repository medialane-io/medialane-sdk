import { hash } from "starknet";
import { normalizeAddress } from "../utils/address.js";

export interface PopAllowlist {
  /** Merkle root to publish with `set_allowlist_root`. */
  root: string;
  /** Proof per address, keyed by normalized Starknet address. */
  proofs: Record<string, string[]>;
}

const FRAGMENT_KEY = "pop-proof";

const toHex = (x: bigint) => "0x" + x.toString(16).padStart(64, "0");
const poseidon = (xs: bigint[]) =>
  BigInt(hash.computePoseidonHashOnElements(xs.map((x) => "0x" + x.toString(16))));
const nodeHash = (a: bigint, b: bigint) => (a < b ? poseidon([a, b]) : poseidon([b, a]));

/** Leaf for an address: poseidon([poseidon([address])]), as the collection computes it. */
export function popLeafHash(address: string): bigint {
  return poseidon([poseidon([BigInt(address)])]);
}

/** OpenZeppelin standard tree over leaf hashes (sorted leaves, sorted-pair Poseidon nodes). */
export function merkleTree(leafHashes: bigint[]) {
  const leaves = [...leafHashes].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const tree: bigint[] = new Array(2 * leaves.length - 1);
  leaves.forEach((leaf, i) => (tree[tree.length - 1 - i] = leaf));
  for (let i = tree.length - 1 - leaves.length; i >= 0; i--) {
    tree[i] = nodeHash(tree[2 * i + 1]!, tree[2 * i + 2]!);
  }
  return {
    root: tree[0]!,
    proof(leaf: bigint): bigint[] {
      let i = tree.lastIndexOf(leaf);
      if (i < tree.length - leaves.length) throw new Error("Not a leaf of this tree");
      const proof: bigint[] = [];
      while (i > 0) {
        proof.push(tree[i % 2 === 1 ? i + 1 : i - 1]!);
        i = Math.floor((i - 1) / 2);
      }
      return proof;
    },
  };
}

export function buildPopAllowlist(addresses: string[]): PopAllowlist {
  const unique = [...new Set(addresses.map((a) => normalizeAddress("STARKNET", a)))];
  if (unique.length === 0) throw new Error("An allowlist needs at least one address");
  const leaves = unique.map((address) => ({ address, leaf: popLeafHash(address) }));
  const tree = merkleTree(leaves.map((l) => l.leaf));
  const proofs: Record<string, string[]> = {};
  for (const { address, leaf } of leaves) proofs[address] = tree.proof(leaf).map(toHex);
  return { root: toHex(tree.root), proofs };
}

/** True when `proof` places `address` under `root` — checked before sending a claim. */
export function verifyPopProof(root: string, address: string, proof: string[]): boolean {
  let computed = popLeafHash(address);
  for (const sibling of proof) computed = nodeHash(computed, BigInt(sibling));
  return computed === BigInt(root);
}

export function encodePopClaimFragment(proof: string[]): string {
  return `#${FRAGMENT_KEY}=${proof.join(",")}`;
}

/** The proof in a claim link's fragment; `null` when absent or malformed. */
export function decodePopClaimFragment(fragment: string): string[] | null {
  const raw = new URLSearchParams(fragment.replace(/^#/, "")).get(FRAGMENT_KEY);
  if (raw === null) return null;
  if (raw === "") return [];
  const parts = raw.split(",");
  return parts.every((p) => /^0x[0-9a-fA-F]{1,64}$/.test(p)) ? parts : null;
}
