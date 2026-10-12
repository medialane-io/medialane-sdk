import { readCookie, sessionCookie, ACCOUNT_SESSION_COOKIE } from "./app-gateway.js";

export interface AppSessionConfig {
  appId: string;
  backendUrl: string;
  apiKey: string | undefined;
  fetchImpl?: typeof fetch;
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
        headers: { "x-api-key": config.apiKey ?? "", "x-app-id": config.appId, "x-account-session": session },
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 403) return signedOut();
      if (!res.ok) return Response.json({ error: "Session check failed" }, { status: 502 });
      return Response.json(await res.json());
    },
    async DELETE() {
      return signedOut();
    },
  };
}
