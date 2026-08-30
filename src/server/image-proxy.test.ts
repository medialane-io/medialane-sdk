import { describe, test, expect } from "bun:test";
import { createImageProxyHandler, readBodyWithCap } from "./image-proxy.js";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function imageResponse(body: Uint8Array = PNG, contentType = "image/png"): Response {
  return new Response(body as unknown as BodyInit, {
    status: 200,
    headers: { "content-type": contentType },
  });
}

function handler(overrides: {
  resolveHostname?: (h: string) => Promise<string[]>;
  fetchImpl?: typeof fetch;
  checkRateLimit?: (ip: string) => boolean;
} = {}) {
  return createImageProxyHandler({
    checkRateLimit: overrides.checkRateLimit ?? (() => true),
    resolveHostname: overrides.resolveHostname ?? (async () => ["93.184.216.34"]),
    fetchImpl: overrides.fetchImpl ?? (async () => imageResponse()),
  });
}

function request(url: string): Request {
  return new Request(`https://app.example/api/img?url=${encodeURIComponent(url)}`);
}

describe("image proxy", () => {
  test("proxies a public image", async () => {
    const res = await handler()(request("https://cdn.example/a.png"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("rejects a missing url", async () => {
    const res = await handler()(new Request("https://app.example/api/img"));
    expect(res.status).toBe(400);
  });

  test("rejects http and private hosts before any fetch", async () => {
    let fetched = false;
    const h = handler({
      fetchImpl: async () => {
        fetched = true;
        return imageResponse();
      },
    });
    for (const url of ["http://cdn.example/a.png", "https://127.0.0.1/a.png", "https://169.254.169.254/a"]) {
      expect((await h(request(url))).status).toBe(400);
    }
    expect(fetched).toBe(false);
  });

  // The guard that a URL-only check cannot provide: the name is public, the
  // address it resolves to is not.
  test("rejects a public name that resolves to a private address", async () => {
    const res = await handler({ resolveHostname: async () => ["127.0.0.1"] })(
      request("https://evil.example/a.png"),
    );
    expect(res.status).toBe(502);
  });

  test("refuses when a hostname resolves to nothing", async () => {
    const res = await handler({ resolveHostname: async () => [] })(
      request("https://nowhere.example/a.png"),
    );
    expect(res.status).toBe(502);
  });

  test("refuses when resolution throws", async () => {
    const res = await handler({
      resolveHostname: async () => {
        throw new Error("SERVFAIL");
      },
    })(request("https://broken.example/a.png"));
    expect(res.status).toBe(502);
  });

  // A permitted host can redirect into the private range; each hop is revalidated.
  test("blocks a redirect into a private address", async () => {
    const res = await handler({
      fetchImpl: async () =>
        new Response(null, { status: 302, headers: { location: "https://127.0.0.1/a.png" } }),
    })(request("https://cdn.example/a.png"));
    expect(res.status).toBe(502);
  });

  test("blocks a redirect chain that never terminates", async () => {
    const res = await handler({
      fetchImpl: async () =>
        new Response(null, { status: 302, headers: { location: "https://cdn.example/next.png" } }),
    })(request("https://cdn.example/a.png"));
    expect(res.status).toBe(502);
  });

  test("rejects a non-image content type", async () => {
    const res = await handler({
      fetchImpl: async () => imageResponse(PNG, "text/html"),
    })(request("https://cdn.example/a.png"));
    expect(res.status).toBe(400);
  });

  test("passes the upstream status through when it fails", async () => {
    const res = await handler({
      fetchImpl: async () => new Response(null, { status: 404 }),
    })(request("https://cdn.example/missing.png"));
    expect(res.status).toBe(404);
  });

  test("honours the rate limit", async () => {
    const res = await handler({ checkRateLimit: () => false })(request("https://cdn.example/a.png"));
    expect(res.status).toBe(429);
  });
});

describe("readBodyWithCap", () => {
  test("rejects a declared content-length over the cap without reading", async () => {
    const res = new Response(PNG as unknown as BodyInit, {
      headers: { "content-length": "999999" },
    });
    const capped = await readBodyWithCap(res, 10);
    expect(capped.ok).toBe(false);
    expect(capped.status).toBe(413);
  });

  test("rejects a body that exceeds the cap while streaming", async () => {
    const big = new Uint8Array(100);
    const capped = await readBodyWithCap(new Response(big as unknown as BodyInit), 10);
    expect(capped.ok).toBe(false);
    expect(capped.status).toBe(413);
  });

  test("returns a body within the cap intact", async () => {
    const capped = await readBodyWithCap(new Response(PNG as unknown as BodyInit), 1000);
    expect(capped.ok).toBe(true);
    expect(Array.from(capped.body!)).toEqual(Array.from(PNG));
  });
});
