// Auto-generated from on-chain ABI at contract:
// 0x059deafbbafbf7051c315cf75a94b03c5547892bc0c6dfa36d7ac7290d4cc33a
// Fetched on 2026-02-16

export const IPMarketplaceABI = [
  {
    type: "impl",
    name: "UpgradeableImpl",
    interface_name: "openzeppelin_upgrades::interface::IUpgradeable",
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
        state_mutability: "external",
      },
    ],
  },
  {
    type: "impl",
    name: "MedialaneImpl",
    interface_name: "mediolano_core::core::interface::IMedialane",
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OfferItem",
    members: [
      { name: "item_type", type: "core::felt252" },
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "identifier_or_criteria", type: "core::felt252" },
      { name: "start_amount", type: "core::felt252" },
      { name: "end_amount", type: "core::felt252" },
    ],
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
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
    ],
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
      { name: "nonce", type: "core::felt252" },
    ],
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::Order",
    members: [
      { name: "parameters", type: "mediolano_core::core::types::OrderParameters" },
      { name: "signature", type: "core::array::Array::<core::felt252>" },
    ],
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OrderFulfillment",
    members: [
      { name: "order_hash", type: "core::felt252" },
      { name: "fulfiller", type: "core::starknet::contract_address::ContractAddress" },
      { name: "nonce", type: "core::felt252" },
    ],
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::FulfillmentRequest",
    members: [
      { name: "fulfillment", type: "mediolano_core::core::types::OrderFulfillment" },
      { name: "signature", type: "core::array::Array::<core::felt252>" },
    ],
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OrderCancellation",
    members: [
      { name: "order_hash", type: "core::felt252" },
      { name: "offerer", type: "core::starknet::contract_address::ContractAddress" },
      { name: "nonce", type: "core::felt252" },
    ],
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::CancelRequest",
    members: [
      { name: "cancelation", type: "mediolano_core::core::types::OrderCancellation" },
      { name: "signature", type: "core::array::Array::<core::felt252>" },
    ],
  },
  {
    type: "enum",
    name: "mediolano_core::core::types::OrderStatus",
    variants: [
      { name: "None", type: "()" },
      { name: "Created", type: "()" },
      { name: "Filled", type: "()" },
      { name: "Cancelled", type: "()" },
    ],
  },
  {
    type: "enum",
    name: "core::option::Option::<core::starknet::contract_address::ContractAddress>",
    variants: [
      { name: "Some", type: "core::starknet::contract_address::ContractAddress" },
      { name: "None", type: "()" },
    ],
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
        type: "core::option::Option::<core::starknet::contract_address::ContractAddress>",
      },
    ],
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
        state_mutability: "external",
      },
      {
        type: "function",
        name: "fulfill_order",
        inputs: [
          {
            name: "fulfillment_request",
            type: "mediolano_core::core::types::FulfillmentRequest",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "cancel_order",
        inputs: [{ name: "cancel_request", type: "mediolano_core::core::types::CancelRequest" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_order_details",
        inputs: [{ name: "order_hash", type: "core::felt252" }],
        outputs: [{ type: "mediolano_core::core::types::OrderDetails" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_order_hash",
        inputs: [
          { name: "parameters", type: "mediolano_core::core::types::OrderParameters" },
          { name: "signer", type: "core::starknet::contract_address::ContractAddress" },
        ],
        outputs: [{ type: "core::felt252" }],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "impl",
    name: "NoncesImpl",
    interface_name: "openzeppelin_utils::cryptography::interface::INonces",
  },
  {
    type: "interface",
    name: "openzeppelin_utils::cryptography::interface::INonces",
    items: [
      {
        type: "function",
        name: "nonces",
        inputs: [
          { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
        ],
        outputs: [{ type: "core::felt252" }],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "impl",
    name: "SRC5Impl",
    interface_name: "openzeppelin_introspection::interface::ISRC5",
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      { name: "False", type: "()" },
      { name: "True", type: "()" },
    ],
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
        state_mutability: "view",
      },
    ],
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      { name: "manager", type: "core::starknet::contract_address::ContractAddress" },
      { name: "native_token_address", type: "core::starknet::contract_address::ContractAddress" },
    ],
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
        kind: "key",
      },
    ],
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
        kind: "key",
      },
      {
        name: "fulfiller",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
    ],
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
        kind: "key",
      },
    ],
  },
  {
    type: "event",
    name: "mediolano_core::core::medialane::Medialane::Event",
    kind: "enum",
    variants: [
      {
        name: "OrderCreated",
        type: "mediolano_core::core::events::OrderCreated",
        kind: "nested",
      },
      {
        name: "OrderFulfilled",
        type: "mediolano_core::core::events::OrderFulfilled",
        kind: "nested",
      },
      {
        name: "OrderCancelled",
        type: "mediolano_core::core::events::OrderCancelled",
        kind: "nested",
      },
    ],
  },
] as const;

export const POPCollectionABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" },
    ],
  },
  {
    type: "function",
    name: "claim",
    inputs: [],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "admin_mint",
    inputs: [
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "custom_uri", type: "core::byte_array::ByteArray" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "add_to_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "batch_add_to_allowlist",
    inputs: [{ name: "addresses", type: "core::array::Array::<core::starknet::contract_address::ContractAddress>" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "remove_from_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "set_token_uri",
    inputs: [
      { name: "token_id", type: "core::integer::u256" },
      { name: "uri", type: "core::byte_array::ByteArray" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "set_paused",
    inputs: [{ name: "paused", type: "core::bool" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "is_eligible",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "has_claimed",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "total_minted",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
] as const;

export const POPFactoryABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" },
    ],
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
      { name: "Other", type: "()" },
    ],
  },
  {
    type: "function",
    name: "create_collection",
    inputs: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
      { name: "claim_end_time", type: "core::integer::u64" },
      { name: "event_type", type: "pop_protocol::types::EventType" },
    ],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "register_provider",
    inputs: [
      { name: "provider", type: "core::starknet::contract_address::ContractAddress" },
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "website_url", type: "core::byte_array::ByteArray" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "set_pop_collection_class_hash",
    inputs: [{ name: "new_class_hash", type: "core::starknet::class_hash::ClassHash" }],
    outputs: [],
    state_mutability: "external",
  },
] as const;

export const DropCollectionABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" },
    ],
  },
  {
    type: "struct",
    name: "collection_drop::types::ClaimConditions",
    members: [
      { name: "start_time", type: "core::integer::u64" },
      { name: "end_time", type: "core::integer::u64" },
      { name: "price", type: "core::integer::u256" },
      { name: "payment_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "max_quantity_per_wallet", type: "core::integer::u256" },
    ],
  },
  {
    type: "function",
    name: "claim",
    inputs: [{ name: "quantity", type: "core::integer::u256" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "admin_mint",
    inputs: [
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "quantity", type: "core::integer::u256" },
      { name: "custom_uri", type: "core::byte_array::ByteArray" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "set_claim_conditions",
    inputs: [{ name: "conditions", type: "collection_drop::types::ClaimConditions" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "get_claim_conditions",
    inputs: [],
    outputs: [{ type: "collection_drop::types::ClaimConditions" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "set_allowlist_enabled",
    inputs: [{ name: "enabled", type: "core::bool" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "is_allowlist_enabled",
    inputs: [],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "add_to_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "batch_add_to_allowlist",
    inputs: [{ name: "addresses", type: "core::array::Array::<core::starknet::contract_address::ContractAddress>" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "remove_from_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "is_allowlisted",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "set_base_uri",
    inputs: [{ name: "new_uri", type: "core::byte_array::ByteArray" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "set_token_uri",
    inputs: [
      { name: "token_id", type: "core::integer::u256" },
      { name: "uri", type: "core::byte_array::ByteArray" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "set_paused",
    inputs: [{ name: "paused", type: "core::bool" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "withdraw_payments",
    inputs: [],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "get_drop_id",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_max_supply",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "total_minted",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "remaining_supply",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "minted_by_wallet",
    inputs: [{ name: "wallet", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "is_paused",
    inputs: [],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
] as const;

export const DropFactoryABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" },
    ],
  },
  {
    type: "struct",
    name: "collection_drop::types::ClaimConditions",
    members: [
      { name: "start_time", type: "core::integer::u64" },
      { name: "end_time", type: "core::integer::u64" },
      { name: "price", type: "core::integer::u256" },
      { name: "payment_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "max_quantity_per_wallet", type: "core::integer::u256" },
    ],
  },
  {
    type: "function",
    name: "register_organizer",
    inputs: [
      { name: "organizer", type: "core::starknet::contract_address::ContractAddress" },
      { name: "name", type: "core::byte_array::ByteArray" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "revoke_organizer",
    inputs: [{ name: "organizer", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "is_active_organizer",
    inputs: [{ name: "organizer", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "create_drop",
    inputs: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
      { name: "max_supply", type: "core::integer::u256" },
      { name: "initial_conditions", type: "collection_drop::types::ClaimConditions" },
    ],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "get_drop_address",
    inputs: [{ name: "drop_id", type: "core::integer::u256" }],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_last_drop_id",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_organizer_drop_count",
    inputs: [{ name: "organizer", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u32" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "set_drop_collection_class_hash",
    inputs: [{ name: "new_class_hash", type: "core::starknet::class_hash::ClassHash" }],
    outputs: [],
    state_mutability: "external",
  },
] as const;

// Collection Registry ABI — minimal subset for list_user_collections + get_collection
// Contract: 0x05c49ee5d3208a2c2e150fdd0c247d1195ed9ab54fa2d5dea7a633f39e4b205b
// Fetched on 2026-04-10
export const CollectionRegistryABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" },
    ],
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
      { name: "is_active", type: "core::bool" },
    ],
  },
  {
    type: "function",
    name: "list_user_collections",
    inputs: [{ name: "user", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::array::Span::<core::integer::u256>" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_collection",
    inputs: [{ name: "collection_id", type: "core::integer::u256" }],
    outputs: [{ type: "ip_collection_erc_721::types::Collection" }],
    state_mutability: "view",
  },
] as const;

// ─── Medialane1155 ABI ───────────────────────────────────────────────────────
// Auto-generated from on-chain ABI at contract:
// 0x03aab04e806542cd88bfd0c5bb2a37334fd742d477a2e0f97af09aa4a36137ca
// Deployed 2026-04-20

export const Medialane1155ABI = [
  {
    "type": "impl",
    "name": "UpgradeableImpl",
    "interface_name": "openzeppelin_upgrades::interface::IUpgradeable"
  },
  {
    "type": "interface",
    "name": "openzeppelin_upgrades::interface::IUpgradeable",
    "items": [
      {
        "type": "function",
        "name": "upgrade",
        "inputs": [
          {
            "name": "new_class_hash",
            "type": "core::starknet::class_hash::ClassHash"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "Medialane1155Impl",
    "interface_name": "medialane_erc1155::core::interface::IMedialane1155"
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
        "name": "nft_contract",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token_id",
        "type": "core::felt252"
      },
      {
        "name": "amount",
        "type": "core::felt252"
      },
      {
        "name": "payment_token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "price_per_unit",
        "type": "core::felt252"
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
    "type": "enum",
    "name": "core::option::Option::<core::starknet::contract_address::ContractAddress>",
    "variants": [
      {
        "name": "Some",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "None",
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
        "name": "nft_contract",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token_id",
        "type": "core::felt252"
      },
      {
        "name": "amount",
        "type": "core::felt252"
      },
      {
        "name": "payment_token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "price_per_unit",
        "type": "core::felt252"
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
        "name": "fulfiller",
        "type": "core::option::Option::<core::starknet::contract_address::ContractAddress>"
      }
    ]
  },
  {
    "type": "interface",
    "name": "medialane_erc1155::core::interface::IMedialane1155",
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
        "name": "get_native_token",
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
    "type": "impl",
    "name": "SRC5Impl",
    "interface_name": "openzeppelin_introspection::interface::ISRC5"
  },
  {
    "type": "enum",
    "name": "core::bool",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "type": "interface",
    "name": "openzeppelin_introspection::interface::ISRC5",
    "items": [
      {
        "type": "function",
        "name": "supports_interface",
        "inputs": [
          {
            "name": "interface_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "impl",
    "name": "AccessControlImpl",
    "interface_name": "openzeppelin_access::accesscontrol::interface::IAccessControl"
  },
  {
    "type": "interface",
    "name": "openzeppelin_access::accesscontrol::interface::IAccessControl",
    "items": [
      {
        "type": "function",
        "name": "has_role",
        "inputs": [
          {
            "name": "role",
            "type": "core::felt252"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::bool"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_role_admin",
        "inputs": [
          {
            "name": "role",
            "type": "core::felt252"
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
        "name": "grant_role",
        "inputs": [
          {
            "name": "role",
            "type": "core::felt252"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "revoke_role",
        "inputs": [
          {
            "name": "role",
            "type": "core::felt252"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "renounce_role",
        "inputs": [
          {
            "name": "role",
            "type": "core::felt252"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "manager",
        "type": "core::starknet::contract_address::ContractAddress"
      },
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
      },
      {
        "name": "nft_contract",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "token_id",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "amount",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "price_per_unit",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "payment_token",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
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
    "name": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded",
    "kind": "struct",
    "members": [
      {
        "name": "class_hash",
        "type": "core::starknet::class_hash::ClassHash",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "Upgraded",
        "type": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Upgraded",
        "kind": "nested"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_introspection::src5::SRC5Component::Event",
    "kind": "enum",
    "variants": []
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
    "kind": "struct",
    "members": [
      {
        "name": "role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "account",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "sender",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGrantedWithDelay",
    "kind": "struct",
    "members": [
      {
        "name": "role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "account",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "sender",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "delay",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
    "kind": "struct",
    "members": [
      {
        "name": "role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "account",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "sender",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
    "kind": "struct",
    "members": [
      {
        "name": "role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "previous_admin_role",
        "type": "core::felt252",
        "kind": "data"
      },
      {
        "name": "new_admin_role",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "RoleGranted",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGranted",
        "kind": "nested"
      },
      {
        "name": "RoleGrantedWithDelay",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleGrantedWithDelay",
        "kind": "nested"
      },
      {
        "name": "RoleRevoked",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleRevoked",
        "kind": "nested"
      },
      {
        "name": "RoleAdminChanged",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::RoleAdminChanged",
        "kind": "nested"
      }
    ]
  },
  {
    "type": "event",
    "name": "medialane_erc1155::core::medialane::Medialane1155::Event",
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
      },
      {
        "name": "UpgradeableEvent",
        "type": "openzeppelin_upgrades::upgradeable::UpgradeableComponent::Event",
        "kind": "flat"
      },
      {
        "name": "SRC5Event",
        "type": "openzeppelin_introspection::src5::SRC5Component::Event",
        "kind": "flat"
      },
      {
        "name": "AccessControlEvent",
        "type": "openzeppelin_access::accesscontrol::accesscontrol::AccessControlComponent::Event",
        "kind": "flat"
      }
    ]
  }
] as const;

// ─── ERC-1155 IP Collection Factory (v2) ───────────────────────────────────────
// Deployed on Starknet mainnet at:
// 0x006b2dc7ca7c4f466bb4575ba043d934310f052074f849caf853a86bcb819fd6
// v2 adds base_uri as third argument to deploy_collection.

export const IPCollection1155FactoryABI = [
  {
    type: "function",
    name: "collection_class_hash",
    inputs: [],
    outputs: [{ type: "core::starknet::class_hash::ClassHash" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "deploy_collection",
    inputs: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
    ],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "update_collection_class_hash",
    inputs: [{ name: "new_class_hash", type: "core::starknet::class_hash::ClassHash" }],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view",
  },
] as const;

// ─── ERC-1155 IP Collection (per-collection, v2) ───────────────────────────────
// Class hash: 0x39a85126c6627db263617e5bce2bb72e49d2bb1f20961efc8b8954665bcfd25
// v2 adds name(), symbol(), base_uri() view functions and requires value > 0 on mint.

export const IPCollection1155ABI = [
  // ── Metadata views ──────────────────────────────────────────────────────────
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ type: "core::byte_array::ByteArray" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ type: "core::byte_array::ByteArray" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "base_uri",
    inputs: [],
    outputs: [{ type: "core::byte_array::ByteArray" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "uri",
    inputs: [{ name: "token_id", type: "core::integer::u256" }],
    outputs: [{ type: "core::byte_array::ByteArray" }],
    state_mutability: "view",
  },
  // ── Minting ─────────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "mint_item",
    inputs: [
      { name: "to", type: "core::starknet::contract_address::ContractAddress" },
      { name: "token_id", type: "core::integer::u256" },
      { name: "value", type: "core::integer::u256" },
      { name: "token_uri", type: "core::byte_array::ByteArray" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "batch_mint_item",
    inputs: [
      { name: "to", type: "core::starknet::contract_address::ContractAddress" },
      { name: "token_ids", type: "core::array::Span::<core::integer::u256>" },
      { name: "values", type: "core::array::Span::<core::integer::u256>" },
      { name: "token_uris", type: "core::array::Array::<core::byte_array::ByteArray>" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  // ── Provenance queries ───────────────────────────────────────────────────────
  {
    type: "function",
    name: "get_collection_creator",
    inputs: [],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_token_creator",
    inputs: [{ name: "token_id", type: "core::integer::u256" }],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_token_registered_at",
    inputs: [{ name: "token_id", type: "core::integer::u256" }],
    outputs: [{ type: "core::integer::u64" }],
    state_mutability: "view",
  },
  // ── Ownership ────────────────────────────────────────────────────────────────
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view",
  },
  // ── ERC-1155 standard ────────────────────────────────────────────────────────
  {
    type: "function",
    name: "balance_of",
    inputs: [
      { name: "account", type: "core::starknet::contract_address::ContractAddress" },
      { name: "token_id", type: "core::integer::u256" },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "set_approval_for_all",
    inputs: [
      { name: "operator", type: "core::starknet::contract_address::ContractAddress" },
      { name: "approved", type: "core::bool" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "is_approved_for_all",
    inputs: [
      { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
      { name: "operator", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  // ── ERC-2981 royalties ───────────────────────────────────────────────────────
  {
    type: "function",
    name: "royalty_info",
    inputs: [
      { name: "token_id", type: "core::integer::u256" },
      { name: "sale_price", type: "core::integer::u256" },
    ],
    outputs: [
      { type: "core::starknet::contract_address::ContractAddress" },
      { type: "core::integer::u256" },
    ],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "set_default_royalty",
    inputs: [
      { name: "receiver", type: "core::starknet::contract_address::ContractAddress" },
      { name: "fee_numerator", type: "core::integer::u128" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "set_token_royalty",
    inputs: [
      { name: "token_id", type: "core::integer::u256" },
      { name: "receiver", type: "core::starknet::contract_address::ContractAddress" },
      { name: "fee_numerator", type: "core::integer::u128" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "delete_default_royalty",
    inputs: [],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "reset_token_royalty",
    inputs: [{ name: "token_id", type: "core::integer::u256" }],
    outputs: [],
    state_mutability: "external",
  },
] as const;