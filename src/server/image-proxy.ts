import { requestIp } from "./rate-limit.js";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_PROXY_BYTES,
  MAX_IMAGE_REDIRECTS,
  isPrivateHost,
  validateUrl,
} from "./ssrf-guard.js";

/**
 * Proxies a remote image, which means fetching a URL an untrusted caller chose
 * — the classic SSRF shape. Guarded in four places, each of which has to hold:
 *
 *   1. the URL is https, credential-free and not a private host
 *   2. the hostname's *resolved* addresses are re-checked, since a public name
 *      can resolve to a private address
 *   3. redirects are followed manually, re-validating each hop, because a
 *      permitted host can redirect into the private range
 *   4. the response must be an allowed image type and is read under a byte cap
 *
 * This existed as a byte-identical copy in each app, so a fix to one would not
 * have reached the other. DNS resolution is injected rather than imported: it
 * is runtime-specific, and this package stays isomorphic.
 *
 * Note the remaining exposure: between resolving a hostname and fetching it,
 * the name could resolve differently (DNS rebinding). Closing that needs the
 * fetch pinned to the address already checked, which the platform fetch does
 * not expose. The content-type allowlist and byte cap bound what an attacker
 * gets if they win that race.
 */
export interface ImageProxyConfig {
  checkRateLimit: (ip: string) => boolean;
  /** Returns every address a hostname resolves to. Injected; see above. */
  resolveHostname: (hostname: string) => Promise<string[]>;
  fetchImpl?: typeof fetch;
  userAgent?: string;
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; Medialane/1.0; +https://www.medialane.io)";

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export interface CappedBody {
  ok: boolean;
  body?: Uint8Array;
  error?: string;
  status?: number;
}

/** Reads a response body, refusing anything past `maxBytes` rather than buffering it. */
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
  const doFetch = config.fetchImpl ?? fetch;
  const userAgent = config.userAgent ?? DEFAULT_USER_AGENT;

  async function resolvesToPrivateHost(hostname: string): Promise<boolean> {
    try {
      const addresses = await config.resolveHostname(hostname);
      // No addresses is not "safe by default" — refuse rather than proceed.
      if (addresses.length === 0) return true;
      return addresses.some((address) => isPrivateHost(address));
    } catch {
      return true;
    }
  }

  async function safeFetch(url: URL, hopsLeft: number): Promise<Response> {
    if (hopsLeft < 0) throw new Error("Too many redirects");

    if (await resolvesToPrivateHost(url.hostname)) {
      throw new Error("Blocked: hostname resolves to a private address");
    }

    const res = await doFetch(url.toString(), {
      redirect: "manual",
      headers: { "User-Agent": userAgent },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Redirect with no Location header");

      const next = new URL(location, url);
      const validated = validateUrl(next.toString());
      if ("error" in validated) throw new Error(`Redirect blocked: ${validated.error}`);

      return safeFetch(validated.url, hopsLeft - 1);
    }

    return res;
  }

  return async function handleImageProxy(req: Request): Promise<Response> {
    if (!config.checkRateLimit(requestIp(req))) {
      return jsonError("Too many requests", 429);
    }

    const raw = new URL(req.url).searchParams.get("url");
    if (!raw) return jsonError("Missing url", 400);

    const validated = validateUrl(raw);
    if ("error" in validated) return jsonError(validated.error, validated.status);

    let upstream: Response;
    try {
      upstream = await safeFetch(validated.url, MAX_IMAGE_REDIRECTS);
    } catch {
      return jsonError("Failed to fetch image", 502);
    }

    if (!upstream.ok) {
      return jsonError(`Upstream returned ${upstream.status}`, upstream.status);
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    const baseType = contentType.split(";")[0]!.trim().toLowerCase();
    if (!ALLOWED_IMAGE_CONTENT_TYPES.has(baseType)) {
      return jsonError("Not an image", 400);
    }

    const capped = await readBodyWithCap(upstream, MAX_IMAGE_PROXY_BYTES);
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
