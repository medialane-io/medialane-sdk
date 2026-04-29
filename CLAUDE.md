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
  "version": "0.8.0",
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
  constants.ts       ← contract addresses, SUPPORTED_TOKENS, DEFAULT_RPC_URLS
  abis.ts            ← IPMarketplaceABI (fetched 2026-02-16)
  index.ts           ← public re-exports
  api/
    client.ts        ← ApiClient class (all REST methods)
  marketplace/
    index.ts         ← MarketplaceModule (wraps orders.ts functions)
    orders.ts        ← createListing, makeOffer, fulfillOrder, cancelOrder, checkoutCart
    signing.ts       ← SNIP-12 typed data builders
  services/
    pop.ts           ← PopService (POP Protocol on-chain interactions)
    drop.ts          ← DropService (Collection Drop on-chain interactions)
  types/
    api.ts           ← API response types (ApiOrder, ApiToken, etc.)
    index.ts
    marketplace.ts   ← on-chain param types
  utils/
    address.ts       ← normalizeAddress()
    bigint.ts        ← stringifyBigInts()
    token.ts         ← parseAmount(), formatAmount(), getListableTokens()
```

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
| `fulfillOrder(account, params)` | Buy a listed NFT. Fetches nonce, signs fulfillment typed data |
| `cancelOrder(account, params)` | Cancel active order. Fetches nonce, signs cancellation typed data |
| `checkoutCart(account, items)` | Atomic multicall: one ERC-20 approve per token (summed), sequential nonce per fulfill |
| `mint(account, params)` | Mint NFT into a collection. Calls `mint(collection_id, recipient, token_uri)` on collection registry. No SNIP-12. params: `{ collectionId, recipient, tokenUri, collectionContract? }` |
| `createCollection(account, params)` | Register new collection. Calls `create_collection(name, symbol, base_uri)`. No SNIP-12. **Owner = the executing `account` (implicit caller).** params: `{ name, symbol, baseUri, collectionContract? }` |
| `getOrderDetails(orderHash)` | View call: `get_order_details(order_hash)` → `OrderDetails` |
| `getNonce(address)` | View call: `nonces(owner)` → `bigint` |

All write methods: fetch nonce → build typed data → `account.signMessage()` → execute calls → `waitForTransaction()` → `TxResult { txHash }`.

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
client.api.getCollections(page?, limit?, isKnown?, sort?)
// sort: "recent" (default) | "supply" | "floor" | "volume" | "name"
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

On-chain ERC-1155 marketplace operations against the Medialane1155V2 contract (`0x02bfa521c25461a09d735889b469418608d7d92f8b26e3d37ef174a4c2e22f99`). All require a starknet.js `AccountInterface`.

| Method | Description |
|---|---|
| `createListing(account, params)` | Signs `OrderParameters` (SNIP-12) + calls `register_order`. Auto-grants `set_approval_for_all` if needed. |
| `fulfillOrder(account, params)` | Signs `OrderFulfillment`, approves ERC-20 payment, calls `fulfill_order`. |
| `cancelOrder(account, params)` | Signs `OrderCancellation`, calls `cancel_order`. |
| `buildListingTypedData(params, chainId)` | Returns SNIP-12 typed data (for ChipiPay/custom flows). |
| `buildFulfillmentTypedData(params, chainId)` | Returns SNIP-12 fulfillment typed data. |
| `buildCancellationTypedData(params, chainId)` | Returns SNIP-12 cancellation typed data. |

SNIP-12 domain: `{ name: "Medialane", version: "2", revision: "1" }`. V2 uses nested `OfferItem` and `ConsiderationItem` order data, matching the ERC-721 protocol shape while preserving ERC-1155 quantities.

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
MARKETPLACE_CONTRACT_MAINNET              = "0x00f8ccaae0bc811c79605974cc1dab769b9cea8877f033f8e3c17f30457caba6"  // ERC-721 current
MARKETPLACE_1155_CONTRACT_MAINNET         = "0x02bfa521c25461a09d735889b469418608d7d92f8b26e3d37ef174a4c2e22f99"  // ERC-1155 current
COLLECTION_CONTRACT_MAINNET               = "0x05c49ee5d3208a2c2e150fdd0c247d1195ed9ab54fa2d5dea7a633f39e4b205b"  // v2
ERC1155_FACTORY_CONTRACT_MAINNET          = "0x006b2dc7ca7c4f466bb4575ba043d934310f052074f849caf853a86bcb819fd6"
ERC1155_COLLECTION_CLASS_HASH_MAINNET     = (see src/constants.ts)
POP_FACTORY_CONTRACT_MAINNET              = "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111"
POP_COLLECTION_CLASS_HASH_MAINNET         = "0x077c421686f10851872561953ea16898d933364b7f8937a5d7e2b1ba0a36263f"
DROP_FACTORY_CONTRACT_MAINNET             = "0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800"
DROP_COLLECTION_CLASS_HASH_MAINNET        = "0x00092e72cdb63067521e803aaf7d4101c3e3ce026ae6bc045ec4228027e58282"
INDEXER_START_BLOCK_MAINNET               = 9130000

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

Three typed data builders used before `account.signMessage()`:

- `buildOrderTypedData(orderParams, chainId)` — listing or offer
- `buildFulfillmentTypedData({ order_hash, fulfiller, nonce }, chainId)` — fulfill
- `buildCancellationTypedData({ order_hash, offerer, nonce }, chainId)` — cancel

Domain: `{ name: "Medialane", version: "1", revision: "1", chainId }`
All results pass through `stringifyBigInts()` before being cast to starknet.js `TypedData`.
