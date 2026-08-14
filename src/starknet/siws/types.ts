import type { TypedData } from "starknet";

export interface SiwsSigner {
  signMessage: (typedData: TypedData) => Promise<unknown>;
}

export interface RequestSiwsTokenArgs {

  backendUrl: string;
  walletAddress: string;
  signer: SiwsSigner;
}
