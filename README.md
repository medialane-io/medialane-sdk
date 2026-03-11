<img width="1260" height="640" alt="Medialane SDK" src="https://github.com/user-attachments/assets/a72bca86-bb82-42c4-8f61-9558484df5b9" />

# @medialane/sdk

**Framework-agnostic TypeScript SDK for the Medialane IP marketplace on Starknet**

The Medialane SDK provides a unified interface for interacting with the Medialane marketplace — both **on-chain operations** (create listings, make offers, fulfill orders, mint IP assets) and **REST API access** (search tokens, manage orders, upload metadata to IPFS). Built for [Medialane.io](https://medialane.io) and [Medialane.xyz](https://medialane.xyz).

---

## Features

**On-Chain Operations**
- Create listings (ERC-721 for sale)
- Make offers (bid with ERC-20)
- Fulfill orders (purchase NFTs)
- Cancel active orders
- Atomic multi-item cart checkout
- Built-in approval checking
- SNIP-12 typed data signing
- Mint IP NFTs into any collection
- Deploy new ERC-721 collections

**REST API Client**
- Query orders, tokens, collections, and activities
- Full-text search across the marketplace
- Intent-based transaction orchestration
- Upload metadata and files to IPFS (Pinata)
- Tenant portal: API keys, webhooks, usage

**IP Metadata Types**
- `IpAttribute` — typed OpenSea ERC-721 attribute
- `IpNftMetadata` — full IPFS metadata shape with licensing fields
- `ApiTokenMetadata` — indexed token metadata with all licensing attributes
- Berne Convention-compatible licensing data model

**Developer-Friendly**
- Framework-agnostic TypeScript
- Dual ESM + CJS builds
- Zod schema config validation
- Full type safety
- Peer dependency: `starknet >= 6.0.0`

---

## Installation

```bash
npm install @medialane/sdk starknet
# or
bun add @medialane/sdk starknet
# or
yarn add @medialane/sdk starknet
```

---

## Quick Start

### Initialize the Client

```typescript
import { MedialaneClient } from "@medialane/sdk";

const client = new MedialaneClient({
  network: "mainnet",                              // "mainnet" | "sepolia"
  rpcUrl: "https://rpc.starknet.lava.build", // optional; defaults to Lava
  backendUrl: "https://medialane-backend-production.up.railway.app",        // required for .api methods
  apiKey: "ml_live_...",                          // from Medialane Portal
});
```

---

## Marketplace Operations (On-Chain)

All methods require a `starknet.js` `AccountInterface`. Nonce management, SNIP-12 signing, and `waitForTransaction` are handled automatically.

### Create a Listing

```typescript
import { Account } from "starknet";

const result = await client.marketplace.createListing(account, {
  nftContract: "0x05e73b7...",
  tokenId: 42n,
  currency: "USDC",
  price: "1000000", // 1 USDC (6 decimals)
  endTime: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
});
console.log("Listed:", result.txHash);
```

### Make an Offer

```typescript
const result = await client.marketplace.makeOffer(account, {
  nftContract: "0x05e73b7...",
  tokenId: 42n,
  currency: "USDC",
  price: "500000", // 0.5 USDC
  endTime: Math.floor(Date.now() / 1000) + 86400 * 7,
});
```

### Fulfill an Order

```typescript
const result = await client.marketplace.fulfillOrder(account, {
  orderHash: "0x...",
  fulfiller: account.address,
});
```

### Cart Checkout (Multiple Items)

```typescript
const result = await client.marketplace.checkoutCart(account, [
  { orderHash: "0x...", fulfiller: account.address },
  { orderHash: "0x...", fulfiller: account.address },
]);
```

### Cancel an Order

```typescript
const result = await client.marketplace.cancelOrder(account, {
  orderHash: "0x...",
  offerer: account.address,
});
```

### Mint an IP Asset

```typescript
const result = await client.marketplace.mint(account, {
  collectionId: "1",          // collection ID on the registry
  recipient: account.address,
  tokenUri: "ipfs://...",     // IPFS URI of the metadata JSON
});
```

### Deploy a Collection

```typescript
const result = await client.marketplace.createCollection(account, {
  name: "My Creative Works",
  symbol: "MCW",
  baseUri: "",
});
```

---

## REST API

### Query Orders

```typescript
const orders = await client.api.getOrders({
  status: "ACTIVE",
  sort: "price_asc",
  currency: "0x033068...", // USDC address
  page: 1,
  limit: 20,
});

const order = await client.api.getOrder("0x...");
const tokenOrders = await client.api.getActiveOrdersForToken(contract, tokenId);
const userOrders = await client.api.getOrdersByUser(address);
```

### Query Tokens

```typescript
const token = await client.api.getToken(contract, tokenId);
const tokens = await client.api.getTokensByOwner(address);
const history = await client.api.getTokenHistory(contract, tokenId);
```

### Query Collections

```typescript
// All collections — newest first by default
const collections = await client.api.getCollections();

// With sort and pagination
const byVolume = await client.api.getCollections(1, 20, undefined, "volume");
const verified = await client.api.getCollections(1, 18, true, "recent");

// Sort options: "recent" | "supply" | "floor" | "volume" | "name"
const collection = await client.api.getCollection(contract);
const tokens = await client.api.getCollectionTokens(contract);
```

### Search

```typescript
const results = await client.api.search("landscape painting", 10);
// results.data.tokens — matching tokens
// results.data.collections — matching collections
```

### Activities

```typescript
const feed = await client.api.getActivities({ type: "sale", page: 1 });
const userFeed = await client.api.getActivitiesByAddress(address);
```

### Upload Metadata to IPFS

```typescript
// Upload a file
const fileResult = await client.api.uploadFile(imageFile);
// fileResult.data.url → "ipfs://..."

// Upload metadata JSON
const metaResult = await client.api.uploadMetadata({
  name: "My Work",
  description: "...",
  image: "ipfs://...",
  external_url: "https://medialane.io",
  attributes: [
    { trait_type: "License", value: "CC BY-NC" },
    { trait_type: "Commercial Use", value: "No" },
    // ...
  ],
});
// metaResult.data.url → "ipfs://..."
```

### Intents (Advanced)

The intent system handles the SNIP-12 signing flow for marketplace operations:

```typescript
// 1. Create intent (gets typedData to sign)
const intent = await client.api.createListingIntent({
  offerer: address,
  nftContract: "0x...",
  tokenId: "42",
  currency: "0x033068...",
  price: "1000000",
  endTime: Math.floor(Date.now() / 1000) + 86400 * 30,
});

// 2. Sign typedData
const signature = await account.signMessage(intent.data.typedData);

// 3. Submit signature
await client.api.submitIntentSignature(intent.data.id, toSignatureArray(signature));
```

Mint and collection intents are pre-signed — no signature step needed:

```typescript
const mintIntent = await client.api.createMintIntent({
  owner: ownerAddress,
  collectionId: "1",
  recipient: recipientAddress,
  tokenUri: "ipfs://...",
});
// mintIntent.data.calls → ready to execute
```

---

## IP Metadata Types

```typescript
import type { IpAttribute, IpNftMetadata, ApiTokenMetadata } from "@medialane/sdk";

// Single OpenSea ERC-721 attribute
const attr: IpAttribute = { trait_type: "License", value: "CC BY-NC-SA" };

// Full IPFS metadata shape for a Medialane IP NFT
const metadata: IpNftMetadata = {
  name: "My Track",
  description: "Original music",
  image: "ipfs://...",
  external_url: "https://medialane.io",
  attributes: [
    { trait_type: "IP Type",        value: "Music" },
    { trait_type: "License",        value: "CC BY-NC-SA" },
    { trait_type: "Commercial Use", value: "No" },
    { trait_type: "Derivatives",    value: "Share-Alike" },
    { trait_type: "Attribution",    value: "Required" },
    { trait_type: "Territory",      value: "Worldwide" },
    { trait_type: "AI Policy",      value: "Not Allowed" },
    { trait_type: "Royalty",        value: "10%" },
    { trait_type: "Standard",       value: "Berne Convention" },
    { trait_type: "Registration",   value: "2026-03-06" },
  ],
};

// Token from the API — includes indexed licensing fields for fast access
const token = await client.api.getToken(contract, tokenId);
token.data.metadata.licenseType;   // "CC BY-NC-SA"
token.data.metadata.commercialUse; // "No"
token.data.metadata.derivatives;   // "Share-Alike"
token.data.metadata.attributes;    // IpAttribute[] | null
```

---

## Supported Tokens

| Symbol | Type | Address | Decimals |
|---|---|---|---|
| USDC | Circle-native (canonical) | `0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb` | 6 |
| USDC.e | Bridged (Starkgate) | `0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8` | 6 |
| USDT | Tether | `0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8` | 6 |
| ETH | Ether | `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7` | 18 |
| STRK | Starknet native | `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` | 18 |

```typescript
import { getTokenBySymbol, getTokenByAddress, SUPPORTED_TOKENS } from "@medialane/sdk";

const usdc = getTokenBySymbol("USDC");
const token = getTokenByAddress("0x033068...");
```

---

## Utilities

```typescript
import {
  normalizeAddress,   // Pad to 64-char 0x-prefixed lowercase hex
  shortenAddress,     // → "0x1234...5678"
  parseAmount,        // Human-readable → smallest unit BigInt ("1.5", 6) → 1500000n
  formatAmount,       // Smallest unit → human-readable ("1500000", 6) → "1.5"
  stringifyBigInts,   // Recursively convert BigInt → string (for JSON)
  u256ToBigInt,       // u256 { low, high } → BigInt
} from "@medialane/sdk";
```

---

## Error Handling

```typescript
import { MedialaneError, MedialaneApiError } from "@medialane/sdk";

// On-chain errors (marketplace module)
try {
  await client.marketplace.createListing(account, params);
} catch (err) {
  if (err instanceof MedialaneError) {
    console.error("On-chain error:", err.message, err.cause);
  }
}

// REST API errors
try {
  await client.api.getOrders();
} catch (err) {
  if (err instanceof MedialaneApiError) {
    console.error(`API ${err.status}:`, err.message);
  }
}
```

---

## Configuration Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `network` | `"mainnet" \| "sepolia"` | `"mainnet"` | Starknet network |
| `rpcUrl` | `string` | Lava public endpoint | JSON-RPC URL |
| `backendUrl` | `string` | — | Medialane API base URL (required for `.api.*`) |
| `apiKey` | `string` | — | API key from [Medialane Portal](https://medialane.xyz) |
| `marketplaceContract` | `string` | Mainnet default | Marketplace contract override |
| `collectionContract` | `string` | Mainnet default | Collection registry override |

---

## Advanced: SNIP-12 Typed Data Builders

For integrations that handle signing externally (e.g. ChipiPay, Cartridge Controller):

```typescript
import {
  buildOrderTypedData,
  buildFulfillmentTypedData,
  buildCancellationTypedData,
} from "@medialane/sdk";

const typedData = buildOrderTypedData(orderParams, chainId);
const signature = await account.signMessage(typedData);
await client.api.submitIntentSignature(intentId, signatureArray);
```

---

## Development

```bash
bun run build      # Compile to dist/ (ESM + CJS dual output)
bun run dev        # Watch mode
bun run typecheck  # tsc --noEmit
```

Built with:
- **tsup** — dual ESM/CJS bundling
- **TypeScript** — full type safety
- **Zod** — runtime config validation
- Peer dep: `starknet >= 6.0.0`

---

## Changelog

### v0.3.3
- `getCollections(page?, limit?, isKnown?, sort?)` — added `sort` parameter: `"recent"` (default) | `"supply"` | `"floor"` | `"volume"` | `"name"`
- Default sort changed from `totalSupply DESC` to `createdAt DESC` (newest first) — matches backend default

### v0.3.1
- `ApiCollection.collectionId: string | null` — on-chain registry numeric ID (decimal string). Required for `createMintIntent`. Populated for collections indexed after 2026-03-09.

### v0.3.0
- `normalizeAddress()` now applied internally before all API calls — callers no longer need to normalize Starknet addresses before passing them to SDK methods
- `getCollectionsByOwner(owner)` — fetch collections by wallet address via API

### v0.2.8
- `ApiCollection.owner: string | null`
- `ApiClient.getCollectionsByOwner(owner)`

### v0.2.6
- `ApiOrder.token: ApiOrderTokenMeta | null` — token name/image/description on orders (batchTokenMeta)

### v0.2.0
- `IpAttribute` and `IpNftMetadata` interfaces for IP metadata
- `ApiTokenMetadata.attributes` typed as `IpAttribute[] | null` (was `unknown`)
- `ApiTokenMetadata` extended with `derivatives`, `attribution`, `territory`, `aiPolicy`, `royalty`, `registration`, `standard`
- Added `USDC.e` (bridged USDC via Starkgate) to `SUPPORTED_TOKENS`

### v0.1.0
- Initial release — orders, tokens, collections, activities, intents, metadata, portal

---

## Links

- **Marketplace**: [medialane.io](https://medialane.io)
- **Developer Portal**: [medialane.xyz](https://medialane.xyz)
- **npm**: [npmjs.com/package/@medialane/sdk](https://www.npmjs.com/package/@medialane/sdk)
- **GitHub**: [github.com/medialane-io](https://github.com/medialane-io)

---

## License

[MIT](LICENSE)
