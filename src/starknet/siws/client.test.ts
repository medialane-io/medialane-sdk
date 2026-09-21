import { test, expect } from "bun:test";
import { requestSiwsToken } from "./client.js";

async function capturedVerifyBody(appSource?: string): Promise<Record<string, unknown>> {
  const bodies: Record<string, unknown>[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return String(url).endsWith("/nonce")
      ? new Response(JSON.stringify({ nonce: "n1", typedData: {} }), { status: 200 })
      : new Response(JSON.stringify({ token: "not-a-real-token" }), { status: 200 });
  }) as unknown as typeof fetch;

  try {
    await requestSiwsToken({
      backendUrl: "https://api.test",
      walletAddress: "0x1",
      signer: { signMessage: async () => ["0x2"] },
      ...(appSource ? { appSource } : {}),
    });
  } catch {

  } finally {
    globalThis.fetch = original;
  }

  return bodies[1]!;
}

test("a sign-in that names its app carries that app to the backend", async () => {
  expect(await capturedVerifyBody("MEDIALANE_IO")).toMatchObject({ appSource: "MEDIALANE_IO" });
});

test("a sign-in that names no app sends none", async () => {
  expect(await capturedVerifyBody()).not.toHaveProperty("appSource");
});
