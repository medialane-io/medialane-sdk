import type { TypedData } from "starknet";
import type { ApiClient } from "../../api/client.js";
import type { FundingApi } from "../../api/domains/portal.js";
import type { ApiFundingInstructions } from "../../types/api.js";

export type FundingTransferApi = Pick<FundingApi, "create" | "challenge" | "authorize" | "submit" | "cancel">;

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

export function fundingApiFor(client: ApiClient): FundingTransferApi {
  return client.portal.funding;
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

export type FundWithTransferOptions = (
  | { amount: string; amountUsdc?: never }
  | { amountUsdc: string; amount?: never }
) & FundWithTransferRest;

interface FundWithTransferRest {
  onStep?: (step: FundingStep) => void;
  pollMs?: number;
  maxPolls?: number;
  sleep?: (ms: number) => Promise<void>;
}

export async function fundWithChainTransfer(
  api: FundingTransferApi,
  wallet: FundingWallet,
  options: FundWithTransferOptions,
): Promise<FundingResult> {
  const step = options.onStep ?? (() => {});
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const pollMs = options.pollMs ?? 3000;
  const maxPolls = options.maxPolls ?? 20;

  step("creating");
  const params = options.amount !== undefined ? { amount: options.amount } : { amountUsdc: options.amountUsdc };
  const intent = await api.create({ method: "chain-transfer", params });

  let txHash: string;
  let transferStarted = false;
  try {
    step("signing");
    const challenge = await api.challenge(intent.id, wallet.address);
    const signature = await wallet.signTypedData(challenge.typedData as TypedData);

    step("authorizing");
    const authorized = await api.authorize(intent.id, { payer: wallet.address, signature });

    step("paying");
    transferStarted = true;
    ({ txHash } = await wallet.sendTransfer(buildFundingTransferCall(authorized.instructions)));
  } catch (err) {
    if (!transferStarted || err instanceof FundingTransferNotSentError) {
      await api.cancel(intent.id).catch(() => undefined);
    }
    throw err;
  }

  step("confirming");
  let reason = "waiting for the transfer to confirm";
  for (let attempt = 0; attempt < maxPolls; attempt++) {
    const res = await api.submit(intent.id, txHash);
    if (res.status === "SETTLED") {
      return { status: "SETTLED", intentId: intent.id, credited: res.credited };
    }
    reason = res.reason;
    await sleep(pollMs);
  }
  return { status: "PENDING", intentId: intent.id, reason };
}
