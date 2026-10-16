import { test, expect } from "bun:test";
import { createChainProvider } from "./chain-provider.js";
import { MedialaneClient } from "./client.js";

function channelOf(provider: unknown): { nodeUrl: string; headers: Record<string, string> } {
  return (provider as { channel: { nodeUrl: string; headers: Record<string, string> } }).channel;
}

test("createChainProvider points at the backend's /v1/rpc", () => {
  expect(channelOf(createChainProvider("https://app.test/api/proxy")).nodeUrl).toBe("https://app.test/api/proxy/v1/rpc");
});

test("createChainProvider drops a trailing slash on the backend url", () => {
  expect(channelOf(createChainProvider("https://api.test/")).nodeUrl).toBe("https://api.test/v1/rpc");
});

test("createChainProvider sends the api key the api client sends", () => {
  expect(channelOf(createChainProvider("https://api.test", "ml_test_key")).headers["x-api-key"]).toBe("ml_test_key");
});

test("createChainProvider sends no api key header without a key", () => {
  expect(channelOf(createChainProvider("https://app.test/api/proxy")).headers["x-api-key"]).toBeUndefined();
});

test("client.provider on a server config reaches the backend with the key", () => {
  const client = new MedialaneClient({ backendUrl: "https://api.test", apiKey: "ml_test_key" });
  const channel = channelOf(client.provider);
  expect(channel.nodeUrl).toBe("https://api.test/v1/rpc");
  expect(channel.headers["x-api-key"]).toBe("ml_test_key");
});

test("client.provider is built once per client", () => {
  const client = new MedialaneClient({ backendUrl: "https://api.test" });
  expect(client.provider).toBe(client.provider);
});

test("client.provider throws without a backendUrl", () => {
  const client = new MedialaneClient({});
  expect(() => client.provider).toThrow("backendUrl not configured");
});
