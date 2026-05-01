import type { MedialaneErrorCode } from "../types/errors.js";

export class MedialaneError extends Error {
  constructor(
    message: string,
    public readonly code: MedialaneErrorCode = "UNKNOWN",
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "MedialaneError";
  }
}
