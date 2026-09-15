import type { Call, TypedData } from "starknet";

export interface SealedOwner {
  credentialId: string;
  ownerPubKey: string;
  address: string;
  iv: string;
  ciphertext: string;
}

export interface OwnerSigner {
  address: string;
  signTypedData(typedData: TypedData): Promise<string[]>;
}

export interface ExecutedTransaction {
  transactionHash: string;
}

export interface WalletExecutor {
  execute(input: {
    userAddress: string;
    privateKeyHex: string;
    calls: Call[];
  }): Promise<ExecutedTransaction>;
}

export interface ReceiptProviderLike {
  getClassHashAt(address: string): Promise<unknown>;
}
