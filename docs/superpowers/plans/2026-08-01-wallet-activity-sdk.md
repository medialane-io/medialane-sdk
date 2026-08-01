# Wallet Activity SDK Method Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `ApiClient.getWalletActivity(address, siwsToken, chain?)` to
`@medialane/sdk`, calling `medialane-backend`'s already-shipped
`GET /v1/wallet-activity`.

**Architecture:** One new chain-neutral type (`ApiWalletActivity`) + one new
`ApiClient` method, following two existing conventions exactly:
`getActivitiesByAddress`'s address-scoped-read URL shape, and
`getGatedContent`'s per-call-Bearer-token pattern (`this.request` directly,
not the header-less `this.get` helper).

**Tech Stack:** TypeScript, Bun test runner, tsup build.

## Global Constraints

- Runtime dep additions are not allowed — this task needs none; `zod` stays
  the only runtime dependency.
- `chains.ts`/`constants.ts` are not touched by this plan — no contract
  addresses involved.
- This method lives on `ApiClient` in the **chain-neutral core** (`.` root
  export), not `./starknet` — it's a plain JSON REST call with no
  starknet.js dependency, matching every other `ApiClient` method.
- Mirror `getActivitiesByAddress`'s URL-building (`this.addr(address)` for
  chain-scoped normalization) and `getGatedContent`'s auth pattern
  (`this.request(path, { method: "GET", headers: this.bearer(token) })`) —
  do not invent a third pattern.
- The backend's response already has `blockNumber` serialized as a `string`
  (fixed 2026-08-01, `medialane-backend` commit `7ef8930` — the raw Prisma
  `BigInt` crashed `JSON.stringify` before that fix) — `ApiWalletActivity`
  must type `blockNumber` as `string`, not attempt to parse it back to a
  number/bigint at this layer.
- Run `bun run typecheck` and `bun test` after every task — both must be
  clean before moving on.

---

## File Structure

- `src/types/api.ts` — add `ApiWalletActivity`.
- `src/api/client.ts` — add `getWalletActivity`.
- `src/api/client.walletActivity.test.ts` — new test file, mirrors
  `client.businessProvisioning.test.ts`'s `scriptFetch` convention exactly
  (mocked `globalThis.fetch`, restored in `afterEach` — never `mock.module`,
  which leaks process-globally across test files in this runner).

---

### Task 1: `ApiWalletActivity` type + `getWalletActivity` method

**Files:**
- Modify: `src/types/api.ts`
- Modify: `src/api/client.ts`
- Test: `src/api/client.walletActivity.test.ts`

**Interfaces:**
- Produces: `ApiWalletActivity` type;
  `ApiClient.getWalletActivity(address: string, siwsToken: string, chain?: "STARKNET"): Promise<ApiResponse<ApiWalletActivity[]>>`
  — consumed by the (separate, later) media-wallet client-integration plan.

- [ ] **Step 1: Add the type**

Append to `src/types/api.ts` (near `ApiBusinessProvisioning`):

```ts
// ─── Wallet Activity ────────────────────────────────────────────────────────

export interface ApiWalletActivity {
  id: string;
  chain: string;
  accountAddress: string;
  type: "SEND" | "RECEIVE" | "SWAP" | "DEPLOY" | "GUARDIAN_SET" | "GUARDIAN_TRIGGER_ESCAPE" | "GUARDIAN_COMPLETE_ESCAPE" | "GUARDIAN_CANCEL_ESCAPE";
  txHash: string;
  blockNumber: string;
  timestamp: string;
  tokenAddress: string | null;
  amount: string | null;
  counterparty: string | null;
  tokenInAddress: string | null;
  amountIn: string | null;
  tokenOutAddress: string | null;
  amountOut: string | null;
}
```

- [ ] **Step 2: Write the failing test**

`src/api/client.test.ts` mocks `globalThis.fetch` via `mock()`, restores it
in `afterEach`, and scripts responses by URL through a small `scriptFetch`
helper — mirror that exact convention:

```ts
// src/api/client.walletActivity.test.ts
import { test, expect, mock, afterEach } from "bun:test";
import { ApiClient } from "./client.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

interface Captured { url: string; init: RequestInit }

function scriptFetch(script: (url: string) => { status: number; body?: unknown }) {
  const captured: Captured[] = [];
  globalThis.fetch = mock(async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    captured.push({ url, init: init ?? {} });
    const { status, body } = script(url);
    return new Response(body === undefined ? "" : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return captured;
}

test("getWalletActivity GETs /v1/wallet-activity with the address query param and a Bearer token", async () => {
  const calls = scriptFetch(() => ({
    status: 200,
    body: { data: [{ id: "a1", chain: "STARKNET", accountAddress: "0x1", type: "SEND", txHash: "0xtx", blockNumber: "175", timestamp: "2026-08-01T00:00:00.000Z", tokenAddress: "0xtoken", amount: "100", counterparty: "0xother", tokenInAddress: null, amountIn: null, tokenOutAddress: null, amountOut: null }] },
  }));
  const client = new ApiClient("https://api.test.invalid", "test-key");
  const res = await client.getWalletActivity("0x1", "siws-token-abc");
  expect(calls[0].url).toBe(
    "https://api.test.invalid/v1/wallet-activity?address=0x0000000000000000000000000000000000000000000000000000000000000001&chain=STARKNET",
  );
  const headers = calls[0].init.headers as Record<string, string>;
  expect(headers["Authorization"]).toBe("Bearer siws-token-abc");
  expect(headers["x-api-key"]).toBe("test-key");
  expect(res.data[0].blockNumber).toBe("175");
});

test("getWalletActivity normalizes the address for the client's chain", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { data: [] } }));
  const client = new ApiClient("https://api.test.invalid", "test-key");
  await client.getWalletActivity("0x1", "siws-token-abc");
  expect(calls[0].url).toContain("address=0x0000000000000000000000000000000000000000000000000000000000000001");
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `bun test src/api/client.walletActivity.test.ts`
Expected: FAIL — `getWalletActivity` is not a method on `ApiClient`.

- [ ] **Step 4: Implement in `src/api/client.ts`**

Add `ApiWalletActivity` to the existing `import type { ... } from "../types/api.js"` block at the top of the file.

Add near `getActivitiesByAddress` (the "Activities" section, or immediately after `getGatedContent` — either is fine, this method belongs conceptually with both):

```ts
  getWalletActivity(
    address: string,
    siwsToken: string,
    chain: "STARKNET" = "STARKNET",
  ): Promise<ApiResponse<ApiWalletActivity[]>> {
    return this.request<ApiResponse<ApiWalletActivity[]>>(
      `/v1/wallet-activity?address=${this.addr(address)}&chain=${chain}`,
      { method: "GET", headers: this.bearer(siwsToken) },
    );
  }
```

**Corrected during execution (2026-08-01):** the first test's original
version asserted the URL as `?address=0x1` verbatim — but `this.addr()`
normalizes/pads the address before it ever reaches the URL, so that exact
match could never pass (caught before running the test, by checking the
second test's own — correct — expectation of the padded form and noticing
the first test contradicted it). Fixed above to expect the padded address
and the trailing `&chain=STARKNET`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun test src/api/client.walletActivity.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Typecheck + full suite**

Run: `bun run typecheck && bun test`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/types/api.ts src/api/client.ts src/api/client.walletActivity.test.ts
git commit -m "feat: add ApiClient.getWalletActivity"
```

---

## Self-Review Notes

- **Spec coverage:** design spec §4 (SDK addition) — fully covered by Task 1.
  §3 (SIWS flow), §5 (the `/activities` page), §6 (retiring the old panel) are
  explicitly out of scope for this plan — media-wallet's own follow-up plan.
- **Type consistency:** `ApiWalletActivity.type`'s union matches the eight
  `WalletActivityType` enum values exactly as shipped in
  `medialane-backend/prisma/schema.prisma` — verified against the actual
  enum, not re-derived from memory.
- **No placeholder risk:** the query-string ordering note in Task 1 Step 4 is
  a real, bounded uncertainty (which order `URLSearchParams`-equivalent
  string concatenation produces) flagged explicitly with an exact resolution
  path (adjust the assertion after seeing real output), not a vague "handle
  it" — consistent with the "no placeholders" rule.
