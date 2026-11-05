import { describe, test, expect } from "bun:test";
import { createImageProxyHandler, readBodyWithCap } from "./image-proxy.js";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function imageResponse(body: Uint8Array = PNG, contentType = "image/png"): Response {
  return new Response(body as unknown as BodyInit, {
    status: 200,
    headers: { "content-type": contentType },
  });
}

type Get = (url: URL, headers: Record<string, string>) => Promise<Response>;

function handler(overrides: { get?: Get } = {}) {
  return createImageProxyHandler({ get: overrides.get ?? (async () => imageResponse()) });
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
      get: async () => {
        fetched = true;
        return imageResponse();
      },
    });
    for (const url of ["http://cdn.example/a.png", "https://127.0.0.1/a.png", "https://169.254.169.254/a"]) {
      expect((await h(request(url))).status).toBe(400);
    }
    expect(fetched).toBe(false);
  });

  test("a connection the guard refuses fails the request", async () => {
    const res = await handler({
      get: async () => {
        throw Object.assign(new Error("blocked"), { code: "EBLOCKED" });
      },
    })(request("https://evil.example/a.png"));
    expect(res.status).toBe(502);
  });

  test("a redirect is fetched through the guarded connection", async () => {
    const seen: string[] = [];
    const res = await handler({
      get: async (url) => {
        seen.push(url.toString());
        return seen.length === 1
          ? new Response(null, { status: 302, headers: { location: "https://other.example/x.png" } })
          : imageResponse();
      },
    })(request("https://cdn.example/a.png"));
    expect(res.status).toBe(200);
    expect(seen).toEqual(["https://cdn.example/a.png", "https://other.example/x.png"]);
  });

  test("blocks a redirect into a private address", async () => {
    const res = await handler({
      get: async () => new Response(null, { status: 302, headers: { location: "https://127.0.0.1/a.png" } }),
    })(request("https://cdn.example/a.png"));
    expect(res.status).toBe(502);
  });

  test("blocks a redirect chain that never terminates", async () => {
    const res = await handler({
      get: async () => new Response(null, { status: 302, headers: { location: "https://cdn.example/next.png" } }),
    })(request("https://cdn.example/a.png"));
    expect(res.status).toBe(502);
  });

  test("rejects a non-image content type", async () => {
    const res = await handler({
      get: async () => imageResponse(PNG, "text/html"),
    })(request("https://cdn.example/a.png"));
    expect(res.status).toBe(400);
  });

  test("passes the upstream status through when it fails", async () => {
    const res = await handler({
      get: async () => new Response(null, { status: 404 }),
    })(request("https://cdn.example/missing.png"));
    expect(res.status).toBe(404);
  });

  test("serves every request, with no volume limit", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await handler()(request("https://cdn.example/a.png"))).status).toBe(200);
    }
  });
});

describe("image proxy with backend credentials", () => {
  const backend = { appId: "APP", backendUrl: "https://api.example", apiKey: "ml_live_key", appSecret: "secret" };

  function recording() {
    const seen: Array<{ url: string; headers: Record<string, string> }> = [];
    const get = async (url: URL, headers: Record<string, string>) => {
      seen.push({ url: url.toString(), headers: { ...headers } });
      return imageResponse();
    };
    return { seen, get };
  }

  test("an image from the backend is fetched with the app's credentials", async () => {
    const { seen, get } = recording();
    const h = createImageProxyHandler({ get, backend });
    expect((await h(request("https://api.example/media/starknet/0xabc/1/image"))).status).toBe(200);
    expect(seen[0]!.headers["x-api-key"]).toBe("ml_live_key");
    expect(seen[0]!.headers["x-app-id"]).toBe("APP");
    expect(seen[0]!.headers["x-app-secret"]).toBe("secret");
  });

  test("a backend image link on another host is fetched from the configured backend with credentials", async () => {
    const { seen, get } = recording();
    const h = createImageProxyHandler({ get, backend });
    expect((await h(request("https://public.example/media/starknet/0xabc/1/image"))).status).toBe(200);
    expect(seen[0]!.url).toBe("https://api.example/media/starknet/0xabc/1/image");
    expect(seen[0]!.headers["x-api-key"]).toBe("ml_live_key");
    expect(seen[0]!.headers["x-app-id"]).toBe("APP");
    expect(seen[0]!.headers["x-app-secret"]).toBe("secret");
  });

  test("an image from any other host gets no credentials", async () => {
    const { seen, get } = recording();
    const h = createImageProxyHandler({ get, backend });
    for (const url of ["https://cdn.example/a.png", "https://api.example.evil.example/a.png", "https://api.example:8443/a.png"]) {
      await h(request(url));
    }
    for (const { headers } of seen) {
      expect(headers["x-api-key"]).toBeUndefined();
      expect(headers["x-app-id"]).toBeUndefined();
      expect(headers["x-app-secret"]).toBeUndefined();
    }
  });

  test("a redirect away from the backend carries no credentials", async () => {
    const seen: Array<Record<string, string>> = [];
    const get = async (url: URL, headers: Record<string, string>) => {
      seen.push({ ...headers });
      return url.toString().startsWith("https://api.example/")
        ? new Response(null, { status: 302, headers: { location: "https://cdn.example/a.png" } })
        : imageResponse();
    };
    const h = createImageProxyHandler({ get, backend });
    expect((await h(request("https://api.example/media/starknet/0xabc/1/image"))).status).toBe(200);
    expect(seen[0]!["x-api-key"]).toBe("ml_live_key");
    expect(seen[1]!["x-api-key"]).toBeUndefined();
    expect(seen[1]!["x-app-secret"]).toBeUndefined();
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

describe("image proxy limits", () => {
  const hanging = (signal: AbortSignal) =>
    new ReadableStream<Uint8Array>({
      start(controller) {
        signal.addEventListener("abort", () => controller.error(signal.reason));
      },
    });

  function closable(contentType: string, status = 200) {
    let closed = false;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        closed = true;
      },
    });
    return { response: new Response(body, { status, headers: { "content-type": contentType } }), closed: () => closed };
  }

  test("an upstream that never answers times out", async () => {
    const h = createImageProxyHandler({
      timeoutMs: 20,
      get: (_url, _headers, signal) =>
        new Promise<Response>((_, reject) => signal.addEventListener("abort", () => reject(signal.reason))),
    });
    expect((await h(request("https://cdn.example/a.png"))).status).toBe(504);
  });

  test("the timeout also covers reading the image", async () => {
    const h = createImageProxyHandler({
      timeoutMs: 20,
      get: async (_url, _headers, signal) => new Response(hanging(signal), { headers: { "content-type": "image/png" } }),
    });
    expect((await h(request("https://cdn.example/a.png"))).status).toBe(504);
  });

  test("a response that is not an image is closed", async () => {
    const upstream = closable("text/html");
    const res = await createImageProxyHandler({ get: async () => upstream.response })(request("https://cdn.example/a.png"));
    expect(res.status).toBe(400);
    expect(upstream.closed()).toBe(true);
  });

  test("a failed upstream response is closed", async () => {
    const upstream = closable("text/html", 404);
    const res = await createImageProxyHandler({ get: async () => upstream.response })(request("https://cdn.example/a.png"));
    expect(res.status).toBe(404);
    expect(upstream.closed()).toBe(true);
  });
});
