import type { Chain } from "../chains.js";
import { MedialaneApiError, parseRetryAfter } from "../errors.js";
import { normalizeAddress } from "../utils/address.js";
import type { FetchLike } from "../utils/fetch.js";
import { withRetry, type RetryOptions } from "../utils/retry.js";

export type BearerSource = string | (() => string | undefined);

export interface TransportOptions {
  baseUrl: string;
  apiKey?: string;
  bearer?: BearerSource;
  retry?: RetryOptions;
  chain?: Chain;
  fetch?: FetchLike;
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  bearer?: string;
  absent?: readonly number[];
}

export function queryString(query: Record<string, QueryValue> | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function failureFrom(response: Response, path: string): Promise<MedialaneApiError> {
  const text = await response.text().catch(() => response.statusText);
  let message = `Request failed with status ${response.status}`;
  let details: unknown = text;
  let serverCode: string | undefined;
  try {
    const body = JSON.parse(text) as { error?: unknown; code?: unknown };
    if (typeof body.error === "string" && body.error.trim() !== "") message = body.error;
    if (typeof body.code === "string") serverCode = body.code;
    details = body;
  } catch {
    details = text;
  }
  return new MedialaneApiError(
    response.status,
    message,
    parseRetryAfter(response.headers.get("retry-after")),
    details,
    path,
    serverCode,
    response.headers.get("x-request-id") ?? undefined,
  );
}

export class Transport {
  readonly chain: Chain;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(private readonly options: TransportOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.headers = options.apiKey ? { "x-api-key": options.apiKey } : {};
    this.chain = options.chain ?? "STARKNET";
  }

  withBearer(bearer: BearerSource | undefined): Transport {
    return new Transport({ ...this.options, bearer });
  }

  settings(): TransportOptions {
    return this.options;
  }

  addr(address: string): string {
    return normalizeAddress(this.chain, address);
  }

  async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const method = opts.method ?? "GET";
    const url = `${this.baseUrl}${path}${queryString(opts.query)}`;
    const headers: Record<string, string> = { ...this.headers };
    const token = opts.bearer ?? this.defaultBearer();
    if (token) headers.Authorization = `Bearer ${token}`;

    let body: BodyInit | undefined;
    if (opts.body instanceof FormData) {
      body = opts.body;
    } else if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }

    const absent = (status: number) => opts.absent?.includes(status) === true;
    const response = await withRetry(
      async () => {
        const res = await (this.options.fetch ?? globalThis.fetch)(url, { method, headers, body });
        if (!res.ok && !absent(res.status)) throw await failureFrom(res, path);
        return res;
      },
      this.options.retry,
      method,
    );

    if (absent(response.status)) return null as T;
    return response.json() as Promise<T>;
  }

  get<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
    return this.request<T>(path, { query });
  }

  post<T>(path: string, body?: unknown, opts: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
    return this.request<T>(path, { ...opts, method: "POST", body: body ?? {} });
  }

  patch<T>(path: string, body: unknown, opts: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
    return this.request<T>(path, { ...opts, method: "PATCH", body });
  }

  delete<T>(path: string, body?: unknown, opts: Omit<RequestOptions, "method" | "body"> = {}): Promise<T> {
    return this.request<T>(path, { ...opts, method: "DELETE", body });
  }

  find<T>(path: string, opts: Omit<RequestOptions, "absent"> & { also?: readonly number[] } = {}): Promise<T | null> {
    const { also, ...rest } = opts;
    return this.request<T | null>(path, { ...rest, absent: [404, ...(also ?? [])] });
  }

  private defaultBearer(): string | undefined {
    const source = this.options.bearer;
    return typeof source === "function" ? source() : source;
  }
}
