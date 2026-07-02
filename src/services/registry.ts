import type { ServiceDefinition, ServiceCapability } from "../types/api.js";
import { getCoordinates } from "../chains.js";

// The registry re-projects a service's chain coordinates into the generic
// `onchain` shape (factoryAddress/classHash/startBlock). Single source = the
// chain registry. Only STARKNET is populated today.
const SN = getCoordinates("STARKNET");

/**
 * The Medialane service registry (05-service-model §II, §VI).
 * Canonical long-form IDs (01-core-model §III). SDK-resident in v1;
 * on-chain registry later (08-dao-governance §IV).
 *
 * `onchain` is keyed per chain (spec 2026-06-13 §3.1, Decision A): the SDK
 * registry is the single source of a service's coordinates on each chain.
 * Only STARKNET is populated today; adding a chain adds a key here.
 *
 * Phase 2B.2 of the service-model refactor. `ip-erc721` has no dedicated
 * on-chain constant in src/constants.ts, so its `onchain` is omitted rather
 * than invented (the genesis contract address ships with that service).
 */
const SERVICES = {
  "mip-erc721": {
    id: "mip-erc721",
    displayName: "IP Collection",
    description: "Tokenize intellectual property as a per-creator ERC-721 collection.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      STARKNET: {
        factoryAddress: SN.collection721!,
        startBlock: SN.collection721StartBlock!,
      },
    },
    uiVariant: "standard",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer", "mint", "remix", "license"],
    events: [
      { name: "CollectionCreated", emittedBy: "factory" },
      // Per-instance ERC-721 Transfer emitted by each deployed collection; not
      // yet declared here because the indexer polls discovered instances on a
      // slow schedule. Plan 2026-05-24-data-driven-event-registry.md covers
      // the migration.
    ],
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "ip-erc721": {
    id: "ip-erc721",
    displayName: "Programmable IP (genesis)",
    description: "One shared ERC-721 contract; many wallets mint genesis pieces.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    uiVariant: "standard",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer", "mint", "remix", "license"],
    // No factory — single shared contract. Events declared when the genesis
    // contract address is wired into onchain.STARKNET.factoryAddress here.
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "mip-erc1155": {
    id: "mip-erc1155",
    displayName: "NFT Editions",
    description: "Per-creator ERC-1155 collection; creator mints editions.",
    standard: "ERC1155",
    provenance: "MEDIALANE",
    onchain: {
      STARKNET: {
        factoryAddress: SN.collection1155!,
        classHash: SN.collection1155ClassHash!,
        startBlock: SN.collection1155StartBlock!,
      },
    },
    uiVariant: "edition",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer", "mint", "remix", "license"],
    events: [
      { name: "CollectionDeployed", emittedBy: "factory" },
    ],
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "pop-protocol": {
    id: "pop-protocol",
    displayName: "POP Protocol",
    description: "Soulbound proof-of-presence collectibles per event.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      STARKNET: {
        factoryAddress: SN.popFactory!,
        classHash: SN.popCollectionClassHash!,
      },
    },
    uiVariant: "pop",
    capabilities: ["claim", "transfer"],
    events: [
      { name: "CollectionCreated", emittedBy: "factory" },
      { name: "AllowlistUpdated", emittedBy: "instance", poll: "slow" },
    ],
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "drop-collection": {
    id: "drop-collection",
    displayName: "Collection Drop",
    description: "Sequential mint with claim windows + allowlist.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      STARKNET: {
        factoryAddress: SN.dropFactory!,
        classHash: SN.dropCollectionClassHash!,
      },
    },
    uiVariant: "drop",
    capabilities: ["claim", "list", "buy", "make_offer", "cancel", "transfer"],
    events: [
      { name: "DropCreated", emittedBy: "factory" },
      { name: "AllowlistUpdated", emittedBy: "instance", poll: "slow" },
    ],
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "ip-tickets": {
    id: "ip-tickets",
    displayName: "IP Tickets",
    description: "Sell verifiable, redeemable tickets for events and experiences.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    uiVariant: "ticket",
    capabilities: ["mint", "redeem", "transfer"],
    events: [
      { name: "CollectionDeployed", emittedBy: "factory" },
    ],
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "ip-club": {
    id: "ip-club",
    displayName: "IP Club",
    description: "Membership clubs with an on-chain NFT membership card.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    uiVariant: "club",
    capabilities: ["subscribe", "transfer"],
    events: [
      { name: "NewClubCreated", emittedBy: "factory" },
    ],
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "ip-sponsorship": {
    id: "ip-sponsorship",
    displayName: "IP Sponsorship",
    description: "Sponsorship offers and licenses anchored to an existing Medialane asset.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    uiVariant: "standard",
    capabilities: ["sponsor"],
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "ip-sponsorship-license": {
    id: "ip-sponsorship-license",
    displayName: "Sponsorship License Receipt",
    description: "Non-authoritative receipt NFT minted to a sponsor when a sponsorship bid is accepted.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    uiVariant: "standard",
    capabilities: ["transfer"],
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "creator-coin": {
    id: "creator-coin",
    displayName: "Creator Coin",
    description:
      "Launch a fixed-supply social token with permanently-locked Ekubo liquidity.",
    standard: "ERC20",
    provenance: "MEDIALANE",
    onchain: {
      STARKNET: {
        factoryAddress: SN.creatorCoinFactory!,
        classHash: SN.creatorCoinFactoryClassHash!,
        startBlock: SN.creatorCoinStartBlock!,
      },
    },
    uiVariant: "coin",
    // `swap` is a UI affordance (05 §III): the marketplace renders an embedded
    // Ekubo swap (via StarkZapp) for the coin. Settlement is Ekubo — Medialane
    // operates NO trading venue and custodies nothing. No venue service exists
    // for coins (unlike NFTs, whose Medialane marketplace contract settles them).
    capabilities: ["launch", "swap", "transfer"],
    events: [
      { name: "CreatorCoinCreated", emittedBy: "factory" },
      { name: "CreatorCoinLaunched", emittedBy: "factory" },
    ],
  },
  "medialane-marketplace-erc721": {
    id: "medialane-marketplace-erc721",
    displayName: "Medialane Marketplace (ERC-721)",
    description: "ERC-721 order matching venue.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      STARKNET: {
        factoryAddress: SN.marketplace721!,
        classHash: SN.marketplace721ClassHash!,
        startBlock: SN.marketplace721StartBlock!,
      },
    },
    uiVariant: "standard",
    capabilities: ["list", "buy", "make_offer", "cancel"],
    events: [
      { name: "OrderCreated", emittedBy: "factory" },
      { name: "OrderFulfilled", emittedBy: "factory" },
      { name: "OrderCancelled", emittedBy: "factory" },
    ],
  },
  "medialane-marketplace-erc1155": {
    id: "medialane-marketplace-erc1155",
    displayName: "Medialane Marketplace (ERC-1155)",
    description: "ERC-1155 order matching venue.",
    standard: "ERC1155",
    provenance: "MEDIALANE",
    onchain: {
      STARKNET: {
        factoryAddress: SN.marketplace1155!,
        classHash: SN.marketplace1155ClassHash!,
        startBlock: SN.marketplace1155StartBlock!,
      },
    },
    uiVariant: "edition",
    capabilities: ["list", "buy", "make_offer", "cancel"],
    events: [
      { name: "OrderCreated", emittedBy: "factory" },
      { name: "OrderFulfilled", emittedBy: "factory" },
      { name: "OrderCancelled", emittedBy: "factory" },
    ],
  },
  "external-erc20": {
    id: "external-erc20",
    displayName: "External ERC-20",
    description:
      "An ERC-20 token (e.g. an unrug memecoin or a partner coin) not deployed via a Medialane service. Brought in by owner claim or admin/partnership — never bulk-indexed. Generalizes to future chains.",
    standard: "ERC20",
    provenance: "EXTERNAL",
    uiVariant: "coin",
    capabilities: ["swap", "transfer"],
  },
  "external-erc721": {
    id: "external-erc721",
    displayName: "External ERC-721",
    description: "ERC-721 contract not deployed via a Medialane service.",
    standard: "ERC721",
    provenance: "EXTERNAL",
    uiVariant: "standard",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer"],
  },
  "external-erc1155": {
    id: "external-erc1155",
    displayName: "External ERC-1155",
    description: "ERC-1155 contract not deployed via a Medialane service.",
    standard: "ERC1155",
    provenance: "EXTERNAL",
    uiVariant: "edition",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer"],
  },
} as const satisfies Record<string, ServiceDefinition>;

/**
 * Literal-union of every registered service ID. Use this as the type for
 * `Collection.service` write sites in consumers — typos like "pop_protocol"
 * (underscore instead of hyphen) become compile errors.
 *
 * `getService()` still accepts loose `string` for read-side lookups where the
 * value came from the DB and is trusted to already be valid.
 */
export type ServiceId = keyof typeof SERVICES;

/** Type guard: narrows a string to ServiceId if it's registered. */
export function isServiceId(id: string | null | undefined): id is ServiceId {
  return typeof id === "string" && id in SERVICES;
}

/** Lookup. Returns undefined for unregistered service IDs — callers should
 *  treat that as a data error, since every Collection.service value is
 *  expected to map to a registered ServiceDefinition. */
export function getService(id: string | null | undefined): ServiceDefinition | undefined {
  return id && id in SERVICES ? (SERVICES as Record<string, ServiceDefinition>)[id] : undefined;
}

/** All registered services (e.g. the launchpad grid). */
export function listServices(): ServiceDefinition[] {
  return Object.values(SERVICES);
}

/** Services that declare a capability (e.g. "where can users mint"). */
export function getServicesByCapability(cap: ServiceCapability): ServiceDefinition[] {
  return Object.values(SERVICES).filter(
    (s) => (s.capabilities as readonly ServiceCapability[]).includes(cap),
  );
}
