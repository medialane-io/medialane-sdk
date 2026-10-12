import { describe, expect, test } from "bun:test";
import { DropCollectionABI, DropFactoryABI } from "./index.js";

type Fn = { name: string; inputs: { name: string }[] };
type Entry = { type: string; name: string; items?: Fn[] };
const functions = (abi: readonly unknown[]) =>
  (abi as Entry[]).filter((e) => e.type === "interface").flatMap((e) => e.items ?? []);
const names = (abi: readonly unknown[]) => functions(abi).map((f) => f.name);

const FORBIDDEN = [
  "register_organizer", "upgrade", "grant_role", "revoke_role", "set_claim_conditions", "set_phase",
  "admin_mint", "set_paused", "set_base_uri", "set_token_uri", "set_allowlist_enabled",
  "add_to_allowlist", "batch_add_to_allowlist", "remove_from_allowlist", "withdraw_payments",
];

describe("Drop factory ABI", () => {
  test("exposes only creation and reads", () => {
    expect(names(DropFactoryABI).sort()).toEqual(
      ["create_drop", "get_collection_class_hash", "get_drop_address", "get_last_drop_id", "version"].sort(),
    );
  });

  test("create_drop takes name, symbol, base_uri, max_supply, terms, allowlist_root in that order", () => {
    const fn = functions(DropFactoryABI).find((f) => f.name === "create_drop")!;
    expect(fn.inputs.map((i) => i.name)).toEqual(["name", "symbol", "base_uri", "max_supply", "terms", "allowlist_root"]);
  });
});

describe("Drop collection ABI", () => {
  test("has the claim, issue and read surface", () => {
    const n = names(DropCollectionABI);
    for (const f of ["claim", "issue", "set_allowlist_root", "organizer", "terms", "allowlist_root", "max_supply", "total_minted", "claimed_by", "token_uri"]) {
      expect(n).toContain(f);
    }
  });

  test("has no administrative entrypoint", () => {
    const all = [...names(DropFactoryABI), ...names(DropCollectionABI)];
    for (const f of FORBIDDEN) expect(all).not.toContain(f);
  });
});
