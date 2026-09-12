const MEDIALANE_SUFFIX = ".medialane.io";
const STARK_ORDER = (1n << 251n) + 17n * (1n << 192n) + 1n;

export const APPROVAL_PATH = "/approve-app";

export interface ApprovalRequest {
  publicKey: string;
  appName: string;
  returnUrl: string;
}

export class InvalidApprovalRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidApprovalRequestError";
  }
}

export function isMedialaneOrigin(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return parsed.hostname === "localhost";
  return parsed.hostname === "medialane.io" || parsed.hostname.endsWith(MEDIALANE_SUFFIX);
}

function assertPublicKey(value: string): string {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(value)) {
    throw new InvalidApprovalRequestError("That is not a wallet key.");
  }
  const scalar = BigInt(value);
  if (scalar === 0n || scalar >= STARK_ORDER) {
    throw new InvalidApprovalRequestError("That is not a wallet key.");
  }
  return `0x${scalar.toString(16)}`;
}

function assertAppName(value: string): string {
  const name = value.replace(/\s+/g, " ").trim().slice(0, 40);
  if (!name) throw new InvalidApprovalRequestError("The app asking has no name.");
  return name;
}

function assertReturnUrl(value: string): string {
  if (!isMedialaneOrigin(value)) {
    throw new InvalidApprovalRequestError("That app is not part of Medialane.");
  }
  return value;
}

export function buildApprovalUrl(approverOrigin: string, request: ApprovalRequest): string {
  if (!isMedialaneOrigin(approverOrigin)) {
    throw new InvalidApprovalRequestError("That app is not part of Medialane.");
  }

  const url = new URL(APPROVAL_PATH, approverOrigin);
  url.searchParams.set("key", assertPublicKey(request.publicKey));
  url.searchParams.set("app", assertAppName(request.appName));
  url.searchParams.set("return", assertReturnUrl(request.returnUrl));
  return url.toString();
}

export function parseApprovalRequest(params: URLSearchParams): ApprovalRequest {
  return {
    publicKey: assertPublicKey(params.get("key") ?? ""),
    appName: assertAppName(params.get("app") ?? ""),
    returnUrl: assertReturnUrl(params.get("return") ?? ""),
  };
}

export function buildReturnUrl(returnUrl: string, outcome: "approved" | "declined"): string {
  const url = new URL(assertReturnUrl(returnUrl));
  url.searchParams.set("approval", outcome);
  return url.toString();
}
