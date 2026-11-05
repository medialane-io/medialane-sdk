import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_PROXY_BYTES,
  MAX_IMAGE_REDIRECTS,
  validateUrl,
} from "./ssrf-guard.js";
import { guardedGet } from "./guarded-get.js";
import type { AppGatewayConfig } from "./app-gateway.js";

export interface ImageProxyConfig {
  get?: (url: URL, headers: Record<string, string>, signal: AbortSignal) => Promise<Response>;
  timeoutMs?: number;
  userAgent?: string;
  backend?: Pick<AppGatewayConfig, "appId" | "backendUrl" | "apiKey" | "appSecret">;
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; Medialane/1.0; +https://www.medialane.io)";

const DEFAULT_TIMEOUT_MS = 55_000;

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export interface CappedBody {
  ok: boolean;
  body?: Uint8Array;
  error?: string;
  status?: number;
}

export async function readBodyWithCap(res: Response, maxBytes: number): Promise<CappedBody> {
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > maxBytes) {
    return { ok: false, error: "Image too large", status: 413 };
  }

  const reader = res.body?.getReader();
  if (!reader) return { ok: false, error: "Empty response body", status: 502 };

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return { ok: false, error: "Image too large", status: 413 };
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, body };
}

export function createImageProxyHandler(
  config: ImageProxyConfig,
): (req: Request) => Promise<Response> {
  const get = config.get ?? guardedGet;
  const userAgent = config.userAgent ?? DEFAULT_USER_AGENT;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const backendOrigin = config.backend ? new URL(config.backend.backendUrl).origin : null;

  function headersFor(url: URL): Record<string, string> {
    const headers: Record<string, string> = { "User-Agent": userAgent };
    if (!config.backend || url.origin !== backendOrigin) return headers;
    if (config.backend.apiKey) headers["x-api-key"] = config.backend.apiKey;
    headers["x-app-id"] = config.backend.appId;
    if (config.backend.appSecret) headers["x-app-secret"] = config.backend.appSecret;
    return headers;
  }

  async function discard(res: Response): Promise<void> {
    await res.body?.cancel().catch(() => {});
  }

  async function safeFetch(url: URL, hopsLeft: number, signal: AbortSignal): Promise<Response> {
    if (hopsLeft < 0) throw new Error("Too many redirects");

    const res = await get(url, headersFor(url), signal);

    if (res.status >= 300 && res.status < 400) {
      await discard(res);
      const location = res.headers.get("location");
      if (!location) throw new Error("Redirect with no Location header");

      const next = new URL(location, url);
      const validated = validateUrl(next.toString());
      if ("error" in validated) throw new Error(`Redirect blocked: ${validated.error}`);

      return safeFetch(validated.url, hopsLeft - 1, signal);
    }

    return res;
  }

  return async function handleImageProxy(req: Request): Promise<Response> {
    const raw = new URL(req.url).searchParams.get("url");
    if (!raw) return jsonError("Missing url", 400);

    const validated = validateUrl(raw);
    if ("error" in validated) return jsonError(validated.error, validated.status);

    const signal = AbortSignal.timeout(timeoutMs);
    const failed = () =>
      signal.aborted ? jsonError("The image took too long to load", 504) : jsonError("Failed to fetch image", 502);

    let upstream: Response;
    try {
      const isBackendImage = backendOrigin && /^\/media\/[^/]+\/[^/]+\/[^/]+\/image$/.test(validated.url.pathname);
      upstream = await safeFetch(
        isBackendImage ? new URL(validated.url.pathname, backendOrigin) : validated.url,
        MAX_IMAGE_REDIRECTS,
        signal,
      );
    } catch {
      return failed();
    }

    if (!upstream.ok) {
      await discard(upstream);
      return jsonError(`Upstream returned ${upstream.status}`, upstream.status);
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    const baseType = contentType.split(";")[0]!.trim().toLowerCase();
    if (!ALLOWED_IMAGE_CONTENT_TYPES.has(baseType)) {
      await discard(upstream);
      return jsonError("Not an image", 400);
    }

    let capped: CappedBody;
    try {
      capped = await readBodyWithCap(upstream, MAX_IMAGE_PROXY_BYTES);
    } catch {
      return failed();
    }
    if (!capped.ok) return jsonError(capped.error!, capped.status!);

    return new Response(capped.body as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  };
}
