import { describe, expect, test } from "bun:test";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createGuardedLookup, guardedGet } from "./guarded-get.js";

type Answer = { address: string; family: number }[];

function lookupAnswering(answer: Answer) {
  return ((_hostname: string, _options: unknown, callback: (err: Error | null, addresses: Answer) => void) =>
    callback(null, answer)) as never;
}

function resolveWith(answer: Answer, options: { all?: boolean } = {}) {
  return new Promise<{ err: (Error & { code?: string }) | null; address: unknown; family?: number }>((done) => {
    createGuardedLookup(lookupAnswering(answer))("host.example", options as never, (err, address, family) =>
      done({ err: err as (Error & { code?: string }) | null, address, family }),
    );
  });
}

describe("guarded lookup", () => {
  test("a name resolving to a private address is refused", async () => {
    expect((await resolveWith([{ address: "127.0.0.1", family: 4 }])).err?.code).toBe("EBLOCKED");
  });

  test("a mixed public and private answer is refused", async () => {
    const answer = [{ address: "93.184.216.34", family: 4 }, { address: "10.0.0.1", family: 4 }];
    expect((await resolveWith(answer)).err?.code).toBe("EBLOCKED");
  });

  test("an IPv4-mapped private address is refused", async () => {
    expect((await resolveWith([{ address: "::ffff:127.0.0.1", family: 6 }])).err?.code).toBe("EBLOCKED");
  });

  test("an empty answer is refused", async () => {
    expect((await resolveWith([])).err?.code).toBe("EBLOCKED");
  });

  test("a public answer is passed through in the requested form", async () => {
    const answer = [{ address: "93.184.216.34", family: 4 }];
    expect(await resolveWith(answer)).toEqual({ err: null, address: "93.184.216.34", family: 4 });
    expect(await resolveWith(answer, { all: true })).toMatchObject({ err: null, address: answer });
  });
});

describe("guardedGet", () => {
  test("a name that resolves to a private address is never connected to", async () => {
    let reached = false;
    const server = createServer((_req, res) => {
      reached = true;
      res.end("x");
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const { port } = server.address() as AddressInfo;
    try {
      const failure = await guardedGet(new URL(`http://localhost:${port}/a.png`), {}).catch((e: unknown) => e);
      expect((failure as { code?: string }).code).toBe("EBLOCKED");
      expect(reached).toBe(false);
    } finally {
      server.close();
    }
  });
});
