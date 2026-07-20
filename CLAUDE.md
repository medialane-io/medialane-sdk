# CLAUDE.md

Guidance for Claude Code when working in this repository.

> **Release history lives in `CHANGELOG.md` — one home.** This file describes
> the *current* shape only. (The old 400+-line per-version "refactor notes"
> section was a second changelog and was removed 2026-07-11; consult
> CHANGELOG.md or git history for how things got here.)

## Commands

```bash
bun run build      # tsup → dist/ (ESM + CJS, one entry per chain adapter)
bun run dev        # tsup --watch
bun run typecheck  # tsc --noEmit
bun test           # bun's runner (~91 tests)
```

Run `bun test` and `typecheck` after significant changes. `bun` must be on
PATH; use the absolute binary path if not.

**Publishing:** bump `package.json`, add a `CHANGELOG.md` entry (**no publish
without one** — 0.53–0.63 had to be reconstructed from git), then publish with
a project-local `.npmrc` and delete it after. `dist/` is **not committed**
(since 0.65.0 — committed dist shipped two stale-dist releases);
`prepublishOnly` runs typecheck + tests + build automatically at publish.
`"sideEffects": false` is declared — never add import-time side effects.

## Package identity

`@medialane/sdk` (npm, public). Check `package.json` for the current version.
Dual ESM+CJS via tsup. **Subpath exports per chain adapter** (core split,
platform-federation spec §2):

| Entry | Contents |
|---|---|
| `.` (root) | Chain-neutral core ONLY: config, `ApiClient` (all REST methods), types, `chains.ts` coordinate registry, service registry, tokens, utils, adapter interfaces. **The Starknet adapter is NOT re-exported here** — import it from `@medialane/sdk/starknet` (the transition re-export was removed in 0.71.0, audit C-3, so a chain-neutral import no longer pulls starknet.js). |
| `./starknet` | The Starknet chain adapter (~75% of the SDK): `MedialaneClient`, `StarknetVenue` + `StarknetVenueSigner` (order execution), venue reads + pure builders, service classes, all Cairo ABIs, SIWS, admin-auth, fee builder, SNIP-12 builders, `encodeByteArray`. |
| `./evm` | EVM adapter: EIP-712 orders (byte-verified vs the audited Solidity), venue + issuance (Ethereum + Base). |
| `./solana` | Solana adapter: Anchor wire encoding (no Anchor client), venue. |
| `./stellar` | Soroban adapter: invocation builders, venue, canonical order refs (`stellarOrderRef` = sha256(contract:offerer:salt), mirrored by the backend ingestor). |

Peer deps (all optional): `starknet >= 6`, `viem >= 2`, `@solana/web3.js >= 1.90`,
`@stellar/stellar-sdk`. Runtime dep: `zod ^3` (config validation only).

## Source structure

```
src/
  config.ts / chains.ts / constants.ts   ← chain-neutral core
  api/client.ts        ← ApiClient (REST, ~26 methods; sends x-api-key)
  services/registry.ts ← SERVICES + getService()/hasCapability(); ServiceId union
  types/               ← api.ts (REST types), services.ts, marketplace.ts
  utils/               ← address, bigint, token, retry, rpc (PUBLIC_RPC_FALLBACKS,
                          isTransientRpcError, createFailoverFetch)
  fee/                 ← chain-neutral fee config (resolveFeeConfig)
  adapters/            ← chain-neutral VenueAdapter/IssuanceAdapter/VenueSigner ports
  starknet/            ← client.ts, venue.ts, marketplace{,1155}/ (reads + builders + signing),
                          services/, abis/ (one file per contract), siws/,
                          admin-auth/, fee/, bytearray.ts
  evm/ · solana/ · stellar/  ← the other chain adapters
```

## Load-bearing conventions

- **`chains.ts` is the single source of every contract address / class hash /
  start block** (`getCoordinates(chain)`); the flat `STARKNET_*` constants
  derive from it. No contract-address env vars anywhere. Adding a chain = one
  coordinates entry (the federation litmus test). Mainnet-only — no
  network/Sepolia axis, no legacy protocol support (redeploys reclassify prior
  collections `external-*`).
- **Service registry**: 15 services, stable kebab-case IDs, **no version
  suffixes** (a redeploy updates `onchain` coordinates, never the id).
  Capabilities gate UI affordances, never protocol permission
  (`05-service-model`). `mip-erc721` ≠ `ip-erc721`. Coins carry `swap`
  (external Ekubo) — there is no Medialane coin venue.
- **`normalizeAddress(chain, address)`** — chain-dispatched (Starknet pad /
  EIP-55 / base58 / strkey; Bitcoin throws). Never `.toLowerCase()` alone.
  `ApiClient` normalizes internally via its `config.chain`.
- **starknet v8 hosts:** v8's `Contract` constructor takes an options object;
  route EVERY construction through `newContract()`
  (`starknet/marketplace/utils.ts`) — never `new Contract(...)` directly. The
  whole SDK is swept (marketplace 0.61.0, all service classes 0.65.0) and the
  devDependency is starknet **v8**, so a reintroduced positional constructor
  fails typecheck at build time. The peer range stays `>=6` (`newContract`
  handles both forms at runtime).
- **One marketplace execution path** (since 0.64.0, audit C-2): `StarknetVenue`
  + pure builders (`marketplace*/build.ts`) over the `VenueSigner` capability
  port (`{ address, signTypedData, execute }` — the app's wallet layer signs
  and submits; the venue only builds and reads). The self-executing
  `MarketplaceModule`/`Medialane1155Module` were deleted; `marketplace*/orders.ts`
  now hold only the pure venue reads (`getOrderDetails`/`getCounter`).
- **Signing** (`starknet/marketplace/signing.ts`): SNIP-12 domains
  `{ name: "Medialane", version: "5" }` (ERC-721) / `version: "4"` (ERC-1155),
  nested single-`amount` OfferItem/ConsiderationItem with
  `marketplace`/`royalty_max_bps`/`counter` (no nonce; wide 248-bit salt is the
  hash-uniqueness source). **Fulfilment is unsigned** — no fulfillment builder.
  `increment_counter` = bulk cancel.
- **Fees are platform-layer** (`starknet/fee/build-fee-call.ts` → creators
  fund); the venue contracts are zero-fee. Both 721 and 1155 fulfil paths
  compose the fee (parity fixed in 0.57.0).
- No side effects at import time; contract instances lazy/cached per config.
  `toSignatureArray()` accepts array and `{r,s}` signatures.
  `stringifyBigInts()` before JSON/calldata.

## MedialaneClient (Starknet adapter)

```ts
import { MedialaneClient } from "@medialane/sdk"; // → migrate to "@medialane/sdk/starknet"
const client = new MedialaneClient({ chain: "STARKNET", backendUrl, apiKey });
```

- `client.api` — `ApiClient`; throws `MedialaneApiError(status, message)`;
  proxy-throws descriptively if `backendUrl` is missing. Exponential-backoff
  retry (3 attempts, 4xx not retried). Backend reads accept `?chain=`
  (default STARKNET; `all` on list endpoints).
- Order execution is NOT on the client: use `StarknetVenue` (below).
  `MedialaneError(message, code?, cause?)` is the on-chain error type.
- `client.services.{pop, drop, erc1155Collection, creatorCoin, ticket, club, sponsorship}`
  — per-service on-chain classes. **Ticket is the redesigned ERC-1155 surface**
  (`deployCollection` with `baseUri`, `createTicket`, `mint`, `isValid`,
  `getTicket` — no pause switch). **Club is the redesigned ERC-1155 surface**
  (`deployCollection` with `baseUri`, `createMembership`, `mint`, `isMember`,
  `isMemberOf`, `getMembership` — tiers with validity windows that gate
  membership, never minting; memberships trade like any edition).
- `StarknetVenue` (`./starknet`) — the venue adapter over
  `StarknetVenueSigner`; deps inject `resolveOrder`/`resolveStandard` (from the
  indexer — Starknet has no canonical ERC-165 id for 1155).

**Creator Coin integration requirements** (2026-07-09 contract audit): always
launch with `quoteFundAmount` in ONE atomic multicall (the Factory buyback
sweeps its entire quote balance — pre-funding in a separate tx can be consumed
by the next launcher); team allocation must sum to ≥ 1 coin (1e18 raw) and
≤ 10% supply / ≤ 10 holders; coin-side pool fees are unrecoverable by design;
the anti-snipe cap is per-transaction friction, not a guarantee.

## Contracts / coordinates / tokens

Read them from code, not docs: `getCoordinates("STARKNET")` in `src/chains.ts`
is canonical — this file's old address tables went stale twice and are gone on
purpose. Deploy record: `medialane-core/docs/deployments.md`. Tokens: USDC
(native, canonical), USDT, ETH, STRK, WBTC via `SUPPORTED_TOKENS` /
`getTokenBySymbol` (`utils/token.ts`) — never hardcode token addresses.
