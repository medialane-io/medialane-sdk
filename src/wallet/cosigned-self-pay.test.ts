import { test, expect } from "bun:test";
import { RpcProvider, constants, ec, hash, num, transaction } from "starknet";
import { SponsoredCallRejectedError } from "../starknet/services/sponsoredExecutor.js";
import { CREDITS_EXHAUSTED, cosignedSelfFundedExecutor } from "./cosigned-self-pay.js";

const PRIVATE_KEY = "0x012b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b";
const USER = "0x6958ce9523a63b831c5d3a691059affe47dfaab5124a9d7bf10f80a080b8cf";
const CALLS = [{ contractAddress: "0x1", entrypoint: "transfer", calldata: ["0x2", "0x3", "0x0"] }];
const RESULTS: Record<string, unknown> = {
  starknet_specVersion: "0.10.0",
  starknet_chainId: constants.StarknetChainId.SN_MAIN,
  starknet_blockHashAndNumber: { block_number: 100, block_hash: "0x1" },
  starknet_getBlockWithTxs: { block_number: 100, transactions: [] },
  starknet_getNonce: "0x5",
  starknet_estimateFee: [{ l1_gas_consumed: "0x0", l1_gas_price: "0x64", l2_gas_consumed: "0x3e8", l2_gas_price: "0xc8", l1_data_gas_consumed: "0x12c", l1_data_gas_price: "0x190", overall_fee: "0x1", unit: "FRI" }],
  starknet_addInvokeTransaction: { transaction_hash: "0xabc" },
};

function chain() {
  const sent: Array<Record<string, any>> = [];
  const provider = new RpcProvider({
    nodeUrl: "http://node.test",
    baseFetch: (async (_url: string, init: RequestInit) => {
      const { id, method, params } = JSON.parse(String(init.body));
      if (method === "starknet_addInvokeTransaction") sent.push(params.invoke_transaction);
      const result = RESULTS[method];
      if (result === undefined) throw new Error(`unexpected ${method}`);
      return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), { status: 200 });
    }) as never,
  });
  return { provider, sent };
}

function backend(respond: () => Response) {
  const requests: Array<{ url: string; body: Record<string, any> }> = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    requests.push({ url: String(url), body: JSON.parse(String(init.body)) });
    return respond();
  }) as unknown as typeof fetch;
  return { fetchImpl, requests };
}

const input = { userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS, intentIds: ["i1"] };
const big = (bounds: Record<string, Record<string, string>>) =>
  Object.fromEntries(Object.entries(bounds).map(([name, v]) => [name, { max_amount: BigInt(v.max_amount!), max_price_per_unit: BigInt(v.max_price_per_unit!) }]));

test("the owner signs the transaction, the backend adds the guardian, and exactly that is sent", async () => {
  const { provider, sent } = chain();
  const cosigned = ["0x11", "0x12", "0x13", "0x14"];
  const { fetchImpl, requests } = backend(() => new Response(JSON.stringify({ signature: cosigned, transactionHash: "0xabc" }), { status: 200 }));
  const executor = cosignedSelfFundedExecutor({ provider: () => provider, proxyUrl: "/p/", fetchImpl });

  expect(await executor.execute(input)).toEqual({ transactionHash: "0xabc" });

  expect(requests).toHaveLength(1);
  expect(requests[0]!.url).toBe("/p/cosign");
  const { intentIds, nonce, tip, resourceBounds, signature } = requests[0]!.body;
  expect(intentIds).toEqual(["i1"]);

  const messageHash = hash.calculateInvokeTransactionHash({
    senderAddress: USER, version: "0x3", compiledCalldata: transaction.getExecuteCalldata(CALLS, "1"), chainId: constants.StarknetChainId.SN_MAIN,
    nonce: BigInt(nonce), tip: BigInt(tip), resourceBounds: big(resourceBounds), accountDeploymentData: [], paymasterData: [], nonceDataAvailabilityMode: 0, feeDataAvailabilityMode: 0,
  } as never);
  const key = ec.starkCurve.getStarkKey(PRIVATE_KEY).slice(2).padStart(64, "0");
  const owner = new ec.starkCurve.Signature(BigInt(signature[0]), BigInt(signature[1]));
  expect(["02", "03"].some((prefix) => ec.starkCurve.verify(owner, messageHash, prefix + key))).toBe(true);

  expect(sent).toHaveLength(1);
  expect(sent[0]!.signature.map((s: string) => num.toHex(s))).toEqual(cosigned);
  expect(BigInt(sent[0]!.nonce)).toBe(BigInt(nonce));
  expect(BigInt(sent[0]!.tip)).toBe(BigInt(tip));
  expect(big(sent[0]!.resource_bounds)).toEqual(big(resourceBounds));
});

test("a refused signature shows the backend's reason and nothing is sent", async () => {
  const { provider, sent } = chain();
  const { fetchImpl } = backend(() => new Response(JSON.stringify({ error: "These actions are already on their way", code: "invalid_request" }), { status: 409 }));
  const executor = cosignedSelfFundedExecutor({ provider: () => provider, proxyUrl: "/p", fetchImpl });

  const err = await executor.execute(input).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(SponsoredCallRejectedError);
  expect((err as SponsoredCallRejectedError).message).toBe("These actions are already on their way");
  expect((err as SponsoredCallRejectedError).code).toBe("invalid_request");
  expect(sent).toEqual([]);
});

test("an answer without credits says the credits ran out", async () => {
  const { provider } = chain();
  const { fetchImpl } = backend(() => new Response(JSON.stringify({ x402Version: 1, code: "credits_exhausted" }), { status: 402 }));
  const executor = cosignedSelfFundedExecutor({ provider: () => provider, proxyUrl: "/p", fetchImpl });

  const err = await executor.execute(input).catch((e: unknown) => e);
  expect((err as Error).message).toBe(CREDITS_EXHAUSTED);
});
