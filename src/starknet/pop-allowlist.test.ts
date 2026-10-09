import { describe, expect, test } from "bun:test";
import { hash } from "starknet";
import {
  buildPopAllowlist,
  decodePopClaimFragment,
  encodePopClaimFragment,
  merkleTree,
  popLeafHash,
  verifyPopProof,
} from "./pop-allowlist.js";

const H = (xs: bigint[]) => BigInt(hash.computePoseidonHashOnElements(xs.map((x) => "0x" + x.toString(16))));
const hex = (x: bigint) => "0x" + x.toString(16).padStart(64, "0");
const key = (a: string) => "0x" + a.slice(2).padStart(64, "0");

describe("merkle tree", () => {
  test("matches OpenZeppelin's published poseidon vector", () => {
    // openzeppelin_merkle_tree, tests/merkle_proof/test_with_poseidon.cairo
    const leaves: [bigint, bigint][] = [
      [0x7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc8n, 0xfc104e31d098d1ab488fc1acaeb0269n],
      [0x7ffffffffffffffffffffffffffffffffffffffffffffffffffffc66ca5c000n, 0xfc104e31d098d1ab488fc1acaeb0269n],
      [0x6a1f098854799debccf2d3c4059ff0f02dbfef6673dc1fcbfffffffffffffc8n, 0xfc104e31d098d1ab488fc1acaeb0269n],
      [0xfa6541b7909bfb5e8585f1222fcf272eea352c7e0e8ed38c988bd1e2a85e82n, 0xaa8565d732c2c9fa5f6c001d89d5c219n],
    ];
    const hashes = leaves.map(([a, m]) => H([H([a, m])]));
    const tree = merkleTree(hashes);
    expect(hex(tree.root)).toBe("0x013f43fdca44b32f5334414b385b46aa1016d0172a1f066eab4cc93636426fcc");
    expect(tree.proof(hashes[0]!).map(hex)).toEqual([
      "0x05b151ebb9201ce27c56a70f5d0571ccfb9d9d62f12b8ccab7801ba87ec21a2f",
      "0x002b7d689bd2ff488fd06dfb8eb22f5cdaba1e5d9698d3fabff2f1801852dbb2",
    ]);
  });
});

describe("buildPopAllowlist", () => {
  // Same vector the Cairo tests verify (contracts/Pop-Protocol/tests/utils.cairo).
  test("produces the root and proofs the contract verifies", () => {
    const list = buildPopAllowlist(["0x111", "0x222", "0x333"]);
    expect(list.root).toBe("0x055671b388a2640bb77a4a14b1650b4e2b08731a6e1bd966a642ddbaf2f150cb");
    expect(list.proofs[key("0x111")]).toEqual([
      "0x03b85dadc24bd0f247859d1bdbefd71e59ec8c554f586cb92aa90a1070d08abe",
      "0x03f24a6254d5b5f354998d1ad80fc04404b404232d43c44f2b25420044a96366",
    ]);
    expect(list.proofs[key("0x333")]).toEqual([
      "0x077a4a0f02dd99ad227cbb952c3e9fc6d3ec8f3b247a605649eb55d95c8ce73b",
    ]);
  });

  test("dedupes addresses that differ only in case or zero padding", () => {
    const list = buildPopAllowlist(["0xABC", "0x0abc", "0xabc", "0x111"]);
    expect(Object.keys(list.proofs)).toHaveLength(2);
    expect(list.root).toBe(buildPopAllowlist(["0x111", "0xabc"]).root);
  });

  test("a single address has an empty proof that round-trips through the link", () => {
    const list = buildPopAllowlist(["0x111"]);
    expect(list.root).toBe(hex(popLeafHash("0x111")));
    const proof = Object.values(list.proofs)[0]!;
    expect(proof).toEqual([]);
    expect(decodePopClaimFragment(encodePopClaimFragment(proof))).toEqual([]);
    expect(verifyPopProof(list.root, "0x111", [])).toBe(true);
  });

  test("rejects an empty list", () => {
    expect(() => buildPopAllowlist([])).toThrow();
  });
});

describe("verifyPopProof", () => {
  const list = buildPopAllowlist(["0x111", "0x222", "0x333"]);

  test("accepts the listed address", () => {
    expect(verifyPopProof(list.root, "0x222", list.proofs[key("0x222")]!)).toBe(true);
  });

  test("rejects another wallet using someone's link", () => {
    expect(verifyPopProof(list.root, "0x999", list.proofs[key("0x222")]!)).toBe(false);
  });
});

describe("claim link fragment", () => {
  test("round-trips a proof", () => {
    const proof = ["0x03b85dadc24bd0f247859d1bdbefd71e59ec8c554f586cb92aa90a1070d08abe", "0x1"];
    expect(encodePopClaimFragment(proof)).toBe(`#pop-proof=${proof.join(",")}`);
    expect(decodePopClaimFragment(encodePopClaimFragment(proof))).toEqual(proof);
  });

  test("returns null when the fragment has no proof", () => {
    expect(decodePopClaimFragment("")).toBeNull();
    expect(decodePopClaimFragment("#other=1")).toBeNull();
  });

  test("returns null for a malformed proof", () => {
    expect(decodePopClaimFragment("#pop-proof=0x1,nothex")).toBeNull();
  });
});
