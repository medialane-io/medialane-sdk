import { sameFelt } from "../../utils/felt.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function typedDataMatches(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, i) => typedDataMatches(item, b[i]));
  }
  if (isRecord(a) || isRecord(b)) {
    if (!isRecord(a) || !isRecord(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => key in b && typedDataMatches(a[key], b[key]));
  }
  return a === b || sameFelt(a, b);
}
