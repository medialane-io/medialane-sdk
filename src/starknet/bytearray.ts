import { num } from "starknet";

/**
 * Serialize a string as Cairo ByteArray calldata felts using UTF-8 encoding.
 *
 * starknet.js byteArray.byteArrayFromString calls encodeShortString internally
 * which rejects non-ASCII characters (accented letters, CJK, Arabic, etc.).
 * This implementation packs raw UTF-8 bytes into 31-byte chunks as big-endian
 * felts, matching the Cairo ByteArray struct layout.
 *
 * Return layout: [chunks_len, ...chunk_felts, pending_word, pending_word_len]
 */
export function encodeByteArray(str: string): string[] {
  const bytes = new TextEncoder().encode(str);
  const fullChunks: string[] = [];

  let i = 0;
  while (i + 31 <= bytes.length) {
    let val = 0n;
    for (const b of bytes.slice(i, i + 31)) {
      val = (val << 8n) | BigInt(b);
    }
    fullChunks.push(num.toHex(val));
    i += 31;
  }

  const remaining = bytes.slice(i);
  let pendingVal = 0n;
  for (const b of remaining) {
    pendingVal = (pendingVal << 8n) | BigInt(b);
  }

  return [
    fullChunks.length.toString(),
    ...fullChunks,
    num.toHex(pendingVal),
    remaining.length.toString(),
  ];
}
