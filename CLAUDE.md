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
  "version": "0.1.0",
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
  types/
    api.ts           ← API response types (ApiOrder, ApiToken, etc.)
    index.ts
    marketplace.ts   ← on-chain param types
  utils/
    address.ts       ← normalizeAddress()
    bigint.ts        ← stringifyBigInts()
    token.ts         ← parseAmount(), formatAmount()
```

---

## MedialaneClient

```ts
import { MedialaneClient } from "@medialane/sdk"

const client = new MedialaneClient({
  network: "mainnet",              // "mainnet" | "sepolia" (default: "mainnet")
  rpcUrl: "https://...",           // optional; defaults to BlastAPI public endpoint
  backendUrl: "https://api.medialane.xyz",  // optional; required to use .api
  apiKey: "ml_live_...",           // optional; sent as x-api-key on all API calls
  marketplaceContract: "0x059de...", // optional; defaults to mainnet contract
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
client.api.getCollections(page?, limit?)
client.api.getCollection(contract)
client.api.getCollectionTokens(contract, page?, limit?)
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
client.api.createListingIntent(params)   // { nftContract, tokenId, currency, price, offerer, endTime, salt? }
client.api.createOfferIntent(params)     // same params as listing
client.api.createFulfillIntent(params)   // { fulfiller, orderHash }
client.api.createCancelIntent(params)    // { offerer, orderHash }
client.api.getIntent(id)
client.api.submitIntentSignature(id, signature)  // signature: string[]
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

---

## Constants (`src/constants.ts`)

```ts
MARKETPLACE_CONTRACT_MAINNET = "0x059deafbbafbf7051c315cf75a94b03c5547892bc0c6dfa36d7ac7290d4cc33a"
COLLECTION_CONTRACT_MAINNET  = "0x05e73b7be06d82beeb390a0e0d655f2c9e7cf519658e04f05d9c690ccc41da03"
INDEXER_START_BLOCK_MAINNET  = 6204232

DEFAULT_RPC_URLS = {
  mainnet: "https://starknet-mainnet.public.blastapi.io",
  sepolia: "https://starknet-sepolia.public.blastapi.io",
}
```

**SUPPORTED_TOKENS** (4 tokens in SDK — backend has 5, native USDC missing here):

| Symbol | Address | Decimals |
|---|---|---|
| USDC (bridged) | `0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8` | 6 |
| USDT | `0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8` | 6 |
| ETH | `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7` | 18 |
| STRK | `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` | 18 |

> Native USDC (`0x033068f6...`) exists in the backend but is missing from the SDK's `SUPPORTED_TOKENS`. If adding support, add it here too.

---

## Key Conventions

- **Runtime**: Bun. `~/.bun/bin/bun`, never `node`/`npm`/`npx`.
- **Imports**: Use `.js` extension (ESM resolution via tsup).
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
