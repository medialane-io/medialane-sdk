# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commands

```bash
~/.bun/bin/bun run build      # tsup → dist/ (ESM + CJS dual output)
~/.bun/bin/bun run dev        # tsup --watch
~/.bun/bin/bun run typecheck  # tsc --noEmit (no emit, type errors only)
```

No test runner configured. Always run `typecheck` after significant changes.
Always use `~/.bun/bin/bun` — bun is not in PATH by default on this machine.

---

## Package Identity

```json
{
  "name": "@medialane/sdk",
  "version": "0.44.0",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

Peer dependency: `starknet >= 6.0.0` (consumers must install separately).
Runtime dependency: `zod ^3` (for config validation only).
Built with `tsup` — dual ESM + CJS output in `dist/`.

---

## Source Structure

```
src/
  client.ts          ← MedialaneClient (chain-scoped, root export)
  config.ts          ← MedialaneConfig schema (chain) + resolveConfig() (coordinates from registry)
  chains.ts          ← coordinates[chain] registry — single source of per-chain coordinates (CHAINS, getCoordinates, Chain)
  constants.ts       ← chain-named flat constants (STARKNET_*, derive from chains.ts), SUPPORTED_TOKENS, selectors
  abis/              ← one file per contract ABI (split 2026-05-22)
    index.ts         ← re-exports all ABIs; keep `import { IPNftABI } from "@medialane/sdk"` working
    ipMarketplace.ts, popCollection.ts, popFactory.ts, dropCollection.ts,
    dropFactory.ts, collectionRegistry.ts, medialane1155.ts,
    ipCollection1155Factory.ts, ipCollection1155.ts, ipCollection.ts, ipNft.ts
  index.ts           ← public re-exports
  api/
    client.ts        ← ApiClient class (all REST methods)
  fee/               ← buildFeeCall + ResolvedFeeConfig (platform creators-fund fee)
  marketplace/
    index.ts         ← MarketplaceModule (wraps orders.ts functions)
    orders.ts        ← createListing, makeOffer, fulfillOrder, cancelOrder, checkoutCart
    signing.ts       ← unified SNIP-12 typed data builders (both ERC-721 and ERC-1155)
    utils.ts         ← shared getProvider, getChainId, resolveToken
    errors.ts        ← MedialaneError
  marketplace1155/   ← thin module — orders for ERC-1155 only (signing lives in marketplace/)
    index.ts         ← Medialane1155Module
    orders.ts        ← createListing1155, fulfillOrder1155, cancelOrder1155, etc.
  services/
    pop.ts           ← PopService
    drop.ts          ← DropService
    erc1155collection.ts ← ERC1155CollectionService
    registry.ts      ← service registry: SERVICES + getService() + ServiceId literal union
  types/
    api.ts           ← API response types
    services.ts      ← ServiceDefinition, ServiceCapability
    marketplace.ts   ← on-chain param types
    errors.ts        ← MedialaneErrorCode
    index.ts
  utils/
    address.ts       ← normalizeAddress(), shortenAddress()
    bigint.ts        ← stringifyBigInts(), u256ToBigInt()
    bytearray.ts     ← encodeByteArray() (Cairo ByteArray serialization)
    token.ts         ← SUPPORTED_TOKENS, getTokenByAddress, getTokenBySymbol, getListableTokens, parseAmount, formatAmount
    retry.ts         ← RetryOptions
    rpc.ts           ← PUBLIC_RPC_FALLBACKS, isTransientRpcError, createFailoverFetch (resilient RPC — single source for every app)
```

> **Refactor notes (2026-05-22 → 2026-05-23):**
>
> - **v0.16.0**: removed deprecated aliases — `MARKETPLACE_CONTRACT_MAINNET`, `MARKETPLACE_CLASS_HASH_MAINNET`, `MARKETPLACE_START_BLOCK_MAINNET`, `INDEXER_START_BLOCK_MAINNET`, `COLLECTION_CONTRACT_MAINNET`, `ERC1155_FACTORY_CONTRACT_MAINNET`, `ERC1155_COLLECTION_CLASS_HASH_MAINNET`. Use the canonical `MARKETPLACE_721_*`, `COLLECTION_721_*`, `COLLECTION_1155_*` names.
> - **v0.17.0**: registered `external-erc721` + `external-erc1155` as first-class services. Every `Collection.service` value now maps to a registered `ServiceDefinition`.
> - **v0.18.0**: unified `marketplace/signing.ts` (was duplicated as `marketplace1155/signing.ts`). All six builders (`buildOrderTypedData`, `build1155OrderTypedData`, etc.) live in one file with shared type definitions; same export names so consumers are unchanged.
> - **v0.19.0**: split monolithic `abis.ts` (4,247 lines) into per-ABI files under `abis/`. Same public imports via `abis/index.ts` barrel.
> - **v0.20.0**: exported `ServiceId` literal union (`keyof typeof SERVICES`) + `isServiceId()` type guard. Use these to type-check `Collection.service` write sites in consumers.
> - **v0.26.0 (BREAKING — redesigned marketplace venues)**: new marketplace ABIs + mainnet addresses; order schema is single-`amount` with `marketplace`/`royalty_max_bps`/`counter` (no nonce), SNIP-12 domain v4 (721) / v3 (1155); **fulfilment is unsigned** (fulfillment builders removed). Wide 248-bit salt is the sole order-hash uniqueness source.
> - **v0.27.0**: `ApiIntentCreated` is a discriminated union on `requiresSignature` — `{ requiresSignature: true; typedData } | { requiresSignature: false; calls: IntentCall[] }`. Accessing the wrong field without narrowing is a compile error. New `IntentCall` type exported. Pairs with the backend `requiresSignature` field on every create-intent response.
> - **v0.28.0 (resilient RPC — single source of truth)**: new `src/utils/rpc.ts` exports `PUBLIC_RPC_FALLBACKS` (ordered public mainnet endpoints: lava.build → blastapi → nethermind), `isTransientRpcError({ status?, body? })` (one transient-vs-deterministic detector for both raw-text and parsed JSON-RPC paths; **excludes `-32000`** so io's `/api/rpc` "Unauthorized" never fails over), and `createFailoverFetch(urls)` (an `RpcProvider.baseFetch` that rotates endpoints on transient failure — 503/429, `-32001`/`-32603` — while propagating deterministic contract errors verbatim). `getProvider()` (marketplace utils) now builds with `createFailoverFetch([config.rpcUrl, ...PUBLIC_RPC_FALLBACKS])`, so every SDK-client read is resilient by default. Consumed by dapp/io provider singletons, io's `/api/rpc` proxy, and the backend. Motivation + full incident: `medialane-core/docs/specs/2026-06-03-rpc-resilience-failover.md`.
> - **v0.29.0**: **Creator Coin** (chain layer deployed mainnet 2026-06-04, Ekubo-only). One registry entry: `creator-coin` issuance service (`standard: "ERC20"`, `uiVariant: "coin"`, capabilities `launch`/`swap`/`transfer`). **No Medialane trading venue** — `swap` is a UI affordance that drives an embedded Ekubo swap (StarkZapp); settlement is external Ekubo and Medialane custodies nothing. `ServiceCapability` gained `"launch"`/`"swap"`; `ServiceDefinition.standard` gained `"ERC20"`. New `CreatorCoinService` (`client.services.creatorCoin`): `createCreatorCoin`, `launchOnEkubo` (optional `quoteFundAmount` prepends the buyback quote transfer), `isCreatorCoin`. Exports `CreatorCoinFactoryABI`, `VALIDATED_EKUBO_PARAMS` (smoke-validated 0.01 quote/coin tick params), and `CREATOR_COIN_*` constants (Factory `0x50fa80…`, EkuboLauncher `0x4f7fce…`). TODO: `priceToEkuboParams()` tick-math helper for arbitrary launch prices.
> - **v0.30.0**: new `external-erc20` registry service (provenance `EXTERNAL`, `standard: "ERC20"`, capabilities `swap`/`transfer`) — the ERC-20 parallel to `external-erc721`/`external-erc1155`. For any ERC-20 not deployed via a Medialane service (unrug memecoins, partner coins, future chains), brought in by owner claim or admin/partnership — **never bulk-indexed**. No `unrug-`-specific service; admin/claim curation is the gate.
>   Also adds the **Ekubo price helper**: `getCreatorCoinPrice(coinAddress, provider)` + `client.services.creatorCoin.getPrice(coin)` — reads a coin's live spot price directly from its Ekubo pool (discovers pool params from `launched_with_liquidity_parameters` → `Core.get_pool_price` → quote-per-coin). Self-contained, read-only, works day-one (no AVNU/backend dependency). New `EKUBO_CORE_MAINNET` const + `CreatorCoinPrice` type. This is the inverse of the planned `priceToEkuboParams()` — Ekubo math now lives in the SDK (single source), consumed by the dapp coin page.
> - **v0.32.0 (identity model — `MEDIALANE_STARKNET`)**: the backend unified its identity model — a wallet is now one *kind* of `Identity` (`scheme="wallet"`), and `Wallet`/`CreatorProfile`/`User` tables + the `WalletType`/`IdentityProvider` enums were dropped (medialane-backend#51). SDK changes: (1) `ApiAppSource` gains **`"MEDIALANE_STARKNET"`** — the renamed `MEDIALANE_DAPP` (the "dapp" is the Starknet app; the platform is multichain). `MEDIALANE_DAPP` stays as a **deprecated alias** the backend normalizes, so existing apps keep working. (2) `registerUser(...)` response `walletType` is now a **free-form provider label** (`string`, e.g. `"braavos"`/`"chipipay"`/`"unknown"`), not `ApiWalletType` — the backend folds walletType into `Identity.provider`. The **input** `walletType` param (register/me) is unchanged. **App migration:** send `appSource: "MEDIALANE_STARKNET"` (dapp) instead of `"MEDIALANE_DAPP"`. Identity model: `medialane-core/docs/architecture/07-identity-model.md`; app rollout plan: `medialane-core/docs/specs/2026-06-05-identity-app-rollout.md`.
> - **v0.33.0 (finish the walletType cutover)**: 0.32.0 loosened the register *output* but left the *input* typed as the dropped `ApiWalletType` enum. Now symmetric: (1) `registerUser()`/`upsertMyWallet()` **input** `walletType` is `string` (send the lowercase label directly; backend lowercases into `Identity.provider`, never gates). (2) `registerUser()` **response** field `walletType` → **`provider`** (type-only breaking; no app reads it — the dapp's `.walletType` reads are local session state). `ApiWalletType` is still exported for display. Lets the dapp drop its `toBackendWalletType` uppercase mapping; io unaffected. Spec: `medialane-core/docs/specs/2026-06-05-identity-cleanup-followups.md` (item B).
> - **v0.34.0 (ERC-1155 v0.3.0 — sequential on-chain edition ids)**: the IP-Programmable-ERC1155 contract was redeployed (mainnet 2026-06-10) so edition ids are assigned **on-chain** (sequential from 1), replacing the app-side `Date.now()` token-id scheme + the merge-prone `mint_item`. **New mainnet addresses** (`constants.ts`): `COLLECTION_1155_CONTRACT_MAINNET` → `0x0083543c…` (new ownerless factory), `COLLECTION_1155_FACTORY_CLASS_HASH_MAINNET` → `0x331a69da…`, `COLLECTION_1155_CLASS_HASH_MAINNET` → `0x4e110b59…`, `COLLECTION_1155_START_BLOCK_MAINNET` → `10665319`. **ABI** (`IPCollection1155ABI`, `IPCollection1155FactoryABI` regenerated from the deployed artifacts): `mint_item`/`batch_mint_item` → **`mint_edition(to,value,uri)→u256`** + **`batch_mint_edition(to,values,uris)→Span<u256>`**; new **`add_supply(to,token_id,value)`** (re-supply an existing edition, reverts if absent), **`total_editions()→u256`**, **`token_exists(id)→bool`**; factory dropped `update_collection_class_hash` + Ownable. **`ERC1155CollectionService`** (BREAKING): `mintItem`→`mintEdition`, `batchMintItem`→`batchMintEdition`, new `addSupply`; param types `MintItemParams`/`BatchMintItemParams` → `MintEditionParams`/`BatchMintEditionParams`/`AddSupplyParams`. The assigned id is read from the tx's `IPMinted` event (`keys[1]`). Contract: mediolano-contracts #134.
> - **v0.35.0 (drop legacy ERC-1155 constants)**: removed `COLLECTION_1155_CONTRACT_LEGACY_MAINNET` + `COLLECTION_1155_START_BLOCK_LEGACY_MAINNET`. Medialane keeps no legacy protocol support — prior-version (v0.2.0) collections were reclassified `external-erc1155` (read-only) on the 2026-06-10 cutover, so the SDK no longer carries the retired factory address.
> - **v0.37.0 (multichain-readiness foundations — BREAKING, Phase 1)**: `chain` is now a first-class axis. New `chains.ts` holds the **`coordinates[chain]` registry** (single source of per-chain service coordinates; exports `CHAINS`/`getCoordinates`/`DEFAULT_CHAIN`/`Chain`/`ChainCoordinates`). The flat `*_MAINNET` constants stay (same names/values) but **derive** from it. **`MedialaneConfig.chain` replaces `network`** (client is chain-scoped; `client.network`→`client.chain`); **`ServiceDefinition.onchain` is per-chain** (`Partial<Record<Chain,…>>` — read `.onchain?.STARKNET?.factoryAddress`); **removed `SUPPORTED_NETWORKS`/`DEFAULT_RPC_URL`/`Network`** (mainnet-only, coordinates key by chain — refines `D-9`); **`getChainId(config)` throws for non-Starknet**. Starknet behavior unchanged. **Published to npm + merged to `main` 2026-06-14** (backend on 0.37.0, deployed to prod). Spec: `medialane-core/docs/specs/2026-06-13-multichain-readiness-design.md`.
> - **v0.38.0 (Coin / Collection split — BREAKING)**: fungible coins are now their own model, not `Collection` rows. New **`ApiCoin`** type + **`client.api.getCoins(opts?)` / `getCoin(contract)`** (served from `/v1/coins`). **`ApiCollection.standard` narrowed to `"ERC721" | "ERC1155"`** (`Collection` is NFT-only; `ERC20`/`UNKNOWN` removed). The `getCollections(standard="ERC20")` coin path is gone — use `getCoins()`. `getCreatorCoinPrice`/`CreatorCoinService` unchanged (price live from Ekubo). Spec: `medialane-core/docs/specs/2026-06-14-coin-collection-split-design.md`.
> - **v0.39.0 (MIP v0.4.0 — creator royalties, BREAKING)**: the MIP-Collections-ERC721 registry was redeployed on Starknet with per-token EIP-2981 royalties. **New `chains.ts` Starknet coordinates** (and the derived `*_MAINNET` constants): `collection721` → `0x0558c9b6…aeef2`, `ipNftClassHash` → `0x040551f0…`, `ipCollectionClassHash` → `0x063d4ac4…`, `collection721StartBlock` → `11002817`. The retired `0x0322cb71…` registry is **dropped** (Medialane keeps no legacy protocol support; prior collections reclassify `external-erc721` read-only). **ABIs regenerated** from the deployed artifacts: `IPCollectionABI` — `mint`/`batch_mint` take `royalty_bps` (u128 / `Array<u128>`), token ops take explicit `(collection_id, token_id): u256` (the `"collection_id:token_id"` string form is gone), `transfer_token` drops `from`, `CollectionStats.total_transfers` → `protocol_routed_transfers`, plus `version()` and richer batch events; `IPNftABI` gains `royalty_info`/`token_royalty`/`default_royalty`/`supports_interface`/`version`. **`MintParams.royaltyBps` + `CreateMintIntentParams.royaltyBps` are now required** (bps 0–10_000; receiver = immutable creator); `marketplace.mint` appends `royalty_bps` to calldata and `createMintIntent` forwards it to the backend `/mint` builder. Contract: `mediolano-contracts` MIP v0.4.0. Plan: `medialane-core/docs/plans/2026-06-20-mip-v0.4.0-platform-migration.md`.
> - **v0.41.0 (BREAKING — killed the `*_MAINNET` constant debt)**: removed **all** flat `*_MAINNET` address / class-hash / start-block exports from `constants.ts` + `index.ts`. **`getCoordinates(chain)` (`chains.ts`) is now the sole source** of every contract address. Migrate `X_MAINNET` → `getCoordinates(chain).<field>` (e.g. `MARKETPLACE_721_CONTRACT_MAINNET` → `getCoordinates("STARKNET").marketplace721`); `EKUBO_CORE_MAINNET` → `.ekuboCore`, etc. SDK-internal services (`registry`, `pop`, `drop`, `erc1155collection`, `creatorCoin`) resolve from the config's chain. `constants.ts` now holds only `SUPPORTED_TOKENS`/`DEFAULT_CURRENCY`. No behavior change — Starknet addresses are identical (they already derived from the registry). Also **removed dead deprecated exports** (verified unused across apps + backend + SDK): `CollectionRegistryABI` (superseded by `IPCollectionABI` since v0.11.0) and `ApiWalletType` (identity model folded walletType into `Identity.provider`). Kept for now (still consumed): `ApiToken.owner` (io fallback) + the `MEDIALANE_DAPP` alias (backend still normalizes it) — removed in a later phase once consumers drop them. Audit + plan: `medialane-core/docs/specs/2026-06-23-platform-standardization-audit.md`, `medialane-core/docs/plans/2026-06-23-kill-mainnet-constant-debt.md`.
> - **v0.42.0 (chain-named contract constants)**: flat contract constants are back, **chain-named** — the contract is deployed on a specific chain, so the var carries it: `STARKNET_MARKETPLACE_721_CONTRACT`, `STARKNET_COLLECTION_721_CONTRACT`, `STARKNET_NFTCOMMENTS_CONTRACT`, `STARKNET_*_CLASS_HASH` / `_START_BLOCK`, etc. (the old `*_MAINNET` set, renamed `_MAINNET` suffix → `STARKNET_` prefix). Still derived from `chains.ts` (one source). Consumers import the named constant — no `getCoordinates()` calls and **no contract-address env vars** in app/backend code. This is the standard backend + io + dapp all adopted (2026-06-25); tokens single-source from `SUPPORTED_TOKENS`/`getTokenBySymbol` (native USDC canonical).
> - **v0.42.1 (typed addresses)**: `ChainCoordinates` address / class-hash fields are typed `` `0x${string}` `` (start blocks `number`, `rpcUrl: string`), so the derived `STARKNET_*` constants carry the right literal type and consumers need no per-app `as 0x${string}` casts.
> - **v0.43.0 (core protocol redeploy — BREAKING)**: all four core protocols redeployed to Starknet mainnet (2026-06-26). **New `chains.ts` Starknet coordinates** (and derived `STARKNET_*` constants): `marketplace721` → `0x03eda9a2…`, `marketplace1155` → `0x07c4ce1c…`, `collection721` (MIP registry) → `0x0225c3ae…`, `collection1155` (IP-1155 factory) → `0x01536897…`, plus all class hashes — including the now-changed `ipNftClassHash` (`0x012d3ae4…`) and `collection1155FactoryClassHash` (`0x04eb6b41…`) — and new start blocks. **SNIP-12 domain versions bumped — ERC-721 `4 → 5`, ERC-1155 `3 → 4`** (`signing.ts`); orders signed against the prior deployment no longer validate. **ABIs regenerated** from the deployed artifacts: `IPMarketplaceABI` + `Medialane1155ABI` — `OrderDetails` / `get_order_details` now carry `counter` (the offerer's bulk-cancel epoch, re-checked at fulfilment so `increment_counter` invalidates already-registered orders); `IPCollectionABI` — `batch_transfer` drops `from` (sender derived on-chain). `OrderDetails` type gains required `counter`. No `client.*` API-surface change. Deploy record: `medialane-core/docs/specs/2026-06-25-collections-marketplaces-remediation-runbook.md`.
> - **v0.44.0 (SIWS client protocol — single source)**: new `src/siws/` module — `requestSiwsToken({ backendUrl, walletAddress, signer })`, `getStoredSiwsToken`/`storeSiwsToken`/`isSiwsTokenValid`/`getSiwsStorageKey` (localStorage cache, expiry-aware, browser-only), `normalizeSiwsSignature`, types `SiwsSigner`/`RequestSiwsTokenArgs`. Promotes logic that `medialane-starknet` and `medialane-io` each duplicated — both now re-export thin wrappers instead. Additive. Spec: `medialane-core/docs/specs/2026-06-30-remove-clerk-from-backend-design.md` §IX.
> - **v0.45.0 (Launchpad services — IP Tickets, IP Club, IP Sponsorship, additive)**: three new registry entries (`ip-tickets`, `ip-club`, `ip-sponsorship`, plus `ip-sponsorship-license` for the non-authoritative receipt NFT) — `onchain` omitted on all four, same convention as `ip-erc721` (not deployed yet). New `ServiceCapability` member `"sponsor"`. New service classes: `client.services.ticket` (`TicketService`), `client.services.club` (`ClubService`), `client.services.sponsorship` (`SponsorshipService`) — write-only, mirroring `PopService`/`DropService`'s wiring. New ABIs generated from real `scarb build` artifacts: `IPTicketCollectionABI`/`IPTicketCollectionFactoryABI` (IP-Tickets was redesigned in this cycle to add a factory + owner-gating + a "series"→"collection" rename — see `mediolano-contracts` `contracts/IP-Tickets`), `IPClubABI`/`IPClubNFTABI`, `IPSponsorshipABI`, and `IPGenesisABI` (the previously-unwired `MIP-IP-Factory-ERC721` contract behind the `ip-erc721` concept — confirmed via a real build, not assumed). New `ChainCoordinates` fields (`ipTicketsFactory`, `ipClubRegistry`, `ipSponsorship`, `ipSponsorshipLicense`, + class hashes/start blocks) and derived `STARKNET_IP_TICKETS_FACTORY_CONTRACT`/`STARKNET_IP_CLUB_REGISTRY_CONTRACT`/`STARKNET_IP_SPONSORSHIP_CONTRACT`/`STARKNET_IP_SPONSORSHIP_LICENSE_CONTRACT` constants — all resolve to `undefined` at runtime until deploy (Phase 3/4, separate from this SDK work), so callers must falsy-guard them. Spec: `medialane-core/docs/specs/2026-07-02-launchpad-tickets-club-sponsorship-design.md`; plan: `medialane-core/docs/plans/2026-07-02-launchpad-tickets-club-sponsorship-plan.md`.
> - **v0.46.0 (Launchpad services — mainnet deploy, 3 of 4 contracts)**: `ipTicketsFactory` → `0x0664c2d6…` (class hash `0x086f59c4…`, start block 11404656), `ipClubRegistry` → `0x00e189c6…` (IPClubNFT class hash `0x02bc9b20…`, start block 11404776), `ipSponsorship` → `0x044d9b9c…` (start block 11405085) — all deployed from the `medialane-deployer` account. **`ipSponsorshipLicense` still omitted** — pending a separate dedicated `ip-erc721`/MIP instance the user is deploying via Voyager for sponsorship receipts (never the genesis-mint instance). Add it here + bump when that lands. `ip-tickets`/`ip-club`/`ip-sponsorship` are now live services — flip `status: "live"` in `@medialane/ui`'s `launchpad-services.ts` once the backend/apps are confirmed indexing correctly.
> - **v0.47.0 (Launchpad services — the 4th contract lands)**: `ipSponsorshipLicense` → `0x06bcfc4e97758a2abf95af4bd49596efdbfd88ccd740caddc56ad0a4bd095839` (class hash `0x01bd7e39c5135b32b664e34cbbb4eafbd707a0fbc3ec2ef28657f52577d277d7`, reused an already-declared `ip-erc721`/MIP class — deployed via Voyager, never re-declared). This is a dedicated instance solely for sponsorship receipt NFTs — structurally separate from any future genesis-mint `ip-erc721` instance, so receipts can never mix with genesis collectibles. All four Launchpad-services contracts (IPTicketCollectionFactory, IPClub, IPSponsorship, this receipt instance) are now live on mainnet.
> - **v0.49.0 (Rewards read API — additive)**: five typed methods on `client.api` — `getRewards(address)` (score/level/progress/badges, zeroed for unknown addresses), `getRewardsLeaderboard(page?, limit?)`, `getRewardsEvents(address, page?, limit?)`, `getRewardsConfig()` (level ladder + enabled action XP values + badge catalog — powers optimistic "+XP" UI and locked-badge galleries), `getRewardsBatch(addresses)` (≤50, minimal level info for list surfaces — one call per page, never per row; empty input short-circuits without a request). New types: `ApiUserRewards`, `ApiRewardsLeaderboardEntry`, `ApiRewardsConfig`, `ApiRewardsBatchEntry`, `ApiRewardsBadge`, `ApiRewardsLevel`, `ApiPointEvent`. Scores are recomputed by the backend on a ~15-min schedule — these are reads; the UI shows configured XP values optimistically. Spec: `medialane-core/docs/specs/2026-07-04-rewards-2.0-design.md`.
> - **v0.48.0 (fix ip-club transferability + hasCapability helper)**: `ip-club`'s registry `capabilities` incorrectly included `"transfer"` — `IPClubNFT.cairo` enforces non-transferability on-chain (soulbound membership card), and this was the same claim that drifted into hand-written copy across `medialane-starknet`, `medialane-io`, and docs.medialane.io (all fixed by hand in a prior pass). Fixed the registry data (`capabilities: ["subscribe"]`) and added **`hasCapability(id, cap): boolean`** so consumers can derive a transferability/capability fact instead of hardcoding it. Additive except for the `ip-club` data correction. Spec: `medialane-core/docs/specs/2026-07-02-service-capability-facts-design.md`.

---

## MedialaneClient

```ts
import { MedialaneClient } from "@medialane/sdk"

const client = new MedialaneClient({
  chain: "STARKNET",               // chain-scoped (default: "STARKNET"); replaces `network` (v0.37.0)
  rpcUrl: "https://...",           // optional; defaults to the chain's registry rpcUrl (chains.ts)
  backendUrl: "https://medialane-backend-production.up.railway.app",  // optional; required to use .api
  apiKey: "ml_live_...",           // optional; sent as x-api-key on all API calls
  marketplaceContract: "0x059de...", // optional; defaults to mainnet contract
  collectionContract: "0x05e73b...", // optional; defaults to mainnet collection registry
})
```

Config validated by Zod at construction. If `backendUrl` is not provided, `client.api.*` calls throw immediately with a descriptive error.

Contract instance is **cached per `ResolvedConfig` object** via `WeakMap` — one `Contract` + `RpcProvider` per client config. Do not create a new `MedialaneClient` per request.

### client.marketplace

On-chain write operations. All require a starknet.js `AccountInterface`.

| Method | Description |
|---|---|
| `createListing(account, params)` | List ERC-721 for sale. Checks approval first; prepends approve call if needed |
| `makeOffer(account, params)` | Bid on ERC-721 with ERC-20. Always includes approve + register_order |
| `fulfillOrder(account, params)` | Buy a listed NFT. **Unsigned** — approves payment then calls `fulfill_order(orderHash)` (the buyer is the fulfiller; no signature since 0.26.0) |
| `cancelOrder(account, params)` | Cancel active order. Signs the SNIP-12 cancellation (no nonce — `counter`-based) and calls `cancel_order` |
| `checkoutCart(account, items)` | Atomic multicall: one ERC-20 approve per token (summed) + one unsigned `fulfill_order` per item |
| `mint(account, params)` | Mint NFT into a collection. Calls `mint(collection_id, recipient, token_uri)` on collection registry. No SNIP-12. params: `{ collectionId, recipient, tokenUri, collectionContract? }` |
| `createCollection(account, params)` | Register new collection. Calls `create_collection(name, symbol, base_uri)`. No SNIP-12. **Owner = the executing `account` (implicit caller).** params: `{ name, symbol, baseUri, collectionContract? }` |
| `incrementCounter(account)` | Bulk-cancel: bump the caller's `counter`, invalidating all their open orders at once |
| `getOrderDetails(orderHash)` | View call: `get_order_details(order_hash)` → `OrderDetails` |
| `getCounter(address)` | View call: `get_counter(owner)` → `bigint` (replaces the removed `getNonce` in 0.26.0) |

Signed writes (listing, offer, cancel): build typed data → `account.signMessage()` → execute calls → `waitForTransaction()` → `TxResult { txHash }`. Fulfilment is unsigned (calls only). The `counter` (via `get_counter`) replaces the removed per-order nonce.

Throws `MedialaneError(message, cause?)` on on-chain failures.

### client.api

REST client (`ApiClient`). Throws `MedialaneApiError(status, message)` on non-2xx.

**Orders**
```ts
client.api.getOrders(query?)           // { status?, collection?, currency?, sort?, page?, limit?, offerer? }
client.api.getOrder(orderHash)
client.api.getActiveOrdersForToken(contract, tokenId)
client.api.getOrdersByUser(address, page?, limit?)
```

**Tokens**
```ts
client.api.getToken(contract, tokenId, wait?)   // wait=true: JIT metadata (blocks 3s)
client.api.getTokensByOwner(address, page?, limit?)
client.api.getTokenHistory(contract, tokenId, page?, limit?)
```

**Collections**
```ts
client.api.getCollections(page?, limit?, isKnown?, sort?, service?)
// sort: "recent" (default) | "supply" | "floor" | "volume" | "name"
// service: filter by service id (e.g. "pop-protocol"). `source?` param removed in 0.13.0.
client.api.getCollection(contract)
client.api.getCollectionTokens(contract, page?, limit?)
client.api.getCollectionsByOwner(owner)   // GET /v1/collections?owner=address → ApiCollection[]
```

**Activities**
```ts
client.api.getActivities(query?)    // { type?: "transfer"|"sale"|"listing"|"offer", page?, limit? }
client.api.getActivitiesByAddress(address, page?, limit?)
```

**Search**
```ts
client.api.search(q, limit?)
// Returns: { data: { tokens, collections }, query: string }
// q must be ≥ 2 chars; limit max 50
```

**Intents**
```ts
client.api.createListingIntent(params)   // { nftContract, tokenId, currency, price, offerer, endTime, salt?, amount? }
                                          // amount: number of units (ERC-1155 only; omit for ERC-721)
client.api.createOfferIntent(params)     // same params as listing
client.api.createFulfillIntent(params)   // { fulfiller, orderHash }
client.api.createCancelIntent(params)    // { offerer, orderHash }
client.api.createMintIntent(params)      // { owner, collectionId, recipient, tokenUri, collectionContract? } — pre-SIGNED
                                          // owner = collection owner wallet; validated on-chain before intent is created
client.api.createCollectionIntent(params) // { owner, name, symbol, baseUri, image?: string, collectionContract? } — pre-SIGNED
                                          // image: ipfs:// URI stored in intent typedData, recovered at collection index time
client.api.getIntent(id)
client.api.submitIntentSignature(id, signature)  // signature: string[] — NOT for MINT/CREATE_COLLECTION
client.api.confirmIntent(id, txHash)             // PATCH /:id/confirm — triggers backend receipt verification; poll getIntent() for CONFIRMED/FAILED
```

**Metadata**
```ts
client.api.getMetadataSignedUrl()              // Pinata presigned URL (30s TTL)
client.api.uploadMetadata(metadata)            // JSON → IPFS
client.api.uploadFile(file)                    // File → IPFS (FormData, no Content-Type header)
client.api.resolveMetadata(uri)                // ipfs://, data:, https://
```

**Portal (self-service)**
```ts
client.api.getMe()
client.api.getApiKeys()
client.api.createApiKey(label?)              // plaintext returned ONCE
client.api.deleteApiKey(id)                  // → REVOKED
client.api.getUsage()                        // 30 days { day: "YYYY-MM-DD", requests }[]
client.api.getWebhooks()                     // PREMIUM only
client.api.createWebhook(params)             // PREMIUM; secret returned ONCE
client.api.deleteWebhook(id)                 // → DISABLED
```

**Claims (v0.4.1)**
```ts
// Path 1: on-chain ownership check. Requires Clerk JWT + tenant API key.
client.api.claimCollection(contractAddress, walletAddress, clerkToken)
// → { verified: boolean; collection?: ApiCollection; reason?: string }

// Path 3: manual review request (no auth required).
client.api.requestCollectionClaim({ contractAddress, walletAddress?, email, notes? })
// → { claim: ApiCollectionClaim }
```

**Collection Profiles (v0.4.1)**
```ts
client.api.getCollectionProfile(contractAddress)
// → ApiCollectionProfile | null

client.api.updateCollectionProfile(contractAddress, data, clerkToken)
// data: Partial<Omit<ApiCollectionProfile, "contractAddress"|"chain"|"updatedBy"|"updatedAt">>
// Requires Clerk JWT — only the claimedBy wallet may update
// → ApiCollectionProfile
```

**Creator Profiles (v0.4.1)**
```ts
client.api.getCreatorProfile(walletAddress)
// → ApiCreatorProfile | null

client.api.updateCreatorProfile(walletAddress, data, clerkToken)
// data: Partial<Omit<ApiCreatorProfile, "walletAddress"|"chain"|"updatedAt">>
// Requires Clerk JWT — wallet must match authenticated user
// → ApiCreatorProfile
```

**Collection Slug Claims (v0.10.0)**
```ts
client.api.checkCollectionSlugAvailability(slug)
// → { available: boolean; reason?: string } — public, no auth

client.api.submitCollectionSlugClaim(contractAddress, slug, clerkToken, notifyEmail?)
// Requires Clerk JWT — caller must be the collection owner (owner or claimedBy)
// → { claim: ApiCollectionSlugClaim }

client.api.getMyCollectionSlugClaims(clerkToken)
// Requires Clerk JWT — returns all claims submitted by the authenticated wallet
// → { claims: ApiCollectionSlugClaim[] }

client.api.getCollectionBySlug(slug)
// → ApiCollection | null — resolves vanity slug to full collection
```

**Collection Drop (v0.6.1)**
```ts
client.api.getDropCollections(opts?)             // { page?, limit?, sort? } → ApiCollection[]
client.api.getDropMintStatus(collection, wallet) // → { mintedByWallet, totalMinted }
```

**POP Protocol (v0.6.0)**
```ts
client.api.getPopCollections(opts?)              // { page?, limit?, sort? } → ApiCollection[]
client.api.getPopEligibility(collection, wallet) // → { isEligible, hasClaimed, tokenId }
client.api.getPopEligibilityBatch(collection, wallets) // wallets: string[] (max 100)
```

### client.marketplace1155 (`Medialane1155Module`) — added v0.6.8

On-chain ERC-1155 marketplace operations against the redesigned Medialane1155 venue (`0x040cd7b3e73bb3c892166e34bdc01d1797f97ecbc356c23f1cf38033cacf0077`, deployed 2026-05-31). All require a starknet.js `AccountInterface`.

| Method | Description |
|---|---|
| `createListing(account, params)` | Signs `OrderParameters` (SNIP-12) + calls `register_order`. Auto-grants `set_approval_for_all` if needed. |
| `makeOffer(account, params)` | Signs an offer order, approves the ERC-20 spend, calls `register_order`. |
| `fulfillOrder(account, params)` | **Unsigned** — approves the payment token then calls `fulfill_order(orderHash, quantity)`. The buyer is the fulfiller (no signature since 0.26.0). |
| `cancelOrder(account, params)` | Signs `OrderCancellation` (no nonce), calls `cancel_order`. |
| `checkoutCart(account, items)` | Atomic multi-item buy: summed ERC-20 approvals + one unsigned `fulfill_order` per item (with quantity). |
| `incrementCounter(account)` | Bulk-cancel on the 1155 venue: bump the caller's `counter`. |
| `getOrderDetails(orderHash)` | View call → `OrderDetails`. |
| `getCounter(address)` | View call: `get_counter(owner)` → `bigint`. |
| `buildListingTypedData(params, chainId)` | Returns SNIP-12 listing/offer typed data (for ChipiPay/custom flows). |
| `buildCancellationTypedData(params, chainId)` | Returns SNIP-12 cancellation typed data. |

SNIP-12 domain: `{ name: "Medialane", version: "3", revision: "1" }`. Nested `OfferItem`/`ConsiderationItem` with a single `amount` (no start/end) plus `marketplace`, `royalty_max_bps`, and `counter`, matching the ERC-721 venue shape (domain v4) while preserving ERC-1155 quantities. There is no fulfillment builder — fulfilment is an unsigned call.

### client.services.erc1155Collection (`ERC1155CollectionService`) — added v0.7.0

On-chain ERC-1155 collection operations (deploy, mint, royalties). All require a starknet.js `AccountInterface`.

| Method | Description |
|---|---|
| `deployCollection(account, params)` | Deploy new ERC-1155 collection via factory. `params: DeployCollectionParams` (`{ name, symbol, baseUri }`) |
| `mintItem(account, params)` | Mint single token. `params: { collection, tokenId, recipient, amount, tokenUri? }` |
| `batchMintItem(account, params)` | Batch mint. `params: { collection, tokenIds, recipients, amounts, tokenUris? }` |
| `setDefaultRoyalty(account, params)` | Set collection-level ERC-2981 royalty. `params: { collection, receiver, feeBasisPoints }` |
| `setTokenRoyalty(account, params)` | Set per-token royalty. `params: { collection, tokenId, receiver, feeBasisPoints }` |
| `setApprovalForAll(account, params)` | Approve operator for all tokens. `params: { collection, operator, approved }` |

### client.services.drop (`DropService`)

On-chain Collection Drop interactions. All require a starknet.js `AccountInterface`.

| Method | Description |
|---|---|
| `claim(account, collectionAddress, quantity?)` | Public mint. `quantity` defaults to 1 |
| `adminMint(account, params)` | Bypass conditions — gift/reserve. `params: { collection, recipient, quantity?, customUri? }` |
| `setClaimConditions(account, params)` | Update phase config. `params: { collection, conditions: ClaimConditions }` |
| `setAllowlistEnabled(account, params)` | Toggle allowlist gate. `params: { collection, enabled }` |
| `addToAllowlist(account, params)` | Add single wallet. `params: { collection, address }` |
| `batchAddToAllowlist(account, params)` | Add up to 200 wallets per tx. `params: { collection, addresses }` |
| `setPaused(account, params)` | Pause/unpause minting. `params: { collection, paused }` |
| `withdrawPayments(account, params)` | Withdraw ERC-20 proceeds to organizer. `params: { collection }` |
| `createDrop(account, params)` | Deploy new DropCollection via factory. `params: CreateDropParams` |

`ClaimConditions`: `{ startTime, endTime, price, paymentToken, maxQuantityPerWallet }` — set `price=0` for free mints, `endTime=0` for no expiry.

---

## Addresses — `getCoordinates(chain)` (`src/chains.ts`)

Every contract address, class hash, and start block lives in the **per-chain
coordinate registry** — the single source. There are **no flat `*_MAINNET`
constants** (removed v0.41.0). Read them per chain:

```ts
import { getCoordinates } from "@medialane/sdk";
const SN = getCoordinates("STARKNET");
SN.marketplace721      // "0x069cf5…"  (was MARKETPLACE_721_CONTRACT_MAINNET)
SN.collection721       // "0x0558c9b6…"  MIP v0.4.0 royalties
SN.collection1155      // "0x0083543c…"  v0.3.0 ownerless factory
SN.popFactory          // SN.dropFactory, SN.nftComments,
SN.creatorCoinFactory  // SN.ekuboCore, SN.rpcUrl, …all fields in ChainCoordinates
```

`ChainCoordinates` (the full field list) + the populated Starknet values are in
`src/chains.ts`. Adding a chain = adding an entry there (the §7 litmus test).
`getCoordinates(chain)` throws for an unconfigured chain. Mainnet-only — no
network/Sepolia axis.

**SUPPORTED_TOKENS** (5 tokens — v0.4.2):

| Symbol | Address | Decimals | Listable |
|--------|---------|----------|----------|
| USDC | `0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb` | 6 | ✓ |
| USDT | `0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8` | 6 | ✓ |
| ETH | `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7` | 18 | ✓ |
| STRK | `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` | 18 | ✓ |
| WBTC | `0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac` | 8 | ✓ |

**IP Metadata Types** (added v0.2.0 — `src/types/api.ts`):

- `IpAttribute` — `{ trait_type: string; value: string }` — typed OpenSea ERC-721 attribute
- `IpNftMetadata` — full IPFS metadata shape (name, description, image, external_url, attributes, + licensing shortcut fields)
- `ApiTokenMetadata.attributes` — now `IpAttribute[] | null` (was `unknown | null`)
- `ApiTokenMetadata` — extended with `derivatives`, `attribution`, `territory`, `aiPolicy`, `royalty`, `registration`, `standard` (all `string | null`)

**v0.2.6 — Order token enrichment:**
- `ApiOrderTokenMeta` — `{ name: string | null; image: string | null; description: string | null }`
- `ApiOrder.token: ApiOrderTokenMeta | null` — populated by batchTokenMeta in the backend; use directly in UI components, no `useToken` needed

**v0.2.7 — Collection image in intent:**
- `CreateCollectionIntentParams.image?: string` — optional IPFS URI stored in intent typedData

**v0.3.0 — Internal address normalization + collection owner:**
- `normalizeAddress()` now applied internally before every URL construction in `ApiClient` — callers no longer need to normalize addresses themselves
- Affected methods: `getTokensByOwner`, `getOrdersByUser`, `getActivitiesByAddress`, `getActiveOrdersForToken`, `getCollection`, `getCollectionTokens`, `getCollectionsByOwner`, and `offerer` filter in `getOrders`
- `ApiCollection.owner: string | null` — populated from intent typedData or on-chain `owner()` call
- `ApiClient.getCollectionsByOwner(owner: string)` — fetches `GET /v1/collections?owner=address`

**v0.7.1 — ERC-1155 v2 ABIs:**
- `IPCollection1155FactoryABI`: added `base_uri` input to `deploy_collection`, added `update_collection_class_hash`
- `IPCollection1155ABI`: added `name()`, `symbol()`, `base_uri()`, `get_token_registered_at()`; replaced `set_royalty` with full ERC-2981 functions (`set_default_royalty`, `set_token_royalty`, `delete_default_royalty`, `reset_token_royalty`)
- `DeployCollectionParams.baseUri` field added; `deployCollection()` passes it as third factory arg
- `setRoyalty()` removed — use `setDefaultRoyalty()` / `setTokenRoyalty()` instead

**v0.7.0 — ERC-1155 collection service:**
- `ERC1155CollectionService` (`client.services.erc1155Collection`) — `deployCollection`, `mintItem`, `batchMintItem`, `setDefaultRoyalty`, `setTokenRoyalty`, `setApprovalForAll`
- `IPCollection1155FactoryABI` + `IPCollection1155ABI` exported
- `ERC1155_FACTORY_CONTRACT_MAINNET` + `ERC1155_COLLECTION_CLASS_HASH_MAINNET` constants exported

**v0.6.9 — ERC-1155 listing amount:**
- `CreateListingIntentParams.amount?: string` — number of units to list; omit for ERC-721

**v0.6.8 — Medialane1155Module:**
- `Medialane1155Module` (`client.marketplace1155`) — `createListing`, `fulfillOrder`, `cancelOrder` for ERC-1155 marketplace
- `build1155OrderTypedData`, `build1155FulfillmentTypedData`, `build1155CancellationTypedData` signing helpers exported
- `CreateListing1155Params`, `FulfillOrder1155Params`, `CancelOrder1155Params` types exported
- `Medialane1155ABI` + `MARKETPLACE_1155_CONTRACT_MAINNET` exported
- Sepolia network support removed

**v0.6.7 — CollectionRegistryABI:**
- `CollectionRegistryABI` exported — covers `list_user_collections` + `get_collection`

**v0.6.6 — COLLECTION_CONTRACT updated:**
- `COLLECTION_CONTRACT_MAINNET` updated to audited v2 address `0x05c49ee5d3208a2c2e150fdd0c247d1195ed9ab54fa2d5dea7a633f39e4b205b`

**v0.6.5 — ERC-1155 support:**
- `ApiTokenBalance` type — `{ owner: string; amount: string }` — one entry per holder per token ID
- `ApiToken.balances: ApiTokenBalance[] | null` — populated on single-token fetches; null on list responses
- `ApiToken.owner: string | null` — **deprecated**, always null post-migration; use `balances`
- `ApiCollection.standard: "ERC721" | "ERC1155" | "UNKNOWN"` — detected via ERC-165 `supportsInterface` at collection index time

**v0.6.1 — Collection Drop:**
- `CollectionSource` union extended with `"COLLECTION_DROP"`
- `DropMintStatus` type: `{ mintedByWallet: number; totalMinted: number }`
- `DropService` (`client.services.drop`) — on-chain interactions: `claim`, `adminMint`, `setClaimConditions`, `setAllowlistEnabled`, `addToAllowlist`, `batchAddToAllowlist`, `setPaused`, `withdrawPayments`, `createDrop`
- `ClaimConditions` and `CreateDropParams` types exported
- `client.api.getDropCollections(opts?)` and `client.api.getDropMintStatus(collection, wallet)`
- `DropCollectionABI` and `DropFactoryABI` exported
- `DROP_FACTORY_CONTRACT_MAINNET` and `DROP_COLLECTION_CLASS_HASH_MAINNET` constants exported

**v0.14.2 — registerUser:**
- `client.api.registerUser({ walletAddress, walletType?, appSource?, chain? })` — wraps `POST /v1/users/register` (tenant API key, no Clerk JWT). Returns `{ accountId, publicId, walletAddress, chain, walletType, appSource, createdAt }`. Idempotent on the backend. Used by medialane-starknet to silently register web3 wallet connections.

**v0.14.1 — upsertMyWallet metadata:**
- `ApiWalletType` union: `"ARGENT" | "BRAAVOS" | "CARTRIDGE" | "PRIVY" | "CHIPIPAY" | "INJECTED" | "UNKNOWN"`
- `ApiAppSource` union: `"MEDIALANE_DAPP" | "MEDIALANE_IO" | "MEDIALANE_PORTAL" | "MEDIALANE_SDK"`
- `upsertMyWallet(clerkToken, options?: { walletType?, appSource? })` — body now includes `walletType` and `appSource` (defaults: `"UNKNOWN"` and `"MEDIALANE_SDK"`). Previous body was empty; SDK callers were landing as `walletType: UNKNOWN, appSource: MEDIALANE_IO` on the backend. Backward-compatible signature (options is optional).

**v0.14.0 — platform fee module (BREAKING for fee callers):**
- Resolvable `feeConfig` on `MedialaneConfig`; `buildFeeCall(...)` exported. See `src/fee/`.

**v0.13.0 — service-model cleanup (BREAKING, 2026-05-18):**
- **Removed** `CollectionSource` type, `ApiCollection.source`, `ApiCollectionsQuery.source` (backend dropped the `Collection.source` column + `CollectionSource` enum in Phase 2D.4). Use `ApiCollection.service: string | null` / `getService()`.
- `getCollections(page?, limit?, isKnown?, sort?, service?)` — the `source?` positional param was removed; `service` moved from the 6th arg to the 5th. Consumer migration: `getCollections(p,l,k,sort,undefined,service)` → `getCollections(p,l,k,sort,service)`.
- Published to npm; medialane-io + medialane-starknet on 0.13.0.

**v0.12.0 — service-model registry:** `ApiCollection.service`, `getService()`/`getServiceConfig()` registry, `?service=` query support (additive; `source` deprecated then removed in 0.13.0).

**v0.11.0 — Full IPCollection + IPNft ABIs as first-class exports (2026-05-14):**
- `IPCollectionABI` (full) — exports the audited MIP-Collections-ERC721 registry surface (`create_collection`, `mint`, `archive`, `transfer_collection_ownership`, `get_collection`, `is_transferable_token`, etc.)
- `IPNftABI` (full) — exports the per-collection ERC-721 surface (`get_full_token_data`, `get_token_creator`, `get_token_registered_at`, archive, …)
- `CollectionRegistryABI` (the minimal subset for `list_user_collections` + `get_collection`) is now `@deprecated`. Existing consumers continue to work; new code should import `IPCollectionABI` instead.
- Consumed by `medialane-starknet` and `medialane-io` to eliminate duplicate local ABI files. The SDK is now the single source of truth for all MIP / Medialane Cairo ABIs.

**v0.10.0 — Collection slug claims:**
- `ApiCollectionProfile.slug: string | null` — approved vanity slug set by admin on claim approval
- `ApiCollectionSlugClaim` type: `{ id, slug, contractAddress, chain, walletAddress, status: "PENDING"|"APPROVED"|"REJECTED", adminNotes, notifyEmail, reviewedAt, createdAt, updatedAt }`
- `client.api.checkCollectionSlugAvailability(slug)` — public check → `{ available: boolean; reason?: string }`
- `client.api.submitCollectionSlugClaim(contractAddress, slug, clerkToken, notifyEmail?)` — owner-only submit → `{ claim: ApiCollectionSlugClaim }`
- `client.api.getMyCollectionSlugClaims(clerkToken)` — list caller's claims → `{ claims: ApiCollectionSlugClaim[] }`
- `client.api.getCollectionBySlug(slug)` — resolve vanity slug to full collection → `ApiCollection | null`

**v0.5.7 — Gated content fields:**
- `ApiCollectionProfile.hasGatedContent: boolean` — whether collection has gated content configured
- `ApiCollectionProfile.gatedContentTitle: string | null` — public title of gated content (shown to all; URL is holder-only via `GET /v1/collections/:contract/gated-content`)

**v0.4.7 — IPType union:**
- `IPType` union exported: `"Audio" | "Art" | "Documents" | "NFT" | "Video" | "Photography" | "Patents" | "Posts" | "Publications" | "RWA" | "Software" | "Custom"`

**v0.4.6 — ChipiPay wallet fallback:**
- `ApiUserWallet` type + `upsertMyWallet(clerkToken)` / `getMyWallet(clerkToken)` — `POST/GET /v1/users/me`

**v0.4.5 — Creators in search:**
- `ApiSearchCreatorResult` type + `ApiSearchResult.creators` field

**v0.4.4 — Creator listing:**
- `ApiCreatorListResult` type + `getCreators(opts?)` — `GET /v1/creators`

**v0.4.3 — Creator username:**
- `ApiCreatorProfile.username: string | null` + `getCreatorByUsername(username)` — `GET /v1/creators/by-username/:username`

**v0.4.1 — Collection claims + profiles:**
- `claimCollection(contractAddress, walletAddress, clerkToken)` — on-chain ownership auto-claim
- `requestCollectionClaim(params)` — manual email-based claim request
- `getCollectionProfile / updateCollectionProfile` — enriched collection display metadata
- `getCreatorProfile / updateCreatorProfile` — creator display metadata
- New types: `ApiCollectionClaim`, `ApiAdminCollectionClaim`, `ApiCollectionProfile`, `ApiCreatorProfile`
- `ApiCollection` extended: `source` (enum) + `claimedBy: string | null` + optional `profile`

**v0.4.0 — Typed errors + retry:**
- `MedialaneError.code` and `MedialaneApiError.code` — typed `MedialaneErrorCode` union
- Automatic exponential-backoff retry on all API requests (3 attempts, 4xx not retried)
- `RetryOptions` and `CollectionSort` exported from index
- Sepolia guard — throws `NETWORK_NOT_SUPPORTED` at construction if no contracts configured

**v0.3.3 — Collections sort:**
- `getCollections(page?, limit?, isKnown?, sort?)` — added `sort` param: `"recent"` (default, `createdAt DESC`) | `"supply"` | `"floor"` | `"volume"` | `"name"`

**v0.3.1 — Collection on-chain ID:**
- `ApiCollection.collectionId: string | null` — the on-chain numeric registry ID (decimal string, e.g. `"1"`). Required by `createMintIntent`. Populated for collections indexed after the 2026-03-09 backend migration; null for older collections until re-indexed.

---

## Key Conventions

- **Runtime**: Bun. `~/.bun/bin/bun`, never `node`/`npm`/`npx`.
- **Imports**: Use `.js` extension (ESM resolution via tsup).
- **Address normalization**: `normalizeAddress(chain, address)` is chain-dispatched (Starknet pad / EVM EIP-55 / Solana base58; Bitcoin throws). `ApiClient` is chain-scoped and normalizes internally via `this.addr()` using its `config.chain` — callers pass any valid format. Cairo-only services pass `"STARKNET"` explicitly.
- **No side effects at import time** — config and contract instances are lazy/cached.
- **Signatures**: `toSignatureArray()` handles both array format and `{ r, s }` object format from starknet.js.
- **BigInt serialization**: `stringifyBigInts()` recursively converts BigInt to string before JSON or contract calls.
- **Cart checkout nonce**: `baseNonce + BigInt(i)` per item — must be sequential, single tx.
- **Listing approval check**: calls `get_approved(tokenId_low, tokenId_high)` before executing; if already approved, skips the approve call.

---

## Errors

```ts
import { MedialaneError, MedialaneApiError } from "@medialane/sdk"

// On-chain (marketplace module)
throw new MedialaneError("message", cause?)   // e.g. "Failed to create listing"

// REST API (api module)
throw new MedialaneApiError(status, "message")   // e.g. status=401, "Invalid or revoked API key"
```

---

## SNIP-12 Signing (`src/marketplace/signing.ts`)

Typed-data builders used before `account.signMessage()` (redesigned venues, v0.26.0):

- `buildOrderTypedData(orderParams, chainId)` — listing or offer (ERC-721)
- `build1155OrderTypedData(orderParams, chainId)` — listing or offer (ERC-1155)
- `buildCancellationTypedData({ order_hash, offerer }, chainId)` — cancel (no nonce)
- `build1155CancellationTypedData(...)` — cancel (ERC-1155, no nonce)

**Fulfilment is UNSIGNED** — the caller is the fulfiller, so there is no
fulfillment builder (the old `buildFulfillmentTypedData` was removed in 0.26.0).

Order schema (0.26.0): nested `OfferItem`/`ConsiderationItem` with a single
`amount` (no start/end), plus `marketplace`, `royalty_max_bps`, and `counter`
(replaces the removed `nonce`; salt is now the sole hash-uniqueness source).
SNIP-12 domain: `{ name: "Medialane", version: "4" (ERC-721) | "3" (ERC-1155),
revision: "1", chainId }`. All results pass through `stringifyBigInts()`.
