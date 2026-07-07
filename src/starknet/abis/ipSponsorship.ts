export const IPSponsorshipABI = [
  {
    "type": "impl",
    "name": "IPSponsorshipImpl",
    "interface_name": "ip_sponsorship::interface::IIPSponsorship"
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
    "name": "ip_sponsorship::types::SponsorshipOffer",
    "members": [
      {
        "name": "author",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "nft_contract",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token_id",
        "type": "core::integer::u256"
      },
      {
        "name": "min_amount",
        "type": "core::integer::u256"
      },
      {
        "name": "duration",
        "type": "core::integer::u64"
      },
      {
        "name": "payment_token",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "license_terms_uri",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "transferable",
        "type": "core::bool"
      },
      {
        "name": "specific_sponsor",
        "type": "core::option::Option::<core::starknet::contract_address::ContractAddress>"
      },
      {
        "name": "open",
        "type": "core::bool"
      }
    ]
  },
  {
    "type": "struct",
    "name": "ip_sponsorship::types::License",
    "members": [
      {
        "name": "author",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "sponsor",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "nft_contract",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "token_id",
        "type": "core::integer::u256"
      },
      {
        "name": "amount_paid",
        "type": "core::integer::u256"
      },
      {
        "name": "expires_at",
        "type": "core::integer::u64"
      },
      {
        "name": "transferable",
        "type": "core::bool"
      },
      {
        "name": "license_terms_uri",
        "type": "core::byte_array::ByteArray"
      }
    ]
  },
  {
    "type": "interface",
    "name": "ip_sponsorship::interface::IIPSponsorship",
    "items": [
      {
        "type": "function",
        "name": "create_offer",
        "inputs": [
          {
            "name": "nft_contract",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "token_id",
            "type": "core::integer::u256"
          },
          {
            "name": "min_amount",
            "type": "core::integer::u256"
          },
          {
            "name": "duration",
            "type": "core::integer::u64"
          },
          {
            "name": "payment_token",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "license_terms_uri",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "transferable",
            "type": "core::bool"
          },
          {
            "name": "specific_sponsor",
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
        "name": "set_offer_open",
        "inputs": [
          {
            "name": "offer_id",
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
        "name": "place_bid",
        "inputs": [
          {
            "name": "offer_id",
            "type": "core::integer::u256"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "retract_bid",
        "inputs": [
          {
            "name": "offer_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "accept_bid",
        "inputs": [
          {
            "name": "offer_id",
            "type": "core::integer::u256"
          },
          {
            "name": "sponsor",
            "type": "core::starknet::contract_address::ContractAddress"
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
        "name": "transfer_license",
        "inputs": [
          {
            "name": "license_id",
            "type": "core::integer::u256"
          },
          {
            "name": "to",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_offer",
        "inputs": [
          {
            "name": "offer_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "ip_sponsorship::types::SponsorshipOffer"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_bid",
        "inputs": [
          {
            "name": "offer_id",
            "type": "core::integer::u256"
          },
          {
            "name": "sponsor",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_license",
        "inputs": [
          {
            "name": "license_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "ip_sponsorship::types::License"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "is_license_valid",
        "inputs": [
          {
            "name": "license_id",
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
        "name": "get_last_offer_id",
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
        "name": "get_last_license_id",
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
    "inputs": []
  },
  {
    "type": "event",
    "name": "openzeppelin_introspection::src5::SRC5Component::Event",
    "kind": "enum",
    "variants": []
  },
  {
    "type": "event",
    "name": "ip_sponsorship::IPSponsorship::IPSponsorship::OfferCreated",
    "kind": "struct",
    "members": [
      {
        "name": "offer_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "author",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "nft_contract",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "token_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "min_amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "duration",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "payment_token",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "license_terms_uri",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "transferable",
        "type": "core::bool",
        "kind": "data"
      },
      {
        "name": "specific_sponsor",
        "type": "core::option::Option::<core::starknet::contract_address::ContractAddress>",
        "kind": "data"
      },
      {
        "name": "created_at",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_sponsorship::IPSponsorship::IPSponsorship::OfferStatusUpdated",
    "kind": "struct",
    "members": [
      {
        "name": "offer_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "open",
        "type": "core::bool",
        "kind": "data"
      },
      {
        "name": "updated_at",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_sponsorship::IPSponsorship::IPSponsorship::BidPlaced",
    "kind": "struct",
    "members": [
      {
        "name": "offer_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "sponsor",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "bid_at",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_sponsorship::IPSponsorship::IPSponsorship::BidRetracted",
    "kind": "struct",
    "members": [
      {
        "name": "offer_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "sponsor",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "retracted_at",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_sponsorship::IPSponsorship::IPSponsorship::SponsorshipAccepted",
    "kind": "struct",
    "members": [
      {
        "name": "offer_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "license_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "sponsor",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "author",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "expires_at",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_sponsorship::IPSponsorship::IPSponsorship::LicenseTransferred",
    "kind": "struct",
    "members": [
      {
        "name": "license_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "from",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "to",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "transferred_at",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_sponsorship::IPSponsorship::IPSponsorship::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "SRC5Event",
        "type": "openzeppelin_introspection::src5::SRC5Component::Event",
        "kind": "flat"
      },
      {
        "name": "OfferCreated",
        "type": "ip_sponsorship::IPSponsorship::IPSponsorship::OfferCreated",
        "kind": "nested"
      },
      {
        "name": "OfferStatusUpdated",
        "type": "ip_sponsorship::IPSponsorship::IPSponsorship::OfferStatusUpdated",
        "kind": "nested"
      },
      {
        "name": "BidPlaced",
        "type": "ip_sponsorship::IPSponsorship::IPSponsorship::BidPlaced",
        "kind": "nested"
      },
      {
        "name": "BidRetracted",
        "type": "ip_sponsorship::IPSponsorship::IPSponsorship::BidRetracted",
        "kind": "nested"
      },
      {
        "name": "SponsorshipAccepted",
        "type": "ip_sponsorship::IPSponsorship::IPSponsorship::SponsorshipAccepted",
        "kind": "nested"
      },
      {
        "name": "LicenseTransferred",
        "type": "ip_sponsorship::IPSponsorship::IPSponsorship::LicenseTransferred",
        "kind": "nested"
      }
    ]
  }
] as const;
