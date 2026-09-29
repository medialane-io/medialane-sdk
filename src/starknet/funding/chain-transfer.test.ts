import { describe, expect, test } from "bun:test";
import {
  buildFundingTransferCall,
  fundWithChainTransfer,
  FundingTransferNotSentError,
  type FundingApi,
  type FundingWallet,
} from "./chain-transfer.js";

const instructions = { chain: "STARKNET", payTo: "0xtreasury", asset: "0xusdc", amountAtomic: "5000000" };

function fakeApi(over: Partial<FundingApi> = {}) {
  const calls: string[] = [];
  const api: FundingApi = {
    createFunding: async () => { calls.push("create"); return { data: { id: "fi1", method: "chain-transfer", status: "PENDING", expiresAt: "x" } }; },
    getFundingChallenge: async () => { calls.push("challenge"); return { data: { typedData: { primaryType: "FundingIntent", domain: {}, types: {}, message: {} } } }; },
    authorizeFunding: async () => { calls.push("authorize"); return { data: { instructions } }; },
    submitFunding: async () => { calls.push("submit"); return { data: { status: "SETTLED", credited: 500 } }; },
    cancelFunding: async () => { calls.push("cancel"); return { data: { status: "EXPIRED" } }; },
    ...over,
  };
  return { api, calls };
}

function fakeWallet(over: Partial<FundingWallet> = {}) {
  const sent: unknown[] = [];
  const wallet: FundingWallet = {
    address: "0xabc",
    signTypedData: async () => ["0x1", "0x2"],
    sendTransfer: async (call) => { sent.push(call); return { txHash: "0xhash" }; },
    ...over,
  };
  return { wallet, sent };
}

const fast = { pollMs: 0, sleep: async () => {} };

describe("the transfer call", () => {
  test("splits the amount into the u256 low and high words", () => {
    expect(buildFundingTransferCall(instructions)).toEqual({
      contractAddress: "0xusdc", entrypoint: "transfer", calldata: ["0xtreasury", "5000000", "0"],
    });
    const big = buildFundingTransferCall({ ...instructions, amountAtomic: ((1n << 128n) + 5n).toString() });
    expect(big.calldata).toEqual(["0xtreasury", "5", "1"]);
  });
});

describe("funding with a chain transfer", () => {
  test("creates, signs, authorizes, pays, then confirms, in that order, and reports each step", async () => {
    const { api, calls } = fakeApi();
    const { wallet, sent } = fakeWallet();
    const steps: string[] = [];
    const result = await fundWithChainTransfer(api, wallet, { amountUsdc: "5", onStep: (s) => steps.push(s), ...fast });
    expect(calls).toEqual(["create", "challenge", "authorize", "submit"]);
    expect(steps).toEqual(["creating", "signing", "authorizing", "paying", "confirming"]);
    expect(sent).toEqual([{ contractAddress: "0xusdc", entrypoint: "transfer", calldata: ["0xtreasury", "5000000", "0"] }]);
    expect(result).toEqual({ status: "SETTLED", intentId: "fi1", credited: 500 });
  });

  test("keeps confirming until the credits land", async () => {
    let n = 0;
    const { api } = fakeApi({
      submitFunding: async () => (++n < 3 ? { data: { status: "PENDING", reason: "not in a block yet" } } : { data: { status: "SETTLED", credited: 500 } }),
    });
    const result = await fundWithChainTransfer(api, fakeWallet().wallet, { amountUsdc: "5", ...fast });
    expect(n).toBe(3);
    expect(result.status).toBe("SETTLED");
  });

  test("a transfer that never confirms in time is pending, not an error, and is not cancelled", async () => {
    let submits = 0;
    const { api, calls } = fakeApi({ submitFunding: async () => { submits++; return { data: { status: "PENDING", reason: "not in a block yet" } }; } });
    const result = await fundWithChainTransfer(api, fakeWallet().wallet, { amountUsdc: "5", maxPolls: 3, ...fast });
    expect(result).toEqual({ status: "PENDING", intentId: "fi1", reason: "not in a block yet" });
    expect(submits).toBe(3);
    expect(calls).not.toContain("cancel");
  });
});

describe("failing before any money moved", () => {
  test("a failed signature closes the intent and rethrows", async () => {
    const { api, calls } = fakeApi();
    const { wallet, sent } = fakeWallet({ signTypedData: async () => { throw new Error("signature refused"); } });
    await expect(fundWithChainTransfer(api, wallet, { amountUsdc: "5", ...fast })).rejects.toThrow("signature refused");
    expect(calls).toContain("cancel");
    expect(sent).toEqual([]);
  });

  test("a refused authorization closes the intent", async () => {
    const { api, calls } = fakeApi({ authorizeFunding: async () => { throw new Error("That wallet is not deployed on Starknet yet."); } });
    await expect(fundWithChainTransfer(api, fakeWallet().wallet, { amountUsdc: "5", ...fast })).rejects.toThrow("not deployed");
    expect(calls).toContain("cancel");
  });

  test("a wallet that certainly sent nothing closes the intent, so five rejected prompts cannot lock the account", async () => {
    const { api, calls } = fakeApi();
    const { wallet } = fakeWallet({ sendTransfer: async () => { throw new FundingTransferNotSentError("You declined the transfer."); } });
    await expect(fundWithChainTransfer(api, wallet, { amountUsdc: "5", ...fast })).rejects.toBeInstanceOf(FundingTransferNotSentError);
    expect(calls).toContain("cancel");
    expect(calls).not.toContain("submit");
  });

  test("a creation failure has nothing to close", async () => {
    const { api, calls } = fakeApi({ createFunding: async () => { throw new Error("too many open"); } });
    await expect(fundWithChainTransfer(api, fakeWallet().wallet, { amountUsdc: "5", ...fast })).rejects.toThrow("too many open");
    expect(calls).not.toContain("cancel");
  });
});

describe("failing when a transfer may have gone out", () => {
  test("an unknown wallet error does NOT close the intent, because the payment may still land", async () => {
    const { api, calls } = fakeApi();
    const { wallet } = fakeWallet({ sendTransfer: async () => { throw new Error("network dropped"); } });
    await expect(fundWithChainTransfer(api, wallet, { amountUsdc: "5", ...fast })).rejects.toThrow("network dropped");
    expect(calls).not.toContain("cancel");
  });

  test("a failed cancel never hides the original error", async () => {
    const { api } = fakeApi({ cancelFunding: async () => { throw new Error("offline"); } });
    const { wallet } = fakeWallet({ signTypedData: async () => { throw new Error("signature refused"); } });
    await expect(fundWithChainTransfer(api, wallet, { amountUsdc: "5", ...fast })).rejects.toThrow("signature refused");
  });
});
