export const ALLOWED_IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "image/bmp",
  "image/tiff",
]);

export const MAX_IMAGE_REDIRECTS = 5;

export const MAX_IMAGE_PROXY_BYTES = 15 * 1024 * 1024;

/**
 * Whether a hostname or IP literal points somewhere a server must not be
 * tricked into fetching: loopback, private ranges, link-local, cloud metadata.
 *
 * Addresses are parsed into bytes rather than pattern-matched, because one
 * address has many textual forms — 127.0.0.1, 2130706433, 0x7f000001,
 * 017700000001 and ::ffff:127.0.0.1 are all loopback. A check that reasons
 * about the string has to enumerate encodings and will eventually miss one;
 * this reasons about the value.
 *
 * DNS resolution deliberately stays in the caller: it needs a resolver, which
 * differs per runtime, and this module is isomorphic. Anything accepting a
 * user-supplied URL must resolve the hostname and re-check every address that
 * comes back, since a public-looking name can resolve to a private address.
 */

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const bytes: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    bytes.push(n);
  }
  return bytes;
}

function isPrivateIpv4(bytes: number[]): boolean {
  const a = bytes[0]!;
  const b = bytes[1]!;
  const c = bytes[2]!;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 0 && c === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function expandIpv6(rawIp: string): number[] | null {
  let ip = rawIp;

  let embeddedV4: number[] | null = null;
  const v4Tail = ip.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4Tail && ip.includes(":")) {
    embeddedV4 = parseIpv4(v4Tail[1]!);
    if (!embeddedV4) return null;
    ip = ip.slice(0, ip.length - v4Tail[1]!.length) + "0:0";
  }

  const sides = ip.split("::");
  if (sides.length > 2) return null;

  const head = sides[0] ? sides[0].split(":").filter(Boolean) : [];
  const tail = sides.length === 2 && sides[1] ? sides[1].split(":").filter(Boolean) : [];

  let groups: string[];
  if (sides.length === 1) {
    groups = head;
    if (groups.length !== 8) return null;
  } else {
    const missing = 8 - head.length - tail.length;
    if (missing < 0) return null;
    groups = [...head, ...Array(missing).fill("0"), ...tail];
  }
  if (groups.length !== 8) return null;

  const bytes: number[] = [];
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null;
    const n = parseInt(group, 16);
    bytes.push((n >> 8) & 0xff, n & 0xff);
  }

  if (embeddedV4) {
    bytes[12] = embeddedV4[0]!;
    bytes[13] = embeddedV4[1]!;
    bytes[14] = embeddedV4[2]!;
    bytes[15] = embeddedV4[3]!;
  }

  return bytes;
}

function isPrivateIpv6(bytes: number[]): boolean {
  if (bytes.every((b) => b === 0)) return true;
  if (bytes.slice(0, 15).every((b) => b === 0) && bytes[15] === 1) return true;
  if ((bytes[0]! & 0xfe) === 0xfc) return true;
  if (bytes[0] === 0xfe && (bytes[1]! & 0xc0) === 0x80) return true;

  if (bytes.slice(0, 10).every((b) => b === 0) && bytes[10] === 0xff && bytes[11] === 0xff) {
    return isPrivateIpv4(bytes.slice(12));
  }
  return false;
}

/** Reads a whole number in inet_aton's radix rules, without the 0-255 octet cap. */
function parseNumber(part: string): number | null {
  if (/^0x[0-9a-f]+$/i.test(part)) return parseInt(part.slice(2), 16);
  if (/^0[0-7]+$/.test(part)) return parseInt(part, 8);
  if (/^\d+$/.test(part)) return parseInt(part, 10);
  return null;
}

/**
 * Rewrites any inet_aton-accepted spelling of an IPv4 address into dotted
 * decimal. That covers more than four dotted decimal octets: each part may be
 * decimal, octal or hex, and a short form packs the remaining bytes into the
 * last part — so `127.1`, `0177.0.0.1`, `2130706433` and `0x7f000001` are all
 * loopback, and a resolver will treat them as such even though none of them
 * look like `127.0.0.1`.
 */
function normalizeNumericHostname(host: string): string | null {
  const parts = host.trim().split(".");
  if (parts.length < 1 || parts.length > 4) return null;

  const values: number[] = [];
  for (const part of parts) {
    const value = parseNumber(part);
    if (value === null || value < 0) return null;
    values.push(value);
  }

  // Every part but the last is a single byte; the last absorbs what remains.
  const leading = values.slice(0, -1);
  if (leading.some((v) => v > 255)) return null;

  const tail = values[values.length - 1]!;
  const tailBytes = 4 - leading.length;
  if (tail > 2 ** (8 * tailBytes) - 1) return null;

  const bytes = [...leading];
  for (let i = tailBytes - 1; i >= 0; i--) bytes.push((tail >>> (8 * i)) & 0xff);

  return bytes.join(".");
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.azure.internal",
]);

export function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;

  const candidate = normalizeNumericHostname(host) ?? host;

  const v4 = parseIpv4(candidate);
  if (v4) return isPrivateIpv4(v4);

  const v6 = expandIpv6(candidate);
  if (v6) return isPrivateIpv6(v6);

  return false;
}

/**
 * Validates a URL before it is fetched server-side. `requireHttps` is on by
 * default; callers that legitimately accept plain http (a metadata URI already
 * committed on chain, say) opt out explicitly rather than the guard being
 * lenient for everyone.
 */
export function validateUrl(
  raw: string,
  options: { requireHttps?: boolean } = {},
): { url: URL } | { error: string; status: number } {
  const requireHttps = options.requireHttps ?? true;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { error: "Invalid url", status: 400 };
  }

  if (requireHttps && parsed.protocol !== "https:") {
    return { error: "Only https URLs allowed", status: 400 };
  }

  if (!requireHttps && parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { error: "Only http and https URLs allowed", status: 400 };
  }

  if (parsed.username || parsed.password) {
    return { error: "URL credentials not allowed", status: 400 };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { error: "URL not allowed", status: 400 };
  }

  return { url: parsed };
}

/** Convenience for callers that only need a yes/no, mirroring the backend's prior helper. */
export function isPrivateOrInsecureUrl(raw: string, requireHttps = true): boolean {
  return "error" in validateUrl(raw, { requireHttps });
}
