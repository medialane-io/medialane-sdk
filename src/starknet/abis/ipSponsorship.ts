export const IPSponsorshipABI = [
  {
    "type": "impl",
    "name": "ERC721MetadataImpl",
    "interface_name": "openzeppelin_token::erc721::interface::IERC721Metadata"
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
    "type": "interface",
    "name": "openzeppelin_token::erc721::interface::IERC721Metadata",
    "items": [
      {
        "type": "function",
        "name": "name",
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
        "name": "symbol",
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
        "name": "token_uri",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::byte_array::ByteArray"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "impl",
    "name": "ERC721MetadataCamelOnlyImpl",
    "interface_name": "openzeppelin_token::erc721::interface::IERC721MetadataCamelOnly"
  },
  {
    "type": "interface",
    "name": "openzeppelin_token::erc721::interface::IERC721MetadataCamelOnly",
    "items": [
      {
        "type": "function",
        "name": "tokenURI",
        "inputs": [
          {
            "name": "tokenId",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::byte_array::ByteArray"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "impl",
    "name": "IPSponsorshipImpl",
    "interface_name": "ip_sponsorship::interface::IIPSponsorship"
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
      },
      {
        "name": "royalty_bps",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "type": "struct",
    "name": "ip_sponsorship::types::SponsorshipProposal",
    "members": [
      {
        "name": "proposer",
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
        "name": "amount",
        "type": "core::integer::u256"
      },
      {
        "name": "duration",
        "type": "core::integer::u64"
      },
      {
        "name": "valid_until",
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
        "name": "open",
        "type": "core::bool"
      },
      {
        "name": "royalty_bps",
        "type": "core::integer::u256"
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
            "name": "royalty_bps",
            "type": "core::integer::u256"
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
      },
      {
        "type": "function",
        "name": "propose_sponsorship",
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
            "name": "amount",
            "type": "core::integer::u256"
          },
          {
            "name": "duration",
            "type": "core::integer::u64"
          },
          {
            "name": "valid_until",
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
            "name": "royalty_bps",
            "type": "core::integer::u256"
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
        "name": "withdraw_proposal",
        "inputs": [
          {
            "name": "proposal_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "accept_proposal",
        "inputs": [
          {
            "name": "proposal_id",
            "type": "core::integer::u256"
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
        "name": "reject_proposal",
        "inputs": [
          {
            "name": "proposal_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_proposal",
        "inputs": [
          {
            "name": "proposal_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "ip_sponsorship::types::SponsorshipProposal"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_last_proposal_id",
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
        "name": "royalty_info",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          },
          {
            "name": "sale_price",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "(core::starknet::contract_address::ContractAddress, core::integer::u256)"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "royaltyInfo",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          },
          {
            "name": "sale_price",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "(core::starknet::contract_address::ContractAddress, core::integer::u256)"
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
      }
    ]
  },
  {
    "type": "impl",
    "name": "ERC721Impl",
    "interface_name": "openzeppelin_token::erc721::interface::IERC721"
  },
  {
    "type": "struct",
    "name": "core::array::Span::<core::felt252>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "interface",
    "name": "openzeppelin_token::erc721::interface::IERC721",
    "items": [
      {
        "type": "function",
        "name": "balance_of",
        "inputs": [
          {
            "name": "account",
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
        "name": "owner_of",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "safe_transfer_from",
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
            "name": "token_id",
            "type": "core::integer::u256"
          },
          {
            "name": "data",
            "type": "core::array::Span::<core::felt252>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "transfer_from",
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
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "approve",
        "inputs": [
          {
            "name": "to",
            "type": "core::starknet::contract_address::ContractAddress"
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
        "name": "set_approval_for_all",
        "inputs": [
          {
            "name": "operator",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "approved",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_approved",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "is_approved_for_all",
        "inputs": [
          {
            "name": "owner",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "operator",
            "type": "core::starknet::contract_address::ContractAddress"
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
    "name": "ERC721CamelOnly",
    "interface_name": "openzeppelin_token::erc721::interface::IERC721CamelOnly"
  },
  {
    "type": "interface",
    "name": "openzeppelin_token::erc721::interface::IERC721CamelOnly",
    "items": [
      {
        "type": "function",
        "name": "balanceOf",
        "inputs": [
          {
            "name": "account",
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
        "name": "ownerOf",
        "inputs": [
          {
            "name": "tokenId",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "safeTransferFrom",
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
            "name": "tokenId",
            "type": "core::integer::u256"
          },
          {
            "name": "data",
            "type": "core::array::Span::<core::felt252>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "transferFrom",
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
            "name": "tokenId",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "setApprovalForAll",
        "inputs": [
          {
            "name": "operator",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "approved",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "getApproved",
        "inputs": [
          {
            "name": "tokenId",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "isApprovedForAll",
        "inputs": [
          {
            "name": "owner",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "operator",
            "type": "core::starknet::contract_address::ContractAddress"
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
        "name": "name",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "symbol",
        "type": "core::byte_array::ByteArray"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_token::erc721::erc721::ERC721Component::Transfer",
    "kind": "struct",
    "members": [
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
        "name": "token_id",
        "type": "core::integer::u256",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_token::erc721::erc721::ERC721Component::Approval",
    "kind": "struct",
    "members": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "approved",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "token_id",
        "type": "core::integer::u256",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll",
    "kind": "struct",
    "members": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "operator",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "approved",
        "type": "core::bool",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_token::erc721::erc721::ERC721Component::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "Transfer",
        "type": "openzeppelin_token::erc721::erc721::ERC721Component::Transfer",
        "kind": "nested"
      },
      {
        "name": "Approval",
        "type": "openzeppelin_token::erc721::erc721::ERC721Component::Approval",
        "kind": "nested"
      },
      {
        "name": "ApprovalForAll",
        "type": "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll",
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
        "name": "royalty_bps",
        "type": "core::integer::u256",
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
    "name": "ip_sponsorship::IPSponsorship::IPSponsorship::ProposalCreated",
    "kind": "struct",
    "members": [
      {
        "name": "proposal_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "proposer",
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
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "duration",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "valid_until",
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
        "name": "royalty_bps",
        "type": "core::integer::u256",
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
    "name": "ip_sponsorship::IPSponsorship::IPSponsorship::ProposalClosed",
    "kind": "struct",
    "members": [
      {
        "name": "proposal_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "accepted",
        "type": "core::bool",
        "kind": "data"
      },
      {
        "name": "closed_at",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_sponsorship::IPSponsorship::IPSponsorship::ProposalAccepted",
    "kind": "struct",
    "members": [
      {
        "name": "proposal_id",
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
    "name": "ip_sponsorship::IPSponsorship::IPSponsorship::LicenseMinted",
    "kind": "struct",
    "members": [
      {
        "name": "token_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "recipient",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "author",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "asset_contract",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "asset_token_id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "expires_at",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "transferable",
        "type": "core::bool",
        "kind": "data"
      },
      {
        "name": "royalty_bps",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "license_terms_uri",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "minted_at",
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
        "name": "ERC721Event",
        "type": "openzeppelin_token::erc721::erc721::ERC721Component::Event",
        "kind": "flat"
      },
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
        "name": "ProposalCreated",
        "type": "ip_sponsorship::IPSponsorship::IPSponsorship::ProposalCreated",
        "kind": "nested"
      },
      {
        "name": "ProposalClosed",
        "type": "ip_sponsorship::IPSponsorship::IPSponsorship::ProposalClosed",
        "kind": "nested"
      },
      {
        "name": "ProposalAccepted",
        "type": "ip_sponsorship::IPSponsorship::IPSponsorship::ProposalAccepted",
        "kind": "nested"
      },
      {
        "name": "LicenseMinted",
        "type": "ip_sponsorship::IPSponsorship::IPSponsorship::LicenseMinted",
        "kind": "nested"
      }
    ]
  }
] as const;
