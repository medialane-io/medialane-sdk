/**
 * Same-origin guard for server routes. A missing `Origin` header is allowed,
 * because same-origin navigations and server-to-server calls do not send one;
 * a present `Origin` must match `Host`.
 *
 * Read that carefully before relying on it: this blocks cross-site *browser*
 * abuse, and nothing else. A non-browser client simply omits `Origin` and
 * passes. It is not a substitute for authentication, and on a route that
 * spends money or credits it must be paired with a rate limit and, where the
 * route touches a paid resource, real auth.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
