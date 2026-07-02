export const IPClubABI = [
  {
    "type": "impl",
    "name": "IPClubImpl",
    "interface_name": "ip_club::interfaces::IIPClub::IIPClub"
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
    "type": "enum",
    "name": "core::option::Option::<core::integer::u32>",
    "variants": [
      {
        "name": "Some",
        "type": "core::integer::u32"
      },
      {
        "name": "None",
        "type": "()"
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
    "type": "enum",
    "name": "core::option::Option::<core::integer::u256>",
    "variants": [
      {
        "name": "Some",
        "type": "core::integer::u256"
      },
      {
        "name": "None",
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
    "name": "ip_club::types::ClubRecord",
    "members": [
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "club_nft",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "open",
        "type": "core::bool"
      },
      {
        "name": "num_members",
        "type": "core::integer::u32"
      },
      {
        "name": "max_members",
        "type": "core::option::Option::<core::integer::u32>"
      },
      {
        "name": "entry_fee",
        "type": "core::option::Option::<core::integer::u256>"
      },
      {
        "name": "payment_token",
        "type": "core::option::Option::<core::starknet::contract_address::ContractAddress>"
      }
    ]
  },
  {
    "type": "interface",
    "name": "ip_club::interfaces::IIPClub::IIPClub",
    "items": [
      {
        "type": "function",
        "name": "create_club",
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
            "name": "metadata_uri",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "max_members",
            "type": "core::option::Option::<core::integer::u32>"
          },
          {
            "name": "entry_fee",
            "type": "core::option::Option::<core::integer::u256>"
          },
          {
            "name": "payment_token",
            "type": "core::option::Option::<core::starknet::contract_address::ContractAddress>"
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
        "name": "set_club_open",
        "inputs": [
          {
            "name": "club_id",
            "type": "core::integer::u256"
          },
          {
            "name": "open",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "join_club",
        "inputs": [
          {
            "name": "club_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "leave_club",
        "inputs": [
          {
            "name": "club_id",
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
        "name": "get_club_record",
        "inputs": [
          {
            "name": "club_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "ip_club::types::ClubRecord"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "is_member",
        "inputs": [
          {
            "name": "club_id",
            "type": "core::integer::u256"
          },
          {
            "name": "user",
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
        "name": "get_last_club_id",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
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
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "ip_club_nft_class_hash",
        "type": "core::starknet::class_hash::ClassHash"
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
    "name": "ip_club::events::NewClubCreated",
    "kind": "struct",
    "members": [
      {
        "name": "club_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "club_nft",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "metadata_uri",
        "type": "core::byte_array::ByteArray",
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
    "name": "ip_club::events::ClubStatusUpdated",
    "kind": "struct",
    "members": [
      {
        "name": "club_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "open",
        "type": "core::bool",
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
    "name": "ip_club::events::NewMember",
    "kind": "struct",
    "members": [
      {
        "name": "club_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "member",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
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
    "name": "ip_club::events::MemberLeft",
    "kind": "struct",
    "members": [
      {
        "name": "club_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "member",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
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
    "name": "ip_club::IPClub::IPClub::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "SRC5Event",
        "type": "openzeppelin_introspection::src5::SRC5Component::Event",
        "kind": "flat"
      },
      {
        "name": "NewClubCreated",
        "type": "ip_club::events::NewClubCreated",
        "kind": "nested"
      },
      {
        "name": "ClubStatusUpdated",
        "type": "ip_club::events::ClubStatusUpdated",
        "kind": "nested"
      },
      {
        "name": "NewMember",
        "type": "ip_club::events::NewMember",
        "kind": "nested"
      },
      {
        "name": "MemberLeft",
        "type": "ip_club::events::MemberLeft",
        "kind": "nested"
      }
    ]
  }
] as const;
