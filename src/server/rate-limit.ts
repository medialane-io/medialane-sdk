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

export function requestIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}
