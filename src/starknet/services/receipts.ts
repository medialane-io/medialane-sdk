import { hash } from "starknet";
import { normalizeAddress } from "../../utils/address.js";
import { getService } from "../../services/registry.js";

export interface ReceiptLike {
  events?: Array<{ from_address?: string; keys?: string[]; data?: string[] }>;
}

type ReceiptEvent = NonNullable<ReceiptLike["events"]>[number];

export type DeployingServiceId = "mip-erc1155" | "ip-tickets" | "ip-ticketing" | "ip-club" | "drop-collection";

const DEPLOY_EVENTS: Record<DeployingServiceId, { event: string; address: (e: ReceiptEvent) => string | undefined }> = {
  "mip-erc1155": { event: "CollectionDeployed", address: (e) => e.keys?.[1] },
  "ip-tickets": { event: "CollectionDeployed", address: (e) => e.keys?.[1] },
  "ip-ticketing": { event: "CollectionDeployed", address: (e) => e.keys?.[1] },
  "ip-club": { event: "ClubDeployed", address: (e) => e.keys?.[1] },
  "drop-collection": { event: "DropCreated", address: (e) => e.data?.[0] },
};

const IP_MINTED_SELECTOR = BigInt(hash.getSelectorFromName("IPMinted"));
const TRANSFER_SELECTOR = BigInt(hash.getSelectorFromName("Transfer"));

function sameFelt(a: string | undefined, b: string | bigint): boolean {
  if (a === undefined) return false;
  try {
    return BigInt(a) === BigInt(b);
  } catch {
    return false;
  }
}

function u256(low: string | undefined, high: string | undefined): string {
  return (BigInt(low ?? 0) + (BigInt(high ?? 0) << 128n)).toString();
}

export function deployedCollectionFromReceipt(receipt: ReceiptLike, service: DeployingServiceId): string | null {
  const factory = getService(service)?.onchain?.STARKNET?.factoryAddress;
  const { event, address } = DEPLOY_EVENTS[service];
  const selector = BigInt(hash.getSelectorFromName(event));
  for (const e of receipt.events ?? []) {
    if (factory && !sameFelt(e.from_address, factory)) continue;
    if (!sameFelt(e.keys?.[0], selector)) continue;
    const value = address(e);
    if (value) return normalizeAddress("STARKNET", value);
  }
  return null;
}

export function mintedTokenIdFromReceipt(receipt: ReceiptLike, contract: string): string | null {
  for (const e of receipt.events ?? []) {
    if (!sameFelt(e.from_address, contract)) continue;
    const keys = e.keys ?? [];
    if (sameFelt(keys[0], IP_MINTED_SELECTOR) && keys.length >= 3) return u256(keys[1], keys[2]);
    if (sameFelt(keys[0], TRANSFER_SELECTOR) && keys.length === 5 && sameFelt(keys[1], 0n)) return u256(keys[3], keys[4]);
  }
  return null;
}
