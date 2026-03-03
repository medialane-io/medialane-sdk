<img width="1260" height="640" alt="image" src="https://github.com/user-attachments/assets/a72bca86-bb82-42c4-8f61-9558484df5b9" />

# Medialane SDK

The Medialane SDK provides a unified interface for interacting with the Medialane marketplace, offering both **on-chain operations** (create listings, make offers, fulfill orders) and **REST API access** (search tokens, manage orders, upload metadata).

Framework-agnostic TypeScript SDK for [Medialane.xyz](https://medialane.xyz) portal for tokenization and monetization services and [Medialane.io](https://medialane.io) NFT marketplace.

## Features

✨ **On-Chain Operations**
- Create listings (ERC-721 for sale)
- Make offers (bid with ERC-20)
- Fulfill orders (purchase NFTs)
- Cancel active orders
- Atomic multi-item checkout
- Built-in approval checking
- SNIP-12 typed data signing

🌐 **REST API**
- Query orders, tokens, and collections
- Search across the marketplace
- Stream activities and transactions
- Manage API keys and webhooks (authenticated)
- Upload metadata to IPFS

🔧 **Developer-Friendly**
- Framework-agnostic TypeScript
- Dual ESM/CJS builds
- Zod schema validation
- Full type safety
- Zero runtime dependencies (except Zod)
- Peer dependency: `starknet >= 6.0.0`

## Installation

```bash
npm install @medialane/sdk starknet
# or
yarn add @medialane/sdk starknet
# or
bun add @medialane/sdk starknet
```

The SDK requires `starknet >= 6.0.0` as a peer dependency for on-chain operations.

## Quick Start

### Initialize the Client

```typescript
import { MedialaneClient } from "@medialane/sdk";

const client = new MedialaneClient({
  network: "mainnet",                              // "mainnet" | "sepolia"
  rpcUrl: "https://starknet-mainnet.public.blastapi.io", // optional; auto-configured if omitted
  backendUrl: "https://api.medialane.xyz",        // optional; required for .api methods
  apiKey: "ml_live_...",                          // optional; enables authenticated API routes
});
```

### Query the Marketplace (REST API)

```typescript
// Get active listings
const orders = await client.api.getOrders({
  status: "active",
  sort: "newest",
  page: 1,
  limit: 20,
});

// Search for a specific token
const search = await client.api.search("vintage-nft", 10);

// Get activities
const activities = await client.api.getActivities({ 
  type: "sale", 
  page: 1 
});
```

### Create a Listing (On-Chain)

```typescript
import { Account } from "starknet";

const account: Account = /* your starknet.js Account */;

const result = await client.marketplace.createListing(account, {
  nftContract: "0x05e73b7be06d82beeb390a0e0d655f2c9e7cf519658e04f05d9c690ccc41da03",
  tokenId: 42n,
  currency: "USDC", // one of: "USDC", "USDT", "ETH", "STRK"
  price: "1000000", // 1 USDC (6 decimals)
  endTime: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
});

console.log("Listing created:", result.txHash);
```

### Make an Offer

```typescript
const result = await client.marketplace.makeOffer(account, {
  nftContract: "0x05e73b7be06d82beeb390a0e0d655f2c9e7cf519658e04f05d9c690ccc41da03",
  tokenId: 42n,
  currency: "USDC",
  price: "500000", // 0.5 USDC
  endTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
});

console.log("Offer created:", result.txHash);
```

### Fulfill an Order

```typescript
const result = await client.marketplace.fulfillOrder(account, {
  orderHash: "0x...",
  fulfiller: "0x...", // your address
});

console.log("Order fulfilled:", result.txHash);
```

### Checkout Multiple Items

```typescript
const result = await client.marketplace.checkoutCart(account, [
  {
    orderHash: "0x...",
    fulfiller: "0x...",
  },
  {
    orderHash: "0x...",
    fulfiller: "0x...",
  },
]);

console.log("Cart checked out:", result.txHash);
```

## Configuration

The `MedialaneClient` constructor accepts a `MedialaneConfig` object with the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `network` | `"mainnet" \| "sepolia"` | `"mainnet"` | Starknet network |
| `rpcUrl` | `string` | BlastAPI endpoint | JSON-RPC URL for the network |
| `backendUrl` | `string` | *(required for `.api` calls)* | Medialane backend API base URL |
| `apiKey` | `string` | - | API key for authenticated routes (obtained from Medialane Portal) |
| `marketplaceContract` | `string` | Network-specific default | Marketplace contract address |

**Note:** If `backendUrl` is not provided, calling any `.api.*` method will throw an error with instructions to configure it.

## API Reference

### Marketplace Module

All methods require a `starknet.js` `AccountInterface`. They handle nonce management, SNIP-12 signing, and transaction waiting automatically.

#### Write Operations

| Method | Description |
|--------|-------------|
| `createListing(account, params)` | List an ERC-721 for sale. Auto-checks approval; includes approve call if needed. |
| `makeOffer(account, params)` | Bid on an ERC-721 with ERC-20. Includes token approval + order registration. |
| `fulfillOrder(account, params)` | Purchase a listed NFT. Fetches nonce and signs fulfillment typed data. |
| `cancelOrder(account, params)` | Cancel an active order. Fetches nonce and signs cancellation typed data. |
| `checkoutCart(account, items)` | Atomic multicall for multiple purchases. One approve per unique token, sequential nonces. |

#### View Operations

| Method | Description |
|--------|-------------|
| `getOrderDetails(orderHash)` | Fetch order details from the contract. |
| `getNonce(address)` | Get the current nonce for an address. |

### REST API Client

The `client.api` object provides access to all backend endpoints. All methods throw `MedialaneApiError` on non-2xx responses.

#### Orders

```typescript
client.api.getOrders(query?)              // List all orders with optional filters
client.api.getOrder(orderHash)            // Get a specific order
client.api.getActiveOrdersForToken(...)   // Get active orders for a token
client.api.getOrdersByUser(address, ...)  // Get orders by user
```

#### Tokens

```typescript
client.api.getToken(contract, tokenId, wait?)   // Get token metadata
client.api.getTokensByOwner(address, ...)       // Get tokens owned by address
client.api.getTokenHistory(contract, tokenId)   // Get token transaction history
```

#### Collections

```typescript
client.api.getCollections(page?, limit?)       // List all collections
client.api.getCollection(contract)             // Get collection details
client.api.getCollectionTokens(contract, ...)  // Get tokens in collection
```

#### Activities

```typescript
client.api.getActivities(query?)               // Get marketplace activities
client.api.getActivitiesByAddress(address)    // Get activities by user
```

#### Search

```typescript
client.api.search(query, limit?)               // Search tokens and collections
```

#### Intents (Advanced)

```typescript
client.api.createListingIntent(params)         // Create listing intent
client.api.createOfferIntent(params)           // Create offer intent
client.api.createFulfillIntent(params)         // Create fulfill intent
client.api.createCancelIntent(params)          // Create cancel intent
client.api.submitIntentSignature(id, sig)     // Submit signature for intent
```

#### Metadata (IPFS)

```typescript
client.api.uploadMetadata(metadata)            // Upload JSON to IPFS
client.api.uploadFile(file)                    // Upload file to IPFS
client.api.resolveMetadata(uri)                // Resolve ipfs://, data:, https://
client.api.getMetadataSignedUrl()              // Get presigned Pinata URL
```

#### Portal (Self-Service)

```typescript
client.api.getMe()                             // Get current user info
client.api.getApiKeys()                        // List API keys
client.api.createApiKey(label?)                // Create new API key
client.api.deleteApiKey(id)                    // Revoke API key
client.api.getUsage()                          // Get 30-day request usage
```

## Error Handling

The SDK throws two main error types:

```typescript
import { MedialaneError, MedialaneApiError } from "@medialane/sdk";

// On-chain errors
try {
  await client.marketplace.createListing(account, params);
} catch (error) {
  if (error instanceof MedialaneError) {
    console.error("On-chain error:", error.message);
  }
}

// REST API errors
try {
  await client.api.getOrders();
} catch (error) {
  if (error instanceof MedialaneApiError) {
    console.error(`API error ${error.status}:`, error.message);
  }
}
```

## Supported Tokens

The following tokens are supported for on-chain operations:

| Symbol | Address | Decimals |
|--------|---------|----------|
| USDC | `0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8` | 6 |
| USDT | `0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8` | 6 |
| ETH | `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7` | 18 |
| STRK | `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` | 18 |

Use the token symbol (e.g., `"USDC"`) in SDK methods, or access token details via:

```typescript
import { getTokenBySymbol, getTokenByAddress } from "@medialane/sdk";

const usdc = getTokenBySymbol("USDC");
const token = getTokenByAddress("0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8");

console.log(usdc.decimals, token.address);
```

## Utilities

Helper functions for common tasks:

```typescript
import {
  normalizeAddress,      // Normalize address to 0x-prefixed lowercase
  shortenAddress,        // Shorten to 0x1234...5678 format
  parseAmount,           // Convert human-readable amount to smallest unit (BigInt)
  formatAmount,          // Convert smallest unit (BigInt) to human-readable string
  stringifyBigInts,      // Recursively convert BigInts to strings for JSON serialization
} from "@medialane/sdk";

// Address utilities
const addr = normalizeAddress("0x123ABC");
const short = shortenAddress("0x123abc456def789012345678901234567890");

// Token amounts
const amountWei = parseAmount("1.5", 6); // "1500000" (USDC)
const readable = formatAmount("1500000", 6); // "1.5"
```

## Advanced Usage

### Custom RPC Provider

```typescript
import { RpcProvider } from "starknet";

const customProvider = new RpcProvider({
  nodeUrl: "https://your-custom-rpc.com",
});

const client = new MedialaneClient({
  network: "mainnet",
  rpcUrl: "https://your-custom-rpc.com",
});
```

### Signing Typed Data (for integrations)

For advanced integrations like ChipiPay, you can access the SNIP-12 typed data builders directly:

```typescript
import {
  buildOrderTypedData,
  buildFulfillmentTypedData,
  buildCancellationTypedData,
} from "@medialane/sdk";

const typedData = buildOrderTypedData(orderParams, chainId);
const signature = await account.signMessage(typedData);

// Signature can then be submitted via API intents
await client.api.submitIntentSignature(intentId, signature);
```

## Development

Build and type-check the SDK:

```bash
bun run build      # Compile to dist/ (ESM + CJS)
bun run dev        # Watch mode
bun run typecheck  # Type check only (no emit)
```

The SDK uses:
- **tsup** for dual ESM/CJS bundling
- **TypeScript** for type safety
- **Zod** for runtime config validation

## License

[MIT](LICENSE)

## Support

- **Services App**: [medialane.xyz](https://medialane.xyz)
- **Documentation**: [medialane.xyz/docs](https://medialane.xyz/docs)
- **Issues**: [GitHub Issues](https://github.com/medialane-io/sdk/issues)
- **Medialane Github**: [GitHub Issues](https://github.com/medialane-io)
