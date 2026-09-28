import { TRUSTED_APP_IP_HEADER } from "./rate-limit.js";

const SPOOFABLE_FORWARDING_HEADERS = [
  "x-forwarded-for",
  "x-real-ip",
  "x-client-ip",
  "true-client-ip",
  "cf-connecting-ip",
  TRUSTED_APP_IP_HEADER,
];

export function isSpoofableForwardingHeader(name: string): boolean {
  return SPOOFABLE_FORWARDING_HEADERS.includes(name.toLowerCase());
}

// Trusted only when called on the edge/platform-forwarded headers of an
// inbound request — never on a header a caller could set itself. Use this to
// compute the IP an app's own server forwards onward as TRUSTED_APP_IP_HEADER;
// do not use it to read that header back (see requestIp in rate-limit.ts).
export function trustedClientIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((hop) => hop.trim()).filter(Boolean);
    const nearest = hops[hops.length - 1];
    if (nearest) return nearest;
  }

  return "unknown";
}
