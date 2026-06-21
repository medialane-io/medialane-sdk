export const IPCollectionABI =
[
  {
    "type": "impl",
    "name": "IPCollectionImpl",
    "interface_name": "ip_collection_erc_721::interfaces::IIPCollection::IIPCollection"
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
    "type": "struct",
    "name": "core::array::Span::<core::integer::u256>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::integer::u256>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "ip_collection_erc_721::types::Collection",
    "members": [
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
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "ip_nft",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
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
    "type": "struct",
    "name": "ip_collection_erc_721::types::CollectionStats",
    "members": [
      {
        "name": "total_minted",
        "type": "core::integer::u256"
      },
      {
        "name": "total_archived",
        "type": "core::integer::u256"
      },
      {
        "name": "protocol_routed_transfers",
        "type": "core::integer::u256"
      },
      {
        "name": "last_mint_time",
        "type": "core::integer::u64"
      },
      {
        "name": "last_archive_time",
        "type": "core::integer::u64"
      },
      {
        "name": "last_transfer_time",
        "type": "core::integer::u64"
      }
    ]
  },
  {
    "type": "struct",
    "name": "ip_collection_erc_721::types::TokenData",
    "members": [
      {
        "name": "collection_id",
        "type": "core::integer::u256"
      },
      {
        "name": "token_id",
        "type": "core::integer::u256"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "metadata_uri",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "original_creator",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "registered_at",
        "type": "core::integer::u64"
      }
    ]
  },
  {
    "type": "interface",
    "name": "ip_collection_erc_721::interfaces::IIPCollection::IIPCollection",
    "items": [
      {
        "type": "function",
        "name": "create_collection",
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
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "mint",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          },
          {
            "name": "recipient",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "token_uri",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "royalty_bps",
            "type": "core::integer::u128"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "batch_mint",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          },
          {
            "name": "recipients",
            "type": "core::array::Array::<core::starknet::contract_address::ContractAddress>"
          },
          {
            "name": "token_uris",
            "type": "core::array::Array::<core::byte_array::ByteArray>"
          },
          {
            "name": "royalty_bps",
            "type": "core::array::Array::<core::integer::u128>"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Span::<core::integer::u256>"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "transfer_collection_ownership",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          },
          {
            "name": "new_owner",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "archive",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          },
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "batch_archive",
        "inputs": [
          {
            "name": "collection_ids",
            "type": "core::array::Array::<core::integer::u256>"
          },
          {
            "name": "token_ids",
            "type": "core::array::Array::<core::integer::u256>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "transfer_token",
        "inputs": [
          {
            "name": "to",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          },
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "batch_transfer",
        "inputs": [
          {
            "name": "from",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "to",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "collection_ids",
            "type": "core::array::Array::<core::integer::u256>"
          },
          {
            "name": "token_ids",
            "type": "core::array::Array::<core::integer::u256>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "list_user_tokens_per_collection",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          },
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Span::<core::integer::u256>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "list_user_collections",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Span::<core::integer::u256>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_collection",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "ip_collection_erc_721::types::Collection"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_collection_count",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
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
        "name": "is_valid_collection",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
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
        "name": "get_collection_stats",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "ip_collection_erc_721::types::CollectionStats"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "is_collection_owner",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          },
          {
            "name": "owner",
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
        "name": "get_token",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          },
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "ip_collection_erc_721::types::TokenData"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "is_valid_token",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          },
          {
            "name": "token_id",
            "type": "core::integer::u256"
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
        "name": "is_transferable_token",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          },
          {
            "name": "token_id",
            "type": "core::integer::u256"
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
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "ip_nft_class_hash",
        "type": "core::starknet::class_hash::ClassHash"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_collection_erc_721::IPCollection::IPCollection::CollectionCreated",
    "kind": "struct",
    "members": [
      {
        "name": "collection_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
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
    "name": "ip_collection_erc_721::IPCollection::IPCollection::CollectionOwnershipTransferred",
    "kind": "struct",
    "members": [
      {
        "name": "collection_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "previous_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "new_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_collection_erc_721::IPCollection::IPCollection::TokenMinted",
    "kind": "struct",
    "members": [
      {
        "name": "collection_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "token_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "metadata_uri",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "royalty_bps",
        "type": "core::integer::u128",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_collection_erc_721::IPCollection::IPCollection::TokenMintedBatch",
    "kind": "struct",
    "members": [
      {
        "name": "collection_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "token_ids",
        "type": "core::array::Span::<core::integer::u256>",
        "kind": "data"
      },
      {
        "name": "owners",
        "type": "core::array::Array::<core::starknet::contract_address::ContractAddress>",
        "kind": "data"
      },
      {
        "name": "metadata_uris",
        "type": "core::array::Array::<core::byte_array::ByteArray>",
        "kind": "data"
      },
      {
        "name": "operator",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_collection_erc_721::IPCollection::IPCollection::TokenArchived",
    "kind": "struct",
    "members": [
      {
        "name": "collection_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "token_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "operator",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_collection_erc_721::IPCollection::IPCollection::TokenArchivedBatch",
    "kind": "struct",
    "members": [
      {
        "name": "collection_ids",
        "type": "core::array::Span::<core::integer::u256>",
        "kind": "data"
      },
      {
        "name": "token_ids",
        "type": "core::array::Span::<core::integer::u256>",
        "kind": "data"
      },
      {
        "name": "operator",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_collection_erc_721::IPCollection::IPCollection::TokenTransferred",
    "kind": "struct",
    "members": [
      {
        "name": "collection_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "token_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "from",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "to",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "operator",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_collection_erc_721::IPCollection::IPCollection::TokenTransferredBatch",
    "kind": "struct",
    "members": [
      {
        "name": "from",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "to",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "collection_ids",
        "type": "core::array::Span::<core::integer::u256>",
        "kind": "data"
      },
      {
        "name": "token_ids",
        "type": "core::array::Span::<core::integer::u256>",
        "kind": "data"
      },
      {
        "name": "operator",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_collection_erc_721::IPCollection::IPCollection::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "CollectionCreated",
        "type": "ip_collection_erc_721::IPCollection::IPCollection::CollectionCreated",
        "kind": "nested"
      },
      {
        "name": "CollectionOwnershipTransferred",
        "type": "ip_collection_erc_721::IPCollection::IPCollection::CollectionOwnershipTransferred",
        "kind": "nested"
      },
      {
        "name": "TokenMinted",
        "type": "ip_collection_erc_721::IPCollection::IPCollection::TokenMinted",
        "kind": "nested"
      },
      {
        "name": "TokenMintedBatch",
        "type": "ip_collection_erc_721::IPCollection::IPCollection::TokenMintedBatch",
        "kind": "nested"
      },
      {
        "name": "TokenArchived",
        "type": "ip_collection_erc_721::IPCollection::IPCollection::TokenArchived",
        "kind": "nested"
      },
      {
        "name": "TokenArchivedBatch",
        "type": "ip_collection_erc_721::IPCollection::IPCollection::TokenArchivedBatch",
        "kind": "nested"
      },
      {
        "name": "TokenTransferred",
        "type": "ip_collection_erc_721::IPCollection::IPCollection::TokenTransferred",
        "kind": "nested"
      },
      {
        "name": "TokenTransferredBatch",
        "type": "ip_collection_erc_721::IPCollection::IPCollection::TokenTransferredBatch",
        "kind": "nested"
      }
    ]
  }
] as const;
