import { MedialaneApiError } from "../api/client.js";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 300;
const DEFAULT_MAX_DELAY_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: RetryOptions
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = opts?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = opts?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry 4xx errors (client errors) — they won't succeed on retry
      if (err instanceof MedialaneApiError && err.status < 500) {
        throw err;
      }

      // Retry on 5xx or network errors (TypeError from fetch)
      const isRetryable =
        (err instanceof MedialaneApiError && err.status >= 500) ||
        err instanceof TypeError;

      if (!isRetryable || attempt === maxAttempts - 1) {
        throw err;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * baseDelayMs;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + jitter, maxDelayMs);
      await sleep(delay);
    }
  }

  throw lastError;
}
