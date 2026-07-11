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
without one** — 0.53–0.63 had to be reconstructed from git), `bun run build`,
publish with a project-local `.npmrc`, delete it after.

## Package identity

`@medialane/sdk` (npm, public). Check `package.json` for the current version.
Dual ESM+CJS via tsup. **Subpath exports per chain adapter** (core split,
platform-federation spec §2):

| Entry | Contents |
|---|---|
| `.` (root) | Chain-neutral core: config, `ApiClient` (all REST methods), types, `chains.ts` coordinate registry, service registry, tokens, utils, adapter interfaces. **Plus a deprecated transition re-export of `./starknet`** — root importers still pull the whole Starknet adapter; delete the block once backend + apps import from `@medialane/sdk/starknet` (audit C-3). |
| `./starknet` | The Starknet chain adapter (~75% of the SDK): `MedialaneClient`, marketplace modules, `StarknetVenue` + `StarknetVenueSigner`, service classes, all Cairo ABIs, SIWS, admin-auth, fee builder, SNIP-12 builders, `encodeByteArray`. |
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
  starknet/            ← client.ts, venue.ts, marketplace/, marketplace1155/,
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
  route every construction through `newContract()`
  (`starknet/marketplace/utils.ts`). The marketplace is migrated; the
  `starknet/services/*` classes still use the positional form — **sweep each
  service as its redesign lands** (audit S-1; latent `abi.find is not a
  function` under v8 until then).
- **Two marketplace execution paths exist temporarily** (audit C-2): the
  self-executing `MarketplaceModule`/`Medialane1155Module`, and `StarknetVenue`
  + pure builders (`marketplace*/build.ts`) over the `VenueSigner` capability
  port (`{ address, signTypedData, execute }` — the app's wallet layer signs
  and submits; the venue only builds and reads). The venue port is the keeper —
  **delete the self-executing path outright** (no shims) once the dapp
  venue-port branch is merged and smoked. Until then, protocol changes must be
  applied to BOTH paths (the 1155 fee-parity gap came from missing one).
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
- `client.marketplace` / `client.marketplace1155` — self-executing order flows
  (see the C-2 note; `MedialaneError(message, cause?)` on failure).
- `client.services.{pop, drop, erc1155Collection, creatorCoin, ticket, club, sponsorship}`
  — per-service on-chain classes. **Ticket is the v3 ERC-1155 surface**
  (`deployCollection`, `createEvent`, `mint`, `pauseEvent`, `isValid`,
  `getEvent`). **Club is the factory pattern** (`deployClub`/`setOpen`/
  `mintMembership`; single-registry methods are `@deprecated`). `ip-club`
  membership is soulbound — capabilities `["subscribe"]`, no `transfer`.
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
