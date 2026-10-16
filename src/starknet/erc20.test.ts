import { test, expect } from "bun:test";
import { erc20Balance } from "./erc20.js";

function reader(answers: Record<string, string[] | Error>) {
  const calls: string[] = [];
  return {
    calls,
    provider: {
      callContract: async ({ entrypoint }: { entrypoint: string }) => {
        calls.push(entrypoint);
        const a = answers[entrypoint];
        if (!a || a instanceof Error) throw a ?? new Error("Entrypoint not found");
        return a;
      },
    } as never,
  };
}

test("erc20Balance joins the u256 low and high words", async () => {
  const { provider } = reader({ balanceOf: ["0x1", "0x1"] });
  expect(await erc20Balance(provider, "0xtoken", "0xholder")).toBe(1n + (1n << 128n));
});

test("erc20Balance falls back to balance_of", async () => {
  const r = reader({ balance_of: ["0x5", "0x0"] });
  expect(await erc20Balance(r.provider, "0xtoken", "0xholder")).toBe(5n);
  expect(r.calls).toEqual(["balanceOf", "balance_of"]);
});

test("erc20Balance reads a missing high word as zero", async () => {
  const { provider } = reader({ balanceOf: ["0x5"] });
  expect(await erc20Balance(provider, "0xtoken", "0xholder")).toBe(5n);
});

test("erc20Balance rejects when neither entrypoint answers", async () => {
  const { provider } = reader({});
  await expect(erc20Balance(provider, "0xtoken", "0xholder")).rejects.toThrow();
});
