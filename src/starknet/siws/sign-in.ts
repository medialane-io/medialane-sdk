import type { TypedData } from "starknet";
import { normalizeSiwsSignature } from "./client.js";
import type { SiwsSigner } from "./types.js";

export async function signInWithWallet(args: {
  backendUrl: string;
  walletAddress: string;
  signer: SiwsSigner;
  appSource: string;
}): Promise<void> {
  const base = args.backendUrl.replace(/\/$/, "");
  const nonceRes = await fetch(`${base}/v1/auth/siws/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: args.walletAddress }),
  });
  if (!nonceRes.ok) throw new Error("Failed to prepare wallet sign-in");
  const { nonce, typedData } = (await nonceRes.json()) as { nonce: string; typedData: TypedData };
  const signature = normalizeSiwsSignature(await args.signer.signMessage(typedData));
  const verifyRes = await fetch(`${base}/v1/auth/siws/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: args.walletAddress, nonce, signature, appSource: args.appSource }),
  });
  if (!verifyRes.ok) {
    const body = (await verifyRes.json().catch(() => null)) as { message?: string; error?: string } | null;
    throw new Error(body?.message ?? body?.error ?? "Wallet sign-in failed");
  }
}
