import type { TypedData } from "starknet";
import type { ApiClient } from "../../api/client.js";
import type { ApiFundingInstructions, ApiFundingIntent, ApiFundingSubmit } from "../../types/api.js";

export interface FundingTransferCall {
  contractAddress: string;
  entrypoint: "transfer";
  calldata: string[];
}

export interface FundingWallet {
  address: string;
  signTypedData(typedData: TypedData): Promise<string[]>;
  sendTransfer(call: FundingTransferCall): Promise<{ txHash: string }>;
}

export class FundingTransferNotSentError extends Error {
  constructor(message = "The transfer was not sent.") {
    super(message);
    this.name = "FundingTransferNotSentError";
  }
}

type Res<T> = Promise<{ data: T }>;

export interface FundingApi {
  createFunding(input: { method: string; params: Record<string, unknown> }): Res<ApiFundingIntent>;
  getFundingChallenge(id: string, payer: string): Res<{ typedData: unknown }>;
  authorizeFunding(id: string, input: { payer: string; signature: string[] }): Res<{ instructions: ApiFundingInstructions }>;
  submitFunding(id: string, txHash: string): Res<ApiFundingSubmit>;
  cancelFunding(id: string): Res<{ status: string }>;
}

export function fundingApiFor(client: ApiClient, siwsToken?: string): FundingApi {
  return {
    createFunding: (input) => client.createFunding(input, siwsToken),
    getFundingChallenge: (id, payer) => client.getFundingChallenge(id, payer, siwsToken),
    authorizeFunding: (id, input) => client.authorizeFunding(id, input, siwsToken),
    submitFunding: (id, txHash) => client.submitFunding(id, txHash, siwsToken),
    cancelFunding: (id) => client.cancelFunding(id, siwsToken),
  };
}

export function buildFundingTransferCall(instructions: ApiFundingInstructions): FundingTransferCall {
  const amount = BigInt(instructions.amountAtomic);
  const mask = (1n << 128n) - 1n;
  return {
    contractAddress: instructions.asset,
    entrypoint: "transfer",
    calldata: [instructions.payTo, (amount & mask).toString(), (amount >> 128n).toString()],
  };
}

export type FundingStep = "creating" | "signing" | "authorizing" | "paying" | "confirming";

export type FundingResult =
  | { status: "SETTLED"; intentId: string; credited?: number }
  | { status: "PENDING"; intentId: string; reason: string };

export interface FundWithTransferOptions {
  amountUsdc: string;
  onStep?: (step: FundingStep) => void;
  pollMs?: number;
  maxPolls?: number;
  sleep?: (ms: number) => Promise<void>;
}

export async function fundWithChainTransfer(
  api: FundingApi,
  wallet: FundingWallet,
  options: FundWithTransferOptions,
): Promise<FundingResult> {
  const step = options.onStep ?? (() => {});
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const pollMs = options.pollMs ?? 3000;
  const maxPolls = options.maxPolls ?? 20;

  step("creating");
  const { data: intent } = await api.createFunding({ method: "chain-transfer", params: { amountUsdc: options.amountUsdc } });

  let txHash: string;
  let transferStarted = false;
  try {
    step("signing");
    const challenge = await api.getFundingChallenge(intent.id, wallet.address);
    const signature = await wallet.signTypedData(challenge.data.typedData as TypedData);

    step("authorizing");
    const authorized = await api.authorizeFunding(intent.id, { payer: wallet.address, signature });

    step("paying");
    transferStarted = true;
    ({ txHash } = await wallet.sendTransfer(buildFundingTransferCall(authorized.data.instructions)));
  } catch (err) {
    if (!transferStarted || err instanceof FundingTransferNotSentError) {
      await api.cancelFunding(intent.id).catch(() => undefined);
    }
    throw err;
  }

  step("confirming");
  let reason = "waiting for the transfer to confirm";
  for (let attempt = 0; attempt < maxPolls; attempt++) {
    const res = await api.submitFunding(intent.id, txHash);
    if (res.data.status === "SETTLED") {
      return { status: "SETTLED", intentId: intent.id, credited: res.data.credited };
    }
    reason = res.data.reason;
    await sleep(pollMs);
  }
  return { status: "PENDING", intentId: intent.id, reason };
}
