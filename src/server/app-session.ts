import type { FetchLike } from "../utils/fetch.js";
import { readCookie, sessionCookie, ACCOUNT_SESSION_COOKIE } from "./app-gateway.js";

export interface AppSessionConfig {
  appId: string;
  backendUrl: string;
  apiKey: string | undefined;
  appSecret?: string;
  requireEmail?: boolean;
  fetchImpl?: FetchLike;
}

export const SESSION_ERROR_CODES = {
  signInRequired: "sign_in_required",
  accountInactive: "account_inactive",
} as const;

const SESSION_ENDED_CODES = new Set<string>(Object.values(SESSION_ERROR_CODES));

async function sessionEnded(res: Response): Promise<boolean> {
  if (res.status !== 401 && res.status !== 403) return false;
  const body = (await res.json().catch(() => null)) as { code?: string } | null;
  return SESSION_ENDED_CODES.has(body?.code ?? "");
}

function signedOut(): Response {
  const res = Response.json(null);
  res.headers.append("set-cookie", sessionCookie("", 0));
  return res;
}

export function createAppSessionHandler(config: AppSessionConfig): {
  GET(req: Request): Promise<Response>;
  DELETE(req: Request): Promise<Response>;
} {
  const doFetch = config.fetchImpl ?? fetch;
  const base = config.backendUrl.replace(/\/$/, "");
  return {
    async GET(req) {
      const session = readCookie(req, ACCOUNT_SESSION_COOKIE);
      if (!session) return Response.json(null);
      const res = await doFetch(`${base}/v1/users/me`, {
        headers: {
          "x-api-key": config.apiKey ?? "",
          "x-app-id": config.appId,
          ...(config.appSecret ? { "x-app-secret": config.appSecret } : {}),
          "x-account-session": session,
        },
        cache: "no-store",
      });
      if (await sessionEnded(res.clone())) return signedOut();
      if (!res.ok) return Response.json({ error: "Session check failed" }, { status: 502 });
      const account = (await res.json()) as { email?: string | null };
      if (config.requireEmail && !account.email) return Response.json(null);
      return Response.json(account);
    },
    async DELETE() {
      return signedOut();
    },
  };
}
