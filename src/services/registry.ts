import type { ServiceDefinition, ServiceCapability } from "../types/api.js";
import {
  COLLECTION_721_CONTRACT_MAINNET,
  INDEXER_START_BLOCK_MAINNET,
  ERC1155_FACTORY_CONTRACT_MAINNET,
  ERC1155_COLLECTION_CLASS_HASH_MAINNET,
  MARKETPLACE_1155_START_BLOCK_MAINNET,
  POP_FACTORY_CONTRACT_MAINNET,
  POP_COLLECTION_CLASS_HASH_MAINNET,
  DROP_FACTORY_CONTRACT_MAINNET,
  DROP_COLLECTION_CLASS_HASH_MAINNET,
  MARKETPLACE_721_CONTRACT_MAINNET,
  MARKETPLACE_721_CLASS_HASH_MAINNET,
  MARKETPLACE_721_START_BLOCK_MAINNET,
  MARKETPLACE_1155_CONTRACT_MAINNET,
  MARKETPLACE_1155_CLASS_HASH_MAINNET,
} from "../constants.js";

/**
 * The Medialane service registry (05-service-model §II, §VI).
 * Canonical long-form IDs (01-core-model §III). SDK-resident in v1;
 * on-chain registry in year 2 (08-dao-governance §IV).
 *
 * Year-2 forward-compat: cross-account identity uses the future `AccountID`
 * contract (07-identity-model §IV) — no field here yet, intentionally.
 *
 * Phase 2B.2 of the service-model refactor. `ip-erc721` has no dedicated
 * on-chain constant in src/constants.ts, so its `onchain` is omitted rather
 * than invented (the genesis contract address ships with that service).
 */
const SERVICES: Record<string, ServiceDefinition> = {
  "mip-erc721": {
    id: "mip-erc721",
    displayName: "IP Collection",
    description: "Tokenize intellectual property as a per-creator ERC-721 collection.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: COLLECTION_721_CONTRACT_MAINNET,
      startBlock: INDEXER_START_BLOCK_MAINNET,
    },
    uiVariant: "standard",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer", "mint", "remix", "license"],
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
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "mip-erc1155": {
    id: "mip-erc1155",
    displayName: "NFT Editions",
    description: "Per-creator ERC-1155 collection; creator mints editions.",
    standard: "ERC1155",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: ERC1155_FACTORY_CONTRACT_MAINNET,
      classHash: ERC1155_COLLECTION_CLASS_HASH_MAINNET,
      startBlock: MARKETPLACE_1155_START_BLOCK_MAINNET,
    },
    uiVariant: "edition",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer", "mint", "remix", "license"],
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "pop-protocol": {
    id: "pop-protocol",
    displayName: "POP Protocol",
    description: "Soulbound proof-of-presence collectibles per event.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: POP_FACTORY_CONTRACT_MAINNET,
      classHash: POP_COLLECTION_CLASS_HASH_MAINNET,
    },
    uiVariant: "pop",
    capabilities: ["claim", "transfer"],
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "drop-collection": {
    id: "drop-collection",
    displayName: "Collection Drop",
    description: "Sequential mint with claim windows + allowlist.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: DROP_FACTORY_CONTRACT_MAINNET,
      classHash: DROP_COLLECTION_CLASS_HASH_MAINNET,
    },
    uiVariant: "drop",
    capabilities: ["claim", "list", "buy", "make_offer", "cancel", "transfer"],
    metadataSchema: { licenseDefault: "CC BY-SA" },
  },
  "medialane-marketplace-erc721": {
    id: "medialane-marketplace-erc721",
    displayName: "Medialane Marketplace (ERC-721)",
    description: "ERC-721 order matching venue.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: MARKETPLACE_721_CONTRACT_MAINNET,
      classHash: MARKETPLACE_721_CLASS_HASH_MAINNET,
      startBlock: MARKETPLACE_721_START_BLOCK_MAINNET,
    },
    uiVariant: "standard",
    capabilities: ["list", "buy", "make_offer", "cancel"],
  },
  "medialane-marketplace-erc1155": {
    id: "medialane-marketplace-erc1155",
    displayName: "Medialane Marketplace (ERC-1155)",
    description: "ERC-1155 order matching venue.",
    standard: "ERC1155",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: MARKETPLACE_1155_CONTRACT_MAINNET,
      classHash: MARKETPLACE_1155_CLASS_HASH_MAINNET,
      startBlock: MARKETPLACE_1155_START_BLOCK_MAINNET,
    },
    uiVariant: "edition",
    capabilities: ["list", "buy", "make_offer", "cancel"],
  },
};

/** Lookup. Returns undefined for external/unknown (service: null) — callers
 *  fall back to standard-based generic UI (01-core-model §I). */
export function getService(id: string | null | undefined): ServiceDefinition | undefined {
  return id ? SERVICES[id] : undefined;
}

/** All registered services (e.g. the launchpad grid). */
export function listServices(): ServiceDefinition[] {
  return Object.values(SERVICES);
}

/** Services that declare a capability (e.g. "where can users mint"). */
export function getServicesByCapability(cap: ServiceCapability): ServiceDefinition[] {
  return Object.values(SERVICES).filter((s) => s.capabilities.includes(cap));
}
