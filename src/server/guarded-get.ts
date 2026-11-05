import { lookup as dnsLookup, type LookupAddress, type LookupAllOptions } from "node:dns";
import { request as httpRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";
import { Readable } from "node:stream";
import { isPrivateHost } from "./ssrf-guard.js";

const NULL_BODY_STATUSES = new Set([204, 205, 304]);

type AllLookup = (
  hostname: string,
  options: LookupAllOptions,
  callback: (err: NodeJS.ErrnoException | null, addresses: LookupAddress[]) => void,
) => void;

function blocked(hostname: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`${hostname} does not resolve to a public address`), { code: "EBLOCKED" });
}

export function createGuardedLookup(lookup: AllLookup = dnsLookup): LookupFunction {
  return (hostname, options, callback) => {
    lookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) return callback(err, "", 0);
      if (addresses.length === 0 || addresses.some(({ address }) => isPrivateHost(address))) {
        return callback(blocked(hostname), "", 0);
      }
      if (options.all) return callback(null, addresses);
      const [first] = addresses;
      callback(null, first!.address, first!.family);
    });
  };
}

function toResponse(res: IncomingMessage): Response {
  const headers = new Headers();
  for (const [name, value] of Object.entries(res.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  const status = res.statusCode ?? 502;
  if (NULL_BODY_STATUSES.has(status)) {
    res.resume();
    return new Response(null, { status, headers });
  }
  return new Response(Readable.toWeb(res) as unknown as BodyInit, { status, headers });
}

export function guardedGet(url: URL, headers: Record<string, string>, signal?: AbortSignal): Promise<Response> {
  return new Promise((resolve, reject) => {
    const options = { method: "GET", headers, lookup: createGuardedLookup() };
    const onResponse = (res: IncomingMessage) => resolve(toResponse(res));
    const req = url.protocol === "https:" ? httpsRequest(url, options, onResponse) : httpRequest(url, options, onResponse);
    const abort = () => {
      req.destroy(signal!.reason);
      reject(signal!.reason);
    };
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    req.on("close", () => signal?.removeEventListener("abort", abort));
    req.on("error", reject);
    req.end();
  });
}
