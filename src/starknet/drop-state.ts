import type { ProviderInterface } from "starknet";
import { normalizeAddress } from "../utils/address.js";

export interface DropOnchain {
  organizer: string;
  /** Unix seconds; 0 = open from creation. */
  startTime: number;
  /** Unix seconds; 0 = never closes. */
  endTime: number;
  price: bigint;
  paymentToken: string;
  /** 0 = unlimited. */
  maxPerWallet: bigint;
  /** 0x0 = open to everyone. */
  allowlistRoot: string;
  /** 0 = no cap. */
  maxSupply: bigint;
  totalMinted: bigint;
}

const hex = (v: string | undefined) => normalizeAddress("STARKNET", v ?? "0x0");
const u256 = (low: string | undefined, high: string | undefined) =>
  BigInt(low ?? "0x0") + (BigInt(high ?? "0x0") << 128n);

/** A drop's organizer, terms, allowlist root and supply, read from chain. */
export async function readDrop(provider: Pick<ProviderInterface, "callContract">, collection: string): Promise<DropOnchain> {
  const contractAddress = hex(collection);
  const read = (entrypoint: string) => provider.callContract({ contractAddress, entrypoint, calldata: [] });
  const [organizer, terms, root, max, minted] = await Promise.all([
    read("organizer"), read("terms"), read("allowlist_root"), read("max_supply"), read("total_minted"),
  ]);
  return {
    organizer: hex(organizer[0]),
    startTime: Number(BigInt(terms[0] ?? "0x0")),
    endTime: Number(BigInt(terms[1] ?? "0x0")),
    price: u256(terms[2], terms[3]),
    paymentToken: hex(terms[4]),
    maxPerWallet: u256(terms[5], terms[6]),
    allowlistRoot: root[0] ?? "0x0",
    maxSupply: u256(max[0], max[1]),
    totalMinted: u256(minted[0], minted[1]),
  };
}
