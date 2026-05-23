export const Medialane1155ABI = [
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
] as const;

