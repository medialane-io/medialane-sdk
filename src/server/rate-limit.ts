export function createRateLimiter(windowMs: number, max: number) {
  const counts = new Map<string, { count: number; resetAt: number }>();
  let nextSweepAt = Date.now() + windowMs;

  return function checkRateLimit(key: string): boolean {
    const now = Date.now();

    if (now >= nextSweepAt) {
      for (const [k, entry] of counts) {
        if (now >= entry.resetAt) counts.delete(k);
      }
      nextSweepAt = now + windowMs;
    }

    const entry = counts.get(key);
    if (!entry || now >= entry.resetAt) {
      counts.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= max) return false;
    entry.count += 1;
    return true;
  };
}

export const TRUSTED_APP_IP_HEADER = "x-medialane-client-ip";

export function requestIp(req: Request): string {
  const fromApp = req.headers.get(TRUSTED_APP_IP_HEADER)?.trim();
  if (fromApp) return fromApp;

  const fromEdge = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (fromEdge) return fromEdge;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((hop) => hop.trim()).filter(Boolean);
    const nearest = hops[hops.length - 1];
    if (nearest) return nearest;
  }

  return "unknown";
}
