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


export function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0") return true;

  if (/^\d+$/.test(h)) {
    const n = parseInt(h, 10);
    if (
      n === 2130706433 ||
      n === 0 ||
      (n >= 0xac100000 && n <= 0xac1fffff) ||
      (n >= 0xc0a80000 && n <= 0xc0a8ffff) ||
      (n >= 0x0a000000 && n <= 0x0affffff) ||
      (n >= 0xa9fe0000 && n <= 0xa9feffff)
    ) return true;
  }

  if (/^0x[0-9a-f]+$/i.test(h)) {
    const n = parseInt(h, 16);
    if (
      n === 0x7f000001 ||
      n === 0 ||
      (n >= 0xac100000 && n <= 0xac1fffff) ||
      (n >= 0xc0a80000 && n <= 0xc0a8ffff) ||
      (n >= 0x0a000000 && n <= 0x0affffff) ||
      (n >= 0xa9fe0000 && n <= 0xa9feffff)
    ) return true;
  }

  if (/^0\d+\.\d+\.\d+\.\d+$/.test(h)) return true;

  if (h === "::1" || /^0*:0*:0*:0*:0*:0*:0*:0*1$/.test(h)) return true;

  const v4mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4mapped) return isPrivateHost(v4mapped[1]);

  if (/^10\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return true;

  if (/^fe80:/i.test(h)) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(h)) return true;

  if (h.endsWith(".local")) return true;
  if (h === "metadata.google.internal") return true;
  if (h === "metadata.azure.internal") return true;

  return false;
}


export function validateUrl(raw: string): { url: URL } | { error: string; status: number } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { error: "Invalid url", status: 400 };
  }

  if (parsed.protocol !== "https:") {
    return { error: "Only https URLs allowed", status: 400 };
  }

  if (parsed.username || parsed.password) {
    return { error: "URL credentials not allowed", status: 400 };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { error: "URL not allowed", status: 400 };
  }

  return { url: parsed };
}

