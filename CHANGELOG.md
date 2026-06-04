# Changelog

All notable changes to `@medialane/sdk` are documented here.

## [0.30.0] — 2026-06-04

### Added — Creator Coin price reads + external ERC-20s

- **`getCreatorCoinPrice(coinAddress, provider)`** + `client.services.creatorCoin.getPrice(coin)`
  — read a Creator Coin's live spot price directly from its Ekubo pool. Self-contained,
  read-only, day-one: discovers pool params from the coin's `launched_with_liquidity_parameters`,
  reads `Core.get_pool_price`, and converts `sqrt_ratio` → quote-per-coin (handling token0/1
  ordering + quote decimals; normalizes the quote address so `getTokenByAddress` resolves
  symbol/decimals). No AVNU/backend dependency. Returns `null` if not launched on Ekubo.
  New `EKUBO_CORE_MAINNET` constant + `CreatorCoinPrice` type.
- **`external-erc20` registry service** (provenance `EXTERNAL`, `standard: ERC20`,
  `uiVariant: "coin"`, capabilities `swap`/`transfer`) — the ERC-20 parallel to
  `external-erc721`/`external-erc1155`, for claimed/partner/future-multichain coins (e.g.
  Starknet unrug memecoins). Curation is via the existing claim/admin-add path; no bulk
  indexing, no per-source service.

## [0.29.0] — 2026-06-04

### Added — Creator Coin service

- **`creator-coin` registry service** (`standard: ERC20`, capabilities
  `launch`/`swap`/`transfer`, onchain Factory + `startBlock` 10474544). Extends
  `ServiceCapability` (+`launch`, +`swap`) and `ServiceDefinition.standard` (+`ERC20`).
  **No `medialane-coin-trader` venue** — Medialane runs no coin-trading venue; `swap` drives
  an embedded Ekubo swap, settlement external.
- **`CreatorCoinService`** (`client.services.creatorCoin`): `createCreatorCoin`,
  `launchOnEkubo` (optional `quoteFundAmount` prepends the team-allocation buyback transfer),
  `isCreatorCoin`. `VALIDATED_EKUBO_PARAMS` (0.01 quote/coin, smoke-validated) + `CREATOR_COIN_*`
  constants + `CreatorCoinFactoryABI`.
- Published as 0.29.0 (not 0.28.0) to avoid colliding with main's concurrently-shipped 0.28.0.

## [0.28.0] — 2026-06-03

### Added — resilient RPC failover

- `createFailoverFetch(urls)` + `PUBLIC_RPC_FALLBACKS` + `isTransientRpcError` +
  `FailoverFetchOptions`. Single source of the RPC-failover policy (Alchemy primary →
  lava.build on transient `-32001`/`503`), shared across dapp / io / backend. Construct
  `RpcProvider` with `baseFetch: createFailoverFetch(...)` instead of a bare `nodeUrl`.

## [0.27.0] — 2026-06-01

### Changed

- `ApiIntentCreated` is now a discriminated union on `requiresSignature` (signature-required
  intents expose `typedData`; auto-executed intents expose `calls`).

## [0.26.0] — 2026-05-31

### BREAKING — redesigned marketplace venues

The marketplace contracts were redesigned and redeployed as fresh immutable
classes (Medialane721 / Medialane1155). The SDK now targets the new signed
schema; orders produced by ≤0.25.0 are not valid on the new venues.

- **Order schema:** `OfferItem`/`ConsiderationItem` use a single `amount`
  (removed `start_amount`/`end_amount`). `OrderParameters` adds `marketplace`,
  `royalty_max_bps`, `counter`; removes `nonce`. `Cancelation` drops `nonce`.
  SNIP-12 domain versions are now 721=`4`, 1155=`3`.
- **Fulfilment is unsigned** — the caller IS the fulfiller. `buildFulfillmentTypedData`
  and `build1155FulfillmentTypedData` are **removed**, as is
  `MarketplaceModule.buildFulfillmentTypedData`; `fulfillOrder`/`fulfillOrder1155`/
  `checkoutCart*` no longer prompt a signature.
- **Bulk cancel:** `nonces()`/`getNonce` removed → `getCounter()` + new
  `incrementCounter()` (per-offerer counter epoch) on both modules.
- **Royalties:** listings/offers now sign a `royaltyMaxBps` cap, derived from the
  NFT's live EIP-2981 (override via the new `royaltyMaxBps?` param).
- **Addresses/ABIs:** new mainnet `MARKETPLACE_721/1155_*` constants + regenerated
  `IPMarketplaceABI` / `Medialane1155ABI`.
- **salt** widened to a full random felt (sole hash-uniqueness source now).

Migration: consumers replace `getNonce`→`getCounter`, drop fulfillment-signing
flows, and read `OrderFulfilled.fulfiller` (the `OrderDetails.fulfiller` field is gone).

## [0.24.0] — 2026-05-25

### Added

- **`ApiCollection.isHidden: boolean`** — content-moderation flag. Backend already serializes this (`src/api/routes/collections.ts:551`), but the SDK type union was missing it, forcing consumers to cast through `any`. List endpoints filter `isHidden=true` rows out automatically; single-collection fetches still return them so the UI can render a "hidden" banner instead of a 404.
- **`ApiCollection.isFeatured: boolean`** — homepage / browse promotion flag. Backend serializes this on collection rows but the type union was missing it.
- **`ApiCreatorProfile.collectionImage?: string | null`** — computed fallback the backend populates on the creator-list / creator-page endpoints when both `avatarImage` and `bannerImage` are null (see `medialane-backend/src/api/routes/profiles.ts:253`). Undefined on profile-detail endpoints that don't perform the lookup. UI can use this to render hero banners without an extra fetch.

### Runtime impact

None — these fields are already returned by the backend; the SDK was simply not typing them, forcing consumers (`medialane-io`, `medialane-dapp`) to use `as any` casts. Adding the typed declarations unblocks ~3 `as any` removals in io's follow-up Batch D.2 sweep.

### Verification

Audit confirmed each new field is actually serialized by the backend:
- `Collection.isHidden` / `Collection.isFeatured`: see `serializeCollection()` in backend `src/api/routes/collections.ts:540-565`.
- `ApiCreatorProfile.collectionImage`: see `medialane-backend/src/api/routes/profiles.ts:231-256`.

`Token.isHidden` is intentionally NOT added — backend filters tokens by `isHidden=false` but does not serialize the field on token responses. Consumers checking `(token as any).isHidden` are reading a field that never exists at runtime.

## [0.23.0] — 2026-05-25

### BREAKING (type-only)
- **`OrderStatus` no longer includes `"COUNTER_OFFERED"`.** Canonical values are now `"ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED"` per `01-core-model §V`. Counter-offers are linked orders via `parentOrderHash`, not a third lifecycle state. Use `ApiOrder.hasActiveCounterOffer` (added in 0.22.0) for the "this bid has been countered" affordance. (audit P0-1 Phase D)

  Runtime impact: zero — the backend hasn't written `COUNTER_OFFERED` since 0.22.0 + matching backend release (2026-05-25). Any consumer with a `status === "COUNTER_OFFERED"` predicate left over will get a TypeScript narrowing error and a permanently-false branch at runtime; replace with the `hasActiveCounterOffer` flag.

## [0.22.0] — 2026-05-25

### Added
- **`ApiOrder.hasActiveCounterOffer?: boolean`** — true when this order is a bid (ERC-20 offer) AND at least one ACTIVE counter exists with `parentOrderHash = this.orderHash`. Set by `GET /v1/orders/user/:address` and `GET /v1/orders/:orderHash`; undefined on other endpoints. Use this instead of `status === "COUNTER_OFFERED"` for "this bid has been countered" affordances — the status pattern is being phased out (`01-core-model §V`). (audit P0-1, Phase A.2)

### Changed
- **`ApiOrder.parentOrderHash`** is now always emitted by the backend (was conditional). Type stays `string | null | undefined` for back-compat with older response shapes.

## [0.21.0] — 2026-05-24

Audit-driven release. See `medialane-core/docs/audits/2026-05-24-backend-sdk-audit.md`.

### Changed
- **`normalizeAddress` now validates input.** Routes through `BigInt(...)` — non-numeric input throws `Invalid Starknet address` instead of silently producing `0x000...0banana`. Existing valid Starknet addresses continue to normalize to the same 64-char lowercase hex. (audit P1-10 + R0)
- **SNIP-12 builder `chainId` parameter widened to `constants.StarknetChainId | string`** so callers using plain strings from `RpcProvider.getChainId()` (e.g. medialane-backend) can import directly without casts. No behavior change. (R1)

### Added
- **`normalizeHash`** export — same shape as `normalizeAddress`, separate name to make intent explicit at call sites. medialane-backend re-exports both from its `utils/starknet.ts`. (R0)
- **`ServiceEventDeclaration`** type + optional **`events`** field on `ServiceDefinition`. Populated for the 7 services that emit events (marketplace × 2, MIP factories × 2, POP, Drop). `emittedBy: "factory" | "instance"` + `poll: "fast" | "slow"` cadence hint. Foundation for the year-2 data-driven event-parser registry (see `02-protocol-app-split §V`). Backend indexer keeps hand-coded pollers until it consumes this metadata. (R3 prep)

### Fixed
- **`MedialaneClient.api` proxy whitelists known method names only.** When `backendUrl` is not configured, the previous proxy returned a throwing function for ANY property access — including `Symbol.iterator`, `.then` (made the proxy thenable; `Promise.resolve(client.api)` silently hung), `.toString`, `.constructor`. Narrowed to `ApiClient.prototype` method names; symbol/unknown access passes through to a sentinel instance. (P2-8)

## [0.8.3] — 2026-04-28

### Changed
- `MARKETPLACE_1155_CONTRACT_MAINNET` updated to `0x02bfa521c25461a09d735889b469418608d7d92f8b26e3d37ef174a4c2e22f99` (Medialane1155V2 — immutable ERC-1155 marketplace with bid/listing parity).
- `MARKETPLACE_1155_CLASS_HASH_MAINNET` updated to `0x01b674aad934be85abc7c1970265cbf7e9bc7d586a90f0a67112c201636dbdd3`.
- ERC-1155 SNIP-12 order signing now uses the nested V2 `OrderParameters` shape and domain `{ name: "Medialane", version: "2", revision: "1" }`.

### Added
- `MakeOfferIntentParams.tokenStandard` and `MakeOfferIntentParams.quantity` for ERC-1155 offer intents through the backend orchestrator.

---

## [0.8.0] — 2026-04-25

### Changed
- `MARKETPLACE_CONTRACT_MAINNET` updated to `0x004387e58d469f19332dd5d20846b10339ddc49ef208025ec7d5bef294a8daf3` (Medialane ERC-721 v3 — immutable, no admin keys)
- `MARKETPLACE_1155_CONTRACT_MAINNET` updated to `0x035836932ba1d219e00b8e42cd9a433fb2b211a08edcaa8bae40232f335f777d` (Medialane1155 v3 — immutable, no admin keys)

### Added
- `NFTCOMMENTS_CONTRACT_MAINNET` exported from `src/constants.ts` — `0x024f97eb5abe659fb650bf162b5fc16501f8f3863a7369901ce6099462e62799`

---

## [0.7.6] — 2026-04-21

### Changed
- `MARKETPLACE_1155_CONTRACT_MAINNET` updated to `0x03aab04e806542cd88bfd0c5bb2a37334fd742d477a2e0f97af09aa4a36137ca` (Medialane1155 v2 — partial fills)
- `build1155FulfillmentTypedData`: `OrderFulfillment` type now includes `quantity: felt` between `fulfiller` and `nonce` — **required by v2 contract**. Signatures built without this field are rejected on-chain.
- `FulfillOrder1155Params.quantity?: string` — units to purchase (1 ≤ quantity ≤ remaining). Defaults to `"1"`.
- `fulfillOrder1155`: `quantity` included in `fulfillmentParams` and typed data.

### Added
- `ApiOrder.remainingAmount: string | null` — units still available for ERC-1155 partial-fill orders.

---

## [0.7.5] — 2026-04-20

### Added
- `ApiToken.standard: "ERC721" | "ERC1155" | "UNKNOWN" | null` — token standard on all token API responses.

---

## [0.6.9] — 2026-04-16

### Added
- `CreateListingIntentParams.amount?: string` — optional quantity field for ERC-1155 multi-unit listings. Pass the number of units to list; omit for ERC-721 (single-unit).

---

## [0.6.8] — 2026-04-16

### Added
- `Medialane1155Module` — dedicated on-chain module for the ERC-1155 marketplace (`Medialane1155` contract, `0x042005e9b85536072bfa260b95aa6aaef07f48e622031657384d2375195d7123`). Accessible via `client.marketplace1155`.
  - `createListing(account, params)` — signs `OrderParameters` via SNIP-12 and calls `register_order`. Automatically grants `set_approval_for_all` if not already approved.
  - `fulfillOrder(account, params)` — signs `OrderFulfillment`, approves ERC-20 payment, then calls `fulfill_order` atomically. ERC-2981 royalties are handled by the contract.
  - `cancelOrder(account, params)` — signs `OrderCancellation` and calls `cancel_order`.
  - `buildListingTypedData` / `buildFulfillmentTypedData` / `buildCancellationTypedData` — SNIP-12 typed data builders for ChipiPay and custom signing flows.
- `Medialane1155ABI` — exported ABI for the ERC-1155 marketplace contract.
- `MARKETPLACE_1155_CONTRACT_MAINNET` — exported contract address constant.
- `build1155OrderTypedData`, `build1155FulfillmentTypedData`, `build1155CancellationTypedData` — exported signing helpers.
- `CreateListing1155Params`, `FulfillOrder1155Params`, `CancelOrder1155Params` — TypeScript param types.

### Changed
- `MedialaneConfig` and `ResolvedConfig` now include `marketplace1155Contract` (optional, defaults to mainnet address).
- Network support simplified to mainnet only — Sepolia references removed throughout.

---

## [0.6.7] — 2026-04-10

### Added
- `CollectionRegistryABI` exported from `@medialane/sdk` — minimal ABI covering `list_user_collections` and `get_collection` on the collection registry contract (`0x05c49ee5d3208a2c2e150fdd0c247d1195ed9ab54fa2d5dea7a633f39e4b205b`). Consumers no longer need to maintain an inline copy.

---

## [0.6.6] — 2026-04-10

### Changed
- `COLLECTION_CONTRACT_MAINNET` updated to audited v2 address `0x05c49ee5d3208a2c2e150fdd0c247d1195ed9ab54fa2d5dea7a633f39e4b205b`

---

## [0.6.5] — 2026-03-29

### Added
- `ApiTokenBalance` type — `{ owner: string; amount: string }` — one entry per holder per token ID for ERC-1155
- `ApiToken.balances: ApiTokenBalance[] | null` — populated on single-token fetches; null on list responses
- `ApiCollection.standard: "ERC721" | "ERC1155" | "UNKNOWN"` — detected via ERC-165 `supportsInterface` at collection index time

### Changed
- `ApiToken.owner` deprecated — always `null` after the ERC-1155 migration; use `balances` for ownership checks

---

## [0.6.4] — 2026-03-29

### Changed
- `MARKETPLACE_CONTRACT_MAINNET` updated to audited v2 address `0x0234f4e8838801ebf01d7f4166d42aed9a55bc67c1301162decf9e2040e05f16`

---

## [0.6.3] — 2026-03-28

### Added
- `DropFactoryABI` and `POPFactoryABI` exported from `@medialane/sdk`
- `DROP_FACTORY_CONTRACT_MAINNET`, `DROP_COLLECTION_CLASS_HASH_MAINNET`, `POP_FACTORY_CONTRACT_MAINNET`, `POP_COLLECTION_CLASS_HASH_MAINNET` constants exported

---

## [0.6.1] — 2026-03-28

### Added
- `DropService` (`client.services.drop`) — full on-chain Collection Drop management: `claim`, `adminMint`, `setClaimConditions`, `setAllowlistEnabled`, `addToAllowlist`, `batchAddToAllowlist`, `setPaused`, `withdrawPayments`, `createDrop`
- `client.api.getDropCollections(opts?)` — list all `COLLECTION_DROP` collections
- `client.api.getDropMintStatus(collection, wallet)` — returns `{ mintedByWallet, totalMinted }`
- `DropMintStatus`, `ClaimConditions`, `CreateDropParams` types exported
- `DropCollectionABI` and `DropFactoryABI` exported
- `CollectionSource` union extended with `"COLLECTION_DROP"`

---

## [0.6.0] — 2026-03-25

### Added
- `PopService` (`client.services.pop`) — POP Protocol on-chain operations: `claim`, `adminMint`, `addToAllowlist`, `batchAddToAllowlist`, `removeFromAllowlist`, `setTokenUri`, `setPaused`, `createCollection`
- `client.api.getPopCollections(opts?)` and `client.api.getPopEligibility(collection, wallet)`
- `client.api.getPopEligibilityBatch(collection, wallets)` — batch eligibility check (max 100 wallets)
- `POPCollectionABI` and `POPFactoryABI` exported

---

## [0.5.7] — 2026-03-22

### Added
- `ApiCollectionProfile.hasGatedContent: boolean` — whether collection has token-gated content configured
- `ApiCollectionProfile.gatedContentTitle: string | null` — public title of gated content (URL is holder-only via backend)

---

## [0.5.5] — 2026-03-21

### Added
- `extendRemixOffer(id, days, clerkToken)` — extend expiry of a PENDING/AUTO_PENDING remix offer by 1–30 days
- `ApiRemixOfferPrice` type — `{ raw, formatted, currency, decimals }` structured price object on `ApiRemixOffer.price`

---

## [0.5.4] — 2026-03-21

### Changed
- `ApiRemixOffer.price` now serialized as a structured object (`{ raw, formatted, currency, decimals }`) instead of raw wei strings

---

## [0.5.3] — 2026-03-21

### Added
- `getTokenComments(contract, tokenId, opts?)` — fetch on-chain NFT comments (`GET /v1/tokens/:contract/:tokenId/comments`)
- `ApiComment` type — `{ id, author, content, txHash, blockNumber, blockTimestamp, isHidden, createdAt }`

---

## [0.5.0] — 2026-03-21

### Added
- Counter-offer support: `createCounterOfferIntent(params, clerkToken)`, `getCounterOffers(query)`, `ApiCounterOffersQuery`, `CreateCounterOfferIntentParams`
- `OrderStatus` extended with `"COUNTER_OFFERED"`; `IntentType` with `"COUNTER_OFFER"`
- `ApiOrder` extended: `parentOrderHash?: string | null`, `counterOfferMessage?: string | null`
- Full remix licensing methods: `submitRemixOffer`, `submitAutoRemixOffer`, `confirmSelfRemix`, `getRemixOffers`, `getRemixOffer`, `confirmRemixOffer`, `rejectRemixOffer`, `getTokenRemixes`
- New types: `RemixOfferStatus`, `ApiRemixOffer`, `ApiPublicRemix`, `OPEN_LICENSES`, `OpenLicense`, `CreateRemixOfferParams`, `AutoRemixOfferParams`, `ConfirmSelfRemixParams`, `ConfirmRemixOfferParams`, `ApiRemixOffersQuery`

---

## [0.4.8] — 2026-03-20

### Added
- `ApiComment` type + `getTokenComments(contract, tokenId, opts?)` (patch release; backported into v0.5.3)

---

## [0.4.7] — 2026-03-20

### Added
- `IPType` union type exported: `"Audio" | "Art" | "Documents" | "NFT" | "Video" | "Photography" | "Patents" | "Posts" | "Publications" | "RWA" | "Software" | "Custom"` — the 12 canonical IP types supported on Medialane

---

## [0.4.6] — 2026-03-20

### Added
- `ApiUserWallet` type: `{ walletAddress: string; createdAt: string }`
- `ApiClient.upsertMyWallet(clerkToken)` — `POST /v1/users/me` — registers or updates the ChipiPay wallet for the authenticated user. Used as fallback during wallet setup when the main ChipiPay endpoint is unavailable
- `ApiClient.getMyWallet(clerkToken)` — `GET /v1/users/me` — returns `ApiUserWallet | null` (null on 404)

---

## [0.4.5] — 2026-03-19

### Added
- `ApiSearchCreatorResult` type — `{ walletAddress, username, displayName, image, bio }`
- `ApiSearchResult.creators: ApiSearchCreatorResult[]` — creator profiles included in search results

---

## [0.4.4] — 2026-03-19

### Added
- `ApiCreatorListResult` type — `{ creators: ApiCreatorProfile[]; total: number; page: number; limit: number }`
- `ApiClient.getCreators(opts?)` — `GET /v1/creators` with optional `search`, `page`, `limit` params

---

## [0.4.3] — 2026-03-19

### Added
- `ApiCreatorProfile.username: string | null` — optional slug field on creator profiles
- `ApiClient.getCreatorByUsername(username)` — `GET /v1/creators/by-username/:username` — resolves username slug to creator profile

---

## [0.4.2] — 2026-03-17

### Added
- `WBTC` token (`0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac`, 8 decimals) added to `SUPPORTED_TOKENS`
- `listable: boolean` field on every `SUPPORTED_TOKENS` entry — controls whether a token appears in listing/offer dialogs (`true`) or only as a marketplace filter chip (`false`)
- `getListableTokens()` helper — returns `ReadonlyArray<SupportedToken>` filtered to `listable: true`; exported from package root

### Changed
- `ETH` promoted to `listable: true` — now available in listing and offer dialogs (was previously filter-only in the frontend)

### Removed
- `USDC.e` (bridged USDC via Starkgate, `0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8`) removed from `SUPPORTED_TOKENS` entirely — only Circle-native USDC (`0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb`) is supported going forward, to avoid user confusion

### Migration
If your code references `"USDC.e"` as a `SupportedTokenSymbol`-typed value, remove it. Existing on-chain orders denominated in USDC.e remain valid and will display correctly in the backend, but the UI no longer offers USDC.e for new listings or offers.

---

## [0.4.1] — 2026-03-14

### Added
- `claimCollection(contractAddress, walletAddress, clerkToken)` — on-chain ownership auto-claim
- `requestCollectionClaim(params)` — manual email-based claim request
- `getCollectionProfile / updateCollectionProfile` — enriched collection display metadata
- `getCreatorProfile / updateCreatorProfile` — creator display metadata
- New types: `ApiCollectionClaim`, `ApiAdminCollectionClaim`, `ApiCollectionProfile`, `ApiCreatorProfile`
- `ApiCollection` extended: `source` (enum) + `claimedBy: string | null` + optional `profile`

## [0.4.0] — 2026-03-12

### Added
- `MedialaneError.code` and `MedialaneApiError.code` — typed `MedialaneErrorCode` union
- Automatic exponential-backoff retry on all API requests (3 attempts, 4xx not retried)
- `RetryOptions` and `CollectionSort` exported from index
- Sepolia guard — throws `NETWORK_NOT_SUPPORTED` at construction if no contracts configured

## [0.3.3] — 2026-03-11

### Added
- `getCollections(page?, limit?, isKnown?, sort?)` — `sort` param: `"recent"` | `"supply"` | `"floor"` | `"volume"` | `"name"`

## [0.3.1] — 2026-03-09

### Added
- `ApiCollection.collectionId: string | null` — on-chain numeric registry ID (decimal string). Required by `createMintIntent`.

## [0.3.0] — 2026-03-09

### Added
- `normalizeAddress()` applied internally in all `ApiClient` methods
- `ApiCollection.owner: string | null`
- `ApiClient.getCollectionsByOwner(owner: string)`

## [0.2.8] — 2026-03-08

### Added
- `ApiCollection.owner: string | null`

## [0.2.7] — 2026-03-07

### Added
- `CreateCollectionIntentParams.image?: string`

## [0.2.6] — 2026-03-07

### Added
- `ApiOrderTokenMeta` — `{ name, image, description }`
- `ApiOrder.token: ApiOrderTokenMeta | null`
