import { isSameOrigin } from "./origin.js";

export const ACCOUNT_SESSION_COOKIE = "ml_account_session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const SIGN_IN_PATHS = new Set(["auth/email/register-account", "auth/email/verify-code", "auth/siws/verify"]);
const EDGE_CACHE_CONTROL = "public, s-maxage=30, stale-while-revalidate=120";
const DROPPED_REQUEST_HEADERS = new Set([
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers",
  "transfer-encoding", "upgrade", "host", "content-length", "accept-encoding", "cookie",
  "x-api-key", "x-app-id", "x-app-secret", "x-account-session", "authorization",
]);
const DROPPED_RESPONSE_HEADERS = new Set([
  "connection", "keep-alive", "transfer-encoding", "content-length", "content-encoding", "set-cookie",
]);

export interface AppGatewayConfig {
  appId: string;
  backendUrl: string;
  apiKey: string | undefined;
  appSecret?: string;
  allow: Record<string, RegExp[]>;
  cacheableGets?: RegExp[];
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq !== -1 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim() || null;
  }
  return null;
}

export function sessionCookie(value: string, maxAge = SESSION_MAX_AGE_SECONDS): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ACCOUNT_SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

export function createAppGateway(config: AppGatewayConfig): (req: Request, path: string[]) => Promise<Response> {
  const doFetch = config.fetchImpl ?? fetch;
  const base = config.backendUrl.replace(/\/$/, "");

  return async function appGateway(req, path) {
    if (!isSameOrigin(req)) return json({ error: "Cross-origin requests are not allowed" }, 403);
    if (!config.apiKey) return json({ error: "Service unavailable" }, 500);
    if (path.some((s) => s === "." || s === ".." || s === "")) return json({ error: "Invalid path" }, 400);

    const joined = path.join("/");
    const method = req.method.toUpperCase();
    if (!(config.allow[method] ?? []).some((re) => re.test(joined))) {
      return json({ error: `Path not allowed: ${method} /v1/${joined}` }, 403);
    }

    const headers = new Headers();
    req.headers.forEach((v, k) => {
      if (!DROPPED_REQUEST_HEADERS.has(k.toLowerCase())) headers.set(k, v);
    });
    headers.set("x-api-key", config.apiKey);
    headers.set("x-app-id", config.appId);
    if (config.appSecret) headers.set("x-app-secret", config.appSecret);
    const session = readCookie(req, ACCOUNT_SESSION_COOKIE);
    if (session) headers.set("x-account-session", session);

    const search = new URL(req.url).search;
    const target = `${base}/v1/${path.map(encodeURIComponent).join("/")}${search}`;
    const hasBody = method !== "GET" && method !== "HEAD";

    let res: Response;
    try {
      res = await doFetch(target, {
        method,
        headers,
        body: hasBody ? await req.arrayBuffer() : undefined,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(config.timeoutMs ?? 55_000),
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === "TimeoutError") {
        return json({ error: "The service took too long to respond" }, 504);
      }
      return json({ error: "Service unavailable" }, 502);
    }

    const out = new Headers();
    res.headers.forEach((v, k) => {
      if (!DROPPED_RESPONSE_HEADERS.has(k.toLowerCase())) out.set(k, v);
    });

    if (method === "POST" && res.ok && SIGN_IN_PATHS.has(joined)) {
      const text = await res.text();
      let body: Record<string, unknown> | null = null;
      try {
        body = JSON.parse(text) as Record<string, unknown>;
      } catch {
        body = null;
      }
      if (!body) return new Response(text, { status: res.status, headers: out });
      const token = typeof body.accountToken === "string" ? body.accountToken : null;
      delete body.accountToken;
      delete body.token;
      out.set("content-type", "application/json");
      if (token) out.append("set-cookie", sessionCookie(token));
      return new Response(JSON.stringify(body), { status: res.status, headers: out });
    }

    if (method === "GET" && res.ok && !session && (config.cacheableGets ?? []).some((re) => re.test(joined))) {
      out.set("cache-control", EDGE_CACHE_CONTROL);
    }
    return new Response(res.body, { status: res.status, headers: out });
  };
}
