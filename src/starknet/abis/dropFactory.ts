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

