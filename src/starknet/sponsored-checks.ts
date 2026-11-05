import { hash, type Call } from "starknet";
import { sameFelt } from "../utils/felt.js";
import { getTokenBySymbol } from "../utils/token.js";
import { buildSetFirstGuardianCall } from "./media-wallet/guardian.js";

interface SignedCall {
  To?: unknown;
  Selector?: unknown;
  Calldata?: unknown;
}

const calldataOf = (call: Call): readonly unknown[] | null => (Array.isArray(call.calldata) ? call.calldata : call.calldata === undefined ? [] : null);

const sameCalldata = (a: readonly unknown[] | null, b: readonly unknown[] | null): boolean =>
  a !== null && b !== null && a.length === b.length && a.every((value, i) => sameFelt(value, b[i]));

export function sameCalls(a: readonly Call[], b: readonly Call[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (call, i) =>
        sameFelt(call.contractAddress, b[i]!.contractAddress) &&
        call.entrypoint === b[i]!.entrypoint &&
        sameCalldata(calldataOf(call), calldataOf(b[i]!)),
    )
  );
}

function isEmptyCall(call: SignedCall): boolean {
  return sameFelt(call.To, "0x0") && sameFelt(call.Selector, "0x0") && Array.isArray(call.Calldata) && call.Calldata.length === 0;
}

export function typedDataMatchesCalls(typedData: unknown, calls: readonly Call[]): boolean {
  const signed = (typedData as { message?: { Calls?: unknown } } | null)?.message?.Calls;
  if (!Array.isArray(signed)) return false;
  const trailingFeeCall = signed.length === calls.length + 1 && isEmptyCall(signed[calls.length] as SignedCall);
  if (signed.length !== calls.length && !trailingFeeCall) return false;
  return calls.every((call, i) => {
    const s = signed[i] as SignedCall;
    return (
      sameFelt(s.To, call.contractAddress) &&
      sameFelt(s.Selector, hash.getSelectorFromName(call.entrypoint)) &&
      sameCalldata(Array.isArray(s.Calldata) ? s.Calldata : null, calldataOf(call))
    );
  });
}

export function deploymentIsMediaWallet(deployment: unknown, ownerAddress: string, classHash: string): boolean {
  const d = deployment as { address?: unknown; class_hash?: unknown; salt?: unknown; calldata?: unknown } | null;
  if (!sameFelt(d?.address, ownerAddress) || !sameFelt(d?.class_hash, classHash)) return false;
  if (typeof d?.salt !== "string" || !Array.isArray(d.calldata) || !d.calldata.every((v) => typeof v === "string")) return false;
  try {
    return sameFelt(hash.calculateContractAddressFromHash(d.salt, classHash, d.calldata, 0), ownerAddress);
  } catch {
    return false;
  }
}

export function isMediaWalletSetupCall(call: Call, ownerAddress: string): boolean {
  if (call.entrypoint === "change_guardians") {
    const data = calldataOf(call);
    const guardian = data?.[data.length - 1];
    return guardian != null && sameCalls([call], [buildSetFirstGuardianCall(ownerAddress, String(guardian))]);
  }
  const strk = getTokenBySymbol("STRK");
  return (
    strk !== undefined &&
    sameCalls([call], [{ contractAddress: strk.address, entrypoint: "transfer", calldata: [ownerAddress, "0", "0"] }])
  );
}
