export const IPCollection1155FactoryABI = [
  {
    "type": "impl",
    "name": "IPCollectionFactoryImpl",
    "interface_name": "ip_programmable_erc1155_collections::interfaces::IIPCollectionFactory::IIPCollectionFactory"
  },
  {
    "type": "struct",
    "name": "core::byte_array::ByteArray",
    "members": [
      {
        "name": "data",
        "type": "core::array::Array::<core::bytes_31::bytes31>"
      },
      {
        "name": "pending_word",
        "type": "core::felt252"
      },
      {
        "name": "pending_word_len",
        "type": "core::internal::bounded_int::BoundedInt::<0, 30>"
      }
    ]
  },
  {
    "type": "interface",
    "name": "ip_programmable_erc1155_collections::interfaces::IIPCollectionFactory::IIPCollectionFactory",
    "items": [
      {
        "type": "function",
        "name": "collection_class_hash",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::class_hash::ClassHash"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "version",
        "inputs": [],
        "outputs": [
          {
            "type": "core::byte_array::ByteArray"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "deploy_collection",
        "inputs": [
          {
            "name": "name",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "symbol",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "base_uri",
            "type": "core::byte_array::ByteArray"
          }
        ],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "collection_class_hash",
        "type": "core::starknet::class_hash::ClassHash"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_programmable_erc1155_collections::IPCollectionFactory::IPCollectionFactory::CollectionDeployed",
    "kind": "struct",
    "members": [
      {
        "name": "collection_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "name",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "symbol",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "base_uri",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_programmable_erc1155_collections::IPCollectionFactory::IPCollectionFactory::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "CollectionDeployed",
        "type": "ip_programmable_erc1155_collections::IPCollectionFactory::IPCollectionFactory::CollectionDeployed",
        "kind": "nested"
      }
    ]
  }
] as const;
