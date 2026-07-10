export const IPClubFactoryABI = [
  {
    "type": "impl",
    "name": "IPClubFactoryImpl",
    "interface_name": "ip_club::interface::IIPClubFactory"
  },
  {
    "type": "struct",
    "name": "core::byte_array::ByteArray",
    "members": [
      { "name": "data", "type": "core::array::Array::<core::bytes_31::bytes31>" },
      { "name": "pending_word", "type": "core::felt252" },
      { "name": "pending_word_len", "type": "core::internal::bounded_int::BoundedInt::<0, 30>" }
    ]
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      { "name": "low", "type": "core::integer::u128" },
      { "name": "high", "type": "core::integer::u128" }
    ]
  },
  {
    "type": "enum",
    "name": "core::option::Option::<core::starknet::contract_address::ContractAddress>",
    "variants": [
      { "name": "Some", "type": "core::starknet::contract_address::ContractAddress" },
      { "name": "None", "type": "()" }
    ]
  },
  {
    "type": "interface",
    "name": "ip_club::interface::IIPClubFactory",
    "items": [
      {
        "type": "function",
        "name": "collection_class_hash",
        "inputs": [],
        "outputs": [{ "type": "core::starknet::class_hash::ClassHash" }],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "version",
        "inputs": [],
        "outputs": [{ "type": "core::byte_array::ByteArray" }],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "deploy_club",
        "inputs": [
          { "name": "name", "type": "core::byte_array::ByteArray" },
          { "name": "symbol", "type": "core::byte_array::ByteArray" },
          { "name": "base_uri", "type": "core::byte_array::ByteArray" },
          { "name": "max_supply", "type": "core::integer::u256" },
          { "name": "entry_fee", "type": "core::integer::u256" },
          { "name": "payment_token", "type": "core::option::Option::<core::starknet::contract_address::ContractAddress>" },
          { "name": "royalty_bps", "type": "core::integer::u256" }
        ],
        "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }],
        "state_mutability": "external"
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
      { "name": "False", "type": "()" },
      { "name": "True", "type": "()" }
    ]
  },
  {
    "type": "interface",
    "name": "openzeppelin_introspection::interface::ISRC5",
    "items": [
      {
        "type": "function",
        "name": "supports_interface",
        "inputs": [{ "name": "interface_id", "type": "core::felt252" }],
        "outputs": [{ "type": "core::bool" }],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      { "name": "collection_class_hash", "type": "core::starknet::class_hash::ClassHash" }
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
    "name": "ip_club::IPClubFactory::IPClubFactory::ClubDeployed",
    "kind": "struct",
    "members": [
      { "name": "collection_address", "type": "core::starknet::contract_address::ContractAddress", "kind": "key" },
      { "name": "owner", "type": "core::starknet::contract_address::ContractAddress", "kind": "key" },
      { "name": "name", "type": "core::byte_array::ByteArray", "kind": "data" },
      { "name": "symbol", "type": "core::byte_array::ByteArray", "kind": "data" }
    ]
  },
  {
    "type": "event",
    "name": "ip_club::IPClubFactory::IPClubFactory::Event",
    "kind": "enum",
    "variants": [
      { "name": "SRC5Event", "type": "openzeppelin_introspection::src5::SRC5Component::Event", "kind": "flat" },
      { "name": "ClubDeployed", "type": "ip_club::IPClubFactory::IPClubFactory::ClubDeployed", "kind": "nested" }
    ]
  }
] as const;
