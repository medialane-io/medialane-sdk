# Business Provisioning SDK Utility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `@medialane/sdk`'s Starknet adapter the pure, testable building
blocks a business runs on its **own** infrastructure to provision MediaWallet
accounts for recipients who don't have a wallet yet — derive a per-recipient
owner key from a business-held secret, compute/deploy the account, and later
sign the `change_owners` handoff — plus the two backend calls that register
and complete a provisioning row.

**Architecture:** Pure calldata/key builders (no RPC, no signing, no
submission) under `src/starknet/business-provisioning/`, following this SDK's
existing venue-signer pattern: the SDK builds, the caller's own code submits
via starknet.js. Two new chain-neutral `ApiClient` methods call the backend
routes from `medialane-backend`'s `2026-08-01-business-provisioning-backend.md`
plan. No new runtime dependency — `@noble/hashes` (already a real dependency)
does the key derivation; `starknet` (peer dep) does address/hash math.

**Tech Stack:** TypeScript, `starknet` (peer, v6+), `@noble/hashes` (HKDF),
Bun test runner, tsup build.

## Global Constraints

- Runtime dep additions are not allowed here — `@noble/hashes` is already a
  real dependency; `starknet` stays a peer dependency, imported the same way
  every other file in `src/starknet/` imports it.
- **`chains.ts` is the single source of every contract address / class hash**
  (`getCoordinates(chain)`) — no hardcoded class hash inside the new modules;
  it must come from `chains.ts` → `constants.ts`, exactly like every existing
  `STARKNET_*` constant.
- **`normalizeAddress`/address conventions**: pubkeys and addresses that cross
  a public function boundary should be treated as `BigNumberish` in, hex-string
  out (matches `media-wallet`'s `account.ts` convention this code ports).
- **No client-specific naming or internal rationale** anywhere in this repo
  (design spec §8.1) — this is `@medialane/sdk`, published to npm. Function
  names, comments, and test fixtures stay fully generic ("business",
  "recipient", "provisioning") — no client/deal names anywhere.
- **This code never talks to `medialane-backend` directly except via the two
  new `ApiClient` methods added in Task 6.** No new transaction-relay concept —
  the SDK never submits a transaction on the caller's behalf; it only builds
  the pieces starknet.js needs.
- Run `bun run typecheck` and `bun test` after every task — both must be
  clean before moving on.

---

## File Structure

- `src/chains.ts` — add `mediaWalletClassHash` to `StarknetCoordinates` + the
  `STARKNET` coordinates object.
- `src/constants.ts` — add `STARKNET_MEDIAWALLET_CLASS_HASH`.
- `src/starknet/business-provisioning/derive.ts` — HKDF owner-key derivation
  (pure, no starknet.js RPC calls, but does use `starknet`'s `ec.starkCurve`
  for the pubkey).
- `src/starknet/business-provisioning/account.ts` — constructor calldata +
  counterfactual address computation (ports `media-wallet`'s `account.ts`
  exactly, sourcing the class hash from `constants.ts` instead of a local
  literal).
- `src/starknet/business-provisioning/handoff.ts` — owner GUID computation +
  `change_owners` call builder.
- `src/starknet/business-provisioning/deploy.ts` — `DeployAccountContractPayload`
  builder for starknet.js's `Account.deployAccount()`.
- `src/starknet/business-provisioning/index.ts` — barrel re-export.
- `src/starknet/index.ts` — re-export the new barrel (the `./starknet` subpath
  export).
- `src/types/api.ts` — add `ApiBusinessProvisioning`.
- `src/api/client.ts` — add `registerBusinessProvisioning` +
  `completeBusinessProvisioning`.
- `CHANGELOG.md` — entry (required before any publish, per this repo's own
  convention — not part of this plan's tasks, called out for whoever
  publishes next).

---

### Task 1: MediaWallet class hash in `chains.ts`

**Files:**
- Modify: `src/chains.ts`
- Modify: `src/constants.ts`
- Test: `src/chains.test.ts`

**Interfaces:**
- Produces: `getCoordinates("STARKNET").mediaWalletClassHash`,
  `STARKNET_MEDIAWALLET_CLASS_HASH` — consumed by Task 3.

- [ ] **Step 1: Write the failing test**

Append to `src/chains.test.ts`:

```ts
test("getCoordinates returns the MediaWallet account class hash", () => {
  const c = getCoordinates("STARKNET");
  expect(c.mediaWalletClassHash).toBe(
    "0x014b210c7d47392691144bafecdca3c6c7791cc295ea305988da0a724c05ac31",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/chains.test.ts`
Expected: FAIL — `mediaWalletClassHash` is `undefined`.

- [ ] **Step 3: Add the field**

In `src/chains.ts`, add to the `StarknetCoordinates` interface (anywhere in
the `?: \`0x${string}\`` block):

```ts
  mediaWalletClassHash?: `0x${string}`;
```

Add to the `STARKNET` coordinates object (the value is the audited
`medialane-contracts/contracts/MediaWallet` class hash, declared on both
Sepolia and Mainnet — same hash, since a class hash is a pure function of
compiled bytecode):

```ts
  mediaWalletClassHash: "0x014b210c7d47392691144bafecdca3c6c7791cc295ea305988da0a724c05ac31",
```

In `src/constants.ts`, add near the other class-hash constants:

```ts
export const STARKNET_MEDIAWALLET_CLASS_HASH = SN.mediaWalletClassHash!;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/chains.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + full suite**

Run: `bun run typecheck && bun test`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/chains.ts src/constants.ts src/chains.test.ts
git commit -m "feat: add MediaWallet account class hash to chains.ts"
```

---

### Task 2: Owner key derivation

**Files:**
- Create: `src/starknet/business-provisioning/derive.ts`
- Test: `src/starknet/business-provisioning/derive.test.ts`

**Interfaces:**
- Produces: `deriveOwnerKeyPair(secret: Uint8Array, recipientId: string): { privateKey: string; publicKey: string }`
  — consumed by Tasks 3, 4, 5.

`recipientId` is deliberately generic (not `email` specifically) — whatever
stable per-recipient string the caller uses to key the derivation (an email is
the expected value in practice, per the design spec, but the function itself
doesn't care).

- [ ] **Step 1: Write the failing test**

```ts
// src/starknet/business-provisioning/derive.test.ts
import { test, expect } from "bun:test";
import { deriveOwnerKeyPair } from "./derive.js";

const SECRET = new TextEncoder().encode("test-only-secret-do-not-use");

test("derivation is deterministic for the same secret + recipient", () => {
  const a = deriveOwnerKeyPair(SECRET, "a@example.com");
  const b = deriveOwnerKeyPair(SECRET, "a@example.com");
  expect(a).toEqual(b);
});

test("different recipients under the same secret derive different keys", () => {
  const a = deriveOwnerKeyPair(SECRET, "a@example.com");
  const b = deriveOwnerKeyPair(SECRET, "b@example.com");
  expect(a.privateKey).not.toBe(b.privateKey);
  expect(a.publicKey).not.toBe(b.publicKey);
});

test("different secrets derive different keys for the same recipient", () => {
  const other = new TextEncoder().encode("a-different-secret");
  const a = deriveOwnerKeyPair(SECRET, "a@example.com");
  const b = deriveOwnerKeyPair(other, "a@example.com");
  expect(a.privateKey).not.toBe(b.privateKey);
});

test("private key is a valid Stark-curve scalar and publicKey matches it", () => {
  const { ec } = require("starknet");
  const { privateKey, publicKey } = deriveOwnerKeyPair(SECRET, "a@example.com");
  const STARK_ORDER = 3618502788666131213697322783095070105526743751716087489154079457884512865583n;
  expect(BigInt(privateKey) > 0n).toBe(true);
  expect(BigInt(privateKey) < STARK_ORDER).toBe(true);
  expect(ec.starkCurve.getStarkKey(privateKey)).toBe(publicKey);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/starknet/business-provisioning/derive.test.ts`
Expected: FAIL — `./derive.js` does not exist.

- [ ] **Step 3: Implement**

```ts
// src/starknet/business-provisioning/derive.ts
import { extract, expand } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { ec, num } from "starknet";

const STARK_ORDER = 3618502788666131213697322783095070105526743751716087489154079457884512865583n;

/**
 * Derive a MediaWallet owner key pair from a business-held secret and a
 * per-recipient identifier (typically their email) — deterministic, so the
 * business never has to store a per-recipient key: recompute it from the one
 * secret it already holds whenever it's needed (deploy time, handoff time),
 * then discard it. HKDF-SHA256(secret, recipientId), reduced mod the Stark
 * curve order to get a valid scalar (never zero).
 */
export function deriveOwnerKeyPair(
  secret: Uint8Array,
  recipientId: string,
): { privateKey: string; publicKey: string } {
  const prk = extract(sha256, secret);
  const okm = expand(sha256, prk, new TextEncoder().encode(recipientId), 32);
  let scalar = BigInt("0x" + Buffer.from(okm).toString("hex")) % STARK_ORDER;
  if (scalar === 0n) scalar = 1n;
  const privateKey = num.toHex(scalar);
  const publicKey = ec.starkCurve.getStarkKey(privateKey);
  return { privateKey, publicKey };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/starknet/business-provisioning/derive.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck + full suite**

Run: `bun run typecheck && bun test`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/starknet/business-provisioning/derive.ts src/starknet/business-provisioning/derive.test.ts
git commit -m "feat: add deterministic owner-key derivation for business provisioning"
```

---

### Task 3: Account address + constructor calldata

**Files:**
- Create: `src/starknet/business-provisioning/account.ts`
- Test: `src/starknet/business-provisioning/account.test.ts`

**Interfaces:**
- Consumes: `STARKNET_MEDIAWALLET_CLASS_HASH` (Task 1).
- Produces: `ownerConstructorCalldata(ownerPubkey): string[]`,
  `computeAccountAddress(ownerPubkey, salt?): string` — consumed by Tasks 4, 5.

This ports `media-wallet/wallet-app/src/lib/wallet/account.ts` exactly (same
constructor-calldata shape, same address derivation), sourcing the class hash
from this SDK's own `constants.ts` instead of a locally-declared literal —
`chains.ts` is the single source here, not a second copy of the hash.

- [ ] **Step 1: Write the failing test**

```ts
// src/starknet/business-provisioning/account.test.ts
import { test, expect } from "bun:test";
import { ownerConstructorCalldata, computeAccountAddress } from "./account.js";
import { STARKNET_MEDIAWALLET_CLASS_HASH } from "../../constants.js";

const OWNER = "0x61cc05c5da6e9b1403a27ffa564498cd2b8cda1428b053b08dbbd1cceb744c6";

test("owner constructor calldata is [0, pubkey, 1]", () => {
  expect(ownerConstructorCalldata("0xabc")).toEqual(["0x0", "0xabc", "0x1"]);
  expect(ownerConstructorCalldata(2748)).toEqual(["0x0", "0xabc", "0x1"]);
});

test("computeAccountAddress is deterministic", () => {
  expect(computeAccountAddress(OWNER, 0)).toBe(computeAccountAddress(OWNER, 0));
});

test("computeAccountAddress varies with salt and owner", () => {
  expect(computeAccountAddress(OWNER, 1)).not.toBe(computeAccountAddress(OWNER, 0));
  expect(computeAccountAddress("0xdead", 0)).not.toBe(computeAccountAddress(OWNER, 0));
});

test("computeAccountAddress is a valid Starknet felt (< 2^251)", () => {
  const addr = computeAccountAddress(OWNER, 0);
  expect(addr.startsWith("0x")).toBe(true);
  expect(BigInt(addr) < 2n ** 251n).toBe(true);
  expect(BigInt(addr) > 0n).toBe(true);
});

test("uses the SDK's single-source MediaWallet class hash", () => {
  expect(STARKNET_MEDIAWALLET_CLASS_HASH).toBe(
    "0x014b210c7d47392691144bafecdca3c6c7791cc295ea305988da0a724c05ac31",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/starknet/business-provisioning/account.test.ts`
Expected: FAIL — `./account.js` does not exist (the last test passes on its
own since it only touches Task 1's constant — the first four fail).

- [ ] **Step 3: Implement**

```ts
// src/starknet/business-provisioning/account.ts
import { hash, num, type BigNumberish } from "starknet";
import { STARKNET_MEDIAWALLET_CLASS_HASH } from "../../constants.js";

/**
 * Account constructor calldata for a Stark-curve owner and no guardian:
 * `serialize((Signer::Starknet(owner_pubkey), Option::None))` = `[0, owner_pubkey, 1]`.
 * Verified against `medialane-contracts/contracts/MediaWallet`'s factory
 * `build_constructor_calldata`.
 */
export function ownerConstructorCalldata(ownerPubkey: BigNumberish): string[] {
  return ["0x0", num.toHex(ownerPubkey), "0x1"];
}

/**
 * Counterfactual MediaWallet account address for `(ownerPubkey, salt)` —
 * standard Starknet derivation with `deploy_from_zero` (deployer address = 0).
 * With `salt = 0` the address is a pure function of the owner key, so it can
 * be computed before anything is deployed on-chain.
 */
export function computeAccountAddress(ownerPubkey: BigNumberish, salt: BigNumberish = 0): string {
  return hash.calculateContractAddressFromHash(
    num.toHex(salt),
    STARKNET_MEDIAWALLET_CLASS_HASH,
    ownerConstructorCalldata(ownerPubkey),
    0,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/starknet/business-provisioning/account.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck + full suite**

Run: `bun run typecheck && bun test`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/starknet/business-provisioning/account.ts src/starknet/business-provisioning/account.test.ts
git commit -m "feat: add counterfactual account address + constructor calldata"
```

---

### Task 4: Owner GUID + `change_owners` handoff call

**Files:**
- Create: `src/starknet/business-provisioning/handoff.ts`
- Test: `src/starknet/business-provisioning/handoff.test.ts`

**Interfaces:**
- Produces: `computeOwnerGuid(ownerPubkey): string`,
  `buildChangeOwnersCall(accountAddress, removeOwnerPubkey, addOwnerPubkey): Call`
  — this is what the business signs (with the derived interim key) and submits
  at claim-completion time; consumed by the business's own script, not by a
  later task in this plan.

`change_owners(owner_guids_to_remove: Array<felt252>, owners_to_add: Array<Signer>)`
removes owners **by GUID**, not by raw pubkey — a GUID is
`poseidon_2("Starknet Signer", pubkey)` for a Stark-curve signer (verified
against `medialane-contracts/contracts/MediaWallet/src/signer/signer_signature.cairo`'s
`into_guid()`). `"Starknet Signer"` as a Cairo shortstring is the felt
`0x537461726b6e6574205369676e6572`.

- [ ] **Step 1: Write the failing test**

```ts
// src/starknet/business-provisioning/handoff.test.ts
import { test, expect } from "bun:test";
import { computeOwnerGuid, buildChangeOwnersCall } from "./handoff.js";

// Known-answer vector: hash.computePoseidonHash(
//   "0x537461726b6e6574205369676e6572", // "Starknet Signer" shortstring
//   "0x151c1fe8a4c7edba2dab3e168c4ab4638c606b5f6a14bdfdbd68c7f3241ac5",
// ) — computed independently via starknet.js and cross-checked by hand
// against the Cairo `poseidon_2` construction.
const PUBKEY = "0x151c1fe8a4c7edba2dab3e168c4ab4638c606b5f6a14bdfdbd68c7f3241ac5";
const EXPECTED_GUID = "0x77e51695557ad11adcf5c962434b1c1feac94fa3f5cd6534759c5ae78518766";

test("computeOwnerGuid matches the contract's poseidon_2(\"Starknet Signer\", pubkey)", () => {
  expect(computeOwnerGuid(PUBKEY)).toBe(EXPECTED_GUID);
});

test("buildChangeOwnersCall encodes remove-one-add-one as [1, guid, 1, 0, newPubkey]", () => {
  const call = buildChangeOwnersCall("0xaccount", PUBKEY, "0x999");
  expect(call.contractAddress).toBe("0xaccount");
  expect(call.entrypoint).toBe("change_owners");
  expect(call.calldata).toEqual(["0x1", EXPECTED_GUID, "0x1", "0x0", "0x999"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/starknet/business-provisioning/handoff.test.ts`
Expected: FAIL — `./handoff.js` does not exist.

- [ ] **Step 3: Implement**

```ts
// src/starknet/business-provisioning/handoff.ts
import { hash, num, type BigNumberish, type Call } from "starknet";

const STARKNET_SIGNER_TYPE = "0x537461726b6e6574205369676e6572"; // "Starknet Signer" shortstring

/**
 * GUID of a Stark-curve owner, matching MediaWallet's
 * `SignerTrait::into_guid` for `Signer::Starknet` — `poseidon_2("Starknet
 * Signer", pubkey)`. `change_owners` removes owners by GUID, not by raw
 * pubkey.
 */
export function computeOwnerGuid(ownerPubkey: BigNumberish): string {
  return hash.computePoseidonHash(STARKNET_SIGNER_TYPE, num.toHex(ownerPubkey));
}

/**
 * The `change_owners` call that hands a provisioned account off to its real
 * owner: removes the business-derived interim owner (by GUID) and adds the
 * recipient's own new owner key (by pubkey) — one call, immediate, no
 * timelock. Must be signed by a *current* owner (the interim key) to
 * succeed on-chain.
 */
export function buildChangeOwnersCall(
  accountAddress: string,
  removeOwnerPubkey: BigNumberish,
  addOwnerPubkey: BigNumberish,
): Call {
  const guidToRemove = computeOwnerGuid(removeOwnerPubkey);
  return {
    contractAddress: accountAddress,
    entrypoint: "change_owners",
    calldata: ["0x1", guidToRemove, "0x1", "0x0", num.toHex(addOwnerPubkey)],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/starknet/business-provisioning/handoff.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck + full suite**

Run: `bun run typecheck && bun test`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/starknet/business-provisioning/handoff.ts src/starknet/business-provisioning/handoff.test.ts
git commit -m "feat: add owner GUID + change_owners handoff call builder"
```

---

### Task 5: Deploy-account params

**Files:**
- Create: `src/starknet/business-provisioning/deploy.ts`
- Test: `src/starknet/business-provisioning/deploy.test.ts`

**Interfaces:**
- Consumes: `ownerConstructorCalldata`, `computeAccountAddress` (Task 3).
- Produces: `buildDeployAccountParams(ownerPubkey, salt?): DeployAccountContractPayload`
  — the exact shape starknet.js's `Account.deployAccount()` accepts; the
  business's own script does
  `account.deployAccount(buildDeployAccountParams(pubkey))` directly. This
  plan does not wrap or call `deployAccount` itself — deployment requires a
  funded, signing `Account` instance the business's own code constructs from
  its derived private key, matching this SDK's existing venue-signer pattern
  (the SDK builds, the caller submits).

- [ ] **Step 1: Write the failing test**

```ts
// src/starknet/business-provisioning/deploy.test.ts
import { test, expect } from "bun:test";
import { buildDeployAccountParams } from "./deploy.js";
import { ownerConstructorCalldata, computeAccountAddress } from "./account.js";

const OWNER = "0x61cc05c5da6e9b1403a27ffa564498cd2b8cda1428b053b08dbbd1cceb744c6";

test("buildDeployAccountParams matches the account module's own calldata and address", () => {
  const params = buildDeployAccountParams(OWNER);
  expect(params.constructorCalldata).toEqual(ownerConstructorCalldata(OWNER));
  expect(params.contractAddress).toBe(computeAccountAddress(OWNER, 0));
  expect(params.addressSalt).toBe("0x0");
});

test("buildDeployAccountParams uses the MediaWallet class hash", () => {
  const params = buildDeployAccountParams(OWNER);
  expect(params.classHash).toBe(
    "0x014b210c7d47392691144bafecdca3c6c7791cc295ea305988da0a724c05ac31",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/starknet/business-provisioning/deploy.test.ts`
Expected: FAIL — `./deploy.js` does not exist.

- [ ] **Step 3: Implement**

```ts
// src/starknet/business-provisioning/deploy.ts
import { num, type BigNumberish, type DeployAccountContractPayload } from "starknet";
import { STARKNET_MEDIAWALLET_CLASS_HASH } from "../../constants.js";
import { ownerConstructorCalldata, computeAccountAddress } from "./account.js";

/**
 * The exact payload starknet.js's `Account.deployAccount()` expects — the
 * caller constructs a signing `Account` from the derived private key
 * (`deriveOwnerKeyPair`) against a **pre-funded** counterfactual address
 * (`computeAccountAddress`) and calls
 * `account.deployAccount(buildDeployAccountParams(ownerPubkey))` directly.
 * This function only builds the payload — it never signs or submits
 * anything itself.
 */
export function buildDeployAccountParams(
  ownerPubkey: BigNumberish,
  salt: BigNumberish = 0,
): DeployAccountContractPayload {
  return {
    classHash: STARKNET_MEDIAWALLET_CLASS_HASH,
    constructorCalldata: ownerConstructorCalldata(ownerPubkey),
    addressSalt: num.toHex(salt),
    contractAddress: computeAccountAddress(ownerPubkey, salt),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/starknet/business-provisioning/deploy.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck + full suite**

Run: `bun run typecheck && bun test`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/starknet/business-provisioning/deploy.ts src/starknet/business-provisioning/deploy.test.ts
git commit -m "feat: add deploy-account payload builder for business provisioning"
```

---

### Task 6: Backend API client methods

**Files:**
- Modify: `src/types/api.ts`
- Modify: `src/api/client.ts`
- Test: `src/api/client.businessProvisioning.test.ts`

**Interfaces:**
- Produces: `ApiBusinessProvisioning` type;
  `ApiClient.registerBusinessProvisioning(params): Promise<ApiResponse<ApiBusinessProvisioning>>`,
  `ApiClient.completeBusinessProvisioning(id): Promise<ApiResponse<ApiBusinessProvisioning>>`
  — these call the backend routes from `medialane-backend`'s
  `2026-08-01-business-provisioning-backend.md` plan
  (`POST /v1/business/provisioning`, `POST /v1/business/provisioning/:id/complete`).

These live on `ApiClient` in the **chain-neutral core** (`.` root export), not
under `./starknet` — they're plain JSON REST calls with no starknet.js
dependency, matching how every other `ApiClient` method is chain-neutral.

- [ ] **Step 1: Add the type**

Append to `src/types/api.ts` (near `ApiCollectionClaim`):

```ts
// ─── Business Provisioning ─────────────────────────────────────────────────────

export interface ApiBusinessProvisioning {
  id: string;
  accountId: string;
  chain: string;
  walletAddress: string;
  /** Free-form (mirrors Identity.scheme) — "email" is the only scheme the backend
   *  delivers a claim link for on its own; any other scheme still registers, the
   *  business gets `claimUrl` back on the register response and delivers it itself. */
  recipientScheme: string;
  recipientValue: string;
  interimOwnerPubkey: string;
  newOwnerPubkey: string | null;
  status: "DEPLOYED" | "HANDOFF" | "TRANSFERRED";
}
```

- [ ] **Step 2: Write the failing test**

`src/api/client.test.ts` mocks `globalThis.fetch` via `mock()`, restores it in
`afterEach` (an unrestored mock leaks into every other test file in the run),
and scripts responses by URL through a small `scriptFetch` helper. Mirror that
exact convention — do not hand-roll a different mocking style:

```ts
// src/api/client.businessProvisioning.test.ts
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

test("registerBusinessProvisioning posts to /v1/business/provisioning", async () => {
  const calls = scriptFetch(() => ({ status: 201, body: { data: { id: "prov-1", status: "DEPLOYED", claimUrl: "https://medialane.io/claim/tok_1" } } }));
  const client = new ApiClient("https://api.test.invalid", "test-key");
  const res = await client.registerBusinessProvisioning({
    chain: "STARKNET",
    walletAddress: "0x1",
    recipientScheme: "email",
    recipientValue: "worker@example.com",
    interimOwnerPubkey: "0x2",
  });
  expect(calls[0].url).toBe("https://api.test.invalid/v1/business/provisioning");
  expect(JSON.parse(calls[0].init.body as string)).toEqual({
    chain: "STARKNET",
    walletAddress: "0x1",
    recipientScheme: "email",
    recipientValue: "worker@example.com",
    interimOwnerPubkey: "0x2",
  });
  expect(res.data.id).toBe("prov-1");
  expect(res.data.claimUrl).toBe("https://medialane.io/claim/tok_1");
});

test("registerBusinessProvisioning works with a non-email recipientScheme", async () => {
  const calls = scriptFetch(() => ({ status: 201, body: { data: { id: "prov-2", status: "DEPLOYED", claimUrl: "https://medialane.io/claim/tok_2" } } }));
  const client = new ApiClient("https://api.test.invalid", "test-key");
  const res = await client.registerBusinessProvisioning({
    chain: "STARKNET",
    walletAddress: "0x1",
    recipientScheme: "phone",
    recipientValue: "+15550001111",
    interimOwnerPubkey: "0x2",
  });
  expect(JSON.parse(calls[0].init.body as string).recipientScheme).toBe("phone");
  expect(res.data.claimUrl).toBe("https://medialane.io/claim/tok_2");
});

test("completeBusinessProvisioning posts to /v1/business/provisioning/:id/complete", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { data: { id: "prov-1", status: "TRANSFERRED" } } }));
  const client = new ApiClient("https://api.test.invalid", "test-key");
  const res = await client.completeBusinessProvisioning("prov-1");
  expect(calls[0].url).toBe("https://api.test.invalid/v1/business/provisioning/prov-1/complete");
  expect(calls[0].init.method).toBe("POST");
  expect(res.data.status).toBe("TRANSFERRED");
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun test src/api/client.businessProvisioning.test.ts`
Expected: FAIL — `registerBusinessProvisioning`/`completeBusinessProvisioning`
are not methods on `ApiClient`.

- [ ] **Step 4: Implement in `src/api/client.ts`**

Add near `claimCollection`/`requestCollectionClaim` (the "Collection Claims"
section) a new section:

```ts
  // ─── Business Provisioning ──────────────────────────────────────────────────

  registerBusinessProvisioning(params: {
    chain: "STARKNET";
    walletAddress: string;
    recipientScheme: string;
    recipientValue: string;
    interimOwnerPubkey: string;
  }): Promise<ApiResponse<ApiBusinessProvisioning & { claimUrl: string }>> {
    return this.post<ApiResponse<ApiBusinessProvisioning & { claimUrl: string }>>("/v1/business/provisioning", params);
  }

  completeBusinessProvisioning(id: string): Promise<ApiResponse<ApiBusinessProvisioning>> {
    return this.post<ApiResponse<ApiBusinessProvisioning>>(`/v1/business/provisioning/${id}/complete`, {});
  }
```

Add `ApiBusinessProvisioning` to the existing `import type { ... } from "../types/api.js"`
block at the top of `client.ts`.

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test src/api/client.businessProvisioning.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Typecheck + full suite**

Run: `bun run typecheck && bun test`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/types/api.ts src/api/client.ts src/api/client.businessProvisioning.test.ts
git commit -m "feat: add registerBusinessProvisioning/completeBusinessProvisioning to ApiClient"
```

---

### Task 7: Barrel exports

**Files:**
- Create: `src/starknet/business-provisioning/index.ts`
- Modify: `src/starknet/index.ts`
- Test: `src/starknet/business-provisioning/exports.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–5.
- Produces: the public `@medialane/sdk/starknet` surface for this feature.

- [ ] **Step 1: Write the failing test**

```ts
// src/starknet/business-provisioning/exports.test.ts
import { test, expect } from "bun:test";

test("business provisioning primitives are exported from the starknet subpath barrel", async () => {
  const mod = await import("../index.js");
  expect(typeof mod.deriveOwnerKeyPair).toBe("function");
  expect(typeof mod.computeAccountAddress).toBe("function");
  expect(typeof mod.ownerConstructorCalldata).toBe("function");
  expect(typeof mod.computeOwnerGuid).toBe("function");
  expect(typeof mod.buildChangeOwnersCall).toBe("function");
  expect(typeof mod.buildDeployAccountParams).toBe("function");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/starknet/business-provisioning/exports.test.ts`
Expected: FAIL — these names aren't exported from `../index.js` yet.

- [ ] **Step 3: Create the subdirectory barrel**

```ts
// src/starknet/business-provisioning/index.ts
export { deriveOwnerKeyPair } from "./derive.js";
export { ownerConstructorCalldata, computeAccountAddress } from "./account.js";
export { computeOwnerGuid, buildChangeOwnersCall } from "./handoff.js";
export { buildDeployAccountParams } from "./deploy.js";
```

- [ ] **Step 4: Re-export from `src/starknet/index.ts`**

Add near the other feature groupings (after the fee-call export block is a
reasonable spot):

```ts
// Business account provisioning — pure builders (key derivation, address
// computation, deploy payload, change_owners handoff). The caller's own code
// signs and submits everything; nothing here touches a live RPC.
export {
  deriveOwnerKeyPair,
  ownerConstructorCalldata,
  computeAccountAddress,
  computeOwnerGuid,
  buildChangeOwnersCall,
  buildDeployAccountParams,
} from "./business-provisioning/index.js";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test src/starknet/business-provisioning/exports.test.ts`
Expected: PASS.

- [ ] **Step 6: Full verification**

Run: `bun run typecheck && bun test && bun run build`
Expected: all clean, including a successful `dist/` build (this is the step
that would catch a subpath-export wiring mistake that unit tests alone
wouldn't).

- [ ] **Step 7: Commit**

```bash
git add src/starknet/business-provisioning/index.ts src/starknet/index.ts src/starknet/business-provisioning/exports.test.ts
git commit -m "feat: export business provisioning primitives from @medialane/sdk/starknet"
```

---

## Self-Review Notes

- **Spec coverage:** design spec §4 steps 1–2 (business derives the key,
  deploys the account) are Tasks 2/3/5. The `change_owners` handoff signing
  (§4 step 5) is Task 4. The backend calls (§4 steps 3, 6) are Task 6. Step 4
  (recipient's own onboarding, creating their real passkey key) is entirely
  out of this SDK's scope — that's media-wallet's own existing
  `createOwnerKey()`, unmodified, per the design spec's §2.
- **What this plan deliberately does NOT build:** an `Account`-submission
  wrapper, an RPC client, or a "send STRK to fund the new address" helper.
  Funding the counterfactual address before `deployAccount()` can succeed is
  the business's own operational responsibility (ordinary STRK transfer,
  no new primitive needed) — noted here so it isn't silently assumed away.
  Consistent with this SDK's existing venue-signer philosophy: build, don't
  submit.
- **§8.1 naming discipline:** verified no client/deal-specific wording — all
  identifiers are generic (`business`, `recipient`, `provisioning`).
- **Type consistency check:** `deriveOwnerKeyPair`'s `publicKey` return value
  is exactly what `ownerConstructorCalldata`/`computeAccountAddress`/
  `buildDeployAccountParams`/`computeOwnerGuid`/`buildChangeOwnersCall` each
  accept as their pubkey argument (`BigNumberish`, and a hex string satisfies
  that) — no mismatch between what Task 2 produces and what Tasks 3–5 consume.
- **Left for the portal-console and media-wallet-claim-landing plans:** this
  plan does not add SDK methods for `GET/POST /v1/business/provisioning/claim/:token`
  (the recipient-facing claim endpoints) — those belong with whichever plan
  builds the claim-landing UI that actually calls them, not here.
