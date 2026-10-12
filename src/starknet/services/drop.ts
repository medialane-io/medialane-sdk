import { RpcProvider, type AccountInterface, type ProviderInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { getStarknetCoordinates } from "../../chains.js";
import type { CreateDropParams, DropTerms } from "../../types/services.js";
import type { TxResult } from "../../types/marketplace.js";
import { buildFeeCall } from "../fee/index.js";
import { dropCalls } from "../drop-calls.js";
import { readDrop } from "../drop-state.js";

export type { CreateDropParams, DropTerms };

export class DropService {
  private readonly factoryAddress: string;
  private readonly config: ResolvedConfig;
  private readonly reader: Pick<ProviderInterface, "callContract">;

  constructor(config: ResolvedConfig, reader?: Pick<ProviderInterface, "callContract">) {
    this.factoryAddress = getStarknetCoordinates(config.chain).dropFactory!;
    this.config = config;
    this.reader = reader ?? new RpcProvider({ nodeUrl: config.rpcUrl });
  }

  async createDrop(account: AccountInterface, params: CreateDropParams): Promise<TxResult> {
    const res = await account.execute([dropCalls.create(this.factoryAddress, params)]);
    return { txHash: res.transaction_hash };
  }

  /** Mints `quantity` to the account, paying the drop's price and the platform fee. */
  async claim(
    account: AccountInterface,
    params: { collection: string; quantity: bigint | string | number; proof?: string[] },
  ): Promise<TxResult> {
    const drop = await readDrop(this.reader, params.collection);
    const calls = dropCalls.claim(params.collection, {
      quantity: params.quantity,
      proof: params.proof,
      price: drop.price,
      paymentToken: drop.paymentToken,
    });
    const fee = drop.price > 0n
      ? buildFeeCall(
          { surface: "launchpad", token: drop.paymentToken, grossAmount: drop.price * BigInt(params.quantity) },
          this.config.feeConfig,
        )
      : null;
    const res = await account.execute(fee ? [...calls, fee] : calls);
    return { txHash: res.transaction_hash };
  }

  async issue(
    account: AccountInterface,
    params: { collection: string; recipient: string; quantity: bigint | string | number },
  ): Promise<TxResult> {
    const res = await account.execute([dropCalls.issue(params.collection, params.recipient, params.quantity)]);
    return { txHash: res.transaction_hash };
  }

  async setAllowlistRoot(account: AccountInterface, params: { collection: string; root: string }): Promise<TxResult> {
    const res = await account.execute([dropCalls.setAllowlistRoot(params.collection, params.root)]);
    return { txHash: res.transaction_hash };
  }
}
