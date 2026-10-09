import { describe, expect, test } from "bun:test";
import { CallData } from "starknet";
import { POPCollectionABI, POPFactoryABI } from "./index.js";
import { popHasClaimed } from "../services/pop.js";

type Fn = { name: string; inputs: { name: string }[] };
type Entry = { type: string; name: string; items?: Fn[] };
const functions = (abi: readonly unknown[]) =>
  (abi as Entry[]).filter((e) => e.type === "interface").flatMap((e) => e.items ?? []);
const names = (abi: readonly unknown[]) => functions(abi).map((f) => f.name);

const FORBIDDEN = [
  "upgrade", "register_provider", "revoke_provider", "grant_role", "revoke_role",
  "set_pop_collection_class_hash", "admin_mint", "set_paused", "set_base_uri",
  "set_token_uri", "add_to_allowlist", "batch_add_to_allowlist", "remove_from_allowlist",
];

describe("POP factory ABI", () => {
  test("exposes only creation and reads", () => {
    expect(names(POPFactoryABI).sort()).toEqual(
      ["create_collection", "get_collection_address", "get_collection_class_hash", "get_last_collection_id", "version"].sort(),
    );
  });

  test("create_collection takes name, symbol, base_uri, claim_end_time in that order", () => {
    const fn = functions(POPFactoryABI).find((f) => f.name === "create_collection")!;
    expect(fn.inputs.map((i) => i.name)).toEqual(["name", "symbol", "base_uri", "claim_end_time"]);
    const calldata = new CallData(POPFactoryABI as never).compile("create_collection", {
      name: "Pilot", symbol: "PLT", base_uri: "ipfs://x", claim_end_time: 1700000000,
    });
    expect(calldata.at(-1)).toBe("1700000000");
  });
});

describe("POP collection ABI", () => {
  test("has the claim, issue and soulbound surface", () => {
    const n = names(POPCollectionABI);
    for (const f of ["set_allowlist_root", "claim", "issue", "has_claimed", "organizer", "locked", "token_uri"]) {
      expect(n).toContain(f);
    }
  });

  test("has no administrative entrypoint", () => {
    const all = [...names(POPFactoryABI), ...names(POPCollectionABI)];
    for (const f of FORBIDDEN) expect(all).not.toContain(f);
  });
});

describe("popHasClaimed", () => {
  test("reads has_claimed with normalized addresses", async () => {
    const calls: unknown[] = [];
    const provider = { callContract: async (req: unknown) => { calls.push(req); return ["0x1"]; } };
    expect(await popHasClaimed(provider as never, "0xabc", "0x1")).toBe(true);
    expect(calls[0]).toEqual({
      contractAddress: "0x" + "abc".padStart(64, "0"),
      entrypoint: "has_claimed",
      calldata: ["0x" + "1".padStart(64, "0")],
    });
  });
});
