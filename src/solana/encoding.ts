import { sha256 } from "@noble/hashes/sha2.js";
import { PublicKey } from "@solana/web3.js";

/**
 * Anchor wire encoding for the Medialane Solana programs — discriminators,
 * a minimal borsh writer for our argument shapes, and the programs' PDAs.
 * Verified against the audited Rust (Solana-MIP-Collections,
 * Solana-Marketplace); no Anchor client dependency.
 */

export function instructionDiscriminator(name: string): Uint8Array {
  return sha256(new TextEncoder().encode(`global:${name}`)).slice(0, 8);
}

export function eventDiscriminator(name: string): Uint8Array {
  return sha256(new TextEncoder().encode(`event:${name}`)).slice(0, 8);
}

/** Minimal borsh writer covering our programs' argument types. */
export class BorshWriter {
  private chunks: Uint8Array[] = [];

  u8(v: number): this {
    this.chunks.push(Uint8Array.of(v));
    return this;
  }
  u16(v: number): this {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, v, true);
    this.chunks.push(b);
    return this;
  }
  u64(v: bigint): this {
    const b = new Uint8Array(8);
    new DataView(b.buffer).setBigUint64(0, v, true);
    this.chunks.push(b);
    return this;
  }
  i64(v: bigint): this {
    const b = new Uint8Array(8);
    new DataView(b.buffer).setBigInt64(0, v, true);
    this.chunks.push(b);
    return this;
  }
  string(v: string): this {
    const bytes = new TextEncoder().encode(v);
    const len = new Uint8Array(4);
    new DataView(len.buffer).setUint32(0, bytes.length, true);
    this.chunks.push(len, bytes);
    return this;
  }
  pubkey(v: PublicKey): this {
    this.chunks.push(v.toBytes());
    return this;
  }
  option<T>(v: T | null | undefined, write: (value: T) => void): this {
    if (v === null || v === undefined) {
      this.u8(0);
    } else {
      this.u8(1);
      write(v);
    }
    return this;
  }
  build(discriminator: Uint8Array): Uint8Array {
    const total = this.chunks.reduce((n, c) => n + c.length, discriminator.length);
    const out = new Uint8Array(total);
    out.set(discriminator, 0);
    let offset = discriminator.length;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

export function u64le(v: bigint): Uint8Array {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, v, true);
  return b;
}

// ─── PDAs (seeds copied from the Rust) ───────────────────────────────────────

export function orderPda(program: PublicKey, offerer: PublicKey, salt: bigint): PublicKey {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("order"), offerer.toBytes(), u64le(salt)],
    program,
  )[0];
}

export function counterPda(program: PublicKey, offerer: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("counter"), offerer.toBytes()],
    program,
  )[0];
}

export function settlementPda(program: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([new TextEncoder().encode("authority")], program)[0];
}

export function registryCounterPda(program: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([new TextEncoder().encode("counter")], program)[0];
}

export function collectionRecordPda(program: PublicKey, coreCollection: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("collection"), coreCollection.toBytes()],
    program,
  )[0];
}

export const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
