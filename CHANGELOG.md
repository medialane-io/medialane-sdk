# Changelog

All notable changes to `@medialane/sdk` are documented here.

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
