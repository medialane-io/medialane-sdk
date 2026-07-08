import {
  Contract,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  type Transaction,
  rpc,
} from "@stellar/stellar-sdk";
import { sha256 } from "@noble/hashes/sha2.js";
import type { Chain } from "../chains.js";
import { getCoordinates, type StellarCoordinates } from "../chains.js";
import type {
  AdapterTxResult,
  OrderRef,
  RegisterOrderParams,
  VenueAdapter,
} from "../adapters/types.js";

/** Signer shape: the account's public key + a transaction signer (a wallet
 *  kit or a Keypair-backed callback). */
export interface StellarSigner {
  publicKey: string;
  signTransaction(xdr: string, networkPassphrase: string): Promise<string>;
}

export interface StellarVenueOptions {
  server: rpc.Server;
  networkPassphrase: string;
  /** Defaults to the chain registry's venue contract (populated at deploy). */
  contractId?: string;
  baseFee?: string;
}

/** Canonical order id on Stellar (spec §3.2b): a stable hex digest of
 *  (contract, offerer, salt) — orders are storage-keyed, not hashed on-chain. */
export function stellarOrderRef(contractId: string, offerer: string, salt: bigint): OrderRef {
  const payload = new TextEncoder().encode(`${contractId}:${offerer}:${salt.toString()}`);
  return "0x" + Buffer.from(sha256(payload)).toString("hex");
}

/** The Medialane venue adapter for Stellar (Soroban). Both directions settle
 *  in any SEP-41 token including native XLM (the native SAC) — the chain with
 *  no native-bid restriction. */
export class StellarVenue implements VenueAdapter<StellarSigner> {
  readonly chain: Chain = "STELLAR";
  private readonly server: rpc.Server;
  private readonly passphrase: string;
  private readonly contract: Contract;
  private readonly contractId: string;
  private readonly baseFee: string;

  constructor(opts: StellarVenueOptions) {
    this.server = opts.server;
    this.passphrase = opts.networkPassphrase;
    const contractId = opts.contractId ?? maybeCoords()?.marketplace;
    if (!contractId) throw new Error("No Stellar venue contract configured");
    this.contractId = contractId;
    this.contract = new Contract(contractId);
    this.baseFee = opts.baseFee ?? "100";
  }

  async registerOrder(
    signer: StellarSigner,
    params: RegisterOrderParams,
  ): Promise<AdapterTxResult & { orderRef: OrderRef }> {
    const salt = BigInt(params.salt);
    const counter = await this.getCounter(signer.publicKey);
    const op = this.contract.call(
      "register_order",
      nativeToScVal(signer.publicKey, { type: "address" }),
      nativeToScVal(salt, { type: "u64" }),
      nativeToScVal([params.side === "listing" ? "Listing" : "Bid"], { type: "symbol" }),
      nativeToScVal(params.asset.contract, { type: "address" }),
      nativeToScVal(Number(params.asset.tokenId), { type: "u32" }),
      nativeToScVal(params.paymentToken, { type: "address" }),
      nativeToScVal(BigInt(params.amount), { type: "i128" }),
      nativeToScVal(params.royaltyMaxBps, { type: "u32" }),
      nativeToScVal(BigInt(params.startTime), { type: "u64" }),
      nativeToScVal(BigInt(params.endTime), { type: "u64" }),
      nativeToScVal(counter, { type: "u64" }),
    );
    const txHash = await this.invoke(signer, op);
    return { txHash, orderRef: stellarOrderRef(this.contractId, signer.publicKey, salt) };
  }

  async fulfillOrder(
    signer: StellarSigner,
    _orderRef: OrderRef,
    opts?: { offerer?: string; salt?: string },
  ): Promise<AdapterTxResult> {
    if (!opts?.offerer || opts.salt === undefined) {
      throw new Error("Stellar fulfillment needs { offerer, salt } (orders are storage-keyed)");
    }
    const op = this.contract.call(
      "fulfill_order",
      nativeToScVal(signer.publicKey, { type: "address" }),
      nativeToScVal(opts.offerer, { type: "address" }),
      nativeToScVal(BigInt(opts.salt), { type: "u64" }),
    );
    return { txHash: await this.invoke(signer, op) };
  }

  async cancelOrder(
    signer: StellarSigner,
    _orderRef: OrderRef,
    opts?: { salt?: string },
  ): Promise<AdapterTxResult> {
    if (opts?.salt === undefined) throw new Error("Stellar cancel needs { salt }");
    const op = this.contract.call(
      "cancel_order",
      nativeToScVal(signer.publicKey, { type: "address" }),
      nativeToScVal(BigInt(opts.salt), { type: "u64" }),
    );
    return { txHash: await this.invoke(signer, op) };
  }

  async incrementCounter(signer: StellarSigner): Promise<AdapterTxResult> {
    const op = this.contract.call(
      "increment_counter",
      nativeToScVal(signer.publicKey, { type: "address" }),
    );
    return { txHash: await this.invoke(signer, op) };
  }

  async getOrderDetails(_orderRef: OrderRef): Promise<unknown> {
    throw new Error("Use getOrder(offerer, salt) — Stellar orders are storage-keyed");
  }

  async getOrder(offerer: string, salt: bigint): Promise<unknown> {
    return this.view("get_order", [
      nativeToScVal(offerer, { type: "address" }),
      nativeToScVal(salt, { type: "u64" }),
    ]);
  }

  async getCounter(address: string): Promise<bigint> {
    const value = await this.view("get_counter", [nativeToScVal(address, { type: "address" })]);
    return BigInt((value as bigint | number | undefined) ?? 0);
  }

  private async view(method: string, args: Parameters<Contract["call"]>[1][]): Promise<unknown> {
    const account = await this.server.getAccount(PLACEHOLDER_SOURCE);
    const tx = new TransactionBuilder(account, { fee: this.baseFee, networkPassphrase: this.passphrase })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(30)
      .build();
    const sim = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      return scValToNative(sim.result.retval);
    }
    return undefined;
  }

  private async invoke(
    signer: StellarSigner,
    op: ReturnType<Contract["call"]>,
  ): Promise<string> {
    const account = await this.server.getAccount(signer.publicKey);
    const tx = new TransactionBuilder(account, { fee: this.baseFee, networkPassphrase: this.passphrase })
      .addOperation(op)
      .setTimeout(60)
      .build();
    const prepared = await this.server.prepareTransaction(tx);
    const signedXdr = await signer.signTransaction(prepared.toXDR(), this.passphrase);
    const signed = TransactionBuilder.fromXDR(signedXdr, this.passphrase) as Transaction;
    const sent = await this.server.sendTransaction(signed);
    return sent.hash;
  }
}

/** Public "muxed-free" placeholder for view simulations (any funded account
 *  works as a simulation source; callers can override via getAccount). */
const PLACEHOLDER_SOURCE = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

function maybeCoords(): StellarCoordinates | undefined {
  try {
    return getCoordinates("STELLAR");
  } catch {
    return undefined;
  }
}
