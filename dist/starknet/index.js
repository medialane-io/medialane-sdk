import { z } from 'zod';
import { hash, num, cairo, Contract, uint256, RpcProvider, CairoOption, CairoOptionVariant, ec, encode, TypedDataRevision, shortString, constants } from 'starknet';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { base32, base58 } from '@scure/base';

// src/config.ts

// src/chains.ts
var CHAINS = ["STARKNET", "ETHEREUM", "SOLANA", "BASE", "STELLAR", "BITCOIN"];
var COORDINATES = {
  STARKNET: {
    rpcUrl: "https://rpc.starknet.lava.build",
    marketplace721: "0x03eda9a2b6ad90845a43591bac8083ebaf677d51fdf20f503b2c01889e3131fc",
    marketplace721ClassHash: "0x0700d9230d07e5203e27778c0dc70f9134d2b25bf319f7cf8348dc66a6923e90",
    marketplace721StartBlock: 11198146,
    marketplace1155: "0x07c4ce1c19ea48cc11135ed22b19ff745f5aec508c3828593002e4f76fdb1b38",
    marketplace1155ClassHash: "0x0242f5c388da7cee2d99e2a69453c8159bf927fbec4e797a3cfdcbbcb5b68328",
    marketplace1155StartBlock: 11198267,
    collection721: "0x0225c3ae09506b8d97adc39649ca740dad5aac195b7f5f0441cc1852947acaea",
    collection721StartBlock: 11198496,
    ipNftClassHash: "0x012d3ae40ba35c7e2be0946532dac60e48932447912fdf96b674da67c029b9cc",
    ipCollectionClassHash: "0x022155a1a130a40e57aac4b89c07fab3f616bc351b1270fc40f756b963afe8b4",
    collection1155: "0x015368976d46fae5bfa1c58600f641d5aa5dbbf53ebc6b78aa3922194aad3551",
    collection1155FactoryClassHash: "0x04eb6b419770f13bd191f120b9fc9ee624c0613ad4490062d293ca2016b3b1d2",
    collection1155ClassHash: "0x06cf3f5a2322dac35e07a6064a5b8802f19fda8aa3f4726f0cb7bc05dea1bd78",
    collection1155StartBlock: 11199527,
    popFactory: "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111",
    popCollectionClassHash: "0x077c421686f10851872561953ea16898d933364b7f8937a5d7e2b1ba0a36263f",
    dropFactory: "0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800",
    dropCollectionClassHash: "0x00092e72cdb63067521e803aaf7d4101c3e3ce026ae6bc045ec4228027e58282",
    nftComments: "0x02cdac70c94447189af0389dfea63f4d5e4154ea8a563de288a5ab1c39e37843",
    creatorCoinFactory: "0x50fa807b5274079fb19374673d7bab6d2dc3af7e1032ea43eb6e44bcbde4c3c",
    creatorCoinEkuboLauncher: "0x4f7fceb5ac10f12f9544a09580592e5bdf1b7f04f48765eecf12286d8ccb7b4",
    creatorCoinClassHash: "0x743e4c8a5b96bb83bbf4af04edbbb482d5ece89eed9b729a79fb7df0cd0b6b6",
    creatorCoinFactoryClassHash: "0x51765926b1344c9a20b8cd4b5abe7b7d47375ae97cf6804db3ea5d4b05a9b55",
    creatorCoinStartBlock: 10474544,
    ekuboCore: "0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b",
    ipTicketsFactory: "0x0664c2d6a4da9ee3ff053ceeba7579c01f2fedfd9d2b57b4c07af3734bd4acab",
    ipTicketCollectionClassHash: "0x086f59c416e365e2bee4ceff9f1dcb96198f2342d50ba4621f60b831863adb6",
    ipTicketsStartBlock: 11404656,
    ipClubRegistry: "0x00e189c619b6bb07d78973a149641c59c37eb0716f8584d7520bce12d303eede",
    ipClubNftClassHash: "0x02bc9b20cca21b04245e9215bf7121f4d7295b195890e449b472b573017fb889",
    ipClubStartBlock: 11404776,
    ipSponsorship: "0x044d9b9c3bb29b94685b0a3fe27a5e2dfa30a3637ab55979c718ebcd3268bc2f",
    ipSponsorshipStartBlock: 11405085,
    // Dedicated ip-erc721/MIP instance for sponsorship receipts (class hash
    // 0x01bd7e39c5135b32b664e34cbbb4eafbd707a0fbc3ec2ef28657f52577d277d7) —
    // never the genesis-mint instance.
    ipSponsorshipLicense: "0x06bcfc4e97758a2abf95af4bd49596efdbfd88ccd740caddc56ad0a4bd095839"
  }
};
function getCoordinates(chain) {
  const c = COORDINATES[chain];
  if (!c) throw new Error(`No coordinates configured for chain "${chain}"`);
  return c;
}
var DEFAULT_CHAIN = "STARKNET";
function getStarknetCoordinates(chain) {
  if (chain !== "STARKNET") {
    throw new Error(`This module is Starknet-only (client chain: "${chain}")`);
  }
  return getCoordinates("STARKNET");
}
var FeeConfigSchema = z.object({
  enabled: z.boolean().default(true),
  fundAddress: z.string().min(1).optional(),
  marketplaceBps: z.number().int().min(0).max(1e4).default(100),
  launchpadBps: z.number().int().min(0).max(1e4).default(100)
});
function resolveFeeConfig(raw) {
  const p = FeeConfigSchema.parse(raw ?? {});
  return {
    enabled: p.enabled,
    fundAddress: p.fundAddress,
    marketplaceBps: p.marketplaceBps,
    launchpadBps: p.launchpadBps
  };
}

// src/config.ts
var MedialaneConfigSchema = z.object({
  // Chain-scoped client (spec 2026-06-13 Decision B): one client per chain,
  // coordinates resolved from the registry. Replaces the removed `network` axis.
  chain: z.enum(CHAINS).default(DEFAULT_CHAIN),
  rpcUrl: z.string().url().optional(),
  backendUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  // Per-contract overrides remain for tests/forks; default from the registry.
  marketplace721Contract: z.string().optional(),
  marketplaceContract: z.string().optional(),
  marketplace1155Contract: z.string().optional(),
  collection721Contract: z.string().optional(),
  collectionContract: z.string().optional(),
  collection1155Contract: z.string().optional(),
  retryOptions: z.object({
    maxAttempts: z.number().int().min(1).max(10).optional(),
    baseDelayMs: z.number().int().min(0).optional(),
    maxDelayMs: z.number().int().min(0).optional()
  }).optional(),
  feeConfig: FeeConfigSchema.optional()
});
function resolveConfig(raw) {
  const parsed = MedialaneConfigSchema.parse(raw);
  const coords = getCoordinates(parsed.chain);
  const sn = parsed.chain === "STARKNET" ? coords : {};
  const marketplace721Contract = parsed.marketplace721Contract ?? parsed.marketplaceContract ?? sn.marketplace721;
  const collection721Contract = parsed.collection721Contract ?? parsed.collectionContract ?? sn.collection721;
  return {
    chain: parsed.chain,
    rpcUrl: parsed.rpcUrl ?? coords.rpcUrl,
    backendUrl: parsed.backendUrl,
    apiKey: parsed.apiKey,
    marketplace721Contract,
    marketplaceContract: marketplace721Contract,
    marketplace1155Contract: parsed.marketplace1155Contract ?? sn.marketplace1155,
    collection721Contract,
    collectionContract: collection721Contract,
    collection1155Contract: parsed.collection1155Contract ?? sn.collection1155,
    retryOptions: parsed.retryOptions,
    feeConfig: resolveFeeConfig(parsed.feeConfig)
  };
}
var STARKNET_DOMAIN = [
  { name: "name", type: "shortstring" },
  { name: "version", type: "shortstring" },
  { name: "chainId", type: "shortstring" },
  { name: "revision", type: "shortstring" }
];
var OFFER_ITEM = [
  { name: "item_type", type: "shortstring" },
  { name: "token", type: "ContractAddress" },
  { name: "identifier_or_criteria", type: "felt" },
  { name: "amount", type: "felt" }
];
var CONSIDERATION_ITEM = [
  { name: "item_type", type: "shortstring" },
  { name: "token", type: "ContractAddress" },
  { name: "identifier_or_criteria", type: "felt" },
  { name: "amount", type: "felt" },
  { name: "recipient", type: "ContractAddress" }
];
var ORDER_PARAMETERS = [
  { name: "offerer", type: "ContractAddress" },
  { name: "marketplace", type: "ContractAddress" },
  { name: "offer", type: "OfferItem" },
  { name: "consideration", type: "ConsiderationItem" },
  { name: "royalty_max_bps", type: "felt" },
  { name: "start_time", type: "felt" },
  { name: "end_time", type: "felt" },
  { name: "salt", type: "felt" },
  { name: "counter", type: "felt" }
];
var ORDER_CANCELLATION = [
  { name: "order_hash", type: "felt" },
  { name: "offerer", type: "ContractAddress" }
];
var DOMAIN_VERSION = {
  erc721: "5",
  erc1155: "4"
};
function buildDomain(standard, chainId) {
  return {
    name: "Medialane",
    version: DOMAIN_VERSION[standard],
    chainId,
    revision: TypedDataRevision.ACTIVE
  };
}
function buildOrderTypedData(message, chainId) {
  return {
    domain: buildDomain("erc721", chainId),
    primaryType: "OrderParameters",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderParameters: ORDER_PARAMETERS,
      OfferItem: OFFER_ITEM,
      ConsiderationItem: CONSIDERATION_ITEM
    },
    message
  };
}
function build1155OrderTypedData(message, chainId) {
  return {
    domain: buildDomain("erc1155", chainId),
    primaryType: "OrderParameters",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderParameters: ORDER_PARAMETERS,
      OfferItem: OFFER_ITEM,
      ConsiderationItem: CONSIDERATION_ITEM
    },
    message
  };
}
function buildCancellationTypedData(message, chainId) {
  return {
    domain: buildDomain("erc721", chainId),
    primaryType: "OrderCancellation",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderCancellation: ORDER_CANCELLATION
    },
    message
  };
}
function build1155CancellationTypedData(message, chainId) {
  return {
    domain: buildDomain("erc1155", chainId),
    primaryType: "OrderCancellation",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderCancellation: ORDER_CANCELLATION
    },
    message
  };
}
function encodeByteArray(str) {
  const bytes = new TextEncoder().encode(str);
  const fullChunks = [];
  let i = 0;
  while (i + 31 <= bytes.length) {
    let val = 0n;
    for (const b of bytes.slice(i, i + 31)) {
      val = val << 8n | BigInt(b);
    }
    fullChunks.push(num.toHex(val));
    i += 31;
  }
  const remaining = bytes.slice(i);
  let pendingVal = 0n;
  for (const b of remaining) {
    pendingVal = pendingVal << 8n | BigInt(b);
  }
  return [
    fullChunks.length.toString(),
    ...fullChunks,
    num.toHex(pendingVal),
    remaining.length.toString()
  ];
}

// src/starknet/abis/ipMarketplace.ts
var IPMarketplaceABI = [
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
];

// src/starknet/abis/popCollection.ts
var POPCollectionABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" }
    ]
  },
  {
    type: "function",
    name: "claim",
    inputs: [],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "admin_mint",
    inputs: [
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "custom_uri", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "add_to_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "batch_add_to_allowlist",
    inputs: [{ name: "addresses", type: "core::array::Array::<core::starknet::contract_address::ContractAddress>" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "remove_from_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_token_uri",
    inputs: [
      { name: "token_id", type: "core::integer::u256" },
      { name: "uri", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_paused",
    inputs: [{ name: "paused", type: "core::bool" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "is_eligible",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "has_claimed",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "total_minted",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  }
];

// src/starknet/abis/popFactory.ts
var POPFactoryABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" }
    ]
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
      { name: "Other", type: "()" }
    ]
  },
  {
    type: "function",
    name: "create_collection",
    inputs: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
      { name: "claim_end_time", type: "core::integer::u64" },
      { name: "event_type", type: "pop_protocol::types::EventType" }
    ],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "register_provider",
    inputs: [
      { name: "provider", type: "core::starknet::contract_address::ContractAddress" },
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "website_url", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_pop_collection_class_hash",
    inputs: [{ name: "new_class_hash", type: "core::starknet::class_hash::ClassHash" }],
    outputs: [],
    state_mutability: "external"
  }
];

// src/starknet/abis/dropCollection.ts
var DropCollectionABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" }
    ]
  },
  {
    type: "struct",
    name: "collection_drop::types::ClaimConditions",
    members: [
      { name: "start_time", type: "core::integer::u64" },
      { name: "end_time", type: "core::integer::u64" },
      { name: "price", type: "core::integer::u256" },
      { name: "payment_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "max_quantity_per_wallet", type: "core::integer::u256" }
    ]
  },
  {
    type: "function",
    name: "claim",
    inputs: [{ name: "quantity", type: "core::integer::u256" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "admin_mint",
    inputs: [
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "quantity", type: "core::integer::u256" },
      { name: "custom_uri", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_claim_conditions",
    inputs: [{ name: "conditions", type: "collection_drop::types::ClaimConditions" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "get_claim_conditions",
    inputs: [],
    outputs: [{ type: "collection_drop::types::ClaimConditions" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "set_allowlist_enabled",
    inputs: [{ name: "enabled", type: "core::bool" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "is_allowlist_enabled",
    inputs: [],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "add_to_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "batch_add_to_allowlist",
    inputs: [{ name: "addresses", type: "core::array::Array::<core::starknet::contract_address::ContractAddress>" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "remove_from_allowlist",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "is_allowlisted",
    inputs: [{ name: "address", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "set_base_uri",
    inputs: [{ name: "new_uri", type: "core::byte_array::ByteArray" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_token_uri",
    inputs: [
      { name: "token_id", type: "core::integer::u256" },
      { name: "uri", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "set_paused",
    inputs: [{ name: "paused", type: "core::bool" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "withdraw_payments",
    inputs: [],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "get_drop_id",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_max_supply",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "total_minted",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "remaining_supply",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "minted_by_wallet",
    inputs: [{ name: "wallet", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "is_paused",
    inputs: [],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  }
];

// src/starknet/abis/dropFactory.ts
var DropFactoryABI = [
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      { name: "data", type: "core::array::Array::<core::felt252>" },
      { name: "pending_word", type: "core::felt252" },
      { name: "pending_word_len", type: "core::integer::u32" }
    ]
  },
  {
    type: "struct",
    name: "collection_drop::types::ClaimConditions",
    members: [
      { name: "start_time", type: "core::integer::u64" },
      { name: "end_time", type: "core::integer::u64" },
      { name: "price", type: "core::integer::u256" },
      { name: "payment_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "max_quantity_per_wallet", type: "core::integer::u256" }
    ]
  },
  {
    type: "function",
    name: "register_organizer",
    inputs: [
      { name: "organizer", type: "core::starknet::contract_address::ContractAddress" },
      { name: "name", type: "core::byte_array::ByteArray" }
    ],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "revoke_organizer",
    inputs: [{ name: "organizer", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "is_active_organizer",
    inputs: [{ name: "organizer", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "create_drop",
    inputs: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
      { name: "max_supply", type: "core::integer::u256" },
      { name: "initial_conditions", type: "collection_drop::types::ClaimConditions" }
    ],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "get_drop_address",
    inputs: [{ name: "drop_id", type: "core::integer::u256" }],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_last_drop_id",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_organizer_drop_count",
    inputs: [{ name: "organizer", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u32" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "set_drop_collection_class_hash",
    inputs: [{ name: "new_class_hash", type: "core::starknet::class_hash::ClassHash" }],
    outputs: [],
    state_mutability: "external"
  }
];

// src/starknet/abis/medialane1155.ts
var Medialane1155ABI = [
  {
    "type": "impl",
    "name": "Medialane1155Impl",
    "interface_name": "medialane_marketplace_erc1155::core::interface::IMedialane1155"
  },
  {
    "type": "struct",
    "name": "medialane_marketplace_erc1155::core::types::OfferItem",
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
    "name": "medialane_marketplace_erc1155::core::types::ConsiderationItem",
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
    "name": "medialane_marketplace_erc1155::core::types::OrderParameters",
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
        "type": "medialane_marketplace_erc1155::core::types::OfferItem"
      },
      {
        "name": "consideration",
        "type": "medialane_marketplace_erc1155::core::types::ConsiderationItem"
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
    "name": "medialane_marketplace_erc1155::core::types::Order",
    "members": [
      {
        "name": "parameters",
        "type": "medialane_marketplace_erc1155::core::types::OrderParameters"
      },
      {
        "name": "signature",
        "type": "core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "medialane_marketplace_erc1155::core::types::OrderCancellation",
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
    "name": "medialane_marketplace_erc1155::core::types::CancelRequest",
    "members": [
      {
        "name": "cancelation",
        "type": "medialane_marketplace_erc1155::core::types::OrderCancellation"
      },
      {
        "name": "signature",
        "type": "core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "enum",
    "name": "medialane_marketplace_erc1155::core::types::OrderStatus",
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
    "name": "medialane_marketplace_erc1155::core::types::OrderDetails",
    "members": [
      {
        "name": "offerer",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "offer",
        "type": "medialane_marketplace_erc1155::core::types::OfferItem"
      },
      {
        "name": "consideration",
        "type": "medialane_marketplace_erc1155::core::types::ConsiderationItem"
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
        "type": "medialane_marketplace_erc1155::core::types::OrderStatus"
      },
      {
        "name": "remaining_amount",
        "type": "core::felt252"
      },
      {
        "name": "counter",
        "type": "core::felt252"
      }
    ]
  },
  {
    "type": "interface",
    "name": "medialane_marketplace_erc1155::core::interface::IMedialane1155",
    "items": [
      {
        "type": "function",
        "name": "register_order",
        "inputs": [
          {
            "name": "order",
            "type": "medialane_marketplace_erc1155::core::types::Order"
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
          },
          {
            "name": "quantity",
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
            "type": "medialane_marketplace_erc1155::core::types::CancelRequest"
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
            "type": "medialane_marketplace_erc1155::core::types::OrderDetails"
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
            "type": "medialane_marketplace_erc1155::core::types::OrderParameters"
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
            "type": "medialane_marketplace_erc1155::core::types::OrderCancellation"
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
    "name": "medialane_marketplace_erc1155::core::events::OrderCreated",
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
    "name": "medialane_marketplace_erc1155::core::events::OrderFulfilled",
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
    "name": "medialane_marketplace_erc1155::core::events::OrderCancelled",
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
    "name": "medialane_marketplace_erc1155::core::events::CounterIncremented",
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
    "name": "medialane_marketplace_erc1155::core::medialane::Medialane1155::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "OrderCreated",
        "type": "medialane_marketplace_erc1155::core::events::OrderCreated",
        "kind": "nested"
      },
      {
        "name": "OrderFulfilled",
        "type": "medialane_marketplace_erc1155::core::events::OrderFulfilled",
        "kind": "nested"
      },
      {
        "name": "OrderCancelled",
        "type": "medialane_marketplace_erc1155::core::events::OrderCancelled",
        "kind": "nested"
      },
      {
        "name": "CounterIncremented",
        "type": "medialane_marketplace_erc1155::core::events::CounterIncremented",
        "kind": "nested"
      }
    ]
  }
];

// src/starknet/abis/ipCollection1155Factory.ts
var IPCollection1155FactoryABI = [
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
];

// src/starknet/abis/ipCollection1155.ts
var IPCollection1155ABI = [
  {
    "type": "impl",
    "name": "ERC1155MetadataURIImpl",
    "interface_name": "openzeppelin_token::erc1155::interface::IERC1155MetadataURI"
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
    "type": "interface",
    "name": "openzeppelin_token::erc1155::interface::IERC1155MetadataURI",
    "items": [
      {
        "type": "function",
        "name": "uri",
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
    "name": "IPCollectionImpl",
    "interface_name": "ip_programmable_erc1155_collections::interfaces::IIPCollection::IIPCollection"
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
    "name": "ip_programmable_erc1155_collections::types::TokenData",
    "members": [
      {
        "name": "token_id",
        "type": "core::integer::u256"
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
    "name": "ip_programmable_erc1155_collections::interfaces::IIPCollection::IIPCollection",
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
        "name": "base_uri",
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
        "name": "mint_edition",
        "inputs": [
          {
            "name": "to",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "value",
            "type": "core::integer::u256"
          },
          {
            "name": "token_uri",
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
        "name": "batch_mint_edition",
        "inputs": [
          {
            "name": "to",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "values",
            "type": "core::array::Span::<core::integer::u256>"
          },
          {
            "name": "token_uris",
            "type": "core::array::Array::<core::byte_array::ByteArray>"
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
        "name": "add_supply",
        "inputs": [
          {
            "name": "to",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "token_id",
            "type": "core::integer::u256"
          },
          {
            "name": "value",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_collection_creator",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_token_creator",
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
        "name": "get_token_registered_at",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_token_data",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "ip_programmable_erc1155_collections::types::TokenData"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "total_editions",
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
        "name": "token_exists",
        "inputs": [
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
    "type": "impl",
    "name": "OwnableMixinImpl",
    "interface_name": "openzeppelin_access::ownable::interface::OwnableABI"
  },
  {
    "type": "interface",
    "name": "openzeppelin_access::ownable::interface::OwnableABI",
    "items": [
      {
        "type": "function",
        "name": "owner",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "transfer_ownership",
        "inputs": [
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
        "name": "renounce_ownership",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "transferOwnership",
        "inputs": [
          {
            "name": "newOwner",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "renounceOwnership",
        "inputs": [],
        "outputs": [],
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
    "name": "ERC1155Impl",
    "interface_name": "openzeppelin_token::erc1155::interface::IERC1155"
  },
  {
    "type": "struct",
    "name": "core::array::Span::<core::starknet::contract_address::ContractAddress>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::starknet::contract_address::ContractAddress>"
      }
    ]
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
    "name": "openzeppelin_token::erc1155::interface::IERC1155",
    "items": [
      {
        "type": "function",
        "name": "balance_of",
        "inputs": [
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "token_id",
            "type": "core::integer::u256"
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
        "name": "balance_of_batch",
        "inputs": [
          {
            "name": "accounts",
            "type": "core::array::Span::<core::starknet::contract_address::ContractAddress>"
          },
          {
            "name": "token_ids",
            "type": "core::array::Span::<core::integer::u256>"
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
            "name": "value",
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
        "name": "safe_batch_transfer_from",
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
            "name": "token_ids",
            "type": "core::array::Span::<core::integer::u256>"
          },
          {
            "name": "values",
            "type": "core::array::Span::<core::integer::u256>"
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
      }
    ]
  },
  {
    "type": "impl",
    "name": "ERC1155CamelImpl",
    "interface_name": "openzeppelin_token::erc1155::interface::IERC1155Camel"
  },
  {
    "type": "interface",
    "name": "openzeppelin_token::erc1155::interface::IERC1155Camel",
    "items": [
      {
        "type": "function",
        "name": "balanceOf",
        "inputs": [
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "tokenId",
            "type": "core::integer::u256"
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
        "name": "balanceOfBatch",
        "inputs": [
          {
            "name": "accounts",
            "type": "core::array::Span::<core::starknet::contract_address::ContractAddress>"
          },
          {
            "name": "tokenIds",
            "type": "core::array::Span::<core::integer::u256>"
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
            "name": "value",
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
        "name": "safeBatchTransferFrom",
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
            "name": "tokenIds",
            "type": "core::array::Span::<core::integer::u256>"
          },
          {
            "name": "values",
            "type": "core::array::Span::<core::integer::u256>"
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
      }
    ]
  },
  {
    "type": "impl",
    "name": "ERC2981Impl",
    "interface_name": "openzeppelin_token::common::erc2981::interface::IERC2981"
  },
  {
    "type": "interface",
    "name": "openzeppelin_token::common::erc2981::interface::IERC2981",
    "items": [
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
      }
    ]
  },
  {
    "type": "impl",
    "name": "ERC2981InfoImpl",
    "interface_name": "openzeppelin_token::common::erc2981::interface::IERC2981Info"
  },
  {
    "type": "interface",
    "name": "openzeppelin_token::common::erc2981::interface::IERC2981Info",
    "items": [
      {
        "type": "function",
        "name": "default_royalty",
        "inputs": [],
        "outputs": [
          {
            "type": "(core::starknet::contract_address::ContractAddress, core::integer::u128, core::integer::u128)"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "token_royalty",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "(core::starknet::contract_address::ContractAddress, core::integer::u128, core::integer::u128)"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "impl",
    "name": "ERC2981AdminOwnableImpl",
    "interface_name": "openzeppelin_token::common::erc2981::interface::IERC2981Admin"
  },
  {
    "type": "interface",
    "name": "openzeppelin_token::common::erc2981::interface::IERC2981Admin",
    "items": [
      {
        "type": "function",
        "name": "set_default_royalty",
        "inputs": [
          {
            "name": "receiver",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "fee_numerator",
            "type": "core::integer::u128"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "delete_default_royalty",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "set_token_royalty",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          },
          {
            "name": "receiver",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "fee_numerator",
            "type": "core::integer::u128"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "reset_token_royalty",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
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
    "name": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
    "kind": "struct",
    "members": [
      {
        "name": "previous_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "new_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
    "kind": "struct",
    "members": [
      {
        "name": "previous_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "new_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "OwnershipTransferred",
        "type": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
        "kind": "nested"
      },
      {
        "name": "OwnershipTransferStarted",
        "type": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
        "kind": "nested"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_token::erc1155::erc1155::ERC1155Component::TransferSingle",
    "kind": "struct",
    "members": [
      {
        "name": "operator",
        "type": "core::starknet::contract_address::ContractAddress",
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
        "name": "id",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "value",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_token::erc1155::erc1155::ERC1155Component::TransferBatch",
    "kind": "struct",
    "members": [
      {
        "name": "operator",
        "type": "core::starknet::contract_address::ContractAddress",
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
        "name": "ids",
        "type": "core::array::Span::<core::integer::u256>",
        "kind": "data"
      },
      {
        "name": "values",
        "type": "core::array::Span::<core::integer::u256>",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_token::erc1155::erc1155::ERC1155Component::ApprovalForAll",
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
    "name": "openzeppelin_token::erc1155::erc1155::ERC1155Component::URI",
    "kind": "struct",
    "members": [
      {
        "name": "value",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "id",
        "type": "core::integer::u256",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_token::erc1155::erc1155::ERC1155Component::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "TransferSingle",
        "type": "openzeppelin_token::erc1155::erc1155::ERC1155Component::TransferSingle",
        "kind": "nested"
      },
      {
        "name": "TransferBatch",
        "type": "openzeppelin_token::erc1155::erc1155::ERC1155Component::TransferBatch",
        "kind": "nested"
      },
      {
        "name": "ApprovalForAll",
        "type": "openzeppelin_token::erc1155::erc1155::ERC1155Component::ApprovalForAll",
        "kind": "nested"
      },
      {
        "name": "URI",
        "type": "openzeppelin_token::erc1155::erc1155::ERC1155Component::URI",
        "kind": "nested"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_token::common::erc2981::erc2981::ERC2981Component::Event",
    "kind": "enum",
    "variants": []
  },
  {
    "type": "event",
    "name": "ip_programmable_erc1155_collections::IPCollection::IPCollection::IPMinted",
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
        "name": "value",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "uri",
        "type": "core::byte_array::ByteArray",
        "kind": "data"
      },
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "registered_at",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_programmable_erc1155_collections::IPCollection::IPCollection::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "SRC5Event",
        "type": "openzeppelin_introspection::src5::SRC5Component::Event",
        "kind": "flat"
      },
      {
        "name": "OwnableEvent",
        "type": "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
        "kind": "flat"
      },
      {
        "name": "ERC1155Event",
        "type": "openzeppelin_token::erc1155::erc1155::ERC1155Component::Event",
        "kind": "flat"
      },
      {
        "name": "ERC2981Event",
        "type": "openzeppelin_token::common::erc2981::erc2981::ERC2981Component::Event",
        "kind": "flat"
      },
      {
        "name": "IPMinted",
        "type": "ip_programmable_erc1155_collections::IPCollection::IPCollection::IPMinted",
        "kind": "nested"
      }
    ]
  }
];

// src/starknet/abis/ipCollection.ts
var IPCollectionABI = [
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
];

// src/starknet/abis/ipNft.ts
var IPNftABI = [
  {
    "type": "impl",
    "name": "ERC721Metadata",
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
    "name": "ERC721MetadataCamelOnly",
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
    "name": "IPNftImpl",
    "interface_name": "ip_collection_erc_721::interfaces::IIPNFT::IIPNft"
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
    "name": "core::array::Span::<core::integer::u256>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::integer::u256>"
      }
    ]
  },
  {
    "type": "interface",
    "name": "ip_collection_erc_721::interfaces::IIPNFT::IIPNft",
    "items": [
      {
        "type": "function",
        "name": "mint",
        "inputs": [
          {
            "name": "recipient",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "token_id",
            "type": "core::integer::u256"
          },
          {
            "name": "token_uri",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "creator",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "royalty_bps",
            "type": "core::integer::u128"
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
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "is_archived",
        "inputs": [
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
        "name": "get_collection_id",
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
        "name": "get_registry",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
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
        "name": "base_uri",
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
        "name": "all_tokens_of_owner",
        "inputs": [
          {
            "name": "owner",
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
        "name": "token_exists",
        "inputs": [
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
        "name": "get_full_token_data",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "(core::starknet::contract_address::ContractAddress, core::byte_array::ByteArray, core::starknet::contract_address::ContractAddress, core::integer::u64)"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_token_creator",
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
        "name": "get_token_registered_at",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u64"
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
    "name": "ERC721EnumerableImpl",
    "interface_name": "openzeppelin_token::erc721::extensions::erc721_enumerable::interface::IERC721Enumerable"
  },
  {
    "type": "interface",
    "name": "openzeppelin_token::erc721::extensions::erc721_enumerable::interface::IERC721Enumerable",
    "items": [
      {
        "type": "function",
        "name": "total_supply",
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
        "name": "token_by_index",
        "inputs": [
          {
            "name": "index",
            "type": "core::integer::u256"
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
        "name": "token_of_owner_by_index",
        "inputs": [
          {
            "name": "owner",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "index",
            "type": "core::integer::u256"
          }
        ],
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
    "type": "impl",
    "name": "ERC2981Impl",
    "interface_name": "openzeppelin_token::common::erc2981::interface::IERC2981"
  },
  {
    "type": "interface",
    "name": "openzeppelin_token::common::erc2981::interface::IERC2981",
    "items": [
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
      }
    ]
  },
  {
    "type": "impl",
    "name": "ERC2981InfoImpl",
    "interface_name": "openzeppelin_token::common::erc2981::interface::IERC2981Info"
  },
  {
    "type": "interface",
    "name": "openzeppelin_token::common::erc2981::interface::IERC2981Info",
    "items": [
      {
        "type": "function",
        "name": "default_royalty",
        "inputs": [],
        "outputs": [
          {
            "type": "(core::starknet::contract_address::ContractAddress, core::integer::u128, core::integer::u128)"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "token_royalty",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "(core::starknet::contract_address::ContractAddress, core::integer::u128, core::integer::u128)"
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
      },
      {
        "name": "base_uri",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "collection_id",
        "type": "core::integer::u256"
      },
      {
        "name": "registry",
        "type": "core::starknet::contract_address::ContractAddress"
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
    "name": "openzeppelin_token::erc721::extensions::erc721_enumerable::erc721_enumerable::ERC721EnumerableComponent::Event",
    "kind": "enum",
    "variants": []
  },
  {
    "type": "event",
    "name": "openzeppelin_token::common::erc2981::erc2981::ERC2981Component::Event",
    "kind": "enum",
    "variants": []
  },
  {
    "type": "event",
    "name": "ip_collection_erc_721::IPNft::IPNft::Event",
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
        "name": "ERC721EnumerableEvent",
        "type": "openzeppelin_token::erc721::extensions::erc721_enumerable::erc721_enumerable::ERC721EnumerableComponent::Event",
        "kind": "flat"
      },
      {
        "name": "ERC2981Event",
        "type": "openzeppelin_token::common::erc2981::erc2981::ERC2981Component::Event",
        "kind": "flat"
      }
    ]
  }
];

// src/starknet/abis/creatorCoinFactory.ts
var CreatorCoinFactoryABI = [{ "type": "impl", "name": "FactoryImpl", "interface_name": "creator_coin::factory::interface::IFactory" }, { "type": "struct", "name": "core::integer::u256", "members": [{ "name": "low", "type": "core::integer::u128" }, { "name": "high", "type": "core::integer::u128" }] }, { "type": "struct", "name": "core::array::Span::<core::starknet::contract_address::ContractAddress>", "members": [{ "name": "snapshot", "type": "@core::array::Array::<core::starknet::contract_address::ContractAddress>" }] }, { "type": "struct", "name": "core::array::Span::<core::integer::u256>", "members": [{ "name": "snapshot", "type": "@core::array::Array::<core::integer::u256>" }] }, { "type": "struct", "name": "creator_coin::factory::LaunchParameters", "members": [{ "name": "creator_coin_address", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "transfer_restriction_delay", "type": "core::integer::u64" }, { "name": "max_percentage_buy_launch", "type": "core::integer::u16" }, { "name": "quote_address", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "initial_holders", "type": "core::array::Span::<core::starknet::contract_address::ContractAddress>" }, { "name": "initial_holders_amounts", "type": "core::array::Span::<core::integer::u256>" }] }, { "type": "enum", "name": "core::bool", "variants": [{ "name": "False", "type": "()" }, { "name": "True", "type": "()" }] }, { "type": "struct", "name": "ekubo::types::i129::i129", "members": [{ "name": "mag", "type": "core::integer::u128" }, { "name": "sign", "type": "core::bool" }] }, { "type": "struct", "name": "creator_coin::exchanges::ekubo::ekubo_adapter::EkuboPoolParameters", "members": [{ "name": "fee", "type": "core::integer::u128" }, { "name": "tick_spacing", "type": "core::integer::u128" }, { "name": "starting_price", "type": "ekubo::types::i129::i129" }, { "name": "bound", "type": "core::integer::u128" }] }, { "type": "struct", "name": "ekubo::types::keys::PoolKey", "members": [{ "name": "token0", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "token1", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "fee", "type": "core::integer::u128" }, { "name": "tick_spacing", "type": "core::integer::u128" }, { "name": "extension", "type": "core::starknet::contract_address::ContractAddress" }] }, { "type": "struct", "name": "ekubo::types::bounds::Bounds", "members": [{ "name": "lower", "type": "ekubo::types::i129::i129" }, { "name": "upper", "type": "ekubo::types::i129::i129" }] }, { "type": "struct", "name": "creator_coin::exchanges::ekubo::launcher::EkuboLP", "members": [{ "name": "owner", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "quote_address", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "pool_key", "type": "ekubo::types::keys::PoolKey" }, { "name": "bounds", "type": "ekubo::types::bounds::Bounds" }] }, { "type": "enum", "name": "creator_coin::exchanges::SupportedExchanges", "variants": [{ "name": "Jediswap", "type": "()" }, { "name": "Ekubo", "type": "()" }, { "name": "Starkdefi", "type": "()" }] }, { "type": "enum", "name": "creator_coin::token::creator_coin::LiquidityType", "variants": [{ "name": "JediERC20", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "StarkDeFiERC20", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "EkuboNFT", "type": "core::integer::u64" }] }, { "type": "enum", "name": "core::option::Option::<(core::starknet::contract_address::ContractAddress, creator_coin::token::creator_coin::LiquidityType)>", "variants": [{ "name": "Some", "type": "(core::starknet::contract_address::ContractAddress, creator_coin::token::creator_coin::LiquidityType)" }, { "name": "None", "type": "()" }] }, { "type": "interface", "name": "creator_coin::factory::interface::IFactory", "items": [{ "type": "function", "name": "create_creator_coin", "inputs": [{ "name": "owner", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "name", "type": "core::felt252" }, { "name": "symbol", "type": "core::felt252" }, { "name": "initial_supply", "type": "core::integer::u256" }, { "name": "contract_address_salt", "type": "core::felt252" }], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "external" }, { "type": "function", "name": "launch_on_jediswap", "inputs": [{ "name": "launch_parameters", "type": "creator_coin::factory::LaunchParameters" }, { "name": "quote_amount", "type": "core::integer::u256" }, { "name": "unlock_time", "type": "core::integer::u64" }], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "external" }, { "type": "function", "name": "launch_on_ekubo", "inputs": [{ "name": "launch_parameters", "type": "creator_coin::factory::LaunchParameters" }, { "name": "ekubo_parameters", "type": "creator_coin::exchanges::ekubo::ekubo_adapter::EkuboPoolParameters" }], "outputs": [{ "type": "(core::integer::u64, creator_coin::exchanges::ekubo::launcher::EkuboLP)" }], "state_mutability": "external" }, { "type": "function", "name": "launch_on_starkdefi", "inputs": [{ "name": "launch_parameters", "type": "creator_coin::factory::LaunchParameters" }, { "name": "quote_amount", "type": "core::integer::u256" }, { "name": "unlock_time", "type": "core::integer::u64" }], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "external" }, { "type": "function", "name": "exchange_address", "inputs": [{ "name": "exchange", "type": "creator_coin::exchanges::SupportedExchanges" }], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "view" }, { "type": "function", "name": "lock_manager_address", "inputs": [], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "view" }, { "type": "function", "name": "locked_liquidity", "inputs": [{ "name": "token", "type": "core::starknet::contract_address::ContractAddress" }], "outputs": [{ "type": "core::option::Option::<(core::starknet::contract_address::ContractAddress, creator_coin::token::creator_coin::LiquidityType)>" }], "state_mutability": "view" }, { "type": "function", "name": "is_creator_coin", "inputs": [{ "name": "address", "type": "core::starknet::contract_address::ContractAddress" }], "outputs": [{ "type": "core::bool" }], "state_mutability": "view" }, { "type": "function", "name": "ekubo_core_address", "inputs": [], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "view" }] }, { "type": "struct", "name": "core::array::Span::<(creator_coin::exchanges::SupportedExchanges, core::starknet::contract_address::ContractAddress)>", "members": [{ "name": "snapshot", "type": "@core::array::Array::<(creator_coin::exchanges::SupportedExchanges, core::starknet::contract_address::ContractAddress)>" }] }, { "type": "struct", "name": "core::array::Span::<(core::starknet::contract_address::ContractAddress, core::starknet::contract_address::ContractAddress)>", "members": [{ "name": "snapshot", "type": "@core::array::Array::<(core::starknet::contract_address::ContractAddress, core::starknet::contract_address::ContractAddress)>" }] }, { "type": "constructor", "name": "constructor", "inputs": [{ "name": "creator_coin_class_hash", "type": "core::starknet::class_hash::ClassHash" }, { "name": "lock_manager_address", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "exchanges", "type": "core::array::Span::<(creator_coin::exchanges::SupportedExchanges, core::starknet::contract_address::ContractAddress)>" }, { "name": "migrated_tokens", "type": "core::array::Span::<(core::starknet::contract_address::ContractAddress, core::starknet::contract_address::ContractAddress)>" }] }, { "type": "event", "name": "creator_coin::factory::factory::Factory::CreatorCoinCreated", "kind": "struct", "members": [{ "name": "owner", "type": "core::starknet::contract_address::ContractAddress", "kind": "data" }, { "name": "name", "type": "core::felt252", "kind": "data" }, { "name": "symbol", "type": "core::felt252", "kind": "data" }, { "name": "initial_supply", "type": "core::integer::u256", "kind": "data" }, { "name": "creator_coin_address", "type": "core::starknet::contract_address::ContractAddress", "kind": "data" }] }, { "type": "event", "name": "creator_coin::factory::factory::Factory::CreatorCoinLaunched", "kind": "struct", "members": [{ "name": "creator_coin_address", "type": "core::starknet::contract_address::ContractAddress", "kind": "data" }, { "name": "quote_token", "type": "core::starknet::contract_address::ContractAddress", "kind": "data" }, { "name": "exchange_name", "type": "core::felt252", "kind": "data" }] }, { "type": "event", "name": "creator_coin::factory::factory::Factory::Event", "kind": "enum", "variants": [{ "name": "CreatorCoinCreated", "type": "creator_coin::factory::factory::Factory::CreatorCoinCreated", "kind": "nested" }, { "name": "CreatorCoinLaunched", "type": "creator_coin::factory::factory::Factory::CreatorCoinLaunched", "kind": "nested" }] }];

// src/starknet/abis/ipTicketCollection.ts
var IPTicketCollectionABI = [
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
    "name": "IPTicketImpl",
    "interface_name": "ip_ticket::interface::IIPTicketCollection"
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
    "name": "ip_ticket::types::TicketCollection",
    "members": [
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "price",
        "type": "core::integer::u256"
      },
      {
        "name": "max_supply",
        "type": "core::integer::u256"
      },
      {
        "name": "minted",
        "type": "core::integer::u256"
      },
      {
        "name": "expiration",
        "type": "core::integer::u64"
      },
      {
        "name": "royalty_bps",
        "type": "core::integer::u256"
      },
      {
        "name": "payment_token",
        "type": "core::option::Option::<core::starknet::contract_address::ContractAddress>"
      },
      {
        "name": "metadata_uri",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "active",
        "type": "core::bool"
      }
    ]
  },
  {
    "type": "struct",
    "name": "ip_ticket::types::TicketData",
    "members": [
      {
        "name": "token_id",
        "type": "core::integer::u256"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "collection_id",
        "type": "core::integer::u256"
      },
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "metadata_uri",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "expiration",
        "type": "core::integer::u64"
      },
      {
        "name": "redeemed",
        "type": "core::bool"
      },
      {
        "name": "valid",
        "type": "core::bool"
      }
    ]
  },
  {
    "type": "interface",
    "name": "ip_ticket::interface::IIPTicketCollection",
    "items": [
      {
        "type": "function",
        "name": "create_ticket_collection",
        "inputs": [
          {
            "name": "price",
            "type": "core::integer::u256"
          },
          {
            "name": "max_supply",
            "type": "core::integer::u256"
          },
          {
            "name": "expiration",
            "type": "core::integer::u64"
          },
          {
            "name": "royalty_bps",
            "type": "core::integer::u256"
          },
          {
            "name": "payment_token",
            "type": "core::option::Option::<core::starknet::contract_address::ContractAddress>"
          },
          {
            "name": "metadata_uri",
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
        "name": "set_collection_active",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          },
          {
            "name": "active",
            "type": "core::bool"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "mint_ticket",
        "inputs": [
          {
            "name": "collection_id",
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
        "name": "redeem_ticket",
        "inputs": [
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
        "name": "has_valid_ticket",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
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
        "name": "get_ticket_collection",
        "inputs": [
          {
            "name": "collection_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "ip_ticket::types::TicketCollection"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_ticket_data",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "ip_ticket::types::TicketData"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_ticket_collection_id",
        "inputs": [
          {
            "name": "token_id",
            "type": "core::integer::u256"
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
        "name": "get_active_ticket_balance",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "collection_id",
            "type": "core::integer::u256"
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
        "name": "get_last_collection_id",
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
        "name": "total_supply",
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
    "type": "impl",
    "name": "OwnableMixinImpl",
    "interface_name": "openzeppelin_access::ownable::interface::OwnableABI"
  },
  {
    "type": "interface",
    "name": "openzeppelin_access::ownable::interface::OwnableABI",
    "items": [
      {
        "type": "function",
        "name": "owner",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "transfer_ownership",
        "inputs": [
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
        "name": "renounce_ownership",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "transferOwnership",
        "inputs": [
          {
            "name": "newOwner",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "renounceOwnership",
        "inputs": [],
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
        "name": "name",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "symbol",
        "type": "core::byte_array::ByteArray"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
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
    "name": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
    "kind": "struct",
    "members": [
      {
        "name": "previous_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "new_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
    "kind": "struct",
    "members": [
      {
        "name": "previous_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "new_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "OwnershipTransferred",
        "type": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
        "kind": "nested"
      },
      {
        "name": "OwnershipTransferStarted",
        "type": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
        "kind": "nested"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_ticket::IPTicketCollection::IPTicketCollection::TicketCollectionCreated",
    "kind": "struct",
    "members": [
      {
        "name": "collection_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "price",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "max_supply",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "expiration",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "royalty_bps",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "payment_token",
        "type": "core::option::Option::<core::starknet::contract_address::ContractAddress>",
        "kind": "data"
      },
      {
        "name": "metadata_uri",
        "type": "core::byte_array::ByteArray",
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
    "name": "ip_ticket::IPTicketCollection::IPTicketCollection::CollectionStatusUpdated",
    "kind": "struct",
    "members": [
      {
        "name": "collection_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "active",
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
    "name": "ip_ticket::IPTicketCollection::IPTicketCollection::TicketMinted",
    "kind": "struct",
    "members": [
      {
        "name": "token_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "collection_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
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
    "name": "ip_ticket::IPTicketCollection::IPTicketCollection::TicketRedeemed",
    "kind": "struct",
    "members": [
      {
        "name": "token_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "collection_id",
        "type": "core::integer::u256",
        "kind": "key"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "redeemed_at",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_ticket::IPTicketCollection::IPTicketCollection::Event",
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
        "name": "OwnableEvent",
        "type": "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
        "kind": "flat"
      },
      {
        "name": "TicketCollectionCreated",
        "type": "ip_ticket::IPTicketCollection::IPTicketCollection::TicketCollectionCreated",
        "kind": "nested"
      },
      {
        "name": "CollectionStatusUpdated",
        "type": "ip_ticket::IPTicketCollection::IPTicketCollection::CollectionStatusUpdated",
        "kind": "nested"
      },
      {
        "name": "TicketMinted",
        "type": "ip_ticket::IPTicketCollection::IPTicketCollection::TicketMinted",
        "kind": "nested"
      },
      {
        "name": "TicketRedeemed",
        "type": "ip_ticket::IPTicketCollection::IPTicketCollection::TicketRedeemed",
        "kind": "nested"
      }
    ]
  }
];

// src/starknet/abis/ipTicketCollectionFactory.ts
var IPTicketCollectionFactoryABI = [
  {
    "type": "impl",
    "name": "IPTicketCollectionFactoryImpl",
    "interface_name": "ip_ticket::interface::IIPTicketCollectionFactory"
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
    "name": "ip_ticket::interface::IIPTicketCollectionFactory",
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
        "name": "deploy_ticket_collection",
        "inputs": [
          {
            "name": "name",
            "type": "core::byte_array::ByteArray"
          },
          {
            "name": "symbol",
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
    "name": "ip_ticket::IPTicketCollectionFactory::IPTicketCollectionFactory::CollectionDeployed",
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
      }
    ]
  },
  {
    "type": "event",
    "name": "ip_ticket::IPTicketCollectionFactory::IPTicketCollectionFactory::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "CollectionDeployed",
        "type": "ip_ticket::IPTicketCollectionFactory::IPTicketCollectionFactory::CollectionDeployed",
        "kind": "nested"
      }
    ]
  }
];

// src/starknet/abis/ipClub.ts
var IPClubABI = [
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
];

// src/starknet/abis/ipClubNft.ts
var IPClubNFTABI = [
  {
    "type": "impl",
    "name": "IIPClubNFTImpl",
    "interface_name": "ip_club::interfaces::IIPClubNFT::IIPClubNFT"
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
    "name": "ip_club::interfaces::IIPClubNFT::IIPClubNFT",
    "items": [
      {
        "type": "function",
        "name": "mint",
        "inputs": [
          {
            "name": "recipient",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "burn",
        "inputs": [
          {
            "name": "member",
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
        "name": "has_nft",
        "inputs": [
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
        "name": "get_nft_creator",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_ip_club_manager",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_associated_club_id",
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
        "name": "get_last_minted_id",
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
    "name": "ERC721MixinImpl",
    "interface_name": "openzeppelin_token::erc721::interface::ERC721ABI"
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
    "name": "openzeppelin_token::erc721::interface::ERC721ABI",
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
      },
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
      },
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
      },
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
      },
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
      },
      {
        "name": "club_id",
        "type": "core::integer::u256"
      },
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "ip_club_manager",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "metadata_uri",
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
    "name": "ip_club::IPClubNFT::IPClubNFT::Event",
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
      }
    ]
  }
];

// src/starknet/abis/ipSponsorship.ts
var IPSponsorshipABI = [
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
];

// src/starknet/abis/ipGenesis.ts
var IPGenesisABI = [
  {
    "type": "impl",
    "name": "MIPImpl",
    "interface_name": "mip::interfaces::IMIP"
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
    "name": "mip::interfaces::IMIP",
    "items": [
      {
        "type": "function",
        "name": "mint_item",
        "inputs": [
          {
            "name": "recipient",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "uri",
            "type": "core::byte_array::ByteArray"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "CounterImpl",
    "interface_name": "mip::interfaces::ICounter"
  },
  {
    "type": "interface",
    "name": "mip::interfaces::ICounter",
    "items": [
      {
        "type": "function",
        "name": "current",
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
        "name": "increment",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "decrement",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "ERC721MixinImpl",
    "interface_name": "openzeppelin_token::erc721::interface::ERC721ABI"
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
    "name": "openzeppelin_token::erc721::interface::ERC721ABI",
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
      },
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
      },
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
      },
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
      },
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
    "name": "OwnableMixinImpl",
    "interface_name": "openzeppelin_access::ownable::interface::OwnableABI"
  },
  {
    "type": "interface",
    "name": "openzeppelin_access::ownable::interface::OwnableABI",
    "items": [
      {
        "type": "function",
        "name": "owner",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "transfer_ownership",
        "inputs": [
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
        "name": "renounce_ownership",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "transferOwnership",
        "inputs": [
          {
            "name": "newOwner",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "renounceOwnership",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "impl",
    "name": "ERC721EnumerableImpl",
    "interface_name": "openzeppelin_token::erc721::extensions::erc721_enumerable::interface::IERC721Enumerable"
  },
  {
    "type": "interface",
    "name": "openzeppelin_token::erc721::extensions::erc721_enumerable::interface::IERC721Enumerable",
    "items": [
      {
        "type": "function",
        "name": "total_supply",
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
        "name": "token_by_index",
        "inputs": [
          {
            "name": "index",
            "type": "core::integer::u256"
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
        "name": "token_of_owner_by_index",
        "inputs": [
          {
            "name": "owner",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "index",
            "type": "core::integer::u256"
          }
        ],
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
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
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
    "name": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
    "kind": "struct",
    "members": [
      {
        "name": "previous_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "new_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
    "kind": "struct",
    "members": [
      {
        "name": "previous_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      },
      {
        "name": "new_owner",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "key"
      }
    ]
  },
  {
    "type": "event",
    "name": "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "OwnershipTransferred",
        "type": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
        "kind": "nested"
      },
      {
        "name": "OwnershipTransferStarted",
        "type": "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
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
    "name": "openzeppelin_token::erc721::extensions::erc721_enumerable::erc721_enumerable::ERC721EnumerableComponent::Event",
    "kind": "enum",
    "variants": []
  },
  {
    "type": "event",
    "name": "mip::mip::MIP::CounterComponent::CounterIncremented",
    "kind": "struct",
    "members": [
      {
        "name": "value",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "mip::mip::MIP::CounterComponent::CounterDecremented",
    "kind": "struct",
    "members": [
      {
        "name": "value",
        "type": "core::integer::u256",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "mip::mip::MIP::CounterComponent::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "CounterIncremented",
        "type": "mip::mip::MIP::CounterComponent::CounterIncremented",
        "kind": "nested"
      },
      {
        "name": "CounterDecremented",
        "type": "mip::mip::MIP::CounterComponent::CounterDecremented",
        "kind": "nested"
      }
    ]
  },
  {
    "type": "event",
    "name": "mip::mip::MIP::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "ERC721Event",
        "type": "openzeppelin_token::erc721::erc721::ERC721Component::Event",
        "kind": "flat"
      },
      {
        "name": "OwnableEvent",
        "type": "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
        "kind": "flat"
      },
      {
        "name": "SRC5Event",
        "type": "openzeppelin_introspection::src5::SRC5Component::Event",
        "kind": "flat"
      },
      {
        "name": "ERC721EnumerableEvent",
        "type": "openzeppelin_token::erc721::extensions::erc721_enumerable::erc721_enumerable::ERC721EnumerableComponent::Event",
        "kind": "flat"
      },
      {
        "name": "CounterEvent",
        "type": "mip::mip::MIP::CounterComponent::Event",
        "kind": "flat"
      }
    ]
  }
];

// src/constants.ts
var SN = getCoordinates("STARKNET");
SN.marketplace721;
SN.marketplace721ClassHash;
SN.marketplace721StartBlock;
SN.marketplace1155;
SN.marketplace1155ClassHash;
SN.marketplace1155StartBlock;
SN.collection721;
SN.collection721StartBlock;
SN.ipNftClassHash;
SN.ipCollectionClassHash;
SN.collection1155;
SN.collection1155FactoryClassHash;
SN.collection1155ClassHash;
SN.collection1155StartBlock;
SN.popFactory;
SN.popCollectionClassHash;
SN.dropFactory;
SN.dropCollectionClassHash;
SN.nftComments;
SN.ipTicketsFactory;
SN.ipTicketCollectionClassHash;
SN.ipClubRegistry;
SN.ipClubNftClassHash;
SN.ipSponsorship;
SN.ipSponsorshipLicense;
SN.creatorCoinFactory;
SN.creatorCoinEkuboLauncher;
SN.creatorCoinClassHash;
SN.creatorCoinFactoryClassHash;
SN.creatorCoinStartBlock;
SN.ekuboCore;
var SUPPORTED_TOKENS = [
  {
    // Circle-native USDC on Starknet (canonical)
    symbol: "USDC",
    address: "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb",
    decimals: 6,
    listable: true
  },
  {
    symbol: "USDT",
    address: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
    decimals: 6,
    listable: true
  },
  {
    symbol: "ETH",
    address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    decimals: 18,
    listable: true
  },
  {
    symbol: "STRK",
    address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18,
    listable: true
  },
  {
    symbol: "WBTC",
    address: "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
    decimals: 8,
    listable: true
  }
];
var DEFAULT_CURRENCY = "USDC";

// src/utils/bigint.ts
function stringifyBigInts(obj) {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(stringifyBigInts);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        stringifyBigInts(value)
      ])
    );
  }
  return obj;
}

// src/utils/token.ts
function parseAmount(human, decimals) {
  const [whole, frac = ""] = human.split(".");
  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  return (BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fracPadded)).toString();
}
function getTokenByAddress(address) {
  const lower = address.toLowerCase();
  return SUPPORTED_TOKENS.find((t) => t.address.toLowerCase() === lower);
}

// src/starknet/marketplace/errors.ts
var MedialaneError = class extends Error {
  constructor(message, code = "UNKNOWN", cause) {
    super(message);
    this.code = code;
    this.cause = cause;
    this.name = "MedialaneError";
  }
};
function buildFeeCall(p, cfg) {
  if (!cfg.enabled || !cfg.fundAddress) return null;
  const bps = p.surface === "marketplace" ? cfg.marketplaceBps : cfg.launchpadBps;
  if (bps <= 0) return null;
  const fee = p.grossAmount * BigInt(bps) / 10000n;
  if (fee <= 0n) return null;
  const u = cairo.uint256(fee.toString());
  return {
    contractAddress: p.token,
    entrypoint: "transfer",
    calldata: [cfg.fundAddress, u.low.toString(), u.high.toString()]
  };
}

// src/utils/rpc.ts
var PUBLIC_RPC_FALLBACKS = [
  "https://rpc.starknet.lava.build"
];
var TRANSIENT_BODY_RE = /"code"\s*:\s*-32001|"code"\s*:\s*-32603|unable to complete|rate.?limit|too many|throttl|exceed.*quota|temporarily unavailable|service unavailable|overload|gateway.*time|upstream.*time|backend.*error/i;
function isTransientRpcError(input) {
  const { status, body } = input;
  if (typeof status === "number" && (status === 429 || status >= 500)) return true;
  if (body == null) return false;
  if (typeof body === "object") {
    const err = body.error;
    if (!err || typeof err !== "object") return false;
    const code = err.code;
    if (typeof code === "number") {
      if (code === 429) return true;
      if (code >= -32099 && code <= -32e3) return true;
      if (code === -32603) return true;
    }
    const message = err.message;
    return typeof message === "string" ? TRANSIENT_BODY_RE.test(message) : false;
  }
  return TRANSIENT_BODY_RE.test(String(body));
}
function createFailoverFetch(urls, options = {}) {
  const endpoints = urls.filter((u) => Boolean(u));
  if (endpoints.length === 0) {
    throw new Error("createFailoverFetch: at least one RPC URL is required");
  }
  const doFetch = options.baseFetch ?? fetch;
  const failover = async (_input, init) => {
    let lastError;
    for (let i = 0; i < endpoints.length; i++) {
      const url = endpoints[i];
      const isLast = i === endpoints.length - 1;
      try {
        const res = await doFetch(url, init);
        const text = await res.text();
        const rebuilt = () => new Response(text, { status: res.status, statusText: res.statusText, headers: res.headers });
        if (isLast || !isTransientRpcError({ status: res.status, body: text })) {
          return rebuilt();
        }
        options.onFailover?.({ url, status: res.status });
      } catch (err) {
        lastError = err;
        if (isLast) throw err;
        options.onFailover?.({ url, error: err });
      }
    }
    throw lastError ?? new Error("createFailoverFetch: all endpoints failed");
  };
  return failover;
}

// src/starknet/marketplace/utils.ts
var START_TIME_BUFFER_SECS = 30;
function generateSalt() {
  const bytes = new Uint8Array(31);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return num.toHex(BigInt("0x" + hex));
}
async function resolveRoyaltyMaxBps(provider, nft, tokenId, override) {
  if (override !== void 0) return override;
  try {
    const id = cairo.uint256(tokenId);
    const res = await provider.callContract({
      contractAddress: nft,
      entrypoint: "royalty_info",
      calldata: [id.low.toString(), id.high.toString(), "10000", "0"]
    });
    return BigInt(res[1] ?? "0").toString();
  } catch {
    return "0";
  }
}
function toSignatureArray(sig) {
  if (Array.isArray(sig)) return sig;
  const s = sig;
  return [s.r.toString(), s.s.toString()];
}
function getChainId(config) {
  if (config.chain !== "STARKNET") {
    throw new Error(`SNIP-12 signing is Starknet-only; got chain "${config.chain}"`);
  }
  return constants.StarknetChainId.SN_MAIN;
}
function resolveToken(currency) {
  const token = SUPPORTED_TOKENS.find(
    (t) => t.symbol === currency.toUpperCase() || t.address.toLowerCase() === currency.toLowerCase()
  );
  if (!token) throw new MedialaneError(`Unsupported currency: ${currency}`, "INVALID_PARAMS");
  return token;
}
var _providerCache = /* @__PURE__ */ new WeakMap();
function getProvider(config) {
  let p = _providerCache.get(config);
  if (!p) {
    const urls = Array.from(/* @__PURE__ */ new Set([config.rpcUrl, ...PUBLIC_RPC_FALLBACKS]));
    p = new RpcProvider({ nodeUrl: urls[0], baseFetch: createFailoverFetch(urls) });
    _providerCache.set(config, p);
  }
  return p;
}

// src/starknet/marketplace/orders.ts
var _contractCache = /* @__PURE__ */ new WeakMap();
function makeContract(config) {
  const cached = _contractCache.get(config);
  const provider = getProvider(config);
  if (cached) return { ...cached, provider };
  const contract = new Contract(
    IPMarketplaceABI,
    config.marketplaceContract,
    provider
  );
  _contractCache.set(config, { contract });
  return { contract, provider };
}
async function createListing(account, params, config) {
  const { nftContract, tokenId, price, currency = DEFAULT_CURRENCY, durationSeconds } = params;
  const { contract, provider } = makeContract(config);
  const token = resolveToken(currency);
  const priceWei = parseAmount(price, token.decimals);
  const now = Math.floor(Date.now() / 1e3);
  const startTime = now + START_TIME_BUFFER_SECS;
  const endTime = now + durationSeconds;
  const counter = (await contract.get_counter(account.address)).toString();
  const royaltyMaxBps = await resolveRoyaltyMaxBps(provider, nftContract, tokenId, params.royaltyMaxBps);
  const orderParams = {
    offerer: account.address,
    marketplace: config.marketplaceContract,
    offer: {
      item_type: "ERC721",
      token: nftContract,
      identifier_or_criteria: tokenId,
      amount: "1"
    },
    consideration: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      amount: priceWei,
      recipient: account.address
    },
    royalty_max_bps: royaltyMaxBps,
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    salt: generateSalt(),
    counter
  };
  const chainId = getChainId(config);
  const typedData = stringifyBigInts(buildOrderTypedData(orderParams, chainId));
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);
  const registerPayload = stringifyBigInts({
    parameters: {
      ...orderParams,
      offer: {
        ...orderParams.offer,
        item_type: shortString.encodeShortString(orderParams.offer.item_type)
      },
      consideration: {
        ...orderParams.consideration,
        item_type: shortString.encodeShortString(orderParams.consideration.item_type)
      }
    },
    signature: signatureArray
  });
  const tokenIdUint256 = cairo.uint256(tokenId);
  let isAlreadyApproved = false;
  try {
    const result = await provider.callContract({
      contractAddress: nftContract,
      entrypoint: "get_approved",
      calldata: [tokenIdUint256.low.toString(), tokenIdUint256.high.toString()]
    });
    isAlreadyApproved = BigInt(result[0]).toString() === BigInt(config.marketplaceContract).toString();
  } catch {
  }
  const registerCall = contract.populate("register_order", [registerPayload]);
  const calls = isAlreadyApproved ? [registerCall] : [
    {
      contractAddress: nftContract,
      entrypoint: "approve",
      calldata: [
        config.marketplaceContract,
        tokenIdUint256.low.toString(),
        tokenIdUint256.high.toString()
      ]
    },
    registerCall
  ];
  try {
    const tx = await account.execute(calls);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to create listing", "TRANSACTION_FAILED", err);
  }
}
async function makeOffer(account, params, config) {
  const { nftContract, tokenId, price, currency = DEFAULT_CURRENCY, durationSeconds } = params;
  const { contract, provider } = makeContract(config);
  const token = resolveToken(currency);
  const priceWei = parseAmount(price, token.decimals);
  const now = Math.floor(Date.now() / 1e3);
  const startTime = now + START_TIME_BUFFER_SECS;
  const endTime = now + durationSeconds;
  const counter = (await contract.get_counter(account.address)).toString();
  const royaltyMaxBps = await resolveRoyaltyMaxBps(provider, nftContract, tokenId, params.royaltyMaxBps);
  const orderParams = {
    offerer: account.address,
    marketplace: config.marketplaceContract,
    offer: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      amount: priceWei
    },
    consideration: {
      item_type: "ERC721",
      token: nftContract,
      identifier_or_criteria: tokenId,
      amount: "1",
      recipient: account.address
    },
    royalty_max_bps: royaltyMaxBps,
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    salt: generateSalt(),
    counter
  };
  const chainId = getChainId(config);
  const typedData = stringifyBigInts(buildOrderTypedData(orderParams, chainId));
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);
  const registerPayload = stringifyBigInts({
    parameters: {
      ...orderParams,
      offer: {
        ...orderParams.offer,
        item_type: shortString.encodeShortString(orderParams.offer.item_type)
      },
      consideration: {
        ...orderParams.consideration,
        item_type: shortString.encodeShortString(orderParams.consideration.item_type)
      }
    },
    signature: signatureArray
  });
  const amountUint256 = cairo.uint256(priceWei);
  const approveCall = {
    contractAddress: token.address,
    entrypoint: "approve",
    calldata: [
      config.marketplaceContract,
      amountUint256.low.toString(),
      amountUint256.high.toString()
    ]
  };
  const registerCall = contract.populate("register_order", [registerPayload]);
  try {
    const tx = await account.execute([approveCall, registerCall]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to make offer", "TRANSACTION_FAILED", err);
  }
}
async function fulfillOrder(account, params, config) {
  const { orderHash, paymentToken, totalPrice } = params;
  const { contract, provider } = makeContract(config);
  const totalPriceU256 = cairo.uint256(totalPrice);
  const approveCall = {
    contractAddress: paymentToken,
    entrypoint: "approve",
    calldata: [
      config.marketplaceContract,
      totalPriceU256.low.toString(),
      totalPriceU256.high.toString()
    ]
  };
  const fulfillCall = contract.populate("fulfill_order", [orderHash]);
  const feeCall = buildFeeCall(
    { surface: "marketplace", token: paymentToken, grossAmount: BigInt(totalPrice) },
    config.feeConfig
  );
  const calls = feeCall ? [approveCall, fulfillCall, feeCall] : [approveCall, fulfillCall];
  try {
    const tx = await account.execute(calls);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to fulfill order", "TRANSACTION_FAILED", err);
  }
}
async function cancelOrder(account, params, config) {
  const { orderHash } = params;
  const { contract, provider } = makeContract(config);
  const chainId = getChainId(config);
  const cancelParams = {
    order_hash: orderHash,
    offerer: account.address
  };
  const typedData = stringifyBigInts(
    buildCancellationTypedData(cancelParams, chainId)
  );
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);
  const cancelRequest = stringifyBigInts({
    cancelation: cancelParams,
    signature: signatureArray
  });
  const call = contract.populate("cancel_order", [cancelRequest]);
  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to cancel order", "TRANSACTION_FAILED", err);
  }
}
async function mint(account, params, config) {
  const { collectionId, recipient, tokenUri, royaltyBps, collectionContract } = params;
  const provider = getProvider(config);
  const contractAddress = collectionContract ?? config.collectionContract;
  const id = cairo.uint256(collectionId);
  const calldata = [
    id.low.toString(),
    id.high.toString(),
    recipient,
    ...encodeByteArray(tokenUri),
    royaltyBps.toString()
  ];
  try {
    const tx = await account.execute([{ contractAddress, entrypoint: "mint", calldata }]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to mint NFT", "TRANSACTION_FAILED", err);
  }
}
async function createCollection(account, params, config) {
  const { name, symbol, baseUri, collectionContract } = params;
  const provider = getProvider(config);
  const contractAddress = collectionContract ?? config.collectionContract;
  const calldata = [
    ...encodeByteArray(name),
    ...encodeByteArray(symbol),
    ...encodeByteArray(baseUri)
  ];
  try {
    const tx = await account.execute([{ contractAddress, entrypoint: "create_collection", calldata }]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to create collection", "TRANSACTION_FAILED", err);
  }
}
async function checkoutCart(account, items, config) {
  if (items.length === 0) throw new MedialaneError("Cart is empty", "INVALID_PARAMS");
  const { contract, provider } = makeContract(config);
  const tokenTotals = /* @__PURE__ */ new Map();
  for (const item of items) {
    const prev = tokenTotals.get(item.considerationToken) ?? 0n;
    tokenTotals.set(item.considerationToken, prev + BigInt(item.considerationAmount));
  }
  const approveCalls = Array.from(tokenTotals.entries()).map(([tokenAddr, totalWei]) => {
    const amount = cairo.uint256(totalWei.toString());
    return {
      contractAddress: tokenAddr,
      entrypoint: "approve",
      calldata: [
        config.marketplaceContract,
        amount.low.toString(),
        amount.high.toString()
      ]
    };
  });
  const fulfillCalls = items.map(
    (item) => contract.populate("fulfill_order", [item.orderHash])
  );
  const feeCalls = Array.from(tokenTotals.entries()).map(
    ([tokenAddr, totalWei]) => buildFeeCall(
      { surface: "marketplace", token: tokenAddr, grossAmount: totalWei },
      config.feeConfig
    )
  ).filter((c) => c !== null);
  try {
    const tx = await account.execute([...approveCalls, ...fulfillCalls, ...feeCalls]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Cart checkout failed", "TRANSACTION_FAILED", err);
  }
}
async function getOrderDetails(orderHash, config) {
  const { contract } = makeContract(config);
  return contract.get_order_details(orderHash);
}
async function getCounter(address, config) {
  const { contract } = makeContract(config);
  return BigInt((await contract.get_counter(address)).toString());
}
async function incrementCounter(account, config) {
  const { contract, provider } = makeContract(config);
  const call = contract.populate("increment_counter", []);
  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to increment counter", "TRANSACTION_FAILED", err);
  }
}

// src/starknet/marketplace/index.ts
var MarketplaceModule = class {
  constructor(config) {
    this.config = config;
  }
  // ─── Writes ───────────────────────────────────────────────────────────────
  createListing(account, params) {
    return createListing(account, params, this.config);
  }
  makeOffer(account, params) {
    return makeOffer(account, params, this.config);
  }
  fulfillOrder(account, params) {
    return fulfillOrder(account, params, this.config);
  }
  cancelOrder(account, params) {
    return cancelOrder(account, params, this.config);
  }
  checkoutCart(account, items) {
    return checkoutCart(account, items, this.config);
  }
  mint(account, params) {
    return mint(account, params, this.config);
  }
  createCollection(account, params) {
    return createCollection(account, params, this.config);
  }
  /** Bulk-cancel: bump the caller's counter, invalidating all their open orders. */
  incrementCounter(account) {
    return incrementCounter(account, this.config);
  }
  // ─── View calls ───────────────────────────────────────────────────────────
  getOrderDetails(orderHash) {
    return getOrderDetails(orderHash, this.config);
  }
  getCounter(address) {
    return getCounter(address, this.config);
  }
  // ─── Typed data builders (for ChipiPay / custom signing flows) ───────────
  buildListingTypedData(params, chainId) {
    return buildOrderTypedData(params, chainId);
  }
  buildCancellationTypedData(params, chainId) {
    return buildCancellationTypedData(params, chainId);
  }
};
var _contractCache2 = /* @__PURE__ */ new WeakMap();
function getContract(config) {
  let c = _contractCache2.get(config);
  if (!c) {
    const provider = getProvider(config);
    c = new Contract(
      Medialane1155ABI,
      config.marketplace1155Contract,
      provider
    );
    _contractCache2.set(config, c);
  }
  return c;
}
async function createListing1155(account, params, config) {
  const {
    nftContract,
    tokenId,
    amount,
    pricePerUnit,
    currency = DEFAULT_CURRENCY,
    durationSeconds
  } = params;
  const contract = getContract(config);
  const provider = getProvider(config);
  const token = resolveToken(currency);
  const priceWei = parseAmount(pricePerUnit, token.decimals);
  const now = Math.floor(Date.now() / 1e3);
  const endTime = now + durationSeconds;
  const chainId = getChainId(config);
  const counter = (await contract.get_counter(account.address)).toString();
  const royaltyMaxBps = await resolveRoyaltyMaxBps(provider, nftContract, tokenId, params.royaltyMaxBps);
  const orderParams = {
    offerer: account.address,
    marketplace: config.marketplace1155Contract,
    offer: {
      item_type: "ERC1155",
      token: nftContract,
      identifier_or_criteria: tokenId,
      amount
      // ERC-1155 leg amount = unit quantity
    },
    consideration: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      amount: priceWei,
      // payment leg amount = price PER UNIT
      recipient: account.address
    },
    royalty_max_bps: royaltyMaxBps,
    start_time: (now + START_TIME_BUFFER_SECS).toString(),
    end_time: endTime.toString(),
    salt: generateSalt(),
    counter
  };
  const typedData = stringifyBigInts(
    build1155OrderTypedData(orderParams, chainId)
  );
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);
  const orderPayload = stringifyBigInts({
    parameters: {
      ...orderParams,
      offer: {
        ...orderParams.offer,
        item_type: shortString.encodeShortString(orderParams.offer.item_type)
      },
      consideration: {
        ...orderParams.consideration,
        item_type: shortString.encodeShortString(orderParams.consideration.item_type)
      }
    },
    signature: signatureArray
  });
  let isApproved = false;
  try {
    const result = await provider.callContract({
      contractAddress: nftContract,
      entrypoint: "is_approved_for_all",
      calldata: [account.address, config.marketplace1155Contract]
    });
    isApproved = BigInt(result[0]) === 1n;
  } catch {
  }
  const registerCall = contract.populate("register_order", [orderPayload]);
  const calls = isApproved ? [registerCall] : [
    {
      contractAddress: nftContract,
      entrypoint: "set_approval_for_all",
      calldata: [config.marketplace1155Contract, "1"]
    },
    registerCall
  ];
  try {
    const tx = await account.execute(calls);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to create ERC-1155 listing", "TRANSACTION_FAILED", err);
  }
}
async function fulfillOrder1155(account, params, config) {
  const { orderHash, paymentToken, totalPrice, quantity = "1" } = params;
  const contract = getContract(config);
  const provider = getProvider(config);
  const totalPriceU256 = cairo.uint256(totalPrice);
  const approveCall = {
    contractAddress: paymentToken,
    entrypoint: "approve",
    calldata: [
      config.marketplace1155Contract,
      totalPriceU256.low.toString(),
      totalPriceU256.high.toString()
    ]
  };
  const fulfillCall = contract.populate("fulfill_order", [orderHash, quantity]);
  try {
    const tx = await account.execute([approveCall, fulfillCall]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to fulfill ERC-1155 order", "TRANSACTION_FAILED", err);
  }
}
async function cancelOrder1155(account, params, config) {
  const { orderHash } = params;
  const contract = getContract(config);
  const provider = getProvider(config);
  const chainId = getChainId(config);
  const cancelParams = {
    order_hash: orderHash,
    offerer: account.address
  };
  const typedData = stringifyBigInts(
    build1155CancellationTypedData(cancelParams, chainId)
  );
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);
  const cancelPayload = stringifyBigInts({
    cancelation: cancelParams,
    signature: signatureArray
  });
  const cancelCall = contract.populate("cancel_order", [cancelPayload]);
  try {
    const tx = await account.execute(cancelCall);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to cancel ERC-1155 order", "TRANSACTION_FAILED", err);
  }
}
async function makeOffer1155(account, params, config) {
  const {
    nftContract,
    tokenId,
    amount,
    price,
    currency = DEFAULT_CURRENCY,
    durationSeconds
  } = params;
  const contract = getContract(config);
  const provider = getProvider(config);
  const chainId = getChainId(config);
  const token = resolveToken(currency);
  const priceWei = parseAmount(price, token.decimals);
  const now = Math.floor(Date.now() / 1e3);
  const endTime = now + durationSeconds;
  const counter = (await contract.get_counter(account.address)).toString();
  const royaltyMaxBps = await resolveRoyaltyMaxBps(provider, nftContract, tokenId, params.royaltyMaxBps);
  const orderParams = {
    offerer: account.address,
    marketplace: config.marketplace1155Contract,
    offer: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      amount: priceWei
      // price PER UNIT
    },
    consideration: {
      item_type: "ERC1155",
      token: nftContract,
      identifier_or_criteria: tokenId,
      amount,
      // unit quantity
      recipient: account.address
    },
    royalty_max_bps: royaltyMaxBps,
    start_time: (now + START_TIME_BUFFER_SECS).toString(),
    end_time: endTime.toString(),
    salt: generateSalt(),
    counter
  };
  const typedData = stringifyBigInts(
    build1155OrderTypedData(orderParams, chainId)
  );
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);
  const registerPayload = stringifyBigInts({
    parameters: {
      ...orderParams,
      offer: {
        ...orderParams.offer,
        item_type: shortString.encodeShortString(orderParams.offer.item_type)
      },
      consideration: {
        ...orderParams.consideration,
        item_type: shortString.encodeShortString(orderParams.consideration.item_type)
      }
    },
    signature: signatureArray
  });
  const totalWei = BigInt(priceWei) * BigInt(amount);
  const amountU256 = cairo.uint256(totalWei.toString());
  const approveCall = {
    contractAddress: token.address,
    entrypoint: "approve",
    calldata: [
      config.marketplace1155Contract,
      amountU256.low.toString(),
      amountU256.high.toString()
    ]
  };
  const registerCall = contract.populate("register_order", [registerPayload]);
  try {
    const tx = await account.execute([approveCall, registerCall]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to make ERC-1155 offer", "TRANSACTION_FAILED", err);
  }
}
async function checkoutCart1155(account, items, config) {
  if (items.length === 0) throw new MedialaneError("Cart is empty", "INVALID_PARAMS");
  const contract = getContract(config);
  const provider = getProvider(config);
  const tokenTotals = /* @__PURE__ */ new Map();
  for (const item of items) {
    const prev = tokenTotals.get(item.considerationToken) ?? 0n;
    tokenTotals.set(item.considerationToken, prev + BigInt(item.considerationAmount));
  }
  const approveCalls = Array.from(tokenTotals.entries()).map(([tokenAddr, totalWei]) => {
    const amount = cairo.uint256(totalWei.toString());
    return {
      contractAddress: tokenAddr,
      entrypoint: "approve",
      calldata: [
        config.marketplace1155Contract,
        amount.low.toString(),
        amount.high.toString()
      ]
    };
  });
  const fulfillCalls = items.map(
    (item) => contract.populate("fulfill_order", [item.orderHash, item.quantity ?? "1"])
  );
  try {
    const tx = await account.execute([...approveCalls, ...fulfillCalls]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("ERC-1155 cart checkout failed", "TRANSACTION_FAILED", err);
  }
}
async function getOrderDetails1155(orderHash, config) {
  const contract = getContract(config);
  return contract.get_order_details(orderHash);
}
async function getCounter1155(address, config) {
  const contract = getContract(config);
  return BigInt((await contract.get_counter(address)).toString());
}
async function incrementCounter1155(account, config) {
  const contract = getContract(config);
  const provider = getProvider(config);
  const call = contract.populate("increment_counter", []);
  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to increment counter (1155)", "TRANSACTION_FAILED", err);
  }
}

// src/starknet/marketplace1155/index.ts
var Medialane1155Module = class {
  constructor(config) {
    this.config = config;
  }
  // ─── Writes ───────────────────────────────────────────────────────────────
  /**
   * Create an ERC-1155 sell listing.
   * Optionally grants `set_approval_for_all` if not already approved.
   */
  createListing(account, params) {
    return createListing1155(account, params, this.config);
  }
  /**
   * Make an offer (bid) on an ERC-1155 token.
   * Approves the ERC-20 spend then calls `register_order` atomically.
   */
  makeOffer(account, params) {
    return makeOffer1155(account, params, this.config);
  }
  /**
   * Fulfill (buy) an ERC-1155 listing.
   * Approves the payment token then calls `fulfill_order` atomically.
   */
  fulfillOrder(account, params) {
    return fulfillOrder1155(account, params, this.config);
  }
  /**
   * Cancel an ERC-1155 listing (offerer only).
   */
  cancelOrder(account, params) {
    return cancelOrder1155(account, params, this.config);
  }
  /**
   * Checkout a cart of ERC-1155 orders atomically.
   * Signs one fulfillment per item (with quantity), sums ERC-20 approvals by token.
   */
  checkoutCart(account, items) {
    return checkoutCart1155(account, items, this.config);
  }
  /** Bulk-cancel on the 1155 venue: bump the caller's counter. */
  incrementCounter(account) {
    return incrementCounter1155(account, this.config);
  }
  // ─── View calls ───────────────────────────────────────────────────────────
  getOrderDetails(orderHash) {
    return getOrderDetails1155(orderHash, this.config);
  }
  getCounter(address) {
    return getCounter1155(address, this.config);
  }
  // ─── Typed data builders (for ChipiPay / custom signing flows) ───────────
  buildListingTypedData(params, chainId) {
    return build1155OrderTypedData(params, chainId);
  }
  buildCancellationTypedData(params, chainId) {
    return build1155CancellationTypedData(params, chainId);
  }
};
function normalizeAddress(chain, address) {
  switch (chain) {
    case "STARKNET":
      return normalizeStarknet(address);
    case "ETHEREUM":
    case "BASE":
      return normalizeEvm(address);
    case "SOLANA":
      return normalizeSolana(address);
    case "STELLAR":
      return normalizeStellar(address);
    case "BITCOIN":
      throw new Error("BITCOIN address normalization not implemented");
  }
}
function normalizeStarknet(address) {
  try {
    const hex = BigInt(address).toString(16);
    return "0x" + hex.padStart(64, "0").toLowerCase();
  } catch {
    throw new Error(`Invalid STARKNET address: "${address}"`);
  }
}
function normalizeEvm(address) {
  const m = /^0x([0-9a-fA-F]{40})$/.exec(address);
  if (!m) throw new Error(`Invalid ETHEREUM/BASE address: "${address}"`);
  const lower = m[1].toLowerCase();
  const hash4 = keccak_256(new TextEncoder().encode(lower));
  let out = "0x";
  for (let i = 0; i < 40; i++) {
    const nibble = hash4[i >> 1] >> (i % 2 === 0 ? 4 : 0) & 15;
    out += nibble >= 8 ? lower[i].toUpperCase() : lower[i];
  }
  return out;
}
function normalizeSolana(address) {
  try {
    const bytes = base58.decode(address);
    if (bytes.length !== 32) throw new Error("not a 32-byte key");
    return address;
  } catch {
    throw new Error(`Invalid SOLANA address: "${address}"`);
  }
}
var STELLAR_VERSION_BYTES = /* @__PURE__ */ new Set([6 << 3, 2 << 3]);
function normalizeStellar(address) {
  const upper = address.toUpperCase();
  if (!/^[GC][A-Z2-7]{55}$/.test(upper)) {
    throw new Error(`Invalid STELLAR address: "${address}"`);
  }
  let decoded;
  try {
    decoded = base32.decode(upper);
  } catch {
    throw new Error(`Invalid STELLAR address: "${address}"`);
  }
  if (decoded.length !== 35 || !STELLAR_VERSION_BYTES.has(decoded[0])) {
    throw new Error(`Invalid STELLAR address: "${address}"`);
  }
  const payload = decoded.subarray(0, 33);
  const checksum = decoded[33] | decoded[34] << 8;
  if (crc16xmodem(payload) !== checksum) {
    throw new Error(`Invalid STELLAR address: "${address}"`);
  }
  return upper;
}
function crc16xmodem(bytes) {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 32768 ? (crc << 1 ^ 4129) & 65535 : crc << 1 & 65535;
    }
  }
  return crc;
}

// src/utils/retry.ts
var DEFAULT_MAX_ATTEMPTS = 3;
var DEFAULT_BASE_DELAY_MS = 300;
var DEFAULT_MAX_DELAY_MS = 5e3;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function withRetry(fn, opts) {
  const maxAttempts = opts?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = opts?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = opts?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof MedialaneApiError && err.status < 500) {
        throw err;
      }
      const isRetryable = err instanceof MedialaneApiError && err.status >= 500 || err instanceof TypeError;
      if (!isRetryable || attempt === maxAttempts - 1) {
        throw err;
      }
      const jitter = Math.random() * baseDelayMs;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + jitter, maxDelayMs);
      await sleep(delay);
    }
  }
  throw lastError;
}

// src/api/client.ts
function deriveErrorCode(status) {
  if (status === 404) return "TOKEN_NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status === 410) return "INTENT_EXPIRED";
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 400) return "INVALID_PARAMS";
  return "UNKNOWN";
}
var MedialaneApiError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "MedialaneApiError";
    this.code = deriveErrorCode(status);
  }
};
var ApiClient = class {
  constructor(baseUrl, apiKey, retryOptions, chain = "STARKNET") {
    this.baseUrl = baseUrl;
    this.chain = chain;
    this.baseHeaders = apiKey ? { "x-api-key": apiKey } : {};
    this.retryOptions = retryOptions;
  }
  /** Normalize an address for this client's chain (chain-scoped — Decision B). */
  addr(a) {
    return normalizeAddress(this.chain, a);
  }
  async request(path, init) {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const headers = { ...this.baseHeaders };
    if (!(init?.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const res = await withRetry(async () => {
      const response = await fetch(url, {
        ...init,
        headers: { ...headers, ...init?.headers }
      });
      if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        let message = text;
        try {
          const body = JSON.parse(text);
          if (body.error) message = body.error;
        } catch {
        }
        throw new MedialaneApiError(response.status, message);
      }
      return response;
    }, this.retryOptions);
    return res.json();
  }
  get(path) {
    return this.request(path, { method: "GET" });
  }
  post(path, body) {
    return this.request(path, { method: "POST", body: JSON.stringify(body) });
  }
  patch(path, body) {
    return this.request(path, { method: "PATCH", body: JSON.stringify(body) });
  }
  del(path) {
    return this.request(path, { method: "DELETE" });
  }
  async checkResponse(res, options) {
    if (options?.allow404 && res.status === 404) return null;
    if (options?.allow403 && res.status === 403) return null;
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      let message = text;
      try {
        const body = JSON.parse(text);
        if (body.error) message = body.error;
      } catch {
      }
      throw new MedialaneApiError(res.status, message);
    }
    return res.json();
  }
  // ─── Orders ────────────────────────────────────────────────────────────────
  getOrders(query = {}) {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.collection) params.set("collection", query.collection);
    if (query.currency) params.set("currency", query.currency);
    if (query.sort) params.set("sort", query.sort);
    if (query.page !== void 0) params.set("page", String(query.page));
    if (query.limit !== void 0) params.set("limit", String(query.limit));
    if (query.offerer) params.set("offerer", this.addr(query.offerer));
    if (query.minPrice) params.set("minPrice", query.minPrice);
    if (query.maxPrice) params.set("maxPrice", query.maxPrice);
    if (query.chain) params.set("chain", query.chain);
    const qs = params.toString();
    return this.get(`/v1/orders${qs ? `?${qs}` : ""}`);
  }
  getOrder(orderHash) {
    return this.get(`/v1/orders/${orderHash}`);
  }
  getActiveOrdersForToken(contract, tokenId) {
    return this.get(`/v1/orders/token/${this.addr(contract)}/${tokenId}`);
  }
  getOrdersByUser(address, page = 1, limit = 20) {
    return this.get(
      `/v1/orders/user/${this.addr(address)}?page=${page}&limit=${limit}`
    );
  }
  // ─── Tokens ────────────────────────────────────────────────────────────────
  getToken(contract, tokenId, wait = false) {
    return this.get(
      `/v1/tokens/${contract}/${tokenId}${wait ? "?wait=true" : ""}`
    );
  }
  getTokensByOwner(address, page = 1, limit = 20) {
    return this.get(
      `/v1/tokens/owned/${this.addr(address)}?page=${page}&limit=${limit}`
    );
  }
  getTokenHistory(contract, tokenId, page = 1, limit = 20) {
    return this.get(
      `/v1/tokens/${contract}/${tokenId}/history?page=${page}&limit=${limit}`
    );
  }
  // ─── Collections ───────────────────────────────────────────────────────────
  getCollections(page = 1, limit = 20, isKnown, sort, service, chain) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (isKnown !== void 0) params.set("isKnown", String(isKnown));
    if (sort) params.set("sort", sort);
    if (service) params.set("service", service);
    if (chain) params.set("chain", chain);
    return this.get(`/v1/collections?${params}`);
  }
  getCollectionsByOwner(owner, page = 1, limit = 50) {
    const params = new URLSearchParams({ owner: this.addr(owner), page: String(page), limit: String(limit) });
    return this.get(`/v1/collections?${params}`);
  }
  getCollection(contract) {
    return this.get(`/v1/collections/${this.addr(contract)}`);
  }
  getCollectionTokens(contract, page = 1, limit = 20, sort = "recent") {
    return this.get(
      `/v1/collections/${this.addr(contract)}/tokens?page=${page}&limit=${limit}&sort=${sort}`
    );
  }
  // ─── Activities ────────────────────────────────────────────────────────────
  getActivities(query = {}) {
    const params = new URLSearchParams();
    if (query.type) params.set("type", query.type);
    if (query.page !== void 0) params.set("page", String(query.page));
    if (query.limit !== void 0) params.set("limit", String(query.limit));
    if (query.chain) params.set("chain", query.chain);
    const qs = params.toString();
    return this.get(`/v1/activities${qs ? `?${qs}` : ""}`);
  }
  getActivitiesByAddress(address, page = 1, limit = 20) {
    return this.get(
      `/v1/activities/${this.addr(address)}?page=${page}&limit=${limit}`
    );
  }
  // ─── Comments ──────────────────────────────────────────────────────────────
  getTokenComments(contract, tokenId, opts = {}) {
    const params = new URLSearchParams();
    if (opts.page !== void 0) params.set("page", String(opts.page));
    if (opts.limit !== void 0) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return this.get(
      `/v1/tokens/${this.addr(contract)}/${tokenId}/comments${qs ? `?${qs}` : ""}`
    );
  }
  // ─── Search ────────────────────────────────────────────────────────────────
  search(q, limit = 10) {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return this.get(
      `/v1/search?${params.toString()}`
    );
  }
  // ─── Intents ───────────────────────────────────────────────────────────────
  createListingIntent(params) {
    return this.post("/v1/intents/listing", params);
  }
  createOfferIntent(params) {
    return this.post("/v1/intents/offer", params);
  }
  createFulfillIntent(params) {
    return this.post("/v1/intents/fulfill", params);
  }
  createCancelIntent(params) {
    return this.post("/v1/intents/cancel", params);
  }
  getIntent(id) {
    return this.get(`/v1/intents/${id}`);
  }
  submitIntentSignature(id, signature) {
    return this.patch(`/v1/intents/${id}/signature`, { signature });
  }
  confirmIntent(id, txHash) {
    return this.patch(`/v1/intents/${id}/confirm`, { txHash });
  }
  createMintIntent(params) {
    return this.post("/v1/intents/mint", params);
  }
  createCollectionIntent(params) {
    return this.post("/v1/intents/create-collection", params);
  }
  /**
   * Create a counter-offer intent. The seller proposes a new price in response
   * to a buyer's active bid. clerkToken is optional — the endpoint authenticates
   * via the tenant API key; pass a Clerk JWT only if your backend requires it.
   */
  createCounterOfferIntent(params, clerkToken) {
    const extraHeaders = clerkToken ? { "Authorization": `Bearer ${clerkToken}` } : {};
    return this.request("/v1/intents/counter-offer", {
      method: "POST",
      body: JSON.stringify(params),
      headers: extraHeaders
    });
  }
  /**
   * Fetch counter-offers. Pass `originalOrderHash` (buyer view) or
   * `sellerAddress` (seller view) — at least one is required.
   */
  getCounterOffers(query) {
    const params = new URLSearchParams();
    if (query.originalOrderHash) params.set("originalOrderHash", query.originalOrderHash);
    if (query.sellerAddress) params.set("sellerAddress", query.sellerAddress);
    if (query.page !== void 0) params.set("page", String(query.page));
    if (query.limit !== void 0) params.set("limit", String(query.limit));
    return this.get(`/v1/orders/counter-offers?${params}`);
  }
  // ─── Metadata ──────────────────────────────────────────────────────────────
  getMetadataSignedUrl() {
    return this.get("/v1/metadata/signed-url");
  }
  uploadMetadata(metadata) {
    return this.post("/v1/metadata/upload", metadata);
  }
  resolveMetadata(uri) {
    const params = new URLSearchParams({ uri });
    return this.get(`/v1/metadata/resolve?${params.toString()}`);
  }
  uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request("/v1/metadata/upload-file", {
      method: "POST",
      body: formData
    });
  }
  // ─── Portal (tenant self-service) ──────────────────────────────────────────
  getMe() {
    return this.get("/v1/portal/me");
  }
  getApiKeys() {
    return this.get("/v1/portal/keys");
  }
  createApiKey(label) {
    return this.post("/v1/portal/keys", label ? { label } : {});
  }
  deleteApiKey(id) {
    return this.del(`/v1/portal/keys/${id}`);
  }
  getUsage() {
    return this.get("/v1/portal/usage");
  }
  getWebhooks() {
    return this.get("/v1/portal/webhooks");
  }
  createWebhook(params) {
    return this.post("/v1/portal/webhooks", params);
  }
  deleteWebhook(id) {
    return this.del(
      `/v1/portal/webhooks/${id}`
    );
  }
  // ─── Collection Claims ──────────────────────────────────────────────────────
  /**
   * Path 1: On-chain auto claim. Sends both x-api-key (tenant auth) and
   * Authorization: Bearer (Clerk JWT) simultaneously.
   */
  async claimCollection(contractAddress, walletAddress, clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/claim`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": this.baseHeaders["x-api-key"] ?? "",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkToken}`
      },
      body: JSON.stringify({ contractAddress, walletAddress })
    });
    return this.checkResponse(res);
  }
  /**
   * Path 3: Manual off-chain claim request (email-based).
   */
  requestCollectionClaim(params) {
    return this.request("/v1/collections/claim/request", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  // ─── Collection Profiles ────────────────────────────────────────────────────
  async getCollectionProfile(contractAddress) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/${this.addr(contractAddress)}/profile`;
    const res = await fetch(url, { headers: this.baseHeaders });
    return this.checkResponse(res, { allow404: true });
  }
  /**
   * Update collection profile. Requires Clerk JWT for ownership check.
   */
  async updateCollectionProfile(contractAddress, data, clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/${this.addr(contractAddress)}/profile`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "x-api-key": this.baseHeaders["x-api-key"] ?? "",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkToken}`
      },
      body: JSON.stringify(data)
    });
    return this.checkResponse(res);
  }
  async getGatedContent(contractAddress, clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/${this.addr(contractAddress)}/gated-content`;
    const res = await fetch(url, {
      headers: { ...this.baseHeaders, "Authorization": `Bearer ${clerkToken}` }
    });
    return this.checkResponse(res, { allow404: true, allow403: true });
  }
  // ─── Creator Profiles ───────────────────────────────────────────────────────
  /** List all creators with an approved username. */
  async getCreators(opts = {}) {
    const params = new URLSearchParams();
    if (opts.search) params.set("search", opts.search);
    if (opts.page) params.set("page", String(opts.page));
    if (opts.limit) params.set("limit", String(opts.limit));
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators?${params}`;
    const res = await fetch(url, { headers: this.baseHeaders });
    return this.checkResponse(res);
  }
  async getCreatorProfile(walletAddress) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators/${this.addr(walletAddress)}/profile`;
    const res = await fetch(url, { headers: this.baseHeaders });
    return this.checkResponse(res, { allow404: true });
  }
  /** Resolve a username slug to a creator profile (public). */
  async getCreatorByUsername(username) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators/by-username/${encodeURIComponent(username.toLowerCase().trim())}`;
    const res = await fetch(url, { headers: this.baseHeaders });
    return this.checkResponse(res, { allow404: true });
  }
  /**
   * Update creator profile. Requires Clerk JWT; wallet must match authenticated user.
   */
  async updateCreatorProfile(walletAddress, data, clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators/${this.addr(walletAddress)}/profile`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "x-api-key": this.baseHeaders["x-api-key"] ?? "",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkToken}`
      },
      body: JSON.stringify(data)
    });
    return this.checkResponse(res);
  }
  // ─── Collection Slug Claims ───────────────────────────────────────────────────
  /** Check if a collection slug is available (public, no auth). */
  async checkCollectionSlugAvailability(slug) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collection-slug-claims/check/${encodeURIComponent(slug.toLowerCase().trim())}`;
    const res = await fetch(url, { headers: this.baseHeaders });
    return this.checkResponse(res);
  }
  /** Submit a slug claim for a collection. Requires Clerk JWT — caller must be the collection owner. */
  async submitCollectionSlugClaim(contractAddress, slug, clerkToken, notifyEmail) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collection-slug-claims`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": this.baseHeaders["x-api-key"] ?? "",
        "Content-Type": "application/json",
        Authorization: `Bearer ${clerkToken}`
      },
      body: JSON.stringify({ contractAddress, slug, notifyEmail })
    });
    return this.checkResponse(res);
  }
  /** Returns all slug claims submitted by the authenticated wallet. Requires Clerk JWT. */
  async getMyCollectionSlugClaims(clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collection-slug-claims/me`;
    const res = await fetch(url, {
      headers: { ...this.baseHeaders, Authorization: `Bearer ${clerkToken}` }
    });
    return this.checkResponse(res);
  }
  /** Resolve a collection slug to a full collection. Returns null if not found. */
  async getCollectionBySlug(slug) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/by-slug/${encodeURIComponent(slug.toLowerCase().trim())}`;
    const res = await fetch(url, { headers: this.baseHeaders });
    return this.checkResponse(res, { allow404: true });
  }
  // ─── User Wallet ─────────────────────────────────────────────────────────────
  /**
   * Upsert the authenticated user's wallet address in the backend DB.
   * Call after onboarding when ChipiPay confirms the wallet address.
   * Requires Clerk JWT; no tenant API key needed.
   */
  /**
   * Frictionless wallet registration. Tenant API key only (no Clerk JWT required).
   * Idempotent — backend's ensureAccountForWallet upserts and upgrades existing
   * UNKNOWN walletType rows when a more specific value is supplied.
   */
  async registerUser(params) {
    return this.post("/v1/users/register", params);
  }
  async upsertMyWallet(clerkToken, options = {}) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/users/me`;
    const body = {
      walletType: options.walletType ?? "UNKNOWN",
      appSource: options.appSource ?? "MEDIALANE_SDK"
    };
    if (options.chain) body.chain = options.chain;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkToken}`
      },
      body: JSON.stringify(body)
    });
    return this.checkResponse(res);
  }
  /**
   * Get the authenticated user's stored wallet address from the backend DB.
   * Returns null if the user has not completed onboarding yet.
   * Requires Clerk JWT; no tenant API key needed.
   */
  async getMyWallet(clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/users/me`;
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
    return this.checkResponse(res, { allow404: true });
  }
  // ─── Remix Licensing ─────────────────────────────────────────────────────────
  /**
   * Get public remixes of a token (open to everyone).
   */
  getTokenRemixes(contract, tokenId, opts = {}) {
    const params = new URLSearchParams();
    if (opts.page !== void 0) params.set("page", String(opts.page));
    if (opts.limit !== void 0) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return this.get(
      `/v1/tokens/${this.addr(contract)}/${tokenId}/remixes${qs ? `?${qs}` : ""}`
    );
  }
  /**
   * Submit a custom remix offer for a token. Requires Clerk JWT.
   */
  submitRemixOffer(params, clerkToken) {
    return this.request("/v1/remix-offers", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  /**
   * Submit an auto remix offer for a token with an open license. Requires Clerk JWT.
   */
  submitAutoRemixOffer(params, clerkToken) {
    return this.request("/v1/remix-offers/auto", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  /**
   * Record a self-remix (owner remixing their own token). Requires Clerk JWT.
   */
  confirmSelfRemix(params, clerkToken) {
    return this.request("/v1/remix-offers/self/confirm", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  /**
   * List remix offers by role. Requires Clerk JWT.
   * role="creator" — offers where you are the original creator.
   * role="requester" — offers you made.
   */
  async getRemixOffers(query, clerkToken) {
    const params = new URLSearchParams({ role: query.role });
    if (query.page !== void 0) params.set("page", String(query.page));
    if (query.limit !== void 0) params.set("limit", String(query.limit));
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/remix-offers?${params}`;
    const res = await fetch(url, {
      headers: { ...this.baseHeaders, "Authorization": `Bearer ${clerkToken}` }
    });
    return this.checkResponse(res);
  }
  /**
   * Get a single remix offer. Clerk JWT optional (price/currency hidden for non-participants).
   */
  async getRemixOffer(id, clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/remix-offers/${id}`;
    const headers = { ...this.baseHeaders };
    if (clerkToken) headers["Authorization"] = `Bearer ${clerkToken}`;
    const res = await fetch(url, { headers });
    return this.checkResponse(res);
  }
  /**
   * Creator approves a remix offer (authorises the requester to mint). Requires Clerk JWT.
   */
  confirmRemixOffer(id, params, clerkToken) {
    return this.request(`/v1/remix-offers/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  /**
   * Creator rejects a remix offer. Requires Clerk JWT.
   */
  rejectRemixOffer(id, clerkToken) {
    return this.request(`/v1/remix-offers/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  /**
   * Requester extends the expiry of a pending remix offer by 1–30 days.
   * Requires Clerk JWT.
   */
  extendRemixOffer(id, days, clerkToken) {
    return this.request(`/v1/remix-offers/${id}/extend`, {
      method: "POST",
      body: JSON.stringify({ days }),
      headers: { "Authorization": `Bearer ${clerkToken}` }
    });
  }
  // ─── POP Protocol ──────────────────────────────────────────────────────────
  getPopCollections(opts = {}) {
    return this.getCollections(opts.page ?? 1, opts.limit ?? 20, void 0, opts.sort, "POP_PROTOCOL");
  }
  async getPopEligibility(collection, wallet) {
    const res = await this.get(
      `/v1/pop/eligibility/${this.addr(collection)}/${this.addr(wallet)}`
    );
    return res.data;
  }
  async getPopEligibilityBatch(collection, wallets) {
    const params = new URLSearchParams({ wallets: wallets.map((w) => this.addr(w)).join(",") });
    const res = await this.get(
      `/v1/pop/eligibility/${this.addr(collection)}?${params}`
    );
    return res.data;
  }
  // ─── Coins (fungible — ERC-20 etc.) ───────────────────────────────────────────
  // Coins are a separate model from Collections (spec 2026-06-14). Price/liquidity
  // is read live from Ekubo (CreatorCoinService.getPrice), never from these.
  getCoins(opts = {}) {
    const params = new URLSearchParams();
    if (opts.page) params.set("page", String(opts.page));
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.service) params.set("service", opts.service);
    if (opts.chain) params.set("chain", opts.chain);
    const qs = params.toString();
    return this.get(`/v1/coins${qs ? `?${qs}` : ""}`);
  }
  getCoin(contract) {
    return this.get(`/v1/coins/${this.addr(contract)}`);
  }
  // ─── Collection Drop ────────────────────────────────────────────────────────
  getDropCollections(opts = {}) {
    return this.getCollections(opts.page ?? 1, opts.limit ?? 20, void 0, opts.sort, "COLLECTION_DROP");
  }
  async getDropMintStatus(collection, wallet) {
    const res = await this.get(
      `/v1/drop/mint-status/${this.addr(collection)}/${this.addr(wallet)}`
    );
    return res.data;
  }
  // ─── Rewards (v0.49.0) ─────────────────────────────────────────────────────
  // Scores are recomputed on a schedule by the backend (~15 min) — reads only.
  /** Score + level + progress + badges for one address (zeroed for unknown). */
  async getRewards(address) {
    const res = await this.get(`/v1/rewards/${this.addr(address)}`);
    return res.data;
  }
  /** Paginated XP leaderboard. */
  getRewardsLeaderboard(page = 1, limit = 50) {
    return this.get(`/v1/rewards?page=${page}&limit=${limit}`);
  }
  /** Point-event history for an address. */
  getRewardsEvents(address, page = 1, limit = 20) {
    return this.get(
      `/v1/rewards/${this.addr(address)}/events?page=${page}&limit=${limit}`
    );
  }
  /** Reward configuration: level ladder, enabled action XP values, badge catalog. */
  async getRewardsConfig() {
    const res = await this.get(`/v1/rewards/config`);
    return res.data;
  }
  /** Minimal level info for up to 50 addresses — one call per list page. */
  async getRewardsBatch(addresses) {
    if (addresses.length === 0) return [];
    const params = new URLSearchParams({ addresses: addresses.map((a) => this.addr(a)).join(",") });
    const res = await this.get(`/v1/rewards/batch?${params}`);
    return res.data;
  }
};
var PopService = class {
  constructor(config) {
    this.factoryAddress = getStarknetCoordinates(config.chain).popFactory;
  }
  _collection(address, account) {
    return new Contract(POPCollectionABI, normalizeAddress("STARKNET", address), account);
  }
  async claim(account, collectionAddress) {
    const call = this._collection(collectionAddress, account).populate("claim", []);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async adminMint(account, params) {
    const call = this._collection(params.collection, account).populate("admin_mint", [
      params.recipient,
      params.customUri ?? ""
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async addToAllowlist(account, params) {
    const call = this._collection(params.collection, account).populate("add_to_allowlist", [params.address]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async batchAddToAllowlist(account, params) {
    const collection = this._collection(params.collection, account);
    const CHUNK = 200;
    const calls = [];
    for (let i = 0; i < params.addresses.length; i += CHUNK) {
      calls.push(collection.populate("batch_add_to_allowlist", [params.addresses.slice(i, i + CHUNK)]));
    }
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }
  async removeFromAllowlist(account, params) {
    const call = this._collection(params.collection, account).populate("remove_from_allowlist", [params.address]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async setTokenUri(account, params) {
    const call = this._collection(params.collection, account).populate("set_token_uri", [
      BigInt(params.tokenId),
      params.uri
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async setPaused(account, params) {
    const call = this._collection(params.collection, account).populate("set_paused", [params.paused]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async createCollection(account, params) {
    const factory = new Contract(POPFactoryABI, this.factoryAddress, account);
    const call = factory.populate("create_collection", [
      params.name,
      params.symbol,
      params.baseUri,
      params.claimEndTime,
      { [params.eventType]: {} }
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
};
function toContractConditions(c) {
  return {
    start_time: c.startTime,
    end_time: c.endTime,
    price: BigInt(c.price),
    payment_token: c.paymentToken,
    max_quantity_per_wallet: BigInt(c.maxQuantityPerWallet)
  };
}
var DropService = class {
  constructor(config) {
    this.factoryAddress = getStarknetCoordinates(config.chain).dropFactory;
    this.config = config;
  }
  _collection(address, account) {
    return new Contract(DropCollectionABI, normalizeAddress("STARKNET", address), account);
  }
  async claim(account, collectionAddress, quantity = 1) {
    const collection = this._collection(collectionAddress, account);
    const qty = BigInt(quantity);
    const claimCall = collection.populate("claim", [qty]);
    const conditions = await collection.get_claim_conditions();
    const price = BigInt(conditions.price);
    const paymentToken = typeof conditions.payment_token === "bigint" ? "0x" + conditions.payment_token.toString(16) : conditions.payment_token;
    const feeCall = price > 0n ? buildFeeCall(
      { surface: "launchpad", token: paymentToken, grossAmount: price * qty },
      this.config.feeConfig
    ) : null;
    const calls = feeCall ? [claimCall, feeCall] : [claimCall];
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }
  async adminMint(account, params) {
    const call = this._collection(params.collection, account).populate("admin_mint", [
      params.recipient,
      BigInt(params.quantity ?? 1),
      params.customUri ?? ""
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async setClaimConditions(account, params) {
    const call = this._collection(params.collection, account).populate("set_claim_conditions", [
      toContractConditions(params.conditions)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async setAllowlistEnabled(account, params) {
    const call = this._collection(params.collection, account).populate("set_allowlist_enabled", [params.enabled]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async addToAllowlist(account, params) {
    const call = this._collection(params.collection, account).populate("add_to_allowlist", [params.address]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async batchAddToAllowlist(account, params) {
    const collection = this._collection(params.collection, account);
    const CHUNK = 200;
    const calls = [];
    for (let i = 0; i < params.addresses.length; i += CHUNK) {
      calls.push(collection.populate("batch_add_to_allowlist", [params.addresses.slice(i, i + CHUNK)]));
    }
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }
  async setPaused(account, params) {
    const call = this._collection(params.collection, account).populate("set_paused", [params.paused]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async withdrawPayments(account, params) {
    const call = this._collection(params.collection, account).populate("withdraw_payments", []);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  async createDrop(account, params) {
    const factory = new Contract(DropFactoryABI, this.factoryAddress, account);
    const call = factory.populate("create_drop", [
      params.name,
      params.symbol,
      params.baseUri,
      BigInt(params.maxSupply),
      toContractConditions(params.initialConditions)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
};
var ERC1155CollectionService = class {
  constructor(config) {
    this.factoryAddress = config.collection1155Contract ?? getStarknetCoordinates(config.chain).collection1155;
  }
  _factory(account) {
    return new Contract(
      IPCollection1155FactoryABI,
      normalizeAddress("STARKNET", this.factoryAddress),
      account
    );
  }
  _collection(address, account) {
    return new Contract(
      IPCollection1155ABI,
      normalizeAddress("STARKNET", address),
      account
    );
  }
  /**
   * Deploy a new ERC-1155 IP collection.
   * Caller becomes the collection owner and can mint items.
   * Returns the transaction hash; the deployed collection address is emitted
   * in the `CollectionDeployed` event of the factory.
   */
  async deployCollection(account, params) {
    const factory = this._factory(account);
    const call = factory.populate("deploy_collection", [params.name, params.symbol, params.baseUri]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Mint a new edition into an existing ERC-1155 collection.
   * Caller must be the collection owner. The token id is assigned on-chain
   * (sequential from 1) — read it from the `IPMinted` event of the returned tx.
   * The `tokenUri` is immutable.
   */
  async mintEdition(account, params) {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("mint_edition", [
      params.to,
      BigInt(params.value),
      params.tokenUri
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Batch-mint multiple new editions into an existing ERC-1155 collection.
   * All editions go to the same `to` address; ids are assigned sequentially
   * on-chain. Caller must be the collection owner.
   */
  async batchMintEdition(account, params) {
    const collection = this._collection(params.collection, account);
    const values = params.items.map((i) => BigInt(i.value));
    const tokenUris = params.items.map((i) => i.tokenUri);
    const call = collection.populate("batch_mint_edition", [
      params.to,
      values,
      tokenUris
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Mint additional copies of an EXISTING edition into an ERC-1155 collection.
   * Reverts on-chain if `tokenId` has never been minted. Provenance/URI unchanged.
   * Caller must be the collection owner.
   */
  async addSupply(account, params) {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("add_supply", [
      params.to,
      BigInt(params.tokenId),
      BigInt(params.value)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Set the default ERC-2981 royalty for the entire collection.
   * `feeNumerator` is out of 10 000 (e.g. 500 = 5%).
   * Caller must be the collection owner.
   */
  async setDefaultRoyalty(account, params) {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("set_default_royalty", [
      params.receiver,
      BigInt(params.feeNumerator)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Set a per-token ERC-2981 royalty override.
   * `feeNumerator` is out of 10 000. Caller must be the collection owner.
   */
  async setTokenRoyalty(account, params) {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("set_token_royalty", [
      BigInt(params.tokenId),
      params.receiver,
      BigInt(params.feeNumerator)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Approve the Medialane1155 marketplace (or any operator) to transfer
   * all tokens on behalf of `account`. Required before listing.
   */
  async setApprovalForAll(account, params) {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("set_approval_for_all", [
      params.operator,
      params.approved
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
};
var VALIDATED_EKUBO_PARAMS = {
  fee: "0xc49ba5e353f7d00000000000000000",
  tickSpacing: 5982n,
  startingPrice: { mag: 4600158n, sign: true },
  bound: 88719042n
};
var COIN_DECIMALS = 18;
async function getCreatorCoinPrice(coinAddress, provider) {
  const r = await provider.callContract({
    contractAddress: coinAddress,
    entrypoint: "launched_with_liquidity_parameters",
    calldata: []
  });
  if (BigInt(r[0]) !== 0n || BigInt(r[1]) !== 0n) return null;
  const fee = r[2];
  const tickSpacing = r[3];
  const quoteToken = normalizeAddress("STARKNET", "0x" + BigInt(r[7]).toString(16));
  const token = getTokenByAddress(quoteToken);
  const quoteDecimals = token?.decimals ?? 18;
  const ci = BigInt(coinAddress);
  const qi = BigInt(quoteToken);
  const [t0, t1] = ci < qi ? [coinAddress, quoteToken] : [quoteToken, coinAddress];
  const quoteIsToken0 = qi === BigInt(t0);
  const pp = await provider.callContract({
    contractAddress: getStarknetCoordinates("STARKNET").ekuboCore,
    entrypoint: "get_pool_price",
    calldata: [t0, t1, fee, tickSpacing, "0x0"]
  });
  const sqrt = BigInt(pp[0]) + (BigInt(pp[1] ?? "0x0") << 128n);
  const priceT1perT0 = (Number(sqrt) / 2 ** 128) ** 2;
  const decAdj = 10 ** (COIN_DECIMALS - quoteDecimals);
  const quotePerCoin = (quoteIsToken0 ? 1 / priceT1perT0 : priceT1perT0) * decAdj;
  return { quotePerCoin, quoteToken, quoteSymbol: token?.symbol ?? null, quoteDecimals };
}
var _factoryContract = null;
function factoryContract() {
  if (!_factoryContract) {
    _factoryContract = new Contract(
      CreatorCoinFactoryABI,
      getStarknetCoordinates("STARKNET").creatorCoinFactory
    );
  }
  return _factoryContract;
}
function buildCreateCreatorCoinCall(params) {
  const salt = params.salt ?? BigInt("0x" + Date.now().toString(16));
  return factoryContract().populate("create_creator_coin", [
    params.owner,
    params.name,
    params.symbol,
    BigInt(params.initialSupply),
    BigInt(salt)
  ]);
}
function buildLaunchOnEkuboCalls(params) {
  const ek = params.ekubo ?? VALIDATED_EKUBO_PARAMS;
  const launchParameters = {
    creator_coin_address: params.creatorCoin,
    transfer_restriction_delay: params.transferRestrictionDelay ?? 0,
    max_percentage_buy_launch: params.maxPercentageBuyLaunch ?? 200,
    quote_address: params.quoteToken,
    initial_holders: params.initialHolders,
    initial_holders_amounts: params.initialHoldersAmounts.map((a) => BigInt(a))
  };
  const ekuboParameters = {
    fee: BigInt(ek.fee),
    tick_spacing: BigInt(ek.tickSpacing),
    starting_price: { mag: BigInt(ek.startingPrice.mag), sign: ek.startingPrice.sign },
    bound: BigInt(ek.bound)
  };
  const calls = [];
  if (params.quoteFundAmount !== void 0) {
    const amt = uint256.bnToUint256(BigInt(params.quoteFundAmount));
    calls.push({
      contractAddress: params.quoteToken,
      entrypoint: "transfer",
      calldata: [getStarknetCoordinates("STARKNET").creatorCoinFactory, amt.low, amt.high]
    });
  }
  calls.push(factoryContract().populate("launch_on_ekubo", [launchParameters, ekuboParameters]));
  return calls;
}
var CREATOR_COIN_CREATED_SELECTOR = hash.getSelectorFromName("CreatorCoinCreated");
function parseCreatorCoinCreated(receipt) {
  const factory = normalizeAddress("STARKNET", getStarknetCoordinates("STARKNET").creatorCoinFactory);
  for (const ev of receipt?.events ?? []) {
    let from;
    try {
      from = normalizeAddress("STARKNET", ev.from_address ?? "");
    } catch {
      continue;
    }
    if (from !== factory) continue;
    const k0 = ev.keys?.[0];
    if (!k0 || normalizeAddress("STARKNET", k0) !== normalizeAddress("STARKNET", CREATOR_COIN_CREATED_SELECTOR)) continue;
    const data = ev.data ?? [];
    if (data.length < 1) continue;
    return normalizeAddress("STARKNET", data[data.length - 1]);
  }
  throw new Error("Coin deployed but the coin address could not be read from the receipt");
}
var CreatorCoinService = class {
  constructor(config) {
    this.factoryAddress = getStarknetCoordinates(config.chain).creatorCoinFactory;
    this.config = config;
  }
  _factory(account) {
    return new Contract(CreatorCoinFactoryABI, this.factoryAddress, account);
  }
  /** Deploy a fixed-supply CreatorCoin (full supply minted to the Factory). */
  async createCreatorCoin(account, params) {
    const res = await account.execute([buildCreateCreatorCoinCall(params)]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Launch a coin on Ekubo (owner-only). Optionally pre-funds the Factory with
   * quote (for the buyback) in the same multicall. Liquidity is permanently
   * locked in the EkuboLauncher.
   */
  async launchOnEkubo(account, params) {
    const res = await account.execute(buildLaunchOnEkuboCalls(params));
    return { txHash: res.transaction_hash };
  }
  /** View: is this address a Factory-deployed Creator Coin? */
  async isCreatorCoin(address, account) {
    const r = await this._factory(account).is_creator_coin(address);
    return BigInt(r) === 1n;
  }
  /** Read a coin's live Ekubo spot price (quote-per-coin) via the configured RPC.
   *  Read-only; returns null if the coin isn't launched on Ekubo. */
  async getPrice(coinAddress) {
    return getCreatorCoinPrice(coinAddress, new RpcProvider({ nodeUrl: this.config.rpcUrl }));
  }
};
var TicketService = class {
  constructor(config) {
    this.factoryAddress = getStarknetCoordinates(config.chain).ipTicketsFactory;
  }
  _collection(address, account) {
    return new Contract(IPTicketCollectionABI, normalizeAddress("STARKNET", address), account);
  }
  /** Deploys a new IPTicketCollection via the factory. Caller becomes its owner. */
  async deployTicketCollection(account, params) {
    const factoryAddress = params.factoryAddress ?? this.factoryAddress;
    if (!factoryAddress) {
      throw new Error("IP-Tickets factory address not configured for this chain");
    }
    const factory = new Contract(IPTicketCollectionFactoryABI, factoryAddress, account);
    const call = factory.populate("deploy_ticket_collection", [params.name, params.symbol]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /** Owner-only. Creates a new ticket collection (event/tier) inside the caller's deployed IPTicketCollection. */
  async createTicketCollection(account, params) {
    const paymentToken = params.paymentToken ? new CairoOption(CairoOptionVariant.Some, params.paymentToken) : new CairoOption(CairoOptionVariant.None);
    const call = this._collection(params.collection, account).populate("create_ticket_collection", [
      cairo.uint256(params.price),
      cairo.uint256(params.maxSupply),
      params.expiration,
      params.royaltyBps,
      paymentToken,
      params.metadataUri
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /** Owner-only. Gates minting only — existing tickets keep access/transfer/redeem. */
  async setCollectionActive(account, params) {
    const call = this._collection(params.collection, account).populate("set_collection_active", [
      cairo.uint256(params.collectionId),
      params.active
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /** Mints a ticket. Prepends an ERC-20 approve when the collection is paid. */
  async mintTicket(account, params) {
    const calls = [];
    if (params.paymentToken && params.price && BigInt(params.price) > 0n) {
      const amount = cairo.uint256(params.price);
      calls.push({
        contractAddress: params.paymentToken,
        entrypoint: "approve",
        calldata: [normalizeAddress("STARKNET", params.collection), amount.low.toString(), amount.high.toString()]
      });
    }
    calls.push(this._collection(params.collection, account).populate("mint_ticket", [cairo.uint256(params.collectionId)]));
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }
  /** Only the current token owner may redeem. */
  async redeemTicket(account, params) {
    const call = this._collection(params.collection, account).populate("redeem_ticket", [cairo.uint256(params.tokenId)]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
};
var ClubService = class {
  constructor(config) {
    this.registryAddress = getStarknetCoordinates(config.chain).ipClubRegistry;
  }
  _registry(account, registryAddress) {
    const address = registryAddress ?? this.registryAddress;
    if (!address) {
      throw new Error("IP-Club registry address not configured for this chain");
    }
    return new Contract(IPClubABI, normalizeAddress("STARKNET", address), account);
  }
  /** Permissionless — anyone may create a club. The registry deploys its own membership NFT internally. */
  async createClub(account, params) {
    const maxMembers = params.maxMembers != null ? new CairoOption(CairoOptionVariant.Some, params.maxMembers) : new CairoOption(CairoOptionVariant.None);
    const entryFee = params.entryFee != null ? new CairoOption(CairoOptionVariant.Some, cairo.uint256(params.entryFee)) : new CairoOption(CairoOptionVariant.None);
    const paymentToken = params.paymentToken ? new CairoOption(CairoOptionVariant.Some, params.paymentToken) : new CairoOption(CairoOptionVariant.None);
    const call = this._registry(account, params.registryAddress).populate("create_club", [
      params.name,
      params.symbol,
      params.metadataUri,
      maxMembers,
      entryFee,
      paymentToken
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /** Reversible — gates new joins only; existing members are never affected. */
  async setClubOpen(account, params) {
    const call = this._registry(account, params.registryAddress).populate("set_club_open", [
      cairo.uint256(params.clubId),
      params.open
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /** Prepends an ERC-20 approve when the club has an entry fee. */
  async joinClub(account, params) {
    const registryAddress = params.registryAddress ?? this.registryAddress;
    if (!registryAddress) {
      throw new Error("IP-Club registry address not configured for this chain");
    }
    const calls = [];
    if (params.paymentToken && params.entryFee && BigInt(params.entryFee) > 0n) {
      const amount = cairo.uint256(params.entryFee);
      calls.push({
        contractAddress: params.paymentToken,
        entrypoint: "approve",
        calldata: [normalizeAddress("STARKNET", registryAddress), amount.low.toString(), amount.high.toString()]
      });
    }
    calls.push(this._registry(account, registryAddress).populate("join_club", [cairo.uint256(params.clubId)]));
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }
  /** Always allowed, open or closed. No fee refund. Burns the caller's membership NFT. */
  async leaveClub(account, params) {
    const call = this._registry(account, params.registryAddress).populate("leave_club", [
      cairo.uint256(params.clubId),
      cairo.uint256(params.tokenId)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
};
var SponsorshipService = class {
  constructor(config) {
    this.sponsorshipAddress = getStarknetCoordinates(config.chain).ipSponsorship;
    this.licenseReceiptAddress = getStarknetCoordinates(config.chain).ipSponsorshipLicense;
  }
  _sponsorship(account, address) {
    const resolved = address ?? this.sponsorshipAddress;
    if (!resolved) {
      throw new Error("IP-Sponsorship address not configured for this chain");
    }
    return new Contract(IPSponsorshipABI, normalizeAddress("STARKNET", resolved), account);
  }
  /** The offer author must currently own (nftContract, tokenId) — enforced on-chain at create and accept. */
  async createOffer(account, params) {
    const specificSponsor = params.specificSponsor ? new CairoOption(CairoOptionVariant.Some, params.specificSponsor) : new CairoOption(CairoOptionVariant.None);
    const call = this._sponsorship(account, params.sponsorshipAddress).populate("create_offer", [
      params.nftContract,
      cairo.uint256(params.tokenId),
      cairo.uint256(params.minAmount),
      params.duration,
      params.paymentToken,
      params.licenseTermsUri,
      params.transferable,
      specificSponsor
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /** Reversible — gates new bids/acceptance only. */
  async setOfferOpen(account, params) {
    const call = this._sponsorship(account, params.sponsorshipAddress).populate("set_offer_open", [
      cairo.uint256(params.offerId),
      params.open
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /** A bid is a signal plus an open ERC-20 allowance — no tokens move until accepted. Prepends the approve. */
  async placeBid(account, params) {
    const sponsorshipAddress = params.sponsorshipAddress ?? this.sponsorshipAddress;
    if (!sponsorshipAddress) {
      throw new Error("IP-Sponsorship address not configured for this chain");
    }
    const amount = cairo.uint256(params.amount);
    const approveCall = {
      contractAddress: params.paymentToken,
      entrypoint: "approve",
      calldata: [normalizeAddress("STARKNET", sponsorshipAddress), amount.low.toString(), amount.high.toString()]
    };
    const bidCall = this._sponsorship(account, sponsorshipAddress).populate("place_bid", [
      cairo.uint256(params.offerId),
      amount
    ]);
    const res = await account.execute([approveCall, bidCall]);
    return { txHash: res.transaction_hash };
  }
  async retractBid(account, params) {
    const call = this._sponsorship(account, params.sponsorshipAddress).populate("retract_bid", [
      cairo.uint256(params.offerId)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Author-only. Settles the sponsor's payment (allowance pull, no escrow) and
   * mints a non-authoritative receipt NFT to the sponsor via the dedicated
   * sponsorship-license IPGenesis instance — never the genesis-mint instance.
   * `is_license_valid()` on IPSponsorship remains the sole authority for
   * gating/perks; the receipt is a wallet-visible courtesy only.
   */
  async acceptBid(account, params) {
    const receiptAddress = params.licenseReceiptAddress ?? this.licenseReceiptAddress;
    if (!receiptAddress) {
      throw new Error("IP-Sponsorship-License receipt address not configured for this chain");
    }
    const acceptCall = this._sponsorship(account, params.sponsorshipAddress).populate("accept_bid", [
      cairo.uint256(params.offerId),
      params.sponsor
    ]);
    const receipt = new Contract(IPGenesisABI, normalizeAddress("STARKNET", receiptAddress), account);
    const mintCall = receipt.populate("mint_item", [params.sponsor, params.licenseTermsUri]);
    const res = await account.execute([acceptCall, mintCall]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Best-effort — bundles a receipt-NFT transfer alongside `transfer_license`
   * when both `licenseReceiptAddress` and `receiptTokenId` are supplied.
   * IPSponsorship's own license ownership stays authoritative regardless of
   * whether the receipt NFT is kept in sync.
   */
  async transferLicense(account, params) {
    const calls = [
      this._sponsorship(account, params.sponsorshipAddress).populate("transfer_license", [
        cairo.uint256(params.licenseId),
        params.to
      ])
    ];
    const receiptAddress = params.licenseReceiptAddress ?? this.licenseReceiptAddress;
    if (receiptAddress && params.receiptTokenId != null) {
      const receipt = new Contract(IPGenesisABI, normalizeAddress("STARKNET", receiptAddress), account);
      calls.push(receipt.populate("transfer_from", [account.address, params.to, cairo.uint256(params.receiptTokenId)]));
    }
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }
};

// src/starknet/client.ts
var MedialaneClient = class {
  constructor(rawConfig = {}) {
    this.config = resolveConfig(rawConfig);
    this.marketplace = new MarketplaceModule(this.config);
    this.marketplace1155 = new Medialane1155Module(this.config);
    this.services = {
      pop: new PopService(this.config),
      drop: new DropService(this.config),
      erc1155Collection: new ERC1155CollectionService(this.config),
      creatorCoin: new CreatorCoinService(this.config),
      ticket: new TicketService(this.config),
      club: new ClubService(this.config),
      sponsorship: new SponsorshipService(this.config)
    };
    if (!this.config.backendUrl) {
      const sentinel = new ApiClient("https://medialane-sdk-no-backend.invalid", this.config.apiKey);
      const apiMethodNames = new Set(
        Object.getOwnPropertyNames(ApiClient.prototype).filter(
          (k) => k !== "constructor" && typeof sentinel[k] === "function"
        )
      );
      this.api = new Proxy(sentinel, {
        get(target, prop, receiver) {
          if (typeof prop === "symbol" || !apiMethodNames.has(prop)) {
            return Reflect.get(target, prop, receiver);
          }
          return () => {
            throw new Error(
              `backendUrl not configured. Pass backendUrl to MedialaneClient to use .api.${String(prop)}()`
            );
          };
        }
      });
    } else {
      this.api = new ApiClient(this.config.backendUrl, this.config.apiKey, this.config.retryOptions, this.config.chain);
    }
  }
  get chain() {
    return this.config.chain;
  }
  get rpcUrl() {
    return this.config.rpcUrl;
  }
  get marketplaceContract() {
    return this.config.marketplaceContract;
  }
};

// src/starknet/admin-auth/types.ts
var ADMIN_SCOPE = "admin-api";
function adminRequestDigest(req) {
  return hash.computePoseidonHashOnElements([
    hash.starknetKeccak(req.method.toUpperCase()),
    hash.starknetKeccak(req.path),
    hash.starknetKeccak(req.body ?? ""),
    num.toBigInt(req.nonce),
    BigInt(req.ts)
  ]);
}
function signAdminRequest(sessionPrivateKey, req) {
  const digest = adminRequestDigest(req);
  return ec.starkCurve.sign(digest, sessionPrivateKey).toCompactHex();
}
function verifyAdminRequestSig(sessionPublicKey, req, sig) {
  try {
    return ec.starkCurve.verify(sig, adminRequestDigest(req), sessionPublicKey);
  } catch {
    return false;
  }
}
function buildAdminSessionTypedData(p) {
  return {
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" }
      ],
      AdminSession: [
        { name: "sessionKeyHash", type: "felt" },
        { name: "scope", type: "shortstring" },
        { name: "issuedAt", type: "felt" },
        { name: "expiresAt", type: "felt" }
      ]
    },
    primaryType: "AdminSession",
    domain: { name: "Medialane Admin", version: "1", chainId: p.chainId ?? "SN_MAIN", revision: "1" },
    message: {
      sessionKeyHash: p.sessionKeyHash,
      scope: p.scope,
      issuedAt: String(p.issuedAt),
      expiresAt: String(p.expiresAt)
    }
  };
}
function sessionKeyHashOf(sessionPublicKey) {
  return num.toHex(hash.starknetKeccak(sessionPublicKey));
}
async function createAdminSessionGrant(signTypedData, opts) {
  const priv = ec.starkCurve.utils.randomPrivateKey();
  const sessionPrivateKey = "0x" + encode.buf2hex(priv);
  const sessionPublicKey = "0x" + encode.buf2hex(ec.starkCurve.getPublicKey(sessionPrivateKey, false));
  const sessionKeyHash = sessionKeyHashOf(sessionPublicKey);
  const nowSec = Math.floor((opts.now?.() ?? Date.now()) / 1e3);
  const issuedAt = nowSec;
  const expiresAt = nowSec + (opts.ttlSeconds ?? 7200);
  const data = buildAdminSessionTypedData({ sessionKeyHash, scope: ADMIN_SCOPE, issuedAt, expiresAt, chainId: opts.chainId });
  const walletSig = await signTypedData(data);
  const grant = {
    wallet: opts.wallet,
    chain: opts.chain ?? "STARKNET",
    sessionPublicKey,
    sessionKeyHash,
    scope: ADMIN_SCOPE,
    issuedAt,
    expiresAt,
    walletSig
  };
  return { grant, sessionPrivateKey };
}

// src/starknet/admin-auth/headers.ts
var ADMIN_HEADERS = {
  grant: "x-ml-admin-grant",
  sig: "x-ml-admin-sig",
  nonce: "x-ml-admin-nonce",
  ts: "x-ml-admin-ts"
};
function b64urlEncode(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s) {
  const pad = s.length % 4 ? "=".repeat(4 - s.length % 4) : "";
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function randomNonce() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  let hex = "";
  for (const x of b) hex += x.toString(16).padStart(2, "0");
  return "0x" + hex;
}
function encodeAdminHeaders(session, reqInit) {
  const nonce = randomNonce();
  const ts = Math.floor((reqInit.now?.() ?? Date.now()) / 1e3);
  const req = { method: reqInit.method, path: reqInit.path, body: reqInit.body ?? "", nonce, ts };
  const sig = signAdminRequest(session.sessionPrivateKey, req);
  return {
    [ADMIN_HEADERS.grant]: b64urlEncode(JSON.stringify(session.grant)),
    [ADMIN_HEADERS.sig]: sig,
    [ADMIN_HEADERS.nonce]: nonce,
    [ADMIN_HEADERS.ts]: String(ts)
  };
}
function parseAdminHeaders(get) {
  const rawGrant = get(ADMIN_HEADERS.grant);
  const sig = get(ADMIN_HEADERS.sig);
  const nonce = get(ADMIN_HEADERS.nonce);
  const tsRaw = get(ADMIN_HEADERS.ts);
  if (!rawGrant || !sig || !nonce || !tsRaw) return null;
  try {
    const grant = JSON.parse(b64urlDecode(rawGrant));
    if (!grant.wallet || !grant.sessionPublicKey || !grant.sessionKeyHash || !Array.isArray(grant.walletSig) || typeof grant.expiresAt !== "number") return null;
    const ts = Number(tsRaw);
    if (!Number.isFinite(ts)) return null;
    return { grant, sig, nonce, ts };
  } catch {
    return null;
  }
}

// src/starknet/siws/client.ts
var STORAGE_PREFIX = "ml_siws_";
function decodeBase64url(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - base64.length % 4) % 4);
  return atob(base64 + padding);
}
function readTokenExpiry(token) {
  try {
    if (!token.startsWith("siws_")) return null;
    const inner = token.slice(5);
    const dot = inner.lastIndexOf(".");
    if (dot === -1) return null;
    const data = JSON.parse(decodeBase64url(inner.slice(0, dot)));
    return typeof data.exp === "number" ? data.exp : null;
  } catch {
    return null;
  }
}
function getSiwsStorageKey(address) {
  return `${STORAGE_PREFIX}${address.toLowerCase()}`;
}
function isSiwsTokenValid(token) {
  if (!token?.startsWith("siws_")) return false;
  const expiry = readTokenExpiry(token);
  return Boolean(expiry && expiry > Math.floor(Date.now() / 1e3));
}
function getStoredSiwsToken(address) {
  if (typeof window === "undefined") return null;
  const key = getSiwsStorageKey(address);
  const token = localStorage.getItem(key);
  if (isSiwsTokenValid(token)) return token;
  localStorage.removeItem(key);
  return null;
}
function storeSiwsToken(address, token) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getSiwsStorageKey(address), token);
}
function normalizeSiwsSignature(signature) {
  if (Array.isArray(signature)) {
    return signature.map(String);
  }
  if (signature && typeof signature === "object") {
    const { r, s } = signature;
    if (r !== void 0 && s !== void 0) {
      return [String(r), String(s)];
    }
  }
  return [String(signature)];
}
async function requestSiwsToken({
  backendUrl,
  walletAddress,
  signer
}) {
  const base = backendUrl.replace(/\/$/, "");
  const nonceRes = await fetch(`${base}/v1/auth/siws/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress })
  });
  if (!nonceRes.ok) {
    throw new Error("Failed to prepare wallet sign-in");
  }
  const { nonce, typedData } = await nonceRes.json();
  const signature = normalizeSiwsSignature(await signer.signMessage(typedData));
  const verifyRes = await fetch(`${base}/v1/auth/siws/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, nonce, signature })
  });
  if (!verifyRes.ok) {
    let backendMessage;
    try {
      const body = await verifyRes.json();
      if (body?.message) backendMessage = body.message;
    } catch {
    }
    throw new Error(backendMessage ?? "Wallet sign-in failed");
  }
  const { token } = await verifyRes.json();
  if (!isSiwsTokenValid(token)) {
    throw new Error("Wallet sign-in returned an invalid token");
  }
  storeSiwsToken(walletAddress, token);
  return token;
}

// src/starknet/services/coinLaunchMath.ts
var COIN_DECIMALS2 = 18;
var LAUNCH_PRICE_QUOTE_PER_COIN = 0.01;
var MIN_SUPPLY = 1000n;
var MAX_SUPPLY = 1000000000000n;
var MAX_FELT_BYTES = 31;
function byteLen(s) {
  return new TextEncoder().encode(s).length;
}
function validateName(s) {
  if (!s.trim()) return "Name is required";
  if (byteLen(s) > MAX_FELT_BYTES) return `Name must be at most ${MAX_FELT_BYTES} bytes`;
  return null;
}
function validateSymbol(s) {
  if (!s.trim()) return "Symbol is required";
  if (byteLen(s) > MAX_FELT_BYTES) return `Symbol must be at most ${MAX_FELT_BYTES} bytes`;
  return null;
}
function validateSupply(human) {
  if (!/^\d+$/.test(human.trim())) return "Supply must be a whole number";
  const v = BigInt(human.trim());
  if (v < MIN_SUPPLY) return `Supply must be at least ${MIN_SUPPLY.toString()}`;
  if (v > MAX_SUPPLY) return `Supply must be at most ${MAX_SUPPLY.toString()}`;
  return null;
}
function toRaw(human, decimals = COIN_DECIMALS2) {
  return human * 10n ** BigInt(decimals);
}
function teamCoinsRaw(supplyRaw, pct) {
  const bps = BigInt(Math.round(pct * 100));
  return supplyRaw * bps / 10000n;
}
function buybackQuoteRaw(teamCoinsRawValue, quoteDecimals) {
  return teamCoinsRawValue * 10n ** BigInt(quoteDecimals) / (100n * 10n ** BigInt(COIN_DECIMALS2));
}
function fdvHuman(supplyHuman) {
  return supplyHuman * LAUNCH_PRICE_QUOTE_PER_COIN;
}

export { ADMIN_HEADERS, ADMIN_SCOPE, MAX_SUPPLY as COIN_MAX_SUPPLY, MIN_SUPPLY as COIN_MIN_SUPPLY, ClubService, CreatorCoinFactoryABI, CreatorCoinService, DropCollectionABI, DropFactoryABI, DropService, ERC1155CollectionService, IPClubABI, IPClubNFTABI, IPCollection1155ABI, IPCollection1155FactoryABI, IPCollectionABI, IPGenesisABI, IPMarketplaceABI, IPNftABI, IPSponsorshipABI, IPTicketCollectionABI, IPTicketCollectionFactoryABI, LAUNCH_PRICE_QUOTE_PER_COIN, MarketplaceModule, Medialane1155ABI, Medialane1155Module, MedialaneClient, MedialaneError, POPCollectionABI, POPFactoryABI, PopService, SponsorshipService, TicketService, VALIDATED_EKUBO_PARAMS, adminRequestDigest, build1155CancellationTypedData, build1155OrderTypedData, buildAdminSessionTypedData, buildCancellationTypedData, buildCreateCreatorCoinCall, buildFeeCall, buildLaunchOnEkuboCalls, buildOrderTypedData, buybackQuoteRaw, toRaw as coinToRaw, createAdminSessionGrant, encodeAdminHeaders, encodeByteArray, fdvHuman, getCreatorCoinPrice, getSiwsStorageKey, getStoredSiwsToken, isSiwsTokenValid, normalizeSiwsSignature, parseAdminHeaders, parseCreatorCoinCreated, randomNonce, requestSiwsToken, sessionKeyHashOf, signAdminRequest, storeSiwsToken, teamCoinsRaw, validateName as validateCoinName, validateSupply as validateCoinSupply, validateSymbol as validateCoinSymbol, verifyAdminRequestSig };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map