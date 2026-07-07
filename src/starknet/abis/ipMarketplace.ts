// Auto-generated from Medialane721 class (redesigned venue). Do not hand-edit.
export const IPMarketplaceABI = [
  {
    "type": "impl",
    "name": "Medialane721Impl",
    "interface_name": "medialane_marketplace_erc721::core::interface::IMedialane"
  },
  {
    "type": "struct",
    "name": "medialane_marketplace_erc721::core::types::OfferItem",
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
        "name": "amount",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_marketplace_erc721::core::types::ConsiderationItem",
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
        "name": "amount",
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
    "name": "medialane_marketplace_erc721::core::types::OrderParameters",
    "members": [
      {
        "name": "offerer",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "marketplace",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "offer",
        "type": "medialane_marketplace_erc721::core::types::OfferItem"
      },
      {
        "name": "consideration",
        "type": "medialane_marketplace_erc721::core::types::ConsiderationItem"
      },
      {
        "name": "royalty_max_bps",
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
        "name": "counter",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_marketplace_erc721::core::types::Order",
    "members": [
      {
        "name": "parameters",
        "type": "medialane_marketplace_erc721::core::types::OrderParameters"
      },
      {
        "name": "signature",
        "type": "core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_marketplace_erc721::core::types::OrderCancellation",
    "members": [
      {
        "name": "order_hash",
        "type": "core::felt252"
      },
      {
        "name": "offerer",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_marketplace_erc721::core::types::CancelRequest",
    "members": [
      {
        "name": "cancelation",
        "type": "medialane_marketplace_erc721::core::types::OrderCancellation"
      },
      {
        "name": "signature",
        "type": "core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "enum",
    "name": "medialane_marketplace_erc721::core::types::OrderStatus",
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
    "name": "medialane_marketplace_erc721::core::types::OrderDetails",
    "members": [
      {
        "name": "offerer",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "offer",
        "type": "medialane_marketplace_erc721::core::types::OfferItem"
      },
      {
        "name": "consideration",
        "type": "medialane_marketplace_erc721::core::types::ConsiderationItem"
      },
      {
        "name": "royalty_max_bps",
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
        "type": "medialane_marketplace_erc721::core::types::OrderStatus"
      },
      {
        "name": "counter",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "interface",
    "name": "medialane_marketplace_erc721::core::interface::IMedialane",
    "items": [
      {
        "type": "function",
        "name": "register_order",
        "inputs": [
          {
            "name": "order",
            "type": "medialane_marketplace_erc721::core::types::Order"
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
            "name": "order_hash",
            "type": "core::felt252"
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
            "type": "medialane_marketplace_erc721::core::types::CancelRequest"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "increment_counter",
        "inputs": [],
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
            "type": "medialane_marketplace_erc721::core::types::OrderDetails"
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
            "type": "medialane_marketplace_erc721::core::types::OrderParameters"
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
        "name": "get_cancellation_hash",
        "inputs": [
          {
            "name": "cancellation",
            "type": "medialane_marketplace_erc721::core::types::OrderCancellation"
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
        "name": "get_counter",
        "inputs": [
          {
            "name": "offerer",
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
    "name": "medialane_marketplace_erc721::core::events::OrderCreated",
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
    "name": "medialane_marketplace_erc721::core::events::OrderFulfilled",
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
    "name": "medialane_marketplace_erc721::core::events::OrderCancelled",
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
    "name": "medialane_marketplace_erc721::core::events::CounterIncremented",
    "kind": "struct",
    "members": [
      {
        "name": "offerer",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "new_counter",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "medialane_marketplace_erc721::core::medialane::Medialane721::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "OrderCreated",
        "type": "medialane_marketplace_erc721::core::events::OrderCreated",
        "kind": "nested"
      },
      {
        "name": "OrderFulfilled",
        "type": "medialane_marketplace_erc721::core::events::OrderFulfilled",
        "kind": "nested"
      },
      {
        "name": "OrderCancelled",
        "type": "medialane_marketplace_erc721::core::events::OrderCancelled",
        "kind": "nested"
      },
      {
        "name": "CounterIncremented",
        "type": "medialane_marketplace_erc721::core::events::CounterIncremented",
        "kind": "nested"
      }
    ]
  }
] as const;
