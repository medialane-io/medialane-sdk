'use strict';

var zod = require('zod');
var starknet = require('starknet');

// src/config.ts

// src/constants.ts
var MARKETPLACE_721_CONTRACT_MAINNET = "0x00f8ccaae0bc811c79605974cc1dab769b9cea8877f033f8e3c17f30457caba6";
var MARKETPLACE_CONTRACT_MAINNET = MARKETPLACE_721_CONTRACT_MAINNET;
var MARKETPLACE_721_CLASS_HASH_MAINNET = "0x03dff4f34b976207246207954263be9a28b51390321702443291088dcdf4b2e6";
var MARKETPLACE_CLASS_HASH_MAINNET = MARKETPLACE_721_CLASS_HASH_MAINNET;
var MARKETPLACE_721_START_BLOCK_MAINNET = 9196722;
var MARKETPLACE_START_BLOCK_MAINNET = MARKETPLACE_721_START_BLOCK_MAINNET;
var MARKETPLACE_1155_CONTRACT_MAINNET = "0x02bfa521c25461a09d735889b469418608d7d92f8b26e3d37ef174a4c2e22f99";
var MARKETPLACE_1155_CLASS_HASH_MAINNET = "0x01b674aad934be85abc7c1970265cbf7e9bc7d586a90f0a67112c201636dbdd3";
var MARKETPLACE_1155_START_BLOCK_MAINNET = 9260304;
var COLLECTION_721_CONTRACT_MAINNET = "0x05c49ee5d3208a2c2e150fdd0c247d1195ed9ab54fa2d5dea7a633f39e4b205b";
var COLLECTION_CONTRACT_MAINNET = COLLECTION_721_CONTRACT_MAINNET;
var DROP_FACTORY_CONTRACT_MAINNET = "0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800";
var POP_FACTORY_CONTRACT_MAINNET = "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111";
var NFTCOMMENTS_CONTRACT_MAINNET = "0x024f97eb5abe659fb650bf162b5fc16501f8f3863a7369901ce6099462e62799";
var INDEXER_START_BLOCK_MAINNET = MARKETPLACE_721_START_BLOCK_MAINNET;
var SUPPORTED_TOKENS = [
  {
    // Circle-native USDC on Starknet (canonical)
    symbol: "USDC",
    address: "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb",
    decimals: 6,
    listable: true
  },
  {
    symbol: "USDT",
    address: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
    decimals: 6,
    listable: true
  },
  {
    symbol: "ETH",
    address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    decimals: 18,
    listable: true
  },
  {
    symbol: "STRK",
    address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18,
    listable: true
  },
  {
    symbol: "WBTC",
    address: "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
    decimals: 8,
    listable: true
  }
];
var DEFAULT_CURRENCY = "USDC";
var SUPPORTED_NETWORKS = ["mainnet"];
var DEFAULT_RPC_URL = "https://rpc.starknet.lava.build";
var POP_COLLECTION_CLASS_HASH_MAINNET = "0x077c421686f10851872561953ea16898d933364b7f8937a5d7e2b1ba0a36263f";
var DROP_COLLECTION_CLASS_HASH_MAINNET = "0x00092e72cdb63067521e803aaf7d4101c3e3ce026ae6bc045ec4228027e58282";
var COLLECTION_1155_CONTRACT_MAINNET = "0x006b2dc7ca7c4f466bb4575ba043d934310f052074f849caf853a86bcb819fd6";
var ERC1155_FACTORY_CONTRACT_MAINNET = COLLECTION_1155_CONTRACT_MAINNET;
var COLLECTION_1155_CLASS_HASH_MAINNET = "0x39a85126c6627db263617e5bce2bb72e49d2bb1f20961efc8b8954665bcfd25";
var ERC1155_COLLECTION_CLASS_HASH_MAINNET = COLLECTION_1155_CLASS_HASH_MAINNET;

// src/config.ts
var MedialaneConfigSchema = zod.z.object({
  network: zod.z.enum(SUPPORTED_NETWORKS).default("mainnet"),
  rpcUrl: zod.z.string().url().optional(),
  backendUrl: zod.z.string().url().optional(),
  apiKey: zod.z.string().optional(),
  marketplace721Contract: zod.z.string().optional(),
  marketplaceContract: zod.z.string().optional(),
  marketplace1155Contract: zod.z.string().optional(),
  collection721Contract: zod.z.string().optional(),
  collectionContract: zod.z.string().optional(),
  collection1155Contract: zod.z.string().optional(),
  retryOptions: zod.z.object({
    maxAttempts: zod.z.number().int().min(1).max(10).optional(),
    baseDelayMs: zod.z.number().int().min(0).optional(),
    maxDelayMs: zod.z.number().int().min(0).optional()
  }).optional()
});
function resolveConfig(raw) {
  const parsed = MedialaneConfigSchema.parse(raw);
  const marketplace721Contract = parsed.marketplace721Contract ?? parsed.marketplaceContract ?? MARKETPLACE_721_CONTRACT_MAINNET;
  const collection721Contract = parsed.collection721Contract ?? parsed.collectionContract ?? COLLECTION_721_CONTRACT_MAINNET;
  return {
    network: parsed.network,
    rpcUrl: parsed.rpcUrl ?? DEFAULT_RPC_URL,
    backendUrl: parsed.backendUrl,
    apiKey: parsed.apiKey,
    marketplace721Contract,
    marketplaceContract: marketplace721Contract,
    marketplace1155Contract: parsed.marketplace1155Contract ?? MARKETPLACE_1155_CONTRACT_MAINNET,
    collection721Contract,
    collectionContract: collection721Contract,
    collection1155Contract: parsed.collection1155Contract ?? COLLECTION_1155_CONTRACT_MAINNET,
    retryOptions: parsed.retryOptions
  };
}
function buildOrderTypedData(message, chainId) {
  return {
    domain: {
      name: "Medialane",
      version: "1",
      chainId,
      revision: starknet.TypedDataRevision.ACTIVE
    },
    primaryType: "OrderParameters",
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" }
      ],
      OrderParameters: [
        { name: "offerer", type: "ContractAddress" },
        { name: "offer", type: "OfferItem" },
        { name: "consideration", type: "ConsiderationItem" },
        { name: "start_time", type: "felt" },
        { name: "end_time", type: "felt" },
        { name: "salt", type: "felt" },
        { name: "nonce", type: "felt" }
      ],
      OfferItem: [
        { name: "item_type", type: "shortstring" },
        { name: "token", type: "ContractAddress" },
        { name: "identifier_or_criteria", type: "felt" },
        { name: "start_amount", type: "felt" },
        { name: "end_amount", type: "felt" }
      ],
      ConsiderationItem: [
        { name: "item_type", type: "shortstring" },
        { name: "token", type: "ContractAddress" },
        { name: "identifier_or_criteria", type: "felt" },
        { name: "start_amount", type: "felt" },
        { name: "end_amount", type: "felt" },
        { name: "recipient", type: "ContractAddress" }
      ]
    },
    message
  };
}
function buildFulfillmentTypedData(message, chainId) {
  return {
    domain: {
      name: "Medialane",
      version: "1",
      chainId,
      revision: starknet.TypedDataRevision.ACTIVE
    },
    primaryType: "OrderFulfillment",
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" }
      ],
      OrderFulfillment: [
        { name: "order_hash", type: "felt" },
        { name: "fulfiller", type: "ContractAddress" },
        { name: "nonce", type: "felt" }
      ]
    },
    message
  };
}
function buildCancellationTypedData(message, chainId) {
  return {
    domain: {
      name: "Medialane",
      version: "1",
      chainId,
      revision: starknet.TypedDataRevision.ACTIVE
    },
    primaryType: "OrderCancellation",
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" }
      ],
      OrderCancellation: [
        { name: "order_hash", type: "felt" },
        { name: "offerer", type: "ContractAddress" },
        { name: "nonce", type: "felt" }
      ]
    },
    message
  };
}

// src/abis.ts
var IPMarketplaceABI = [
  {
    type: "impl",
    name: "UpgradeableImpl",
    interface_name: "openzeppelin_upgrades::interface::IUpgradeable"
  },
  {
    type: "interface",
    name: "openzeppelin_upgrades::interface::IUpgradeable",
    items: [
      {
        type: "function",
        name: "upgrade",
        inputs: [{ name: "new_class_hash", type: "core::starknet::class_hash::ClassHash" }],
        outputs: [],
        state_mutability: "external"
      }
    ]
  },
  {
    type: "impl",
    name: "MedialaneImpl",
    interface_name: "mediolano_core::core::interface::IMedialane"
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OfferItem",
    members: [
      { name: "item_type", type: "core::felt252" },
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "identifier_or_criteria", type: "core::felt252" },
      { name: "start_amount", type: "core::felt252" },
      { name: "end_amount", type: "core::felt252" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::ConsiderationItem",
    members: [
      { name: "item_type", type: "core::felt252" },
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "identifier_or_criteria", type: "core::felt252" },
      { name: "start_amount", type: "core::felt252" },
      { name: "end_amount", type: "core::felt252" },
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OrderParameters",
    members: [
      { name: "offerer", type: "core::starknet::contract_address::ContractAddress" },
      { name: "offer", type: "mediolano_core::core::types::OfferItem" },
      { name: "consideration", type: "mediolano_core::core::types::ConsiderationItem" },
      { name: "start_time", type: "core::felt252" },
      { name: "end_time", type: "core::felt252" },
      { name: "salt", type: "core::felt252" },
      { name: "nonce", type: "core::felt252" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::Order",
    members: [
      { name: "parameters", type: "mediolano_core::core::types::OrderParameters" },
      { name: "signature", type: "core::array::Array::<core::felt252>" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OrderFulfillment",
    members: [
      { name: "order_hash", type: "core::felt252" },
      { name: "fulfiller", type: "core::starknet::contract_address::ContractAddress" },
      { name: "nonce", type: "core::felt252" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::FulfillmentRequest",
    members: [
      { name: "fulfillment", type: "mediolano_core::core::types::OrderFulfillment" },
      { name: "signature", type: "core::array::Array::<core::felt252>" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OrderCancellation",
    members: [
      { name: "order_hash", type: "core::felt252" },
      { name: "offerer", type: "core::starknet::contract_address::ContractAddress" },
      { name: "nonce", type: "core::felt252" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::CancelRequest",
    members: [
      { name: "cancelation", type: "mediolano_core::core::types::OrderCancellation" },
      { name: "signature", type: "core::array::Array::<core::felt252>" }
    ]
  },
  {
    type: "enum",
    name: "mediolano_core::core::types::OrderStatus",
    variants: [
      { name: "None", type: "()" },
      { name: "Created", type: "()" },
      { name: "Filled", type: "()" },
      { name: "Cancelled", type: "()" }
    ]
  },
  {
    type: "enum",
    name: "core::option::Option::<core::starknet::contract_address::ContractAddress>",
    variants: [
      { name: "Some", type: "core::starknet::contract_address::ContractAddress" },
      { name: "None", type: "()" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OrderDetails",
    members: [
      { name: "offerer", type: "core::starknet::contract_address::ContractAddress" },
      { name: "offer", type: "mediolano_core::core::types::OfferItem" },
      { name: "consideration", type: "mediolano_core::core::types::ConsiderationItem" },
      { name: "start_time", type: "core::integer::u64" },
      { name: "end_time", type: "core::integer::u64" },
      { name: "order_status", type: "mediolano_core::core::types::OrderStatus" },
      {
        name: "fulfiller",
        type: "core::option::Option::<core::starknet::contract_address::ContractAddress>"
      }
    ]
  },
  {
    type: "interface",
    name: "mediolano_core::core::interface::IMedialane",
    items: [
      {
        type: "function",
        name: "register_order",
        inputs: [{ name: "order", type: "mediolano_core::core::types::Order" }],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "fulfill_order",
        inputs: [
          {
            name: "fulfillment_request",
            type: "mediolano_core::core::types::FulfillmentRequest"
          }
        ],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "cancel_order",
        inputs: [{ name: "cancel_request", type: "mediolano_core::core::types::CancelRequest" }],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "get_order_details",
        inputs: [{ name: "order_hash", type: "core::felt252" }],
        outputs: [{ type: "mediolano_core::core::types::OrderDetails" }],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "get_order_hash",
        inputs: [
          { name: "parameters", type: "mediolano_core::core::types::OrderParameters" },
          { name: "signer", type: "core::starknet::contract_address::ContractAddress" }
        ],
        outputs: [{ type: "core::felt252" }],
        state_mutability: "view"
      }
    ]
  },
  {
    type: "impl",
    name: "NoncesImpl",
    interface_name: "openzeppelin_utils::cryptography::interface::INonces"
  },
  {
    type: "interface",
    name: "openzeppelin_utils::cryptography::interface::INonces",
    items: [
      {
        type: "function",
        name: "nonces",
        inputs: [
          { name: "owner", type: "core::starknet::contract_address::ContractAddress" }
        ],
        outputs: [{ type: "core::felt252" }],
        state_mutability: "view"
      }
    ]
  },
  {
    type: "impl",
    name: "SRC5Impl",
    interface_name: "openzeppelin_introspection::interface::ISRC5"
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      { name: "False", type: "()" },
      { name: "True", type: "()" }
    ]
  },
  {
    type: "interface",
    name: "openzeppelin_introspection::interface::ISRC5",
    items: [
      {
        type: "function",
        name: "supports_interface",
        inputs: [{ name: "interface_id", type: "core::felt252" }],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view"
      }
    ]
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      { name: "manager", type: "core::starknet::contract_address::ContractAddress" },
      { name: "native_token_address", type: "core::starknet::contract_address::ContractAddress" }
    ]
  },
  {
    type: "event",
    name: "mediolano_core::core::events::OrderCreated",
    kind: "struct",
    members: [
      { name: "order_hash", type: "core::felt252", kind: "key" },
      {
        name: "offerer",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key"
      }
    ]
  },
  {
    type: "event",
    name: "mediolano_core::core::events::OrderFulfilled",
    kind: "struct",
    members: [
      { name: "order_hash", type: "core::felt252", kind: "key" },
      {
        name: "offerer",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key"
      },
      {
        name: "fulfiller",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key"
      }
    ]
  },
  {
    type: "event",
    name: "mediolano_core::core::events::OrderCancelled",
    kind: "struct",
    members: [
      { name: "order_hash", type: "core::felt252", kind: "key" },
      {
        name: "offerer",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key"
      }
    ]
  },
  {
    type: "event",
    name: "mediolano_core::core::medialane::Medialane::Event",
    kind: "enum",
    variants: [
      {
        name: "OrderCreated",
        type: "mediolano_core::core::events::OrderCreated",
        kind: "nested"
      },
      {
        name: "OrderFulfilled",
        type: "mediolano_core::core::events::OrderFulfilled",
        kind: "nested"
      },
      {
        name: "OrderCancelled",
        type: "mediolano_core::core::events::OrderCancelled",
        kind: "nested"
      }
    ]
  }
];
var POPCollectionABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" }
    ]
  },
  {
    type: "function",
    name: "claim",
    inputs: [],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "admin_mint",
    inputs: [
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "custom_uri", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "add_to_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "batch_add_to_allowlist",
    inputs: [{ name: "addresses", type: "core::array::Array::<core::starknet::contract_address::ContractAddress>" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "remove_from_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_token_uri",
    inputs: [
      { name: "token_id", type: "core::integer::u256" },
      { name: "uri", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_paused",
    inputs: [{ name: "paused", type: "core::bool" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "is_eligible",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "has_claimed",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "total_minted",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  }
];
var POPFactoryABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" }
    ]
  },
  {
    type: "enum",
    name: "pop_protocol::types::EventType",
    variants: [
      { name: "Conference", type: "()" },
      { name: "Bootcamp", type: "()" },
      { name: "Workshop", type: "()" },
      { name: "Hackathon", type: "()" },
      { name: "Meetup", type: "()" },
      { name: "Course", type: "()" },
      { name: "Other", type: "()" }
    ]
  },
  {
    type: "function",
    name: "create_collection",
    inputs: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
      { name: "claim_end_time", type: "core::integer::u64" },
      { name: "event_type", type: "pop_protocol::types::EventType" }
    ],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "register_provider",
    inputs: [
      { name: "provider", type: "core::starknet::contract_address::ContractAddress" },
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "website_url", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_pop_collection_class_hash",
    inputs: [{ name: "new_class_hash", type: "core::starknet::class_hash::ClassHash" }],
    outputs: [],
    state_mutability: "external"
  }
];
var DropCollectionABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" }
    ]
  },
  {
    type: "struct",
    name: "collection_drop::types::ClaimConditions",
    members: [
      { name: "start_time", type: "core::integer::u64" },
      { name: "end_time", type: "core::integer::u64" },
      { name: "price", type: "core::integer::u256" },
      { name: "payment_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "max_quantity_per_wallet", type: "core::integer::u256" }
    ]
  },
  {
    type: "function",
    name: "claim",
    inputs: [{ name: "quantity", type: "core::integer::u256" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "admin_mint",
    inputs: [
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "quantity", type: "core::integer::u256" },
      { name: "custom_uri", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_claim_conditions",
    inputs: [{ name: "conditions", type: "collection_drop::types::ClaimConditions" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "get_claim_conditions",
    inputs: [],
    outputs: [{ type: "collection_drop::types::ClaimConditions" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "set_allowlist_enabled",
    inputs: [{ name: "enabled", type: "core::bool" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "is_allowlist_enabled",
    inputs: [],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "add_to_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "batch_add_to_allowlist",
    inputs: [{ name: "addresses", type: "core::array::Array::<core::starknet::contract_address::ContractAddress>" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "remove_from_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "is_allowlisted",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "set_base_uri",
    inputs: [{ name: "new_uri", type: "core::byte_array::ByteArray" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_token_uri",
    inputs: [
      { name: "token_id", type: "core::integer::u256" },
      { name: "uri", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_paused",
    inputs: [{ name: "paused", type: "core::bool" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "withdraw_payments",
    inputs: [],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "get_drop_id",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_max_supply",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "total_minted",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "remaining_supply",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "minted_by_wallet",
    inputs: [{ name: "wallet", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "is_paused",
    inputs: [],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  }
];
var DropFactoryABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" }
    ]
  },
  {
    type: "struct",
    name: "collection_drop::types::ClaimConditions",
    members: [
      { name: "start_time", type: "core::integer::u64" },
      { name: "end_time", type: "core::integer::u64" },
      { name: "price", type: "core::integer::u256" },
      { name: "payment_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "max_quantity_per_wallet", type: "core::integer::u256" }
    ]
  },
  {
    type: "function",
    name: "register_organizer",
    inputs: [
      { name: "organizer", type: "core::starknet::contract_address::ContractAddress" },
      { name: "name", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "revoke_organizer",
    inputs: [{ name: "organizer", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "is_active_organizer",
    inputs: [{ name: "organizer", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "create_drop",
    inputs: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
      { name: "max_supply", type: "core::integer::u256" },
      { name: "initial_conditions", type: "collection_drop::types::ClaimConditions" }
    ],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "get_drop_address",
    inputs: [{ name: "drop_id", type: "core::integer::u256" }],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_last_drop_id",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_organizer_drop_count",
    inputs: [{ name: "organizer", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u32" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "set_drop_collection_class_hash",
    inputs: [{ name: "new_class_hash", type: "core::starknet::class_hash::ClassHash" }],
    outputs: [],
    state_mutability: "external"
  }
];
var CollectionRegistryABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" }
    ]
  },
  {
    type: "struct",
    name: "ip_collection_erc_721::types::Collection",
    members: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
      { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
      { name: "ip_nft", type: "core::starknet::contract_address::ContractAddress" },
      { name: "is_active", type: "core::bool" }
    ]
  },
  {
    type: "function",
    name: "list_user_collections",
    inputs: [{ name: "user", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::array::Span::<core::integer::u256>" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_collection",
    inputs: [{ name: "collection_id", type: "core::integer::u256" }],
    outputs: [{ type: "ip_collection_erc_721::types::Collection" }],
    state_mutability: "view"
  }
];
var Medialane1155ABI = [
  {
    "type": "impl",
    "name": "Medialane1155V2Impl",
    "interface_name": "medialane_erc1155::core::interface::IMedialane1155V2"
  },
  {
    "type": "struct",
    "name": "medialane_erc1155::core::types::OfferItem",
    "members": [
      {
        "name": "item_type",
        "type": "core::felt252"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "identifier_or_criteria",
        "type": "core::felt252"
      },
      {
        "name": "start_amount",
        "type": "core::felt252"
      },
      {
        "name": "end_amount",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_erc1155::core::types::ConsiderationItem",
    "members": [
      {
        "name": "item_type",
        "type": "core::felt252"
      },
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "identifier_or_criteria",
        "type": "core::felt252"
      },
      {
        "name": "start_amount",
        "type": "core::felt252"
      },
      {
        "name": "end_amount",
        "type": "core::felt252"
      },
      {
        "name": "recipient",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_erc1155::core::types::OrderParameters",
    "members": [
      {
        "name": "offerer",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "offer",
        "type": "medialane_erc1155::core::types::OfferItem"
      },
      {
        "name": "consideration",
        "type": "medialane_erc1155::core::types::ConsiderationItem"
      },
      {
        "name": "start_time",
        "type": "core::felt252"
      },
      {
        "name": "end_time",
        "type": "core::felt252"
      },
      {
        "name": "salt",
        "type": "core::felt252"
      },
      {
        "name": "nonce",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_erc1155::core::types::Order",
    "members": [
      {
        "name": "parameters",
        "type": "medialane_erc1155::core::types::OrderParameters"
      },
      {
        "name": "signature",
        "type": "core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_erc1155::core::types::OrderFulfillment",
    "members": [
      {
        "name": "order_hash",
        "type": "core::felt252"
      },
      {
        "name": "fulfiller",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "quantity",
        "type": "core::felt252"
      },
      {
        "name": "nonce",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_erc1155::core::types::FulfillmentRequest",
    "members": [
      {
        "name": "fulfillment",
        "type": "medialane_erc1155::core::types::OrderFulfillment"
      },
      {
        "name": "signature",
        "type": "core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_erc1155::core::types::OrderCancellation",
    "members": [
      {
        "name": "order_hash",
        "type": "core::felt252"
      },
      {
        "name": "offerer",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "nonce",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_erc1155::core::types::CancelRequest",
    "members": [
      {
        "name": "cancelation",
        "type": "medialane_erc1155::core::types::OrderCancellation"
      },
      {
        "name": "signature",
        "type": "core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "enum",
    "name": "medialane_erc1155::core::types::OrderStatus",
    "variants": [
      {
        "name": "None",
        "type": "()"
      },
      {
        "name": "Created",
        "type": "()"
      },
      {
        "name": "Filled",
        "type": "()"
      },
      {
        "name": "Cancelled",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_erc1155::core::types::OrderDetails",
    "members": [
      {
        "name": "offerer",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "offer",
        "type": "medialane_erc1155::core::types::OfferItem"
      },
      {
        "name": "consideration",
        "type": "medialane_erc1155::core::types::ConsiderationItem"
      },
      {
        "name": "start_time",
        "type": "core::integer::u64"
      },
      {
        "name": "end_time",
        "type": "core::integer::u64"
      },
      {
        "name": "order_status",
        "type": "medialane_erc1155::core::types::OrderStatus"
      },
      {
        "name": "total_amount",
        "type": "core::felt252"
      },
      {
        "name": "remaining_amount",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "interface",
    "name": "medialane_erc1155::core::interface::IMedialane1155V2",
    "items": [
      {
        "type": "function",
        "name": "register_order",
        "inputs": [
          {
            "name": "order",
            "type": "medialane_erc1155::core::types::Order"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "fulfill_order",
        "inputs": [
          {
            "name": "fulfillment_request",
            "type": "medialane_erc1155::core::types::FulfillmentRequest"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "cancel_order",
        "inputs": [
          {
            "name": "cancel_request",
            "type": "medialane_erc1155::core::types::CancelRequest"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_order_details",
        "inputs": [
          {
            "name": "order_hash",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "medialane_erc1155::core::types::OrderDetails"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_order_hash",
        "inputs": [
          {
            "name": "parameters",
            "type": "medialane_erc1155::core::types::OrderParameters"
          },
          {
            "name": "signer",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::felt252"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_native_token_address",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "impl",
    "name": "NoncesImpl",
    "interface_name": "openzeppelin_utils::cryptography::interface::INonces"
  },
  {
    "type": "interface",
    "name": "openzeppelin_utils::cryptography::interface::INonces",
    "items": [
      {
        "type": "function",
        "name": "nonces",
        "inputs": [
          {
            "name": "owner",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::felt252"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "native_token_address",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "event",
    "name": "medialane_erc1155::core::events::OrderCreated",
    "kind": "struct",
    "members": [
      {
        "name": "order_hash",
        "type": "core::felt252",
        "kind": "key"
      },
      {
        "name": "offerer",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "event",
    "name": "medialane_erc1155::core::events::OrderFulfilled",
    "kind": "struct",
    "members": [
      {
        "name": "order_hash",
        "type": "core::felt252",
        "kind": "key"
      },
      {
        "name": "offerer",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "fulfiller",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "quantity",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "remaining_amount",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "sale_amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "royalty_receiver",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "royalty_amount",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "medialane_erc1155::core::events::OrderCancelled",
    "kind": "struct",
    "members": [
      {
        "name": "order_hash",
        "type": "core::felt252",
        "kind": "key"
      },
      {
        "name": "offerer",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_utils::cryptography::nonces::NoncesComponent::Event",
    "kind": "enum",
    "variants": []
  },
  {
    "type": "event",
    "name": "medialane_erc1155::core::medialane::Medialane1155V2::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "OrderCreated",
        "type": "medialane_erc1155::core::events::OrderCreated",
        "kind": "nested"
      },
      {
        "name": "OrderFulfilled",
        "type": "medialane_erc1155::core::events::OrderFulfilled",
        "kind": "nested"
      },
      {
        "name": "OrderCancelled",
        "type": "medialane_erc1155::core::events::OrderCancelled",
        "kind": "nested"
      },
      {
        "name": "NoncesEvent",
        "type": "openzeppelin_utils::cryptography::nonces::NoncesComponent::Event",
        "kind": "flat"
      }
    ]
  }
];
var IPCollection1155FactoryABI = [
  {
    type: "function",
    name: "collection_class_hash",
    inputs: [],
    outputs: [{ type: "core::starknet::class_hash::ClassHash" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "deploy_collection",
    inputs: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" }
    ],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "update_collection_class_hash",
    inputs: [{ name: "new_class_hash", type: "core::starknet::class_hash::ClassHash" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view"
  }
];
var IPCollection1155ABI = [
  // ── Metadata views ──────────────────────────────────────────────────────────
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ type: "core::byte_array::ByteArray" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ type: "core::byte_array::ByteArray" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "base_uri",
    inputs: [],
    outputs: [{ type: "core::byte_array::ByteArray" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "uri",
    inputs: [{ name: "token_id", type: "core::integer::u256" }],
    outputs: [{ type: "core::byte_array::ByteArray" }],
    state_mutability: "view"
  },
  // ── Minting ─────────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "mint_item",
    inputs: [
      { name: "to", type: "core::starknet::contract_address::ContractAddress" },
      { name: "token_id", type: "core::integer::u256" },
      { name: "value", type: "core::integer::u256" },
      { name: "token_uri", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "batch_mint_item",
    inputs: [
      { name: "to", type: "core::starknet::contract_address::ContractAddress" },
      { name: "token_ids", type: "core::array::Span::<core::integer::u256>" },
      { name: "values", type: "core::array::Span::<core::integer::u256>" },
      { name: "token_uris", type: "core::array::Array::<core::byte_array::ByteArray>" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  // ── Provenance queries ───────────────────────────────────────────────────────
  {
    type: "function",
    name: "get_collection_creator",
    inputs: [],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_token_creator",
    inputs: [{ name: "token_id", type: "core::integer::u256" }],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_token_registered_at",
    inputs: [{ name: "token_id", type: "core::integer::u256" }],
    outputs: [{ type: "core::integer::u64" }],
    state_mutability: "view"
  },
  // ── Ownership ────────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view"
  },
  // ── ERC-1155 standard ────────────────────────────────────────────────────────
  {
    type: "function",
    name: "balance_of",
    inputs: [
      { name: "account", type: "core::starknet::contract_address::ContractAddress" },
      { name: "token_id", type: "core::integer::u256" }
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "set_approval_for_all",
    inputs: [
      { name: "operator", type: "core::starknet::contract_address::ContractAddress" },
      { name: "approved", type: "core::bool" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "is_approved_for_all",
    inputs: [
      { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
      { name: "operator", type: "core::starknet::contract_address::ContractAddress" }
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  },
  // ── ERC-2981 royalties ───────────────────────────────────────────────────────
  {
    type: "function",
    name: "royalty_info",
    inputs: [
      { name: "token_id", type: "core::integer::u256" },
      { name: "sale_price", type: "core::integer::u256" }
    ],
    outputs: [
      { type: "core::starknet::contract_address::ContractAddress" },
      { type: "core::integer::u256" }
    ],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "set_default_royalty",
    inputs: [
      { name: "receiver", type: "core::starknet::contract_address::ContractAddress" },
      { name: "fee_numerator", type: "core::integer::u128" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_token_royalty",
    inputs: [
      { name: "token_id", type: "core::integer::u256" },
      { name: "receiver", type: "core::starknet::contract_address::ContractAddress" },
      { name: "fee_numerator", type: "core::integer::u128" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "delete_default_royalty",
    inputs: [],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "reset_token_royalty",
    inputs: [{ name: "token_id", type: "core::integer::u256" }],
    outputs: [],
    state_mutability: "external"
  }
];

// src/utils/bigint.ts
function stringifyBigInts(obj) {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(stringifyBigInts);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        stringifyBigInts(value)
      ])
    );
  }
  return obj;
}
function u256ToBigInt(low, high) {
  return BigInt(low) + (BigInt(high) << 128n);
}

// src/utils/token.ts
function parseAmount(human, decimals) {
  const [whole, frac = ""] = human.split(".");
  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  return (BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fracPadded)).toString();
}
function formatAmount(raw, decimals) {
  const value = BigInt(raw);
  const factor = BigInt(Math.pow(10, decimals));
  const whole = value / factor;
  const remainder = value % factor;
  const fractional = remainder.toString().padStart(decimals, "0");
  return `${whole}.${fractional}`;
}
function getTokenByAddress(address) {
  const lower = address.toLowerCase();
  return SUPPORTED_TOKENS.find((t) => t.address.toLowerCase() === lower);
}
function getTokenBySymbol(symbol) {
  const upper = symbol.toUpperCase();
  return SUPPORTED_TOKENS.find((t) => t.symbol === upper);
}
function getListableTokens() {
  return SUPPORTED_TOKENS.filter((t) => t.listable);
}

// src/marketplace/orders.ts
var MedialaneError = class extends Error {
  constructor(message, code = "UNKNOWN", cause) {
    super(message);
    this.code = code;
    this.cause = cause;
    this.name = "MedialaneError";
  }
};
function toSignatureArray(sig) {
  if (Array.isArray(sig)) return sig;
  const s = sig;
  return [s.r.toString(), s.s.toString()];
}
function getChainId(_config) {
  return starknet.constants.StarknetChainId.SN_MAIN;
}
var _contractCache = /* @__PURE__ */ new WeakMap();
var _providerCache = /* @__PURE__ */ new WeakMap();
function getProvider(config) {
  let provider = _providerCache.get(config);
  if (!provider) {
    provider = new starknet.RpcProvider({ nodeUrl: config.rpcUrl });
    _providerCache.set(config, provider);
  }
  return provider;
}
function makeContract(config) {
  const cached = _contractCache.get(config);
  if (cached) return cached;
  const provider = getProvider(config);
  const contract = new starknet.Contract(
    IPMarketplaceABI,
    config.marketplaceContract,
    provider
  );
  const result = { contract, provider };
  _contractCache.set(config, result);
  return result;
}
function resolveToken(currency) {
  const token = SUPPORTED_TOKENS.find(
    (t) => t.symbol === currency.toUpperCase() || t.address.toLowerCase() === currency.toLowerCase()
  );
  if (!token) throw new MedialaneError(`Unsupported currency: ${currency}`, "INVALID_PARAMS");
  return token;
}
async function createListing(account, params, config) {
  const { nftContract, tokenId, price, currency = DEFAULT_CURRENCY, durationSeconds } = params;
  const { contract, provider } = makeContract(config);
  const token = resolveToken(currency);
  const priceWei = parseAmount(price, token.decimals);
  const now = Math.floor(Date.now() / 1e3);
  const startTime = now + 300;
  const endTime = now + durationSeconds;
  const saltBytes = new Uint8Array(4);
  crypto.getRandomValues(saltBytes);
  const salt = new DataView(saltBytes.buffer).getUint32(0).toString();
  const currentNonce = await contract.nonces(account.address);
  const orderParams = {
    offerer: account.address,
    offer: {
      item_type: "ERC721",
      token: nftContract,
      identifier_or_criteria: tokenId,
      start_amount: "1",
      end_amount: "1"
    },
    consideration: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      start_amount: priceWei,
      end_amount: priceWei,
      recipient: account.address
    },
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    salt,
    nonce: currentNonce.toString()
  };
  const chainId = getChainId();
  const typedData = stringifyBigInts(buildOrderTypedData(orderParams, chainId));
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);
  const registerPayload = stringifyBigInts({
    parameters: {
      ...orderParams,
      offer: {
        ...orderParams.offer,
        item_type: starknet.shortString.encodeShortString(orderParams.offer.item_type)
      },
      consideration: {
        ...orderParams.consideration,
        item_type: starknet.shortString.encodeShortString(orderParams.consideration.item_type)
      }
    },
    signature: signatureArray
  });
  const tokenIdUint256 = starknet.cairo.uint256(tokenId);
  let isAlreadyApproved = false;
  try {
    const result = await provider.callContract({
      contractAddress: nftContract,
      entrypoint: "get_approved",
      calldata: [tokenIdUint256.low.toString(), tokenIdUint256.high.toString()]
    });
    isAlreadyApproved = BigInt(result[0]).toString() === BigInt(config.marketplaceContract).toString();
  } catch {
  }
  const registerCall = contract.populate("register_order", [registerPayload]);
  const calls = isAlreadyApproved ? [registerCall] : [
    {
      contractAddress: nftContract,
      entrypoint: "approve",
      calldata: [
        config.marketplaceContract,
        tokenIdUint256.low.toString(),
        tokenIdUint256.high.toString()
      ]
    },
    registerCall
  ];
  try {
    const tx = await account.execute(calls);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to create listing", "TRANSACTION_FAILED", err);
  }
}
async function makeOffer(account, params, config) {
  const { nftContract, tokenId, price, currency = DEFAULT_CURRENCY, durationSeconds } = params;
  const { contract, provider } = makeContract(config);
  const token = resolveToken(currency);
  const priceWei = parseAmount(price, token.decimals);
  const now = Math.floor(Date.now() / 1e3);
  const startTime = now + 300;
  const endTime = now + durationSeconds;
  const saltBytes = new Uint8Array(4);
  crypto.getRandomValues(saltBytes);
  const salt = new DataView(saltBytes.buffer).getUint32(0).toString();
  const currentNonce = await contract.nonces(account.address);
  const orderParams = {
    offerer: account.address,
    offer: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      start_amount: priceWei,
      end_amount: priceWei
    },
    consideration: {
      item_type: "ERC721",
      token: nftContract,
      identifier_or_criteria: tokenId,
      start_amount: "1",
      end_amount: "1",
      recipient: account.address
    },
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    salt,
    nonce: currentNonce.toString()
  };
  const chainId = getChainId();
  const typedData = stringifyBigInts(buildOrderTypedData(orderParams, chainId));
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);
  const registerPayload = stringifyBigInts({
    parameters: {
      ...orderParams,
      offer: {
        ...orderParams.offer,
        item_type: starknet.shortString.encodeShortString(orderParams.offer.item_type)
      },
      consideration: {
        ...orderParams.consideration,
        item_type: starknet.shortString.encodeShortString(orderParams.consideration.item_type)
      }
    },
    signature: signatureArray
  });
  const amountUint256 = starknet.cairo.uint256(priceWei);
  const approveCall = {
    contractAddress: token.address,
    entrypoint: "approve",
    calldata: [
      config.marketplaceContract,
      amountUint256.low.toString(),
      amountUint256.high.toString()
    ]
  };
  const registerCall = contract.populate("register_order", [registerPayload]);
  try {
    const tx = await account.execute([approveCall, registerCall]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to make offer", "TRANSACTION_FAILED", err);
  }
}
async function fulfillOrder(account, params, config) {
  const { orderHash } = params;
  const { contract, provider } = makeContract(config);
  const currentNonce = await contract.nonces(account.address);
  const chainId = getChainId();
  const fulfillmentParams = {
    order_hash: orderHash,
    fulfiller: account.address,
    nonce: currentNonce.toString()
  };
  const typedData = stringifyBigInts(
    buildFulfillmentTypedData(fulfillmentParams, chainId)
  );
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);
  const fulfillPayload = stringifyBigInts({
    fulfillment: fulfillmentParams,
    signature: signatureArray
  });
  const call = contract.populate("fulfill_order", [fulfillPayload]);
  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to fulfill order", "TRANSACTION_FAILED", err);
  }
}
async function cancelOrder(account, params, config) {
  const { orderHash } = params;
  const { contract, provider } = makeContract(config);
  const currentNonce = await contract.nonces(account.address);
  const chainId = getChainId();
  const cancelParams = {
    order_hash: orderHash,
    offerer: account.address,
    nonce: currentNonce.toString()
  };
  const typedData = stringifyBigInts(
    buildCancellationTypedData(cancelParams, chainId)
  );
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);
  const cancelRequest = stringifyBigInts({
    cancelation: cancelParams,
    signature: signatureArray
  });
  const call = contract.populate("cancel_order", [cancelRequest]);
  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to cancel order", "TRANSACTION_FAILED", err);
  }
}
function encodeByteArray(str) {
  const ba = starknet.byteArray.byteArrayFromString(str);
  return [
    ba.data.length.toString(),
    ...ba.data.map((d) => starknet.num.toHex(d)),
    starknet.num.toHex(ba.pending_word),
    ba.pending_word_len.toString()
  ];
}
async function mint(account, params, config) {
  const { collectionId, recipient, tokenUri, collectionContract } = params;
  const provider = getProvider(config);
  const contractAddress = collectionContract ?? config.collectionContract;
  const id = starknet.cairo.uint256(collectionId);
  const calldata = [id.low.toString(), id.high.toString(), recipient, ...encodeByteArray(tokenUri)];
  try {
    const tx = await account.execute([{ contractAddress, entrypoint: "mint", calldata }]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to mint NFT", "TRANSACTION_FAILED", err);
  }
}
async function createCollection(account, params, config) {
  const { name, symbol, baseUri, collectionContract } = params;
  const provider = getProvider(config);
  const contractAddress = collectionContract ?? config.collectionContract;
  const calldata = [
    ...encodeByteArray(name),
    ...encodeByteArray(symbol),
    ...encodeByteArray(baseUri)
  ];
  try {
    const tx = await account.execute([{ contractAddress, entrypoint: "create_collection", calldata }]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to create collection", "TRANSACTION_FAILED", err);
  }
}
async function checkoutCart(account, items, config) {
  if (items.length === 0) throw new MedialaneError("Cart is empty", "INVALID_PARAMS");
  const { contract, provider } = makeContract(config);
  const tokenTotals = /* @__PURE__ */ new Map();
  for (const item of items) {
    const prev = tokenTotals.get(item.considerationToken) ?? 0n;
    tokenTotals.set(item.considerationToken, prev + BigInt(item.considerationAmount));
  }
  const approveCalls = Array.from(tokenTotals.entries()).map(([tokenAddr, totalWei]) => {
    const amount = starknet.cairo.uint256(totalWei.toString());
    return {
      contractAddress: tokenAddr,
      entrypoint: "approve",
      calldata: [
        config.marketplaceContract,
        amount.low.toString(),
        amount.high.toString()
      ]
    };
  });
  const currentNonce = await contract.nonces(account.address);
  const baseNonce = BigInt(currentNonce.toString());
  const chainId = getChainId();
  const fulfillCalls = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const nonce = (baseNonce + BigInt(i)).toString();
    const fulfillmentParams = {
      order_hash: item.orderHash,
      fulfiller: account.address,
      nonce
    };
    const typedData = stringifyBigInts(
      buildFulfillmentTypedData(fulfillmentParams, chainId)
    );
    const signature = await account.signMessage(typedData);
    const signatureArray = toSignatureArray(signature);
    const fulfillPayload = stringifyBigInts({
      fulfillment: fulfillmentParams,
      signature: signatureArray
    });
    fulfillCalls.push(contract.populate("fulfill_order", [fulfillPayload]));
  }
  try {
    const tx = await account.execute([...approveCalls, ...fulfillCalls]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Cart checkout failed", "TRANSACTION_FAILED", err);
  }
}

// src/marketplace/index.ts
var MarketplaceModule = class {
  constructor(config) {
    this.config = config;
  }
  // ─── Writes ───────────────────────────────────────────────────────────────
  createListing(account, params) {
    return createListing(account, params, this.config);
  }
  makeOffer(account, params) {
    return makeOffer(account, params, this.config);
  }
  fulfillOrder(account, params) {
    return fulfillOrder(account, params, this.config);
  }
  cancelOrder(account, params) {
    return cancelOrder(account, params, this.config);
  }
  checkoutCart(account, items) {
    return checkoutCart(account, items, this.config);
  }
  mint(account, params) {
    return mint(account, params, this.config);
  }
  createCollection(account, params) {
    return createCollection(account, params, this.config);
  }
  // ─── Typed data builders (for ChipiPay / custom signing flows) ───────────
  buildListingTypedData(params, chainId) {
    return buildOrderTypedData(params, chainId);
  }
  buildFulfillmentTypedData(params, chainId) {
    return buildFulfillmentTypedData(params, chainId);
  }
  buildCancellationTypedData(params, chainId) {
    return buildCancellationTypedData(params, chainId);
  }
};
var STARKNET_DOMAIN = [
  { name: "name", type: "shortstring" },
  { name: "version", type: "shortstring" },
  { name: "chainId", type: "shortstring" },
  { name: "revision", type: "shortstring" }
];
function domain1155(chainId) {
  return {
    name: "Medialane",
    version: "2",
    chainId,
    revision: starknet.TypedDataRevision.ACTIVE
  };
}
function build1155OrderTypedData(message, chainId) {
  return {
    domain: domain1155(chainId),
    primaryType: "OrderParameters",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OfferItem: [
        { name: "item_type", type: "shortstring" },
        { name: "token", type: "ContractAddress" },
        { name: "identifier_or_criteria", type: "felt" },
        { name: "start_amount", type: "felt" },
        { name: "end_amount", type: "felt" }
      ],
      ConsiderationItem: [
        { name: "item_type", type: "shortstring" },
        { name: "token", type: "ContractAddress" },
        { name: "identifier_or_criteria", type: "felt" },
        { name: "start_amount", type: "felt" },
        { name: "end_amount", type: "felt" },
        { name: "recipient", type: "ContractAddress" }
      ],
      OrderParameters: [
        { name: "offerer", type: "ContractAddress" },
        { name: "offer", type: "OfferItem" },
        { name: "consideration", type: "ConsiderationItem" },
        { name: "start_time", type: "felt" },
        { name: "end_time", type: "felt" },
        { name: "salt", type: "felt" },
        { name: "nonce", type: "felt" }
      ]
    },
    message
  };
}
function build1155FulfillmentTypedData(message, chainId) {
  return {
    domain: domain1155(chainId),
    primaryType: "OrderFulfillment",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderFulfillment: [
        { name: "order_hash", type: "felt" },
        { name: "fulfiller", type: "ContractAddress" },
        { name: "quantity", type: "felt" },
        { name: "nonce", type: "felt" }
      ]
    },
    message
  };
}
function build1155CancellationTypedData(message, chainId) {
  return {
    domain: domain1155(chainId),
    primaryType: "OrderCancellation",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderCancellation: [
        { name: "order_hash", type: "felt" },
        { name: "offerer", type: "ContractAddress" },
        { name: "nonce", type: "felt" }
      ]
    },
    message
  };
}
function toSignatureArray2(sig) {
  if (Array.isArray(sig)) return sig;
  const s = sig;
  return [s.r.toString(), s.s.toString()];
}
function getChainId2(_config) {
  return starknet.constants.StarknetChainId.SN_MAIN;
}
var _providerCache2 = /* @__PURE__ */ new WeakMap();
var _contractCache2 = /* @__PURE__ */ new WeakMap();
function getProvider2(config) {
  let p = _providerCache2.get(config);
  if (!p) {
    p = new starknet.RpcProvider({ nodeUrl: config.rpcUrl });
    _providerCache2.set(config, p);
  }
  return p;
}
function getContract(config) {
  let c = _contractCache2.get(config);
  if (!c) {
    const provider = getProvider2(config);
    c = new starknet.Contract(
      Medialane1155ABI,
      config.marketplace1155Contract,
      provider
    );
    _contractCache2.set(config, c);
  }
  return c;
}
function resolveToken2(currency) {
  const token = SUPPORTED_TOKENS.find(
    (t) => t.symbol === currency.toUpperCase() || t.address.toLowerCase() === currency.toLowerCase()
  );
  if (!token) throw new MedialaneError(`Unsupported currency: ${currency}`, "INVALID_PARAMS");
  return token;
}
async function createListing1155(account, params, config) {
  const {
    nftContract,
    tokenId,
    amount,
    pricePerUnit,
    currency = DEFAULT_CURRENCY,
    durationSeconds
  } = params;
  const contract = getContract(config);
  const provider = getProvider2(config);
  const token = resolveToken2(currency);
  const priceWei = parseAmount(pricePerUnit, token.decimals);
  const now = Math.floor(Date.now() / 1e3);
  const endTime = now + durationSeconds;
  const saltBytes = new Uint8Array(4);
  crypto.getRandomValues(saltBytes);
  const salt = new DataView(saltBytes.buffer).getUint32(0).toString();
  const currentNonce = await contract.nonces(account.address);
  const chainId = getChainId2();
  const orderParams = {
    offerer: account.address,
    offer: {
      item_type: "ERC1155",
      token: nftContract,
      identifier_or_criteria: tokenId,
      start_amount: amount,
      end_amount: amount
    },
    consideration: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      start_amount: priceWei,
      end_amount: priceWei,
      recipient: account.address
    },
    start_time: now.toString(),
    end_time: endTime.toString(),
    salt,
    nonce: currentNonce.toString()
  };
  const typedData = stringifyBigInts(
    build1155OrderTypedData(orderParams, chainId)
  );
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray2(signature);
  const orderPayload = stringifyBigInts({
    parameters: orderParams,
    signature: signatureArray
  });
  let isApproved = false;
  try {
    const result = await provider.callContract({
      contractAddress: nftContract,
      entrypoint: "is_approved_for_all",
      calldata: [account.address, config.marketplace1155Contract]
    });
    isApproved = BigInt(result[0]) === 1n;
  } catch {
  }
  const registerCall = contract.populate("register_order", [orderPayload]);
  const calls = isApproved ? [registerCall] : [
    {
      contractAddress: nftContract,
      entrypoint: "set_approval_for_all",
      calldata: [config.marketplace1155Contract, "1"]
    },
    registerCall
  ];
  try {
    const tx = await account.execute(calls);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to create ERC-1155 listing", "TRANSACTION_FAILED", err);
  }
}
async function fulfillOrder1155(account, params, config) {
  const { orderHash, paymentToken, totalPrice, quantity = "1" } = params;
  const contract = getContract(config);
  const provider = getProvider2(config);
  const chainId = getChainId2();
  const currentNonce = await contract.nonces(account.address);
  const fulfillmentParams = {
    order_hash: orderHash,
    fulfiller: account.address,
    quantity,
    nonce: currentNonce.toString()
  };
  const typedData = stringifyBigInts(
    build1155FulfillmentTypedData(fulfillmentParams, chainId)
  );
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray2(signature);
  const fulfillPayload = stringifyBigInts({
    fulfillment: fulfillmentParams,
    signature: signatureArray
  });
  const totalPriceU256 = starknet.cairo.uint256(totalPrice);
  const approveCall = {
    contractAddress: paymentToken,
    entrypoint: "approve",
    calldata: [
      config.marketplace1155Contract,
      totalPriceU256.low.toString(),
      totalPriceU256.high.toString()
    ]
  };
  const fulfillCall = contract.populate("fulfill_order", [fulfillPayload]);
  try {
    const tx = await account.execute([approveCall, fulfillCall]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to fulfill ERC-1155 order", "TRANSACTION_FAILED", err);
  }
}
async function cancelOrder1155(account, params, config) {
  const { orderHash } = params;
  const contract = getContract(config);
  const provider = getProvider2(config);
  const chainId = getChainId2();
  const currentNonce = await contract.nonces(account.address);
  const cancelParams = {
    order_hash: orderHash,
    offerer: account.address,
    nonce: currentNonce.toString()
  };
  const typedData = stringifyBigInts(
    build1155CancellationTypedData(cancelParams, chainId)
  );
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray2(signature);
  const cancelPayload = stringifyBigInts({
    cancelation: cancelParams,
    signature: signatureArray
  });
  const cancelCall = contract.populate("cancel_order", [cancelPayload]);
  try {
    const tx = await account.execute(cancelCall);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to cancel ERC-1155 order", "TRANSACTION_FAILED", err);
  }
}

// src/marketplace1155/index.ts
var Medialane1155Module = class {
  constructor(config) {
    this.config = config;
  }
  // ─── Writes ───────────────────────────────────────────────────────────────
  /**
   * Create an ERC-1155 sell listing.
   * Optionally grants `set_approval_for_all` if not already approved.
   */
  createListing(account, params) {
    return createListing1155(account, params, this.config);
  }
  /**
   * Fulfill (buy) an ERC-1155 listing.
   * Approves the payment token then calls `fulfill_order` atomically.
   */
  fulfillOrder(account, params) {
    return fulfillOrder1155(account, params, this.config);
  }
  /**
   * Cancel an ERC-1155 listing (offerer only).
   */
  cancelOrder(account, params) {
    return cancelOrder1155(account, params, this.config);
  }
  // ─── Typed data builders (for ChipiPay / custom signing flows) ───────────
  buildListingTypedData(params, chainId) {
    return build1155OrderTypedData(params, chainId);
  }
  buildFulfillmentTypedData(params, chainId) {
    return build1155FulfillmentTypedData(params, chainId);
  }
  buildCancellationTypedData(params, chainId) {
    return build1155CancellationTypedData(params, chainId);
  }
};

// src/utils/address.ts
function normalizeAddress(address) {
  const hex = address.replace(/^0x/, "").toLowerCase();
  return "0x" + hex.padStart(64, "0");
}
function shortenAddress(address, chars = 4) {
  const norm = normalizeAddress(address);
  return `${norm.slice(0, chars + 2)}...${norm.slice(-chars)}`;
}

// src/utils/retry.ts
var DEFAULT_MAX_ATTEMPTS = 3;
var DEFAULT_BASE_DELAY_MS = 300;
var DEFAULT_MAX_DELAY_MS = 5e3;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function withRetry(fn, opts) {
  const maxAttempts = opts?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = opts?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = opts?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof MedialaneApiError && err.status < 500) {
        throw err;
      }
      const isRetryable = err instanceof MedialaneApiError && err.status >= 500 || err instanceof TypeError;
      if (!isRetryable || attempt === maxAttempts - 1) {
        throw err;
      }
      const jitter = Math.random() * baseDelayMs;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + jitter, maxDelayMs);
      await sleep(delay);
    }
  }
  throw lastError;
}

// src/api/client.ts
function deriveErrorCode(status) {
  if (status === 404) return "TOKEN_NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status === 410) return "INTENT_EXPIRED";
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 400) return "INVALID_PARAMS";
  return "UNKNOWN";
}
var MedialaneApiError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "MedialaneApiError";
    this.code = deriveErrorCode(status);
  }
};
var ApiClient = class {
  constructor(baseUrl, apiKey, retryOptions) {
    this.baseUrl = baseUrl;
    this.baseHeaders = apiKey ? { "x-api-key": apiKey } : {};
    this.retryOptions = retryOptions;
  }
  async request(path, init) {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const headers = { ...this.baseHeaders };
    if (!(init?.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const res = await withRetry(async () => {
      const response = await fetch(url, {
        ...init,
        headers: { ...headers, ...init?.headers }
      });
      if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        let message = text;
        try {
          const body = JSON.parse(text);
          if (body.error) message = body.error;
        } catch {
        }
        throw new MedialaneApiError(response.status, message);
      }
      return response;
    }, this.retryOptions);
    return res.json();
  }
  get(path) {
    return this.request(path, { method: "GET" });
  }
  post(path, body) {
    return this.request(path, { method: "POST", body: JSON.stringify(body) });
  }
  patch(path, body) {
    return this.request(path, { method: "PATCH", body: JSON.stringify(body) });
  }
  del(path) {
    return this.request(path, { method: "DELETE" });
  }
  // ─── Orders ────────────────────────────────────────────────────────────────
  getOrders(query = {}) {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.collection) params.set("collection", query.collection);
    if (query.currency) params.set("currency", query.currency);
    if (query.sort) params.set("sort", query.sort);
    if (query.page !== void 0) params.set("page", String(query.page));
    if (query.limit !== void 0) params.set("limit", String(query.limit));
    if (query.offerer) params.set("offerer", normalizeAddress(query.offerer));
    if (query.minPrice) params.set("minPrice", query.minPrice);
    if (query.maxPrice) params.set("maxPrice", query.maxPrice);
    const qs = params.toString();
    return this.get(`/v1/orders${qs ? `?${qs}` : ""}`);
  }
  getOrder(orderHash) {
    return this.get(`/v1/orders/${orderHash}`);
  }
  getActiveOrdersForToken(contract, tokenId) {
    return this.get(`/v1/orders/token/${normalizeAddress(contract)}/${tokenId}`);
  }
  getOrdersByUser(address, page = 1, limit = 20) {
    return this.get(
      `/v1/orders/user/${normalizeAddress(address)}?page=${page}&limit=${limit}`
    );
  }
  // ─── Tokens ────────────────────────────────────────────────────────────────
  getToken(contract, tokenId, wait = false) {
    return this.get(
      `/v1/tokens/${contract}/${tokenId}${wait ? "?wait=true" : ""}`
    );
  }
  getTokensByOwner(address, page = 1, limit = 20) {
    return this.get(
      `/v1/tokens/owned/${normalizeAddress(address)}?page=${page}&limit=${limit}`
    );
  }
  getTokenHistory(contract, tokenId, page = 1, limit = 20) {
    return this.get(
      `/v1/tokens/${contract}/${tokenId}/history?page=${page}&limit=${limit}`
    );
  }
  // ─── Collections ───────────────────────────────────────────────────────────
  getCollections(page = 1, limit = 20, isKnown, sort, source) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (isKnown !== void 0) params.set("isKnown", String(isKnown));
    if (sort) params.set("sort", sort);
    if (source) params.set("source", source);
    return this.get(`/v1/collections?${params}`);
  }
  getCollectionsByOwner(owner, page = 1, limit = 50) {
    const params = new URLSearchParams({ owner: normalizeAddress(owner), page: String(page), limit: String(limit) });
    return this.get(`/v1/collections?${params}`);
  }
  getCollection(contract) {
    return this.get(`/v1/collections/${normalizeAddress(contract)}`);
  }
  getCollectionTokens(contract, page = 1, limit = 20) {
    return this.get(
      `/v1/collections/${normalizeAddress(contract)}/tokens?page=${page}&limit=${limit}`
    );
  }
  // ─── Activities ────────────────────────────────────────────────────────────
  getActivities(query = {}) {
    const params = new URLSearchParams();
    if (query.type) params.set("type", query.type);
    if (query.page !== void 0) params.set("page", String(query.page));
    if (query.limit !== void 0) params.set("limit", String(query.limit));
    const qs = params.toString();
    return this.get(`/v1/activities${qs ? `?${qs}` : ""}`);
  }
  getActivitiesByAddress(address, page = 1, limit = 20) {
    return this.get(
      `/v1/activities/${normalizeAddress(address)}?page=${page}&limit=${limit}`
    );
  }
  // ─── Comments ──────────────────────────────────────────────────────────────
  getTokenComments(contract, tokenId, opts = {}) {
    const params = new URLSearchParams();
    if (opts.page !== void 0) params.set("page", String(opts.page));
    if (opts.limit !== void 0) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return this.get(
      `/v1/tokens/${normalizeAddress(contract)}/${tokenId}/comments${qs ? `?${qs}` : ""}`
    );
  }
  // ─── Search ────────────────────────────────────────────────────────────────
  search(q, limit = 10) {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return this.get(
      `/v1/search?${params.toString()}`
    );
  }
  // ─── Intents ───────────────────────────────────────────────────────────────
  createListingIntent(params) {
    return this.post("/v1/intents/listing", params);
  }
  createOfferIntent(params) {
    return this.post("/v1/intents/offer", params);
  }
  createFulfillIntent(params) {
    return this.post("/v1/intents/fulfill", params);
  }
  createCancelIntent(params) {
    return this.post("/v1/intents/cancel", params);
  }
  getIntent(id) {
    return this.get(`/v1/intents/${id}`);
  }
  submitIntentSignature(id, signature) {
    return this.patch(`/v1/intents/${id}/signature`, { signature });
  }
  confirmIntent(id, txHash) {
    return this.patch(`/v1/intents/${id}/confirm`, { txHash });
  }
  createMintIntent(params) {
    return this.post("/v1/intents/mint", params);
  }
  createCollectionIntent(params) {
    return this.post("/v1/intents/create-collection", params);
  }
  /**
   * Create a counter-offer intent. The seller proposes a new price in response
   * to a buyer's active bid. clerkToken is optional — the endpoint authenticates
   * via the tenant API key; pass a Clerk JWT only if your backend requires it.
   */
  createCounterOfferIntent(params, clerkToken) {
    const extraHeaders = clerkToken ? { "Authorization": `Bearer ${clerkToken}` } : {};
    return this.request("/v1/intents/counter-offer", {
      method: "POST",
      body: JSON.stringify(params),
      headers: extraHeaders
    });
  }
  /**
   * Fetch counter-offers. Pass `originalOrderHash` (buyer view) or
   * `sellerAddress` (seller view) — at least one is required.
   */
  getCounterOffers(query) {
    const params = new URLSearchParams();
    if (query.originalOrderHash) params.set("originalOrderHash", query.originalOrderHash);
    if (query.sellerAddress) params.set("sellerAddress", query.sellerAddress);
    if (query.page !== void 0) params.set("page", String(query.page));
    if (query.limit !== void 0) params.set("limit", String(query.limit));
    return this.get(`/v1/orders/counter-offers?${params}`);
  }
  // ─── Metadata ──────────────────────────────────────────────────────────────
  getMetadataSignedUrl() {
    return this.get("/v1/metadata/signed-url");
  }
  uploadMetadata(metadata) {
    return this.post("/v1/metadata/upload", metadata);
  }
  resolveMetadata(uri) {
    const params = new URLSearchParams({ uri });
    return this.get(`/v1/metadata/resolve?${params.toString()}`);
  }
  uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request("/v1/metadata/upload-file", {
      method: "POST",
      body: formData
    });
  }
  // ─── Portal (tenant self-service) ──────────────────────────────────────────
  getMe() {
    return this.get("/v1/portal/me");
  }
  getApiKeys() {
    return this.get("/v1/portal/keys");
  }
  createApiKey(label) {
    return this.post("/v1/portal/keys", label ? { label } : {});
  }
  deleteApiKey(id) {
    return this.del(`/v1/portal/keys/${id}`);
  }
  getUsage() {
    return this.get("/v1/portal/usage");
  }
  getWebhooks() {
    return this.get("/v1/portal/webhooks");
  }
  createWebhook(params) {
    return this.post("/v1/portal/webhooks", params);
  }
  deleteWebhook(id) {
    return this.del(
      `/v1/portal/webhooks/${id}`
    );
  }
  // ─── Collection Claims ──────────────────────────────────────────────────────
  /**
   * Path 1: On-chain auto claim. Sends both x-api-key (tenant auth) and
   * Authorization: Bearer (Clerk JWT) simultaneously.
   */
  async claimCollection(contractAddress, walletAddress, clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/claim`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": this.baseHeaders["x-api-key"] ?? "",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkToken}`
      },
      body: JSON.stringify({ contractAddress, walletAddress })
    });
    return res.json();
  }
  /**
   * Path 3: Manual off-chain claim request (email-based).
   */
  requestCollectionClaim(params) {
    return this.request("/v1/collections/claim/request", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  // ─── Collection Profiles ────────────────────────────────────────────────────
  async getCollectionProfile(contractAddress) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/${normalizeAddress(contractAddress)}/profile`;
    const res = await fetch(url, { headers: this.baseHeaders });
    if (res.status === 404) return null;
    return res.json();
  }
  /**
   * Update collection profile. Requires Clerk JWT for ownership check.
   */
  async updateCollectionProfile(contractAddress, data, clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/${normalizeAddress(contractAddress)}/profile`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "x-api-key": this.baseHeaders["x-api-key"] ?? "",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkToken}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }
  async getGatedContent(contractAddress, clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/${normalizeAddress(contractAddress)}/gated-content`;
    const res = await fetch(url, {
      headers: { ...this.baseHeaders, "Authorization": `Bearer ${clerkToken}` }
    });
    if (res.status === 403 || res.status === 404) return null;
    return res.json();
  }
  // ─── Creator Profiles ───────────────────────────────────────────────────────
  /** List all creators with an approved username. */
  async getCreators(opts = {}) {
    const params = new URLSearchParams();
    if (opts.search) params.set("search", opts.search);
    if (opts.page) params.set("page", String(opts.page));
    if (opts.limit) params.set("limit", String(opts.limit));
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators?${params}`;
    const res = await fetch(url, { headers: this.baseHeaders });
    return res.json();
  }
  async getCreatorProfile(walletAddress) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators/${normalizeAddress(walletAddress)}/profile`;
    const res = await fetch(url, { headers: this.baseHeaders });
    if (res.status === 404) return null;
    return res.json();
  }
  /** Resolve a username slug to a creator profile (public). */
  async getCreatorByUsername(username) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators/by-username/${encodeURIComponent(username.toLowerCase().trim())}`;
    const res = await fetch(url, { headers: this.baseHeaders });
    if (res.status === 404) return null;
    return res.json();
  }
  /**
   * Update creator profile. Requires Clerk JWT; wallet must match authenticated user.
   */
  async updateCreatorProfile(walletAddress, data, clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators/${normalizeAddress(walletAddress)}/profile`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "x-api-key": this.baseHeaders["x-api-key"] ?? "",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkToken}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }
  // ─── User Wallet ─────────────────────────────────────────────────────────────
  /**
   * Upsert the authenticated user's wallet address in the backend DB.
   * Call after onboarding when ChipiPay confirms the wallet address.
   * Requires Clerk JWT; no tenant API key needed.
   */
  async upsertMyWallet(clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/users/me`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkToken}`
      }
    });
    return res.json();
  }
  /**
   * Get the authenticated user's stored wallet address from the backend DB.
   * Returns null if the user has not completed onboarding yet.
   * Requires Clerk JWT; no tenant API key needed.
   */
  async getMyWallet(clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/users/me`;
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
    if (res.status === 404) return null;
    return res.json();
  }
  // ─── Remix Licensing ─────────────────────────────────────────────────────────
  /**
   * Get public remixes of a token (open to everyone).
   */
  getTokenRemixes(contract, tokenId, opts = {}) {
    const params = new URLSearchParams();
    if (opts.page !== void 0) params.set("page", String(opts.page));
    if (opts.limit !== void 0) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return this.get(
      `/v1/tokens/${normalizeAddress(contract)}/${tokenId}/remixes${qs ? `?${qs}` : ""}`
    );
  }
  /**
   * Submit a custom remix offer for a token. Requires Clerk JWT.
   */
  submitRemixOffer(params, clerkToken) {
    return this.request("/v1/remix-offers", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  /**
   * Submit an auto remix offer for a token with an open license. Requires Clerk JWT.
   */
  submitAutoRemixOffer(params, clerkToken) {
    return this.request("/v1/remix-offers/auto", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  /**
   * Record a self-remix (owner remixing their own token). Requires Clerk JWT.
   */
  confirmSelfRemix(params, clerkToken) {
    return this.request("/v1/remix-offers/self/confirm", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  /**
   * List remix offers by role. Requires Clerk JWT.
   * role="creator" — offers where you are the original creator.
   * role="requester" — offers you made.
   */
  async getRemixOffers(query, clerkToken) {
    const params = new URLSearchParams({ role: query.role });
    if (query.page !== void 0) params.set("page", String(query.page));
    if (query.limit !== void 0) params.set("limit", String(query.limit));
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/remix-offers?${params}`;
    const res = await fetch(url, {
      headers: { ...this.baseHeaders, "Authorization": `Bearer ${clerkToken}` }
    });
    return res.json();
  }
  /**
   * Get a single remix offer. Clerk JWT optional (price/currency hidden for non-participants).
   */
  async getRemixOffer(id, clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/remix-offers/${id}`;
    const headers = { ...this.baseHeaders };
    if (clerkToken) headers["Authorization"] = `Bearer ${clerkToken}`;
    const res = await fetch(url, { headers });
    return res.json();
  }
  /**
   * Creator approves a remix offer (authorises the requester to mint). Requires Clerk JWT.
   */
  confirmRemixOffer(id, params, clerkToken) {
    return this.request(`/v1/remix-offers/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  /**
   * Creator rejects a remix offer. Requires Clerk JWT.
   */
  rejectRemixOffer(id, clerkToken) {
    return this.request(`/v1/remix-offers/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  /**
   * Requester extends the expiry of a pending remix offer by 1–30 days.
   * Requires Clerk JWT.
   */
  extendRemixOffer(id, days, clerkToken) {
    return this.request(`/v1/remix-offers/${id}/extend`, {
      method: "POST",
      body: JSON.stringify({ days }),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  // ─── POP Protocol ──────────────────────────────────────────────────────────
  getPopCollections(opts = {}) {
    return this.getCollections(opts.page ?? 1, opts.limit ?? 20, void 0, opts.sort, "POP_PROTOCOL");
  }
  async getPopEligibility(collection, wallet) {
    const res = await this.get(
      `/v1/pop/eligibility/${normalizeAddress(collection)}/${normalizeAddress(wallet)}`
    );
    return res.data;
  }
  async getPopEligibilityBatch(collection, wallets) {
    const params = new URLSearchParams({ wallets: wallets.map(normalizeAddress).join(",") });
    const res = await this.get(
      `/v1/pop/eligibility/${normalizeAddress(collection)}?${params}`
    );
    return res.data;
  }
  // ─── Collection Drop ────────────────────────────────────────────────────────
  getDropCollections(opts = {}) {
    return this.getCollections(opts.page ?? 1, opts.limit ?? 20, void 0, opts.sort, "COLLECTION_DROP");
  }
  async getDropMintStatus(collection, wallet) {
    const res = await this.get(
      `/v1/drop/mint-status/${normalizeAddress(collection)}/${normalizeAddress(wallet)}`
    );
    return res.data;
  }
};
var PopService = class {
  constructor(_config) {
    this.factoryAddress = POP_FACTORY_CONTRACT_MAINNET;
  }
  _collection(address, account) {
    return new starknet.Contract(POPCollectionABI, normalizeAddress(address), account);
  }
  async claim(account, collectionAddress) {
    const call = this._collection(collectionAddress, account).populate("claim", []);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async adminMint(account, params) {
    const call = this._collection(params.collection, account).populate("admin_mint", [
      params.recipient,
      params.customUri ?? ""
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async addToAllowlist(account, params) {
    const call = this._collection(params.collection, account).populate("add_to_allowlist", [params.address]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async batchAddToAllowlist(account, params) {
    const collection = this._collection(params.collection, account);
    const CHUNK = 200;
    const calls = [];
    for (let i = 0; i < params.addresses.length; i += CHUNK) {
      calls.push(collection.populate("batch_add_to_allowlist", [params.addresses.slice(i, i + CHUNK)]));
    }
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }
  async removeFromAllowlist(account, params) {
    const call = this._collection(params.collection, account).populate("remove_from_allowlist", [params.address]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async setTokenUri(account, params) {
    const call = this._collection(params.collection, account).populate("set_token_uri", [
      BigInt(params.tokenId),
      params.uri
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async setPaused(account, params) {
    const call = this._collection(params.collection, account).populate("set_paused", [params.paused]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async createCollection(account, params) {
    const factory = new starknet.Contract(POPFactoryABI, this.factoryAddress, account);
    const call = factory.populate("create_collection", [
      params.name,
      params.symbol,
      params.baseUri,
      params.claimEndTime,
      { [params.eventType]: {} }
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
};
function toContractConditions(c) {
  return {
    start_time: c.startTime,
    end_time: c.endTime,
    price: BigInt(c.price),
    payment_token: c.paymentToken,
    max_quantity_per_wallet: BigInt(c.maxQuantityPerWallet)
  };
}
var DropService = class {
  constructor(_config) {
    this.factoryAddress = DROP_FACTORY_CONTRACT_MAINNET;
  }
  _collection(address, account) {
    return new starknet.Contract(DropCollectionABI, normalizeAddress(address), account);
  }
  async claim(account, collectionAddress, quantity = 1) {
    const call = this._collection(collectionAddress, account).populate("claim", [BigInt(quantity)]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async adminMint(account, params) {
    const call = this._collection(params.collection, account).populate("admin_mint", [
      params.recipient,
      BigInt(params.quantity ?? 1),
      params.customUri ?? ""
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async setClaimConditions(account, params) {
    const call = this._collection(params.collection, account).populate("set_claim_conditions", [
      toContractConditions(params.conditions)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async setAllowlistEnabled(account, params) {
    const call = this._collection(params.collection, account).populate("set_allowlist_enabled", [params.enabled]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async addToAllowlist(account, params) {
    const call = this._collection(params.collection, account).populate("add_to_allowlist", [params.address]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async batchAddToAllowlist(account, params) {
    const collection = this._collection(params.collection, account);
    const CHUNK = 200;
    const calls = [];
    for (let i = 0; i < params.addresses.length; i += CHUNK) {
      calls.push(collection.populate("batch_add_to_allowlist", [params.addresses.slice(i, i + CHUNK)]));
    }
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }
  async setPaused(account, params) {
    const call = this._collection(params.collection, account).populate("set_paused", [params.paused]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async withdrawPayments(account, params) {
    const call = this._collection(params.collection, account).populate("withdraw_payments", []);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async createDrop(account, params) {
    const factory = new starknet.Contract(DropFactoryABI, this.factoryAddress, account);
    const call = factory.populate("create_drop", [
      params.name,
      params.symbol,
      params.baseUri,
      BigInt(params.maxSupply),
      toContractConditions(params.initialConditions)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
};

// src/client.ts
var MedialaneClient = class {
  constructor(rawConfig = {}) {
    this.config = resolveConfig(rawConfig);
    this.marketplace = new MarketplaceModule(this.config);
    this.marketplace1155 = new Medialane1155Module(this.config);
    this.services = {
      pop: new PopService(this.config),
      drop: new DropService(this.config)
    };
    if (!this.config.backendUrl) {
      this.api = new Proxy({}, {
        get(_target, prop) {
          return () => {
            throw new Error(
              `backendUrl not configured. Pass backendUrl to MedialaneClient to use .api.${String(prop)}()`
            );
          };
        }
      });
    } else {
      this.api = new ApiClient(this.config.backendUrl, this.config.apiKey, this.config.retryOptions);
    }
  }
  get network() {
    return this.config.network;
  }
  get rpcUrl() {
    return this.config.rpcUrl;
  }
  get marketplaceContract() {
    return this.config.marketplaceContract;
  }
};

// src/types/api.ts
var OPEN_LICENSES = ["CC0", "CC BY", "CC BY-SA", "CC BY-NC"];
var ERC1155CollectionService = class {
  constructor(config) {
    this.factoryAddress = config.collection1155Contract ?? COLLECTION_1155_CONTRACT_MAINNET;
  }
  _factory(account) {
    return new starknet.Contract(
      IPCollection1155FactoryABI,
      normalizeAddress(this.factoryAddress),
      account
    );
  }
  _collection(address, account) {
    return new starknet.Contract(
      IPCollection1155ABI,
      normalizeAddress(address),
      account
    );
  }
  /**
   * Deploy a new ERC-1155 IP collection.
   * Caller becomes the collection owner and can mint items.
   * Returns the transaction hash; the deployed collection address is emitted
   * in the `CollectionDeployed` event of the factory.
   */
  async deployCollection(account, params) {
    const factory = this._factory(account);
    const call = factory.populate("deploy_collection", [params.name, params.symbol, params.baseUri]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Mint a single token into an existing ERC-1155 collection.
   * Caller must be the collection owner.
   * The `tokenUri` is immutable — validated and stored on the first mint only.
   */
  async mintItem(account, params) {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("mint_item", [
      params.to,
      BigInt(params.tokenId),
      BigInt(params.value),
      params.tokenUri
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Batch-mint multiple token IDs into an existing ERC-1155 collection.
   * All items go to the same `to` address.
   * Caller must be the collection owner.
   */
  async batchMintItem(account, params) {
    const collection = this._collection(params.collection, account);
    const tokenIds = params.items.map((i) => BigInt(i.tokenId));
    const values = params.items.map((i) => BigInt(i.value));
    const tokenUris = params.items.map((i) => i.tokenUri);
    const call = collection.populate("batch_mint_item", [
      params.to,
      tokenIds,
      values,
      tokenUris
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Set the default ERC-2981 royalty for the entire collection.
   * `feeNumerator` is out of 10 000 (e.g. 500 = 5%).
   * Caller must be the collection owner.
   */
  async setDefaultRoyalty(account, params) {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("set_default_royalty", [
      params.receiver,
      BigInt(params.feeNumerator)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Set a per-token ERC-2981 royalty override.
   * `feeNumerator` is out of 10 000. Caller must be the collection owner.
   */
  async setTokenRoyalty(account, params) {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("set_token_royalty", [
      BigInt(params.tokenId),
      params.receiver,
      BigInt(params.feeNumerator)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Approve the Medialane1155 marketplace (or any operator) to transfer
   * all tokens on behalf of `account`. Required before listing.
   */
  async setApprovalForAll(account, params) {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("set_approval_for_all", [
      params.operator,
      params.approved
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
};

exports.ApiClient = ApiClient;
exports.COLLECTION_1155_CLASS_HASH_MAINNET = COLLECTION_1155_CLASS_HASH_MAINNET;
exports.COLLECTION_1155_CONTRACT_MAINNET = COLLECTION_1155_CONTRACT_MAINNET;
exports.COLLECTION_721_CONTRACT_MAINNET = COLLECTION_721_CONTRACT_MAINNET;
exports.COLLECTION_CONTRACT_MAINNET = COLLECTION_CONTRACT_MAINNET;
exports.CollectionRegistryABI = CollectionRegistryABI;
exports.DEFAULT_RPC_URL = DEFAULT_RPC_URL;
exports.DROP_COLLECTION_CLASS_HASH_MAINNET = DROP_COLLECTION_CLASS_HASH_MAINNET;
exports.DROP_FACTORY_CONTRACT_MAINNET = DROP_FACTORY_CONTRACT_MAINNET;
exports.DropCollectionABI = DropCollectionABI;
exports.DropFactoryABI = DropFactoryABI;
exports.DropService = DropService;
exports.ERC1155CollectionService = ERC1155CollectionService;
exports.ERC1155_COLLECTION_CLASS_HASH_MAINNET = ERC1155_COLLECTION_CLASS_HASH_MAINNET;
exports.ERC1155_FACTORY_CONTRACT_MAINNET = ERC1155_FACTORY_CONTRACT_MAINNET;
exports.INDEXER_START_BLOCK_MAINNET = INDEXER_START_BLOCK_MAINNET;
exports.IPCollection1155ABI = IPCollection1155ABI;
exports.IPCollection1155FactoryABI = IPCollection1155FactoryABI;
exports.IPMarketplaceABI = IPMarketplaceABI;
exports.MARKETPLACE_1155_CLASS_HASH_MAINNET = MARKETPLACE_1155_CLASS_HASH_MAINNET;
exports.MARKETPLACE_1155_CONTRACT_MAINNET = MARKETPLACE_1155_CONTRACT_MAINNET;
exports.MARKETPLACE_1155_START_BLOCK_MAINNET = MARKETPLACE_1155_START_BLOCK_MAINNET;
exports.MARKETPLACE_721_CLASS_HASH_MAINNET = MARKETPLACE_721_CLASS_HASH_MAINNET;
exports.MARKETPLACE_721_CONTRACT_MAINNET = MARKETPLACE_721_CONTRACT_MAINNET;
exports.MARKETPLACE_721_START_BLOCK_MAINNET = MARKETPLACE_721_START_BLOCK_MAINNET;
exports.MARKETPLACE_CLASS_HASH_MAINNET = MARKETPLACE_CLASS_HASH_MAINNET;
exports.MARKETPLACE_CONTRACT_MAINNET = MARKETPLACE_CONTRACT_MAINNET;
exports.MARKETPLACE_START_BLOCK_MAINNET = MARKETPLACE_START_BLOCK_MAINNET;
exports.MarketplaceModule = MarketplaceModule;
exports.Medialane1155ABI = Medialane1155ABI;
exports.Medialane1155Module = Medialane1155Module;
exports.MedialaneApiError = MedialaneApiError;
exports.MedialaneClient = MedialaneClient;
exports.MedialaneError = MedialaneError;
exports.NFTCOMMENTS_CONTRACT_MAINNET = NFTCOMMENTS_CONTRACT_MAINNET;
exports.OPEN_LICENSES = OPEN_LICENSES;
exports.POPCollectionABI = POPCollectionABI;
exports.POPFactoryABI = POPFactoryABI;
exports.POP_COLLECTION_CLASS_HASH_MAINNET = POP_COLLECTION_CLASS_HASH_MAINNET;
exports.POP_FACTORY_CONTRACT_MAINNET = POP_FACTORY_CONTRACT_MAINNET;
exports.PopService = PopService;
exports.SUPPORTED_NETWORKS = SUPPORTED_NETWORKS;
exports.SUPPORTED_TOKENS = SUPPORTED_TOKENS;
exports.build1155CancellationTypedData = build1155CancellationTypedData;
exports.build1155FulfillmentTypedData = build1155FulfillmentTypedData;
exports.build1155OrderTypedData = build1155OrderTypedData;
exports.buildCancellationTypedData = buildCancellationTypedData;
exports.buildFulfillmentTypedData = buildFulfillmentTypedData;
exports.buildOrderTypedData = buildOrderTypedData;
exports.formatAmount = formatAmount;
exports.getListableTokens = getListableTokens;
exports.getTokenByAddress = getTokenByAddress;
exports.getTokenBySymbol = getTokenBySymbol;
exports.normalizeAddress = normalizeAddress;
exports.parseAmount = parseAmount;
exports.resolveConfig = resolveConfig;
exports.shortenAddress = shortenAddress;
exports.stringifyBigInts = stringifyBigInts;
exports.u256ToBigInt = u256ToBigInt;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map