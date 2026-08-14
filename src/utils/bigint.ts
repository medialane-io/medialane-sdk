
export function stringifyBigInts(obj: unknown): unknown {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(stringifyBigInts);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        key,
        stringifyBigInts(value),
      ])
    );
  }
  return obj;
}

export function u256ToBigInt(low: string, high: string): bigint {
  return BigInt(low) + (BigInt(high) << 128n);
}

export function encodeU256(n: bigint): [string, string] {
  return [
    (n & 0xffffffffffffffffffffffffffffffffn).toString(),
    (n >> 128n).toString(),
  ];
}
