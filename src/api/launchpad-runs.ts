export type RunStatus = "DRAFT" | "PAID" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface RunQuoteLine {
  action: string;
  units: number;
  unitCredits: number;
  credits: number;
}

export interface RunQuote {
  lines: RunQuoteLine[];
  total: number;
}

export type NextStep =
  | { kind: "collection" }
  | { kind: "wait-collection" }
  | { kind: "upload"; files: string[] }
  | { kind: "metadata"; items: number[] }
  | { kind: "batch"; index: number }
  | { kind: "wait"; index: number }
  | { kind: "done" };

/** What a paid IP Ticketing run asks for next. Kinds it shares with the shared union keep their shape. */
export type TicketingNextStep =
  | { kind: "collection" }
  | { kind: "wait-collection" }
  | { kind: "upload"; files: string[] }
  | { kind: "ticket-metadata" }
  | { kind: "tier" }
  | { kind: "wait-tier" }
  | { kind: "wallets" }
  | { kind: "batch"; index: number }
  | { kind: "wait"; index: number }
  | { kind: "done" };

/** What a paid Certificate Emission run asks for next. No tier step — PoP collections are flat. */
export type CertificateEmissionNextStep =
  | { kind: "collection" }
  | { kind: "wait-collection" }
  | { kind: "upload"; files: string[] }
  | { kind: "certificate-metadata" }
  | { kind: "wallets" }
  | { kind: "batch"; index: number }
  | { kind: "wait"; index: number }
  | { kind: "done" };

export interface WalletRequest {
  recipient: string;
}

interface LaunchpadRunBase {
  id: string;
  status: RunStatus;
  spec: unknown;
  quote: RunQuote | null;
  creditsHeld: number;
  creditsSpent: number;
  progress: unknown;
  createdAt: string;
  updatedAt: string;
}

export type DataTokenizationRun = LaunchpadRunBase & { service: "data-tokenization-erc721"; next?: NextStep };
export type TicketingRun = LaunchpadRunBase & { service: "ip-ticketing"; next?: TicketingNextStep };
export type CertificateEmissionRun = LaunchpadRunBase & { service: "certificate-emission"; next?: CertificateEmissionNextStep };
export type LaunchpadRun = DataTokenizationRun | TicketingRun | CertificateEmissionRun;

export const isDataTokenizationRun = (run: LaunchpadRun): run is DataTokenizationRun =>
  run.service === "data-tokenization-erc721";

export const isTicketingRun = (run: LaunchpadRun): run is TicketingRun => run.service === "ip-ticketing";

export const isCertificateEmissionRun = (run: LaunchpadRun): run is CertificateEmissionRun =>
  run.service === "certificate-emission";

export interface ConfirmResult {
  pending: boolean;
  status: string;
  completed?: boolean;
}

export class RunRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: Record<string, unknown>,
  ) {
    super(message);
  }
}

export type TokenSource = () => Promise<string | null>;


export interface LaunchpadRunsClientOptions {
  /** The backend, or an app's proxy to it. `/v1/portal/runs` is appended. */
  baseUrl: string;
  getToken: TokenSource;
  fetchImpl?: typeof fetch;
}

/** Paid launchpad runs for the caller's account: create, pay, execute step by step, confirm. */
export function createLaunchpadRunsClient({ baseUrl, getToken, fetchImpl = fetch }: LaunchpadRunsClientOptions) {
  const runsUrl = `${baseUrl.replace(/\/$/, "")}/v1/portal/runs`;
  const runBase = (id: string): string => `${runsUrl}/${id}`;
  const runBatchBase = (id: string, index: number): string => `${runBase(id)}/batches/${index}`;
  const runCollectionBase = (id: string): string => `${runBase(id)}/collection`;
  const runTierBase = (id: string): string => `${runBase(id)}/tier`;

  const authorizedFetch: typeof fetch = async (input, init) => {
    const token = await getToken();
    const headers = new Headers(init?.headers);
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetchImpl(input, { ...init, headers, cache: "no-store" });
  };

  async function call<T>(url: string, init?: RequestInit): Promise<{ status: number; data: T }> {
    const res = await authorizedFetch(url, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers as Record<string, string> | undefined) },
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new RunRequestError(String(body.error ?? "Something went wrong with this run"), res.status, body);
    }
    return { status: res.status, data: body.data as T };
  }

  const post = <T>(url: string, body?: unknown) =>
    call<T>(url, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

  const confirm = async (url: string): Promise<ConfirmResult> => {
    const { status, data } = await post<{ status: string; completed?: boolean }>(url);
    return { pending: status === 202, status: data.status, completed: data.completed };
  };

  const ticketing = {
    uploadUrl: async (id: string, name: string) =>
      (await post<{ name: string; url: string }>(`${runBase(id)}/files/upload-url`, { name })).data.url,

    uploaded: async (id: string, name: string, cid: string) =>
      (await post<{ name: string; uri: string }>(`${runBase(id)}/files/uploaded`, { name, cid })).data,

    metadata: async (id: string, userAddress: string) =>
      (await post<{ tokenUri: string }>(`${runBase(id)}/metadata`, { userAddress })).data,

    /** Guests who still need a wallet deployed; the ones who already have one are recorded on the run. */
    resolveWallets: async (id: string) =>
      (await post<{ pending: string[] }>(`${runBase(id)}/wallets/resolve`)).data.pending,

    registerWallet: async (id: string, request: WalletRequest) =>
      (await post<{ recipient: string; walletAddress: string }>(`${runBase(id)}/wallets`, request)).data,

    confirmCollection: (id: string) => confirm(`${runCollectionBase(id)}/confirm`),
    confirmTier: (id: string) => confirm(`${runTierBase(id)}/confirm`),
    confirmBatch: (id: string, index: number) => confirm(`${runBatchBase(id, index)}/confirm`),
  };

  const certificateEmission = {
    uploadUrl: async (id: string, name: string) =>
      (await post<{ name: string; url: string }>(`${runBase(id)}/files/upload-url`, { name })).data.url,

    uploaded: async (id: string, name: string, cid: string) =>
      (await post<{ name: string; uri: string }>(`${runBase(id)}/files/uploaded`, { name, cid })).data,

    metadata: async (id: string, userAddress: string) =>
      (await post<{ tokenUri: string }>(`${runBase(id)}/metadata`, { userAddress })).data,

    resolveWallets: async (id: string) =>
      (await post<{ pending: string[] }>(`${runBase(id)}/wallets/resolve`)).data.pending,

    registerWallet: async (id: string, request: WalletRequest) =>
      (await post<{ recipient: string; walletAddress: string }>(`${runBase(id)}/wallets`, request)).data,

    confirmCollection: (id: string) => confirm(`${runCollectionBase(id)}/confirm`),
    confirmBatch: (id: string, index: number) => confirm(`${runBatchBase(id, index)}/confirm`),
  };

  return {
    authorizedFetch,
    runBase,
    runBatchBase,
    runCollectionBase,
    runTierBase,
    ticketing,
    certificateEmission,

    list: async () => (await call<LaunchpadRun[]>(runsUrl)).data,

    get: async (id: string) => (await call<LaunchpadRun>(`${runBase(id)}`)).data,

    create: async (service: string, spec: unknown) =>
      (await post<LaunchpadRun>(runsUrl, { service, spec })).data,

    update: async (id: string, spec: unknown) =>
      (await call<LaunchpadRun>(`${runBase(id)}`, { method: "PATCH", body: JSON.stringify({ spec }) })).data,

    cancel: async (id: string) => (await post<LaunchpadRun>(`${runBase(id)}/cancel`)).data,

    checkoutWithCredits: async (id: string) =>
      (await post<LaunchpadRun>(`${runBase(id)}/checkout`, { method: "credits" })).data,

    checkoutFromWallet: async (id: string, intentId: string) =>
      (await post<LaunchpadRun>(`${runBase(id)}/checkout`, { method: "wallet", intentId })).data,

    uploadUrl: async (id: string, name: string) =>
      (await post<{ name: string; url: string }>(`${runBase(id)}/files/upload-url`, { name })).data.url,

    uploaded: async (id: string, name: string, cid: string) =>
      (await post<{ name: string; uri: string }>(`${runBase(id)}/files/uploaded`, { name, cid })).data,

    itemMetadata: async (id: string, index: number, userAddress: string) =>
      (await post<{ index: number; tokenUri: string }>(`${runBase(id)}/items/${index}/metadata`, { userAddress })).data,

    confirmBatch: async (id: string, index: number): Promise<ConfirmResult> => {
      const { status, data } = await post<{ status: string; completed?: boolean }>(
        `${runBase(id)}/batches/${index}/confirm`,
      );
      return { pending: status === 202, status: data.status, completed: data.completed };
    },

    confirmCollection: async (id: string): Promise<ConfirmResult> => {
      const { status, data } = await post<{ status: string }>(`${runBase(id)}/collection/confirm`);
      return { pending: status === 202, status: data.status };
    },
  };
}

export type LaunchpadRunsClient = ReturnType<typeof createLaunchpadRunsClient>;
