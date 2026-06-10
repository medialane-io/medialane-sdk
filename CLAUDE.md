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
  "version": "0.35.0",
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
  client.ts          ← MedialaneClient (root export)
  config.ts          ← MedialaneConfig schema + resolveConfig()
  constants.ts       ← contract addresses, SUPPORTED_TOKENS, DEFAULT_RPC_URL
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

---

## MedialaneClient

```ts
import { MedialaneClient } from "@medialane/sdk"

const client = new MedialaneClient({
  network: "mainnet",              // "mainnet" | "sepolia" (default: "mainnet")
  rpcUrl: "https://...",           // optional; defaults to Lava public endpoint
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

## Constants (`src/constants.ts`)

```ts
MARKETPLACE_721_CONTRACT_MAINNET            = "0x069cf5391077e3ebdd9cb6aebf90ed530d29f0d6aa34a43f5afae938c0fb565e"  // Medialane721 redesign (2026-05-31)
MARKETPLACE_721_CLASS_HASH_MAINNET          = "0x04c6f952d747ad7ead1b3dad4c1d587837d38f8ec29d6c095a4afa5b5ece5957"
MARKETPLACE_721_START_BLOCK_MAINNET         = 10350340
MARKETPLACE_1155_CONTRACT_MAINNET           = "0x040cd7b3e73bb3c892166e34bdc01d1797f97ecbc356c23f1cf38033cacf0077"  // Medialane1155 redesign (2026-05-31)
MARKETPLACE_1155_CLASS_HASH_MAINNET         = "0x02600bb720908f119afe482309d36c39d087587f0df9576454acfb6363e78cd8"
MARKETPLACE_1155_START_BLOCK_MAINNET        = 10350855
COLLECTION_721_CONTRACT_MAINNET             = "0x0322cb7119955e01ac778d40976eb3ba50540bb0899f812d612f9c7e63e49fd2"  // MIP v0.3.0 (2026-05-22)
COLLECTION_721_START_BLOCK_MAINNET          = 10046166
IPNFT_CLASS_HASH_MAINNET                    = "0x27ee4ded786d51bced1e94afec3034d6ffce71c032c45ee1ff283ccfa9db12e"
IPCOLLECTION_CLASS_HASH_MAINNET             = "0x287ccdff8b6655a2248cfe170d82eae3a35303cd00ef3e751b25ddca26d9095"
COLLECTION_1155_CONTRACT_MAINNET            = "0x0083543c3ee15040a419fc539fa6889f5b956e7d071bcfa97842cb0ae42ad6cc"  // v0.3.0 ownerless factory (2026-06-10)
COLLECTION_1155_FACTORY_CLASS_HASH_MAINNET  = "0x331a69da8655a882ba1fbcb55188b8fa09116521db901bbbaafc9fead0689f8"
COLLECTION_1155_CLASS_HASH_MAINNET          = "0x4e110b59af240ae6c7742999964c4eae13fb2ed935c47fe97653ec017ebea34"
COLLECTION_1155_START_BLOCK_MAINNET         = 10665319
POP_FACTORY_CONTRACT_MAINNET                = "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111"
POP_COLLECTION_CLASS_HASH_MAINNET           = "0x077c421686f10851872561953ea16898d933364b7f8937a5d7e2b1ba0a36263f"
DROP_FACTORY_CONTRACT_MAINNET               = "0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800"
DROP_COLLECTION_CLASS_HASH_MAINNET          = "0x00092e72cdb63067521e803aaf7d4101c3e3ce026ae6bc045ec4228027e58282"
NFTCOMMENTS_CONTRACT_MAINNET                = "0x02cdac70c94447189af0389dfea63f4d5e4154ea8a563de288a5ab1c39e37843"  // fix: 0.24.1 — previous 0x024f97… was undeployed
```

> Deprecated short-name aliases (`MARKETPLACE_CONTRACT_MAINNET`, `COLLECTION_CONTRACT_MAINNET`, `ERC1155_FACTORY_CONTRACT_MAINNET`, etc.) were removed in **v0.16.0** — use the canonical `*_721_*` / `*_1155_*` names.

```ts
DEFAULT_RPC_URLS = {
  mainnet: "https://rpc.starknet.lava.build",
  sepolia: "https://rpc.starknet-sepolia.lava.build",
}
```

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
- `client.api.registerUser({ walletAddress, walletType?, appSource?, chain? })` — wraps `POST /v1/users/register` (tenant API key, no Clerk JWT). Returns `{ accountId, publicId, walletAddress, chain, walletType, appSource, createdAt }`. Idempotent on the backend. Used by medialane-dapp to silently register web3 wallet connections.

**v0.14.1 — upsertMyWallet metadata:**
- `ApiWalletType` union: `"ARGENT" | "BRAAVOS" | "CARTRIDGE" | "PRIVY" | "CHIPIPAY" | "INJECTED" | "UNKNOWN"`
- `ApiAppSource` union: `"MEDIALANE_DAPP" | "MEDIALANE_IO" | "MEDIALANE_PORTAL" | "MEDIALANE_SDK"`
- `upsertMyWallet(clerkToken, options?: { walletType?, appSource? })` — body now includes `walletType` and `appSource` (defaults: `"UNKNOWN"` and `"MEDIALANE_SDK"`). Previous body was empty; SDK callers were landing as `walletType: UNKNOWN, appSource: MEDIALANE_IO` on the backend. Backward-compatible signature (options is optional).

**v0.14.0 — platform fee module (BREAKING for fee callers):**
- Resolvable `feeConfig` on `MedialaneConfig`; `buildFeeCall(...)` exported. See `src/fee/`.

**v0.13.0 — service-model cleanup (BREAKING, 2026-05-18):**
- **Removed** `CollectionSource` type, `ApiCollection.source`, `ApiCollectionsQuery.source` (backend dropped the `Collection.source` column + `CollectionSource` enum in Phase 2D.4). Use `ApiCollection.service: string | null` / `getService()`.
- `getCollections(page?, limit?, isKnown?, sort?, service?)` — the `source?` positional param was removed; `service` moved from the 6th arg to the 5th. Consumer migration: `getCollections(p,l,k,sort,undefined,service)` → `getCollections(p,l,k,sort,service)`.
- Published to npm; medialane-io + medialane-dapp on 0.13.0.

**v0.12.0 — service-model registry:** `ApiCollection.service`, `getService()`/`getServiceConfig()` registry, `?service=` query support (additive; `source` deprecated then removed in 0.13.0).

**v0.11.0 — Full IPCollection + IPNft ABIs as first-class exports (2026-05-14):**
- `IPCollectionABI` (full) — exports the audited MIP-Collections-ERC721 registry surface (`create_collection`, `mint`, `archive`, `transfer_collection_ownership`, `get_collection`, `is_transferable_token`, etc.)
- `IPNftABI` (full) — exports the per-collection ERC-721 surface (`get_full_token_data`, `get_token_creator`, `get_token_registered_at`, archive, …)
- `CollectionRegistryABI` (the minimal subset for `list_user_collections` + `get_collection`) is now `@deprecated`. Existing consumers continue to work; new code should import `IPCollectionABI` instead.
- Consumed by `medialane-dapp` and `medialane-io` to eliminate duplicate local ABI files. The SDK is now the single source of truth for all MIP / Medialane Cairo ABIs.

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
- **Address normalization**: `normalizeAddress()` is called internally in all `ApiClient` methods — callers pass any valid format, SDK normalizes before sending to the backend.
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
