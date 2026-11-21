import { test, expect } from "bun:test";
import { MedialaneClient } from "./client.js";

test("without a backend url, api calls reject with a clear message instead of reaching the network", async () => {
  const client = new MedialaneClient();
  await expect(client.api.orders.list()).rejects.toThrow("backendUrl not configured");
  await expect(client.api.orders.list()).rejects.toThrow("backendUrl not configured");
});

test("with a backend url the api client is the real one", () => {
  const client = new MedialaneClient({ backendUrl: "https://api.test" });
  expect(client.api.orders).toBeDefined();
  expect(() => client.provider).not.toThrow();
});

test("without a backend url, creating a listing reports the missing backend", async () => {
  const client = new MedialaneClient({});
  const listing = { offerer: "0x1", nftContract: "0x2", tokenId: "1", currency: "0x3", price: "1", endTime: 2 };
  await expect(client.createIntent("listing", listing)).rejects.toThrow("backendUrl not configured");
});

test("purchaseCost uses the client's own fee settings", () => {
  const order = {
    offer: { itemType: "ERC1155", token: "0x1", identifier: "1", startAmount: "10", endAmount: "10" },
    consideration: { itemType: "ERC20", token: "0x2", identifier: "0", startAmount: "10000", endAmount: "10000", recipient: "0x3" },
  } as never;
  expect(new MedialaneClient({ feeConfig: { enabled: true } }).purchaseCost(order, 2)).toEqual({ gross: 20000n, fee: 200n, total: 20200n, feeBps: 100 });
  expect(new MedialaneClient({ feeConfig: { enabled: false } }).purchaseCost(order, 2)).toEqual({ gross: 20000n, fee: 0n, total: 20000n, feeBps: 0 });
});
