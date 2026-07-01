import type { TypedData } from "starknet";

/** Anything that can produce a Starknet signature over SNIP-12 typed data. */
export interface SiwsSigner {
  signMessage: (typedData: TypedData) => Promise<unknown>;
}

export interface RequestSiwsTokenArgs {
  /** Medialane backend base URL (each app resolves this per its own env/proxy setup). */
  backendUrl: string;
  walletAddress: string;
  signer: SiwsSigner;
}
