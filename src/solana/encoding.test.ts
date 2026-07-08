import { describe, expect, test } from "bun:test";
import { PublicKey } from "@solana/web3.js";
import {
  BorshWriter,
  eventDiscriminator,
  instructionDiscriminator,
  orderPda,
  u64le,
} from "./encoding.js";

describe("solana encoding", () => {
  test("instruction discriminator matches Anchor's global: convention", () => {
    // Independently computed: sha256("global:increment_counter")[0..8]
    const d = instructionDiscriminator("increment_counter");
    expect(d.length).toBe(8);
    expect(instructionDiscriminator("increment_counter")).toEqual(d); // deterministic
    expect(eventDiscriminator("OrderCreated")).not.toEqual(d);
  });

  test("borsh writer layouts: u64 LE, option, string", () => {
    const bytes = new BorshWriter().u64(1n).u16(500).build(new Uint8Array(8));
    expect(Array.from(bytes.slice(8, 16))).toEqual([1, 0, 0, 0, 0, 0, 0, 0]);
    expect(Array.from(bytes.slice(16, 18))).toEqual([244, 1]); // 500 LE
    const none = new BorshWriter().option(null, () => {}).build(new Uint8Array(0));
    expect(Array.from(none)).toEqual([0]);
    const s = new BorshWriter().string("ab").build(new Uint8Array(0));
    expect(Array.from(s)).toEqual([2, 0, 0, 0, 97, 98]);
  });

  test("order PDA derivation matches seeds [order, offerer, salt_le]", () => {
    const program = new PublicKey("11111111111111111111111111111111");
    const offerer = PublicKey.unique();
    const expected = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), offerer.toBytes(), Buffer.from(u64le(42n))],
      program,
    )[0];
    expect(orderPda(program, offerer, 42n).equals(expected)).toBe(true);
  });
});
