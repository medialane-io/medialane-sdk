import { Account, Signer, num, stark, type Call, type InvocationsSignerDetails, type Signature, type V3InvocationsSignerDetails } from "starknet";
import type { FetchLike } from "../utils/fetch.js";
import { SponsoredCallRejectedError } from "../starknet/services/sponsoredExecutor.js";
import type { SelfFundedDeps } from "./executors.js";
import type { WalletExecutor } from "./types.js";

export const CREDITS_EXHAUSTED = "API credits have run out.";

export interface CosignedSelfFundedDeps extends SelfFundedDeps {
  proxyUrl: string;
  fetchImpl?: FetchLike;
}

type Cosign = (ownerSignature: string[], details: V3InvocationsSignerDetails) => Promise<string[]>;

class CosigningSigner extends Signer {
  constructor(privateKeyHex: string, private readonly cosign: Cosign) {
    super(privateKeyHex);
  }

  override async signTransaction(transactions: Call[], details: InvocationsSignerDetails): Promise<Signature> {
    const ownerSignature = await super.signTransaction(transactions, details);
    return this.cosign(stark.formatSignature(ownerSignature), details as V3InvocationsSignerDetails);
  }
}

function wireBounds(bounds: V3InvocationsSignerDetails["resourceBounds"]) {
  return Object.fromEntries(
    Object.entries(bounds).map(([resource, limit]) => [
      resource,
      { max_amount: num.toHex(limit.max_amount), max_price_per_unit: num.toHex(limit.max_price_per_unit) },
    ]),
  );
}

export function cosignedSelfFundedExecutor(deps: CosignedSelfFundedDeps): WalletExecutor {
  const doFetch = deps.fetchImpl ?? fetch;
  const url = `${deps.proxyUrl.replace(/\/$/, "")}/cosign`;

  return {
    async execute({ userAddress, privateKeyHex, calls, intentIds }) {
      const cosign: Cosign = async (ownerSignature, details) => {
        const res = await doFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intentIds,
            nonce: num.toHex(details.nonce),
            tip: num.toHex(details.tip),
            resourceBounds: wireBounds(details.resourceBounds),
            signature: ownerSignature,
          }),
        });
        const body = (await res.json().catch(() => null)) as { signature?: string[]; error?: string; code?: string } | null;
        if (res.ok && body?.signature) return body.signature;
        const reason = body?.code === "credits_exhausted" ? CREDITS_EXHAUSTED : body?.error || "We couldn't submit this transaction.";
        throw new SponsoredCallRejectedError(reason, {
          code: body?.code,
          status: res.status,
          stage: "execute",
          requestId: res.headers.get("x-request-id") ?? undefined,
        });
      };

      const account = new Account({
        provider: deps.provider(),
        address: userAddress,
        signer: new CosigningSigner(privateKeyHex, cosign),
        cairoVersion: "1",
      });
      const { transaction_hash } = await account.execute(calls);
      return { transactionHash: transaction_hash };
    },
  };
}
