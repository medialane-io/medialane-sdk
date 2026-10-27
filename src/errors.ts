import type { MedialaneErrorCode } from "./types/errors.js";

export class UserFacingError extends Error {
  readonly retryable: boolean;

  constructor(message: string, options: { retryable?: boolean } = {}) {
    super(message);
    this.name = "UserFacingError";
    this.retryable = options.retryable ?? true;
  }
}

export class MedialaneError extends Error {
  constructor(
    message: string,
    public readonly code: MedialaneErrorCode = "UNKNOWN",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "MedialaneError";
  }
}

const RESOURCE_NOT_FOUND: ReadonlyArray<readonly [string, MedialaneErrorCode]> = [
  ["/v1/orders", "ORDER_NOT_FOUND"],
  ["/v1/tokens", "TOKEN_NOT_FOUND"],
  ["/v1/collections", "COLLECTION_NOT_FOUND"],
  ["/v1/intents", "INTENT_NOT_FOUND"],
];

export function errorCodeFor(status: number, path = ""): MedialaneErrorCode {
  if (status === 404) {
    return RESOURCE_NOT_FOUND.find(([prefix]) => path.startsWith(prefix))?.[1] ?? "NOT_FOUND";
  }
  if (status === 429) return "RATE_LIMITED";
  if (status === 410) return "INTENT_EXPIRED";
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 400) return "INVALID_PARAMS";
  return "UNKNOWN";
}

export class MedialaneApiError extends MedialaneError {
  constructor(
    public readonly status: number,
    message: string,
    public readonly retryAfterMs?: number,
    public readonly details?: unknown,
    path?: string,
    public readonly serverCode?: string,
    public readonly requestId?: string,
  ) {
    super(message, errorCodeFor(status, path));
    this.name = "MedialaneApiError";
  }
}

export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
}
