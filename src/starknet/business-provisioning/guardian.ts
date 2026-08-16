import { num, type Call, type ProviderInterface } from "starknet";
import { normalizeAddress } from "../../utils/address.js";

const norm = (address: string): string => normalizeAddress("STARKNET", address);

const SIGNER_TYPE_NAMES = ["Starknet", "Secp256k1", "Secp256r1"] as const;
type SignerTypeName = (typeof SIGNER_TYPE_NAMES)[number];

export interface GuardianInfo {
  type: SignerTypeName;
  guid: string;
  storedValue: string;
}

function encodeFeltArray(items: string[]): string[] {
  return [num.toHex(items.length), ...items];
}

function encodeStarknetSigner(pubkey: string): string[] {
  return ["0x0", num.toHex(pubkey)];
}

function encodeStarknetSignerArray(pubkeys: string[]): string[] {
  return [num.toHex(pubkeys.length), ...pubkeys.flatMap(encodeStarknetSigner)];
}

export function buildSetFirstGuardianCall(address: string, guardianPubkey: string): Call {
  return {
    contractAddress: norm(address),
    entrypoint: "change_guardians",
    calldata: [...encodeFeltArray([]), ...encodeStarknetSignerArray([guardianPubkey])],
  };
}

export function buildTriggerEscapeOwnerCall(targetAddress: string, newOwnerPubkey: string): Call {
  return {
    contractAddress: norm(targetAddress),
    entrypoint: "trigger_escape_owner",
    calldata: encodeStarknetSigner(newOwnerPubkey),
  };
}

export function buildCompleteEscapeOwnerCall(targetAddress: string): Call {
  return { contractAddress: norm(targetAddress), entrypoint: "escape_owner", calldata: [] };
}

export function buildCancelEscapeCall(address: string): Call {
  return { contractAddress: norm(address), entrypoint: "cancel_escape", calldata: [] };
}

export function decodeGuardiansInfo(res: string[]): GuardianInfo[] {
  const len = Number(res[0]);
  const out: GuardianInfo[] = [];
  for (let i = 0; i < len; i++) {
    const base = 1 + i * 3;
    out.push({
      type: SIGNER_TYPE_NAMES[Number(res[base])] ?? "Starknet",
      guid: res[base + 1],
      storedValue: res[base + 2],
    });
  }
  return out;
}

export type EscapeTypeName = "None" | "Guardian" | "Owner";
export type EscapeStatusName = "None" | "NotReady" | "Ready" | "Expired";
const ESCAPE_TYPE_NAMES: EscapeTypeName[] = ["None", "Guardian", "Owner"];
const ESCAPE_STATUS_NAMES: EscapeStatusName[] = ["None", "NotReady", "Ready", "Expired"];

export interface EscapeInfo {
  readyAt: number;
  escapeType: EscapeTypeName;
  status: EscapeStatusName;
}

export function decodeEscapeAndStatus(res: string[]): EscapeInfo {
  // Contract return shape: `(Escape { ready_at, escape_type, new_signer: Option<Signer> }, EscapeStatus)`.
  // res[0]=ready_at, res[1]=escape_type, res[2]=Option tag (0=Some,1=None).
  // When Some, the Signer payload (type + value = 2 felts) sits at res[3..4], so
  // the trailing EscapeStatus is at res[5]; when None it's at res[3].
  const readyAt = Number(res[0]);
  const escapeType = ESCAPE_TYPE_NAMES[Number(res[1])] ?? "None";
  const optionTag = Number(res[2]);
  const statusIndex = optionTag === 0 ? 5 : 3;
  const status = ESCAPE_STATUS_NAMES[Number(res[statusIndex])] ?? "None";
  return { readyAt, escapeType, status };
}

export async function getGuardians(provider: ProviderInterface, address: string): Promise<GuardianInfo[]> {
  const res = await provider.callContract({
    contractAddress: norm(address),
    entrypoint: "get_guardians_info",
    calldata: [],
  });
  return decodeGuardiansInfo(res as unknown as string[]);
}

export async function getEscape(provider: ProviderInterface, address: string): Promise<EscapeInfo> {
  const res = await provider.callContract({
    contractAddress: norm(address),
    entrypoint: "get_escape_and_status",
    calldata: [],
  });
  return decodeEscapeAndStatus(res as unknown as string[]);
}

export async function getEscapeSecurityPeriod(provider: ProviderInterface, address: string): Promise<number> {
  const res = await provider.callContract({
    contractAddress: norm(address),
    entrypoint: "get_escape_security_period",
    calldata: [],
  });
  return Number((res as unknown as string[])[0]);
}
