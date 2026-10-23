<img width="1260" height="640" alt="Medialane SDK" src="https://github.com/user-attachments/assets/a72bca86-bb82-42c4-8f61-9558484df5b9" />

# @medialane/sdk

**Build on Medialane: the open rails for creators, collectors and creator capital markets.**

Everything the Medialane apps can do, your app or AI agent can do too. The SDK covers both **onchain operations** (list, offer, buy, cancel, mint and deploy collections) and the **Medialane API** (assets, collections, orders, activity, search, creator profiles and metadata uploads). It is the same SDK that powers [medialane.io](https://medialane.io), [starknet.medialane.io](https://starknet.medialane.io) and [portal.medialane.io](https://portal.medialane.io).

Framework-agnostic TypeScript, designed for many chains, live today on Starknet mainnet.

---

## Features

**On-Chain Operations**
- Create listings (ERC-721 / ERC-1155 for sale)
- Make offers (bid with ERC-20)
- Fulfill orders (purchase NFTs)
- Cancel active orders
- Atomic multi-item cart checkout
- Built-in approval checking
- SNIP-12 typed data signing
- Mint IP NFTs into any collection
- Deploy new ERC-721 or ERC-1155 collections

**REST API Client**
- Query orders, tokens, collections, and activities
- Full-text search across the marketplace
- Intent-based transaction orchestration
- Upload metadata and files to IPFS
- ERC-1155 multi-holder ownership via `token.balances`

**IP Metadata Types**
- `IpAttribute`: typed OpenSea ERC-721 attribute
- `IpNftMetadata`: full IPFS metadata shape with licensing fields
- `ApiTokenMetadata`: indexed token metadata with all licensing attributes
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
import { MedialaneClient } from "@medialane/sdk/starknet";

const client = new MedialaneClient({
  chain: "STARKNET",                                                          // chain-scoped (default "STARKNET"); replaces `network` (v0.37.0)
  backendUrl: "https://api.medialane.io",                                     // required for .api methods
  apiKey: "ml_live_...",                                                       // from Medialane Portal
});
```

---

## Onchain actions

Every onchain action (list, offer, buy, cancel, checkout, mint, deploy a collection, launch a coin, sponsor) follows the same flow. You ask the API for an **intent**, sign it if it needs a signature, and execute the resulting calls from the user's own account. Nothing is ever signed or sent on the user's behalf.

```typescript
import { executeIntent } from "@medialane/sdk/starknet";
import { RpcProvider, Account, stark } from "starknet";

const provider = new RpcProvider({ nodeUrl: "https://..." });
const account: Account = /* the user's account */;

const signer = {
  address: account.address,
  signTypedData: async (data) => stark.formatSignature(await account.signMessage(data)),
  execute: async (calls) => ({ txHash: (await account.execute(calls)).transaction_hash }),
};

const intent = await client.api.intents.create("listing", {
  offerer: account.address,
  nftContract: "0x...",
  tokenId: "42",
  currency: "0x033068...",            // USDC
  price: "1000000",                   // 1 USDC, in the token's smallest unit
  endTime: Math.floor(Date.now() / 1000) + 86400 * 30,
});

const { txHash } = await executeIntent(signer, client, intent);
```

The same call takes every other kind: `"offer"`, `"fulfill"`, `"cancel"`, `"mint"`, `"create-collection"`, `"create-coin"`, the sponsorship kinds and the rest of `INTENT_KINDS` from `@medialane/sdk/contract`. The params are typed by kind. `client.api.intents.checkout(...)` prepares several purchases at once.

### Calls without the backend

The calls each Launchpad service sends are plain functions that return `Call` values, so any account or agent can run them directly, with no backend in between:

| Builder | What it builds |
|---|---|
| `popCalls`, `popFactoryCalls` | Proof of participation badges: create, claim, issue, burn |
| `dropCalls`, `buildDropClaimCalls` | Timed collection drops, including the priced claim with the platform fee |
| `editionCalls` | Limited editions collections |
| `buildCreateCreatorCoinCall`, `buildLaunchOnEkuboCalls` | Creator coins with a public trading pool |
| `ticketCalls` | IP Tickets |
| `clubCalls` | IP Club memberships |
| `sponsorshipCalls` | IP Sponsorship |

```typescript
import { ticketCalls, getStarknetCoordinates } from "@medialane/sdk/starknet";

const call = ticketCalls.deployCollection(getStarknetCoordinates("STARKNET").ipTicketsFactory, {
  name: "Launch party", symbol: "LP", baseUri: "ipfs://...",
});
await account.execute([call]);
```

---

## REST API

`client.api` is grouped by domain: `orders`, `tokens`, `collections`, `activity`, `search`, `intents`, `metadata`, `creators`, `account`, `portal` (with `portal.funding`), `business`, `remix`, `coins`, `drops`, `sponsorship`, `rewards`, `platform` and `chainReads`.

The domain methods follow one set of rules:

- A single resource comes back as the resource itself. A list comes back as `{ data, meta }`, with `meta` carrying the page.
- `get` throws `MedialaneApiError` when the resource is missing. `find` returns `null`.
- Authentication belongs to the client, not to each call: `client.api.withBearer(token)` returns a client that sends `Authorization: Bearer <token>` (a function is read on every request).
- Every intent goes through one call, typed by kind: `client.api.intents.create("listing", params)`. The kinds, and the path each one posts to, are `INTENT_KINDS` and `intentPath` in `@medialane/sdk/contract`.

```typescript
const page = await client.api.orders.list({ status: "ACTIVE" });
const order = await client.api.orders.get("0x...");
const drop = await client.api.drops.find(contract);

const account = client.api.withBearer(siwsToken);
await account.creators.updateProfile(address, { displayName: "Ada" });

const intent = await client.api.intents.create("pop-claim", { claimer, collection, proof });
```

`ApiClient` takes an options object: `new ApiClient({ baseUrl, apiKey, bearer, retry, chain, fetch })`.

### Query Orders

```typescript
const orders = await client.api.orders.list({
  status: "ACTIVE",
  sort: "price_asc",
  currency: "0x033068...", // USDC address
  page: 1,
  limit: 20,
});

const order = await client.api.orders.get("0x...");
const tokenOrders = await client.api.orders.forToken(contract, tokenId);
const userOrders = await client.api.orders.byUser(address);
```

### Query Tokens

```typescript
const token = await client.api.tokens.get(contract, tokenId);
const tokens = await client.api.tokens.ownedBy(address);
const history = await client.api.tokens.history(contract, tokenId);
```

### ERC-1155 Ownership

For ERC-1155 tokens, a single token ID can be held by many wallets simultaneously; read ownership from `token.balances`:

```typescript
import type { ApiTokenBalance } from "@medialane/sdk";

const token = await client.api.tokens.get(contract, tokenId);

// Check if a wallet owns any quantity of this token
const isOwner = token.balances?.some(
  (b: ApiTokenBalance) => b.owner.toLowerCase() === wallet.toLowerCase() && BigInt(b.amount) > 0n
) ?? (token.owner?.toLowerCase() === wallet.toLowerCase());

// How many copies does a wallet hold?
const balance = token.balances?.find((b) => b.owner.toLowerCase() === wallet.toLowerCase());
console.log(`${wallet} holds ${balance?.amount ?? "0"} copies`);

// All current holders
token.balances?.forEach((b: ApiTokenBalance) => {
  console.log(`${b.owner}: ${b.amount}`);
});
```

`token.owner` is deprecated and always `null` post-migration. `token.balances` is only populated on single-token fetches (`getToken`): it is `null` on list responses.

### Query Collections

```typescript
// All collections: newest first by default
const collections = await client.api.collections.list();

// Filter, sort and paginate in one query
const byVolume = await client.api.collections.list({ page: 1, limit: 20, sort: "volume" });
const featured = await client.api.collections.list({ limit: 18, isFeatured: true, sort: "recent" });
const myDrops = await client.api.drops.list({ organizer: "0x..." });

// Sort options: "recent" | "supply" | "floor" | "volume" | "name"
const collection = await client.api.collections.get(contract);
const tokens = await client.api.collections.tokens(contract);
```

### Search

```typescript
const results = await client.api.search("landscape painting", 10);
// results.data.tokens: matching tokens
// results.data.collections: matching collections
// results.data.creators: matching creator profiles (v0.4.5)
```

### Activities

```typescript
const feed = await client.api.activity.list({ type: "sale", page: 1 });
const userFeed = await client.api.activity.byAddress(address);
```

### Upload Metadata to IPFS

```typescript
// Upload a file
const fileResult = await client.api.metadata.uploadFile(imageFile);
// fileResult.data.url → "ipfs://..."

// Upload metadata JSON
const metaResult = await client.api.metadata.upload({
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
    { trait_type: "IP Type",        value: "Audio" },
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

// Token from the API: includes indexed licensing fields for fast access
const token = await client.api.tokens.get(contract, tokenId);
token.metadata.licenseType;   // "CC BY-NC-SA"
token.metadata.commercialUse; // "No"
token.metadata.derivatives;   // "Share-Alike"
token.metadata.attributes;    // IpAttribute[] | null
```

---

## Supported Tokens

| Symbol | Address | Decimals | Listable |
|--------|---------|----------|----------|
| USDC | `0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb` | 6 | ✓ |
| USDT | `0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8` | 6 | ✓ |
| ETH | `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7` | 18 | ✓ |
| STRK | `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` | 18 | ✓ |
| WBTC | `0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac` | 8 | ✓ |

```typescript
import { getTokenBySymbol, getTokenByAddress, getListableTokens, SUPPORTED_TOKENS } from "@medialane/sdk";

const usdc = getTokenBySymbol("USDC");
const token = getTokenByAddress("0x033068...");
```

---

## Utilities

```typescript
import {
  normalizeAddress,    // (chain, address) → canonical form per chain (Starknet pad / EVM EIP-55 / Solana base58)
  shortenAddress,      // (chain, address) → "0x1234...5678"
  getCoordinates,      // (chain) → that chain's service coordinates from the registry
  CHAINS,              // readonly ["STARKNET","ETHEREUM","SOLANA","BASE","BITCOIN"]
  type Chain,
  parseAmount,         // Human-readable → smallest unit BigInt ("1.5", 6) → 1500000n
  formatAmount,        // Smallest unit → human-readable ("1500000", 6) → "1.5"
  stringifyBigInts,    // Recursively convert BigInt → string (for JSON)
  u256ToBigInt,        // u256 { low, high } → BigInt
  getListableTokens,   // ReadonlyArray<SupportedToken> filtered to listable: true (for dialogs)
} from "@medialane/sdk";
```

---

## Error Handling

```typescript
import { MedialaneApiError } from "@medialane/sdk";
import { MedialaneError, executeIntent } from "@medialane/sdk/starknet";

// Onchain errors
try {
  await executeIntent(signer, client, intent);
} catch (err) {
  if (err instanceof MedialaneError) {
    console.error("On-chain error:", err.message, err.cause);
  }
}

// REST API errors
try {
  await client.api.orders.list();
} catch (err) {
  if (err instanceof MedialaneApiError) {
    console.error(`API ${err.status} ${err.code}:`, err.message, err.serverCode);
  }
}
```

`MedialaneApiError` extends `MedialaneError`, so one `instanceof MedialaneError` check covers both. `err.code` comes from the status (a 404 names the resource: `ORDER_NOT_FOUND`, `TOKEN_NOT_FOUND`, `COLLECTION_NOT_FOUND`, `INTENT_NOT_FOUND`, otherwise `NOT_FOUND`). `err.serverCode` is the machine code the API put in the response body, when it sent one.

### Showing an error to a user

Three types carry text written for someone to read. Everything else is machinery, and the
message belongs to whatever your screen was trying to do.

| Type | What it means | Show |
|---|---|---|
| `MedialaneApiError` | The API refused the request | `err.message`, which is the reason the API gave or a plain statement of the status |
| `UserFacingError` | The SDK got partway and stopped, for example a transaction that reverted | `err.message` |
| `PasskeyCancelledError` | The prompt was dismissed | Nothing was submitted, so avoid wording it as a failure |
| `PasskeyUnsupportedError` | `err.reason`: `"no-webauthn"` or `"no-prf"` | Your own wording |

```typescript
import { MedialaneApiError, PasskeyCancelledError, UserFacingError } from "@medialane/sdk";

function describe(err: unknown, fallback: string): string {
  if (err instanceof PasskeyCancelledError) return "Request not completed. Nothing was submitted.";
  if (err instanceof UserFacingError) return err.message;
  if (err instanceof MedialaneApiError) return err.message;
  return fallback;
}

catch (err) {
  console.error(err);
  setError(describe(err, "We couldn't create that listing. Please try again."));
}
```

The fallback matters. An error carrying none of those types says nothing a reader can act on,
and its text is as likely to be a gateway response as a sentence. Your call site knows which
action was attempted, so that is the message worth showing.

A response body that is not ours stays in `err.details`, where it is available while debugging
without reaching a reader.

---

## Configuration Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `chain` | `Chain` (`"STARKNET" \| "ETHEREUM" \| "SOLANA" \| "BASE" \| "BITCOIN"`) | `"STARKNET"` | The chain this client is scoped to. Coordinates resolve from the `coordinates[chain]` registry (`chains.ts`). Replaces `network` (v0.37.0). |
| `backendUrl` | `string` | (none) | Medialane API base URL (required for `.api.*`) |
| `apiKey` | `string` | (none) | API key from [Medialane Portal](https://portal.medialane.io) |
| `marketplace721Contract` | `string` | Mainnet default | ERC-721 marketplace protocol override |
| `marketplace1155Contract` | `string` | Mainnet default | ERC-1155 marketplace protocol override |
| `collection721Contract` | `string` | Mainnet default | ERC-721 mint / collection registry override |
| `collection1155Contract` | `string` | Mainnet default | ERC-1155 mint / collection factory override |

---

## Advanced: SNIP-12 Typed Data Builders

For integrations that build and sign marketplace orders themselves:

```typescript
import {
  buildOrderTypedData,
  buildCancellationTypedData,
  build1155OrderTypedData,
  build1155CancellationTypedData,
} from "@medialane/sdk/starknet";
```

---

## Development

```bash
bun run build      # Compile to dist/ (ESM + CJS dual output)
bun run dev        # Watch mode
bun run typecheck  # tsc --noEmit
```

Built with:
- **tsup**: dual ESM/CJS bundling
- **TypeScript**: full type safety
- **Zod**: runtime config validation
- Peer dep: `starknet >= 6.0.0`

`bun run typecheck` checks the sources and the test files.

### Entry points

| Import | Contents | Loads a chain library |
|---|---|---|
| `@medialane/sdk` | client, config, registry, routes, uploads, types | no |
| `@medialane/sdk/contract` | request and response schemas shared with the API | no |
| `@medialane/sdk/server` | gateway, image proxy, SSRF guard, session tokens | no |
| `@medialane/sdk/starknet` | call builders, signing, readers, ABIs, services | `starknet` |
| `@medialane/sdk/wallet` | passkey, media wallet, deployment, signers | `starknet` |
| `@medialane/sdk/evm`, `/solana`, `/stellar` | venue and issuance adapters | `viem`, `@solana/web3.js`, `@stellar/stellar-sdk` |

The server exports are still re-exported from `@medialane/sdk`, and the wallet exports from `@medialane/sdk/starknet`.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

---

## Links

- **Medialane**: [medialane.io](https://medialane.io)
- **Docs**: [docs.medialane.io/dev](https://docs.medialane.io/dev)
- **Starknet App**: [starknet.medialane.io](https://starknet.medialane.io)
- **Developer Portal**: [portal.medialane.io](https://portal.medialane.io)
- **npm**: [npmjs.com/package/@medialane/sdk](https://www.npmjs.com/package/@medialane/sdk)
- **GitHub**: [github.com/medialane-io](https://github.com/medialane-io)

---

## License

[MIT](LICENSE)
