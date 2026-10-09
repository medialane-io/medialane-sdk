import { test, expect } from "bun:test";
import { getService, hasCapability } from "./registry.js";

test("mip-erc721 exposes Starknet onchain coordinates", () => {
  const svc = getService("mip-erc721")!;
  expect(svc.onchain?.STARKNET?.factoryAddress).toBe(
    "0x0225c3ae09506b8d97adc39649ca740dad5aac195b7f5f0441cc1852947acaea",
  );
});

test("a service has no coordinates on an unpopulated chain", () => {
  const svc = getService("mip-erc721")!;
  expect(svc.onchain?.ETHEREUM).toBeUndefined();
});

test("ip-club memberships trade like any collection", () => {
  const svc = getService("ip-club")!;
  expect(svc.standard).toBe("ERC1155");
  expect(svc.capabilities).toContain("transfer");
  expect(svc.capabilities).toContain("list");
});

test("hasCapability reflects a service's capabilities array", () => {
  expect(hasCapability("ip-club", "subscribe")).toBe(false);
  expect(hasCapability("ip-tickets", "transfer")).toBe(true);
});

test("hasCapability returns false for an unregistered or missing service id", () => {
  expect(hasCapability("not-a-real-service", "transfer")).toBe(false);
  expect(hasCapability(null, "transfer")).toBe(false);
  expect(hasCapability(undefined, "transfer")).toBe(false);
});

test("data-tokenization-erc721 points at its own factory", () => {
  const service = getService("data-tokenization-erc721")!;
  expect(service.onchain?.STARKNET?.factoryAddress).toBe(
    "0x07421b4442f7f2052c65408fb3561484154cf8175a0bbb41e3cd38d9087af6d2",
  );
  expect(service.onchain?.STARKNET?.startBlock).toBe(14670294);
});

test("data tokenization is a separate factory from IP Collection", () => {
  const data = getService("data-tokenization-erc721")!;
  const collection = getService("mip-erc721")!;
  expect(data.onchain?.STARKNET?.factoryAddress).not.toBe(
    collection.onchain?.STARKNET?.factoryAddress,
  );
});

test("data tokenization assets are tradeable", () => {
  const service = getService("data-tokenization-erc721")!;
  for (const capability of ["list", "buy", "make_offer", "cancel", "transfer"]) {
    expect(service.capabilities).toContain(capability);
  }
});

test("ip-ticketing shares the ip-tickets factory, not a separate contract", () => {
  const ticketing = getService("ip-ticketing")!;
  const tickets = getService("ip-tickets")!;
  expect(ticketing.onchain?.STARKNET?.factoryAddress).toBe(
    tickets.onchain?.STARKNET?.factoryAddress,
  );
  expect(ticketing.onchain?.STARKNET?.classHash).toBe(tickets.onchain?.STARKNET?.classHash);
});

test("ip-ticketing adds airdrop on top of ip-tickets' capabilities", () => {
  expect(hasCapability("ip-ticketing", "airdrop")).toBe(true);
  expect(hasCapability("ip-tickets", "airdrop")).toBe(false);
});

test("certificate-emission shares the pop-protocol factory, not a separate contract", () => {
  const emission = getService("certificate-emission")!;
  const pop = getService("pop-protocol")!;
  expect(emission.onchain?.STARKNET?.factoryAddress).toBe(pop.onchain?.STARKNET?.factoryAddress);
  expect(emission.onchain?.STARKNET?.classHash).toBe(pop.onchain?.STARKNET?.classHash);
});

test("certificate-emission adds airdrop on top of pop-protocol's capabilities, but never claim", () => {
  expect(hasCapability("certificate-emission", "airdrop")).toBe(true);
  expect(hasCapability("certificate-emission", "claim")).toBe(false);
  expect(hasCapability("pop-protocol", "airdrop")).toBe(false);
});

test("pop-protocol credentials are soulbound and only their factory is indexed", () => {
  const pop = getService("pop-protocol")!;
  expect(pop.capabilities).not.toContain("transfer");
  expect(pop.events?.map((e) => e.name)).toEqual(["CollectionCreated"]);
});

test("pop-protocol points at the ownerless factory and its start block", async () => {
  const pop = getService("pop-protocol")!;
  expect(pop.onchain?.STARKNET?.factoryAddress).toBe(
    "0x06af6ffdde310991a40570716dc3681acc7effc610aeb548ea0baa02d4208d5f",
  );
  expect(pop.onchain?.STARKNET?.classHash).toBe(
    "0x076200229933dd10b8d6d41ecb1a53ba1972510a42f4d505dae4f6b54d1b317e",
  );
  const { STARKNET_POP_FACTORY_START_BLOCK } = await import("../constants.js");
  expect(STARKNET_POP_FACTORY_START_BLOCK).toBe(16126169);
});
