import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type Connection,
} from "@solana/web3.js";
import type { Chain } from "../chains.js";
import { getCoordinates, type SolanaCoordinates } from "../chains.js";
import type {
  AdapterTxResult,
  OrderRef,
  RegisterOrderParams,
  VenueAdapter,
} from "../adapters/types.js";
import {
  BorshWriter,
  MPL_CORE_PROGRAM_ID,
  counterPda,
  instructionDiscriminator,
  orderPda,
  settlementPda,
} from "./encoding.js";

/** Wallet-adapter-compatible signer. */
export interface SolanaSigner {
  publicKey: PublicKey;
  signTransaction(tx: Transaction): Promise<Transaction>;
}

export interface SolanaVenueOptions {
  connection: Connection;
  /** Defaults to the chain registry's marketplace program (populated at deploy). */
  programId?: string;
}

/** The Medialane venue adapter for Solana. The canonical order id is the
 *  order PDA (spec §3.2b). Native SOL is the payment when `paymentToken`
 *  is the "native" sentinel; SPL mints otherwise (bids are SPL-only,
 *  enforced by the program). */
export class SolanaVenue implements VenueAdapter<SolanaSigner> {
  readonly chain: Chain = "SOLANA";
  private readonly connection: Connection;
  private readonly program: PublicKey;

  constructor(opts: SolanaVenueOptions) {
    this.connection = opts.connection;
    const program = opts.programId ?? maybeCoords()?.marketplaceProgram;
    if (!program) throw new Error("No Solana marketplace program configured");
    this.program = new PublicKey(program);
  }

  async registerOrder(
    signer: SolanaSigner,
    params: RegisterOrderParams,
  ): Promise<AdapterTxResult & { orderRef: OrderRef }> {
    const offerer = signer.publicKey;
    const salt = BigInt(params.salt);
    const isNative = params.paymentToken === "native";
    const counter = await this.getCounter(offerer.toBase58());
    const writer = new BorshWriter()
      .u64(salt)
      .u8(params.side === "listing" ? 0 : 1)
      .option(isNative ? null : new PublicKey(params.paymentToken), (mint) => writer.pubkey(mint))
      .u64(BigInt(params.amount))
      .u16(params.royaltyMaxBps)
      .i64(BigInt(params.startTime))
      .i64(BigInt(params.endTime))
      .u64(counter);
    const order = orderPda(this.program, offerer, salt);
    const asset = new PublicKey(params.asset.contract);
    const instruction = new TransactionInstruction({
      programId: this.program,
      keys: [
        { pubkey: offerer, isSigner: true, isWritable: true },
        { pubkey: order, isSigner: false, isWritable: true },
        { pubkey: counterPda(this.program, offerer), isSigner: false, isWritable: true },
        { pubkey: settlementPda(this.program), isSigner: false, isWritable: false },
        { pubkey: asset, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(params.asset.tokenId), isSigner: false, isWritable: true },
        { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(writer.build(instructionDiscriminator("register_order"))),
    });
    const txHash = await this.send(signer, instruction);
    return { txHash, orderRef: order.toBase58() };
  }

  async fulfillOrder(): Promise<AdapterTxResult> {
    throw new Error(
      "Solana fulfillment requires the order's creator remaining-accounts; use buildFulfillInstruction with explicit accounts",
    );
  }

  async cancelOrder(signer: SolanaSigner, orderRef: OrderRef): Promise<AdapterTxResult> {
    const instruction = new TransactionInstruction({
      programId: this.program,
      keys: [
        { pubkey: signer.publicKey, isSigner: true, isWritable: false },
        { pubkey: new PublicKey(orderRef), isSigner: false, isWritable: true },
      ],
      data: Buffer.from(new BorshWriter().build(instructionDiscriminator("cancel_order"))),
    });
    const txHash = await this.send(signer, instruction);
    return { txHash };
  }

  async incrementCounter(signer: SolanaSigner): Promise<AdapterTxResult> {
    const instruction = new TransactionInstruction({
      programId: this.program,
      keys: [
        { pubkey: signer.publicKey, isSigner: true, isWritable: true },
        { pubkey: counterPda(this.program, signer.publicKey), isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(new BorshWriter().build(instructionDiscriminator("increment_counter"))),
    });
    const txHash = await this.send(signer, instruction);
    return { txHash };
  }

  async getOrderDetails(orderRef: OrderRef): Promise<unknown> {
    const info = await this.connection.getAccountInfo(new PublicKey(orderRef));
    return info?.data ?? null;
  }

  async getCounter(address: string): Promise<bigint> {
    const pda = counterPda(this.program, new PublicKey(address));
    const info = await this.connection.getAccountInfo(pda);
    if (!info || info.data.length < 16) return 0n;
    // Anchor account: 8-byte discriminator + u64 count (LE).
    return new DataView(info.data.buffer, info.data.byteOffset + 8, 8).getBigUint64(0, true);
  }

  private async send(signer: SolanaSigner, instruction: TransactionInstruction): Promise<string> {
    const tx = new Transaction().add(instruction);
    tx.feePayer = signer.publicKey;
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    const signed = await signer.signTransaction(tx);
    return this.connection.sendRawTransaction(signed.serialize());
  }
}

function maybeCoords(): SolanaCoordinates | undefined {
  try {
    return getCoordinates("SOLANA");
  } catch {
    return undefined;
  }
}
