import { describe, test, expect } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";

const PEERS = ["starknet", "viem", "@solana/web3.js", "@stellar/stellar-sdk"];
const STATEMENT = /(?:^|\n)\s*(import|export)\s+(type\s+)?([^;]*?)\s*from\s*["']([^"']+)["']/g;

function isTypeOnly(clause: string): boolean {
  const named = clause.match(/^\{([\s\S]*)\}$/);
  if (!named) return false;
  const members = named[1].split(",").map((m) => m.trim()).filter(Boolean);
  return members.length > 0 && members.every((m) => m.startsWith("type "));
}

function runtimePeers(entry: string): Set<string> {
  const found = new Set<string>();
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(STATEMENT)) {
      const [, , typeKeyword, clause, specifier] = match;
      if (typeKeyword || isTypeOnly(clause.trim())) continue;
      if (specifier.startsWith(".")) {
        const target = resolve(dirname(file), specifier.replace(/\.js$/, ".ts"));
        if (existsSync(target)) visit(target);
        continue;
      }
      if (PEERS.includes(specifier)) found.add(specifier);
    }
  };
  visit(resolve(entry));
  return found;
}

describe("entry points load only the chain libraries they declare", () => {
  test("the root entry needs no chain library", () => {
    expect([...runtimePeers("src/index.ts")]).toEqual([]);
  });

  test("the contract entry needs no chain library", () => {
    expect([...runtimePeers("src/contract/index.ts")]).toEqual([]);
  });

  test("the server entry needs no chain library", () => {
    expect([...runtimePeers("src/server/index.ts")]).toEqual([]);
  });

  test("the starknet entry loads starknet", () => {
    expect([...runtimePeers("src/starknet/index.ts")]).toEqual(["starknet"]);
  });
});
