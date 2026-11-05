import { describe, expect, test } from "bun:test";
import type { RpcProvider } from "starknet";
import { resolveConfig } from "../../config.js";
import { MedialaneApiError } from "../../errors.js";
import type { ApiOrder } from "../../types/api.js";
import { createIntentReaders } from "./readers.js";

const config = resolveConfig({});
const OFFERER = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function fakeProvider(answers: Record<string, string[]>) {
  const calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }> = [];
  const provider = {
    callContract: async (call: { contractAddress: string; entrypoint: string; calldata: string[] }) => {
      calls.push(call);
      return answers[call.entrypoint] ?? [];
    },
  } as unknown as RpcProvider;
  return { provider, calls };
}

const noOrders = { get: async (): Promise<ApiOrder> => { throw new MedialaneApiError(404, "Not found"); } };

describe("the SDK's intent readers", () => {
  test("a counter is read from the marketplace for the token standard", async () => {
    const { provider, calls } = fakeProvider({ get_counter: ["0x5"] });
    const readers = createIntentReaders({ provider, orders: noOrders, config });
    expect(await readers.counterOf(OFFERER, "ERC721")).toBe("5");
    expect(await readers.counterOf(OFFERER, "ERC1155")).toBe("5");
    expect(calls.map((c) => c.contractAddress)).toEqual([config.marketplace721Contract, config.marketplace1155Contract]);
  });

  test("a counter that the chain doesn't return is an error", async () => {
    const { provider } = fakeProvider({});
    await expect(createIntentReaders({ provider, orders: noOrders, config }).counterOf(OFFERER, "ERC721")).rejects.toThrow();
  });

  test("the royalty cap is the royalty on a 10000-unit sale", async () => {
    const { provider } = fakeProvider({ royalty_info: ["0x0", "0x1f4"] });
    expect(await createIntentReaders({ provider, orders: noOrders, config }).royaltyCapOf("0x2", "42")).toBe("500");
  });

  test("an order the API doesn't have is null", async () => {
    const { provider } = fakeProvider({});
    expect(await createIntentReaders({ provider, orders: noOrders, config }).orderOf("0x7")).toBeNull();
  });

  test("other API failures are not hidden", async () => {
    const { provider } = fakeProvider({});
    const failing = { get: async (): Promise<ApiOrder> => { throw new MedialaneApiError(500, "down"); } };
    await expect(createIntentReaders({ provider, orders: failing, config }).orderOf("0x7")).rejects.toThrow("down");
  });
});
