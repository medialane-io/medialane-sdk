import { expect, test } from "bun:test";
import { signInWithWallet } from "./sign-in.js";

test("wallet sign-in signs the nonce and verifies with the app source", async () => {
  const bodies: unknown[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    bodies.push({ url: String(url), body: JSON.parse(String(init.body)) });
    return String(url).endsWith("/nonce")
      ? Response.json({ nonce: "n1", typedData: { message: {} } })
      : Response.json({ accountId: "a" });
  }) as typeof fetch;
  try {
    await signInWithWallet({
      backendUrl: "/api/proxy",
      walletAddress: "0x1",
      appSource: "MEDIALANE_STARKNET",
      signer: { signMessage: async () => ["0x2", "0x3"] } as never,
    });
  } finally {
    globalThis.fetch = original;
  }
  expect(bodies[1]).toEqual({
    url: "/api/proxy/v1/auth/siws/verify",
    body: { walletAddress: "0x1", nonce: "n1", signature: ["0x2", "0x3"], appSource: "MEDIALANE_STARKNET" },
  });
});

test("a refused verification throws the backend message", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string) =>
    String(url).endsWith("/nonce")
      ? Response.json({ nonce: "n1", typedData: {} })
      : Response.json({ error: "account_not_deployed", message: "Check if your wallet is deployed on Starknet." }, { status: 400 })) as typeof fetch;
  try {
    await expect(
      signInWithWallet({ backendUrl: "", walletAddress: "0x1", appSource: "X", signer: { signMessage: async () => ["0x1"] } as never }),
    ).rejects.toThrow("Check if your wallet is deployed on Starknet.");
  } finally {
    globalThis.fetch = original;
  }
});
