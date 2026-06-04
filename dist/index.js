import { z } from 'zod';
import { cairo, num, Contract, uint256, TypedDataRevision, shortString, constants, RpcProvider } from 'starknet';

// src/config.ts

// src/constants.ts
var MARKETPLACE_721_CONTRACT_MAINNET = "0x069cf5391077e3ebdd9cb6aebf90ed530d29f0d6aa34a43f5afae938c0fb565e";
var MARKETPLACE_721_CLASS_HASH_MAINNET = "0x04c6f952d747ad7ead1b3dad4c1d587837d38f8ec29d6c095a4afa5b5ece5957";
var MARKETPLACE_721_START_BLOCK_MAINNET = 10350340;
var MARKETPLACE_1155_CONTRACT_MAINNET = "0x040cd7b3e73bb3c892166e34bdc01d1797f97ecbc356c23f1cf38033cacf0077";
var MARKETPLACE_1155_CLASS_HASH_MAINNET = "0x02600bb720908f119afe482309d36c39d087587f0df9576454acfb6363e78cd8";
var MARKETPLACE_1155_START_BLOCK_MAINNET = 10350855;
var COLLECTION_721_CONTRACT_MAINNET = "0x0322cb7119955e01ac778d40976eb3ba50540bb0899f812d612f9c7e63e49fd2";
var IPNFT_CLASS_HASH_MAINNET = "0x27ee4ded786d51bced1e94afec3034d6ffce71c032c45ee1ff283ccfa9db12e";
var IPCOLLECTION_CLASS_HASH_MAINNET = "0x287ccdff8b6655a2248cfe170d82eae3a35303cd00ef3e751b25ddca26d9095";
var COLLECTION_721_START_BLOCK_MAINNET = 10046166;
var DROP_FACTORY_CONTRACT_MAINNET = "0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800";
var POP_FACTORY_CONTRACT_MAINNET = "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111";
var NFTCOMMENTS_CONTRACT_MAINNET = "0x02cdac70c94447189af0389dfea63f4d5e4154ea8a563de288a5ab1c39e37843";
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
var SUPPORTED_NETWORKS = ["mainnet"];
var DEFAULT_RPC_URL = "https://rpc.starknet.lava.build";
var POP_COLLECTION_CLASS_HASH_MAINNET = "0x077c421686f10851872561953ea16898d933364b7f8937a5d7e2b1ba0a36263f";
var DROP_COLLECTION_CLASS_HASH_MAINNET = "0x00092e72cdb63067521e803aaf7d4101c3e3ce026ae6bc045ec4228027e58282";
var COLLECTION_1155_CONTRACT_MAINNET = "0x067064adcaaed61e17bf50ea802ea6482336126aec5b4d032b4ff8fbb5009131";
var COLLECTION_1155_FACTORY_CLASS_HASH_MAINNET = "0x188321a7c9ca972cc63e352e3b3a4cdf33781852d957f4b4b62249310fe4c75";
var COLLECTION_1155_CLASS_HASH_MAINNET = "0x281e13803c906f20bbe158efb44b7a0273c56fdebbeeb55b2ba59530ddb1c80";
var COLLECTION_1155_START_BLOCK_MAINNET = 10045611;
var CREATOR_COIN_FACTORY_CONTRACT_MAINNET = "0x50fa807b5274079fb19374673d7bab6d2dc3af7e1032ea43eb6e44bcbde4c3c";
var CREATOR_COIN_EKUBO_LAUNCHER_MAINNET = "0x4f7fceb5ac10f12f9544a09580592e5bdf1b7f04f48765eecf12286d8ccb7b4";
var CREATOR_COIN_CLASS_HASH_MAINNET = "0x743e4c8a5b96bb83bbf4af04edbbb482d5ece89eed9b729a79fb7df0cd0b6b6";
var CREATOR_COIN_FACTORY_CLASS_HASH_MAINNET = "0x51765926b1344c9a20b8cd4b5abe7b7d47375ae97cf6804db3ea5d4b05a9b55";
var CREATOR_COIN_START_BLOCK_MAINNET = 10474544;
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

// src/config.ts
var MedialaneConfigSchema = z.object({
  network: z.enum(SUPPORTED_NETWORKS).default("mainnet"),
  rpcUrl: z.string().url().optional(),
  backendUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
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
  const marketplace721Contract = parsed.marketplace721Contract ?? parsed.marketplaceContract ?? MARKETPLACE_721_CONTRACT_MAINNET;
  const collection721Contract = parsed.collection721Contract ?? parsed.collectionContract ?? COLLECTION_721_CONTRACT_MAINNET;
  return {
    network: parsed.network,
    rpcUrl: parsed.rpcUrl ?? DEFAULT_RPC_URL,
    backendUrl: parsed.backendUrl,
    apiKey: parsed.apiKey,
    marketplace721Contract,
    marketplaceContract: marketplace721Contract,
    marketplace1155Contract: parsed.marketplace1155Contract ?? MARKETPLACE_1155_CONTRACT_MAINNET,
    collection721Contract,
    collectionContract: collection721Contract,
    collection1155Contract: parsed.collection1155Contract ?? COLLECTION_1155_CONTRACT_MAINNET,
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
  erc721: "4",
  erc1155: "3"
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

// src/abis/ipMarketplace.ts
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

// src/abis/popCollection.ts
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

// src/abis/popFactory.ts
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

// src/abis/dropCollection.ts
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

// src/abis/dropFactory.ts
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

// src/abis/collectionRegistry.ts
var CollectionRegistryABI = [
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
    name: "ip_collection_erc_721::types::Collection",
    members: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
      { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
      { name: "ip_nft", type: "core::starknet::contract_address::ContractAddress" }
    ]
  },
  {
    type: "function",
    name: "list_user_collections",
    inputs: [{ name: "user", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::array::Span::<core::integer::u256>" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_collection",
    inputs: [{ name: "collection_id", type: "core::integer::u256" }],
    outputs: [{ type: "ip_collection_erc_721::types::Collection" }],
    state_mutability: "view"
  }
];

// src/abis/medialane1155.ts
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

// src/abis/ipCollection1155Factory.ts
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
        "name": "update_collection_class_hash",
        "inputs": [
          {
            "name": "new_class_hash",
            "type": "core::starknet::class_hash::ClassHash"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
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
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "collection_class_hash",
        "type": "core::starknet::class_hash::ClassHash"
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
    "name": "ip_programmable_erc1155_collections::IPCollectionFactory::IPCollectionFactory::CollectionClassHashUpdated",
    "kind": "struct",
    "members": [
      {
        "name": "previous_class_hash",
        "type": "core::starknet::class_hash::ClassHash",
        "kind": "data"
      },
      {
        "name": "new_class_hash",
        "type": "core::starknet::class_hash::ClassHash",
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
        "name": "OwnableEvent",
        "type": "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
        "kind": "flat"
      },
      {
        "name": "CollectionDeployed",
        "type": "ip_programmable_erc1155_collections::IPCollectionFactory::IPCollectionFactory::CollectionDeployed",
        "kind": "nested"
      },
      {
        "name": "CollectionClassHashUpdated",
        "type": "ip_programmable_erc1155_collections::IPCollectionFactory::IPCollectionFactory::CollectionClassHashUpdated",
        "kind": "nested"
      }
    ]
  }
];

// src/abis/ipCollection1155.ts
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
        "name": "mint_item",
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
          },
          {
            "name": "token_uri",
            "type": "core::byte_array::ByteArray"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "batch_mint_item",
        "inputs": [
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
            "name": "token_uris",
            "type": "core::array::Array::<core::byte_array::ByteArray>"
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

// src/abis/ipCollection.ts
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
        "name": "total_transfers",
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
            "name": "token",
            "type": "core::byte_array::ByteArray"
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
            "name": "tokens",
            "type": "core::array::Array::<core::byte_array::ByteArray>"
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
            "name": "from",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "to",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "token",
            "type": "core::byte_array::ByteArray"
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
            "name": "tokens",
            "type": "core::array::Array::<core::byte_array::ByteArray>"
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
            "name": "token",
            "type": "core::byte_array::ByteArray"
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
            "name": "token",
            "type": "core::byte_array::ByteArray"
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
            "name": "token",
            "type": "core::byte_array::ByteArray"
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
        "name": "tokens",
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
        "name": "tokens",
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

// src/abis/ipNft.ts
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
      }
    ]
  }
];

// src/abis/creatorCoinFactory.ts
var CreatorCoinFactoryABI = [{ "type": "impl", "name": "FactoryImpl", "interface_name": "creator_coin::factory::interface::IFactory" }, { "type": "struct", "name": "core::integer::u256", "members": [{ "name": "low", "type": "core::integer::u128" }, { "name": "high", "type": "core::integer::u128" }] }, { "type": "struct", "name": "core::array::Span::<core::starknet::contract_address::ContractAddress>", "members": [{ "name": "snapshot", "type": "@core::array::Array::<core::starknet::contract_address::ContractAddress>" }] }, { "type": "struct", "name": "core::array::Span::<core::integer::u256>", "members": [{ "name": "snapshot", "type": "@core::array::Array::<core::integer::u256>" }] }, { "type": "struct", "name": "creator_coin::factory::LaunchParameters", "members": [{ "name": "creator_coin_address", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "transfer_restriction_delay", "type": "core::integer::u64" }, { "name": "max_percentage_buy_launch", "type": "core::integer::u16" }, { "name": "quote_address", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "initial_holders", "type": "core::array::Span::<core::starknet::contract_address::ContractAddress>" }, { "name": "initial_holders_amounts", "type": "core::array::Span::<core::integer::u256>" }] }, { "type": "enum", "name": "core::bool", "variants": [{ "name": "False", "type": "()" }, { "name": "True", "type": "()" }] }, { "type": "struct", "name": "ekubo::types::i129::i129", "members": [{ "name": "mag", "type": "core::integer::u128" }, { "name": "sign", "type": "core::bool" }] }, { "type": "struct", "name": "creator_coin::exchanges::ekubo::ekubo_adapter::EkuboPoolParameters", "members": [{ "name": "fee", "type": "core::integer::u128" }, { "name": "tick_spacing", "type": "core::integer::u128" }, { "name": "starting_price", "type": "ekubo::types::i129::i129" }, { "name": "bound", "type": "core::integer::u128" }] }, { "type": "struct", "name": "ekubo::types::keys::PoolKey", "members": [{ "name": "token0", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "token1", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "fee", "type": "core::integer::u128" }, { "name": "tick_spacing", "type": "core::integer::u128" }, { "name": "extension", "type": "core::starknet::contract_address::ContractAddress" }] }, { "type": "struct", "name": "ekubo::types::bounds::Bounds", "members": [{ "name": "lower", "type": "ekubo::types::i129::i129" }, { "name": "upper", "type": "ekubo::types::i129::i129" }] }, { "type": "struct", "name": "creator_coin::exchanges::ekubo::launcher::EkuboLP", "members": [{ "name": "owner", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "quote_address", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "pool_key", "type": "ekubo::types::keys::PoolKey" }, { "name": "bounds", "type": "ekubo::types::bounds::Bounds" }] }, { "type": "enum", "name": "creator_coin::exchanges::SupportedExchanges", "variants": [{ "name": "Jediswap", "type": "()" }, { "name": "Ekubo", "type": "()" }, { "name": "Starkdefi", "type": "()" }] }, { "type": "enum", "name": "creator_coin::token::creator_coin::LiquidityType", "variants": [{ "name": "JediERC20", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "StarkDeFiERC20", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "EkuboNFT", "type": "core::integer::u64" }] }, { "type": "enum", "name": "core::option::Option::<(core::starknet::contract_address::ContractAddress, creator_coin::token::creator_coin::LiquidityType)>", "variants": [{ "name": "Some", "type": "(core::starknet::contract_address::ContractAddress, creator_coin::token::creator_coin::LiquidityType)" }, { "name": "None", "type": "()" }] }, { "type": "interface", "name": "creator_coin::factory::interface::IFactory", "items": [{ "type": "function", "name": "create_creator_coin", "inputs": [{ "name": "owner", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "name", "type": "core::felt252" }, { "name": "symbol", "type": "core::felt252" }, { "name": "initial_supply", "type": "core::integer::u256" }, { "name": "contract_address_salt", "type": "core::felt252" }], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "external" }, { "type": "function", "name": "launch_on_jediswap", "inputs": [{ "name": "launch_parameters", "type": "creator_coin::factory::LaunchParameters" }, { "name": "quote_amount", "type": "core::integer::u256" }, { "name": "unlock_time", "type": "core::integer::u64" }], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "external" }, { "type": "function", "name": "launch_on_ekubo", "inputs": [{ "name": "launch_parameters", "type": "creator_coin::factory::LaunchParameters" }, { "name": "ekubo_parameters", "type": "creator_coin::exchanges::ekubo::ekubo_adapter::EkuboPoolParameters" }], "outputs": [{ "type": "(core::integer::u64, creator_coin::exchanges::ekubo::launcher::EkuboLP)" }], "state_mutability": "external" }, { "type": "function", "name": "launch_on_starkdefi", "inputs": [{ "name": "launch_parameters", "type": "creator_coin::factory::LaunchParameters" }, { "name": "quote_amount", "type": "core::integer::u256" }, { "name": "unlock_time", "type": "core::integer::u64" }], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "external" }, { "type": "function", "name": "exchange_address", "inputs": [{ "name": "exchange", "type": "creator_coin::exchanges::SupportedExchanges" }], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "view" }, { "type": "function", "name": "lock_manager_address", "inputs": [], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "view" }, { "type": "function", "name": "locked_liquidity", "inputs": [{ "name": "token", "type": "core::starknet::contract_address::ContractAddress" }], "outputs": [{ "type": "core::option::Option::<(core::starknet::contract_address::ContractAddress, creator_coin::token::creator_coin::LiquidityType)>" }], "state_mutability": "view" }, { "type": "function", "name": "is_creator_coin", "inputs": [{ "name": "address", "type": "core::starknet::contract_address::ContractAddress" }], "outputs": [{ "type": "core::bool" }], "state_mutability": "view" }, { "type": "function", "name": "ekubo_core_address", "inputs": [], "outputs": [{ "type": "core::starknet::contract_address::ContractAddress" }], "state_mutability": "view" }] }, { "type": "struct", "name": "core::array::Span::<(creator_coin::exchanges::SupportedExchanges, core::starknet::contract_address::ContractAddress)>", "members": [{ "name": "snapshot", "type": "@core::array::Array::<(creator_coin::exchanges::SupportedExchanges, core::starknet::contract_address::ContractAddress)>" }] }, { "type": "struct", "name": "core::array::Span::<(core::starknet::contract_address::ContractAddress, core::starknet::contract_address::ContractAddress)>", "members": [{ "name": "snapshot", "type": "@core::array::Array::<(core::starknet::contract_address::ContractAddress, core::starknet::contract_address::ContractAddress)>" }] }, { "type": "constructor", "name": "constructor", "inputs": [{ "name": "creator_coin_class_hash", "type": "core::starknet::class_hash::ClassHash" }, { "name": "lock_manager_address", "type": "core::starknet::contract_address::ContractAddress" }, { "name": "exchanges", "type": "core::array::Span::<(creator_coin::exchanges::SupportedExchanges, core::starknet::contract_address::ContractAddress)>" }, { "name": "migrated_tokens", "type": "core::array::Span::<(core::starknet::contract_address::ContractAddress, core::starknet::contract_address::ContractAddress)>" }] }, { "type": "event", "name": "creator_coin::factory::factory::Factory::CreatorCoinCreated", "kind": "struct", "members": [{ "name": "owner", "type": "core::starknet::contract_address::ContractAddress", "kind": "data" }, { "name": "name", "type": "core::felt252", "kind": "data" }, { "name": "symbol", "type": "core::felt252", "kind": "data" }, { "name": "initial_supply", "type": "core::integer::u256", "kind": "data" }, { "name": "creator_coin_address", "type": "core::starknet::contract_address::ContractAddress", "kind": "data" }] }, { "type": "event", "name": "creator_coin::factory::factory::Factory::CreatorCoinLaunched", "kind": "struct", "members": [{ "name": "creator_coin_address", "type": "core::starknet::contract_address::ContractAddress", "kind": "data" }, { "name": "quote_token", "type": "core::starknet::contract_address::ContractAddress", "kind": "data" }, { "name": "exchange_name", "type": "core::felt252", "kind": "data" }] }, { "type": "event", "name": "creator_coin::factory::factory::Factory::Event", "kind": "enum", "variants": [{ "name": "CreatorCoinCreated", "type": "creator_coin::factory::factory::Factory::CreatorCoinCreated", "kind": "nested" }, { "name": "CreatorCoinLaunched", "type": "creator_coin::factory::factory::Factory::CreatorCoinLaunched", "kind": "nested" }] }];

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
function u256ToBigInt(low, high) {
  return BigInt(low) + (BigInt(high) << 128n);
}

// src/utils/token.ts
function parseAmount(human, decimals) {
  const [whole, frac = ""] = human.split(".");
  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  return (BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fracPadded)).toString();
}
function formatAmount(raw, decimals) {
  const value = BigInt(raw);
  const factor = BigInt(Math.pow(10, decimals));
  const whole = value / factor;
  const remainder = value % factor;
  const fractional = remainder.toString().padStart(decimals, "0");
  return `${whole}.${fractional}`;
}
function getTokenByAddress(address) {
  const lower = address.toLowerCase();
  return SUPPORTED_TOKENS.find((t) => t.address.toLowerCase() === lower);
}
function getTokenBySymbol(symbol) {
  const upper = symbol.toUpperCase();
  return SUPPORTED_TOKENS.find((t) => t.symbol === upper);
}
function getListableTokens() {
  return SUPPORTED_TOKENS.filter((t) => t.listable);
}

// src/marketplace/errors.ts
var MedialaneError = class extends Error {
  constructor(message, code = "UNKNOWN", cause) {
    super(message);
    this.code = code;
    this.cause = cause;
    this.name = "MedialaneError";
  }
};

// src/utils/rpc.ts
var PUBLIC_RPC_FALLBACKS = [
  "https://rpc.starknet.lava.build",
  "https://starknet-mainnet.public.blastapi.io/rpc/v0_7",
  "https://free-rpc.nethermind.io/mainnet-juno/v0_7"
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

// src/marketplace/utils.ts
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
function getChainId(_config) {
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

// src/marketplace/orders.ts
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
  const chainId = getChainId();
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
  const chainId = getChainId();
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
  const chainId = getChainId();
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
  const { collectionId, recipient, tokenUri, collectionContract } = params;
  const provider = getProvider(config);
  const contractAddress = collectionContract ?? config.collectionContract;
  const id = cairo.uint256(collectionId);
  const calldata = [id.low.toString(), id.high.toString(), recipient, ...encodeByteArray(tokenUri)];
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

// src/marketplace/index.ts
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
  const chainId = getChainId();
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
  const chainId = getChainId();
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
  const chainId = getChainId();
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

// src/marketplace1155/index.ts
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
function normalizeAddress(address) {
  try {
    const hex = num.toHex(BigInt(address));
    return "0x" + hex.slice(2).padStart(64, "0").toLowerCase();
  } catch {
    throw new Error(`Invalid Starknet address: "${address}"`);
  }
}
function normalizeHash(hash) {
  try {
    const hex = num.toHex(BigInt(hash));
    return "0x" + hex.slice(2).padStart(64, "0").toLowerCase();
  } catch {
    throw new Error(`Invalid Starknet hash: "${hash}"`);
  }
}
function shortenAddress(address, chars = 4) {
  const norm = normalizeAddress(address);
  return `${norm.slice(0, chars + 2)}...${norm.slice(-chars)}`;
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
  constructor(baseUrl, apiKey, retryOptions) {
    this.baseUrl = baseUrl;
    this.baseHeaders = apiKey ? { "x-api-key": apiKey } : {};
    this.retryOptions = retryOptions;
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
    if (query.offerer) params.set("offerer", normalizeAddress(query.offerer));
    if (query.minPrice) params.set("minPrice", query.minPrice);
    if (query.maxPrice) params.set("maxPrice", query.maxPrice);
    const qs = params.toString();
    return this.get(`/v1/orders${qs ? `?${qs}` : ""}`);
  }
  getOrder(orderHash) {
    return this.get(`/v1/orders/${orderHash}`);
  }
  getActiveOrdersForToken(contract, tokenId) {
    return this.get(`/v1/orders/token/${normalizeAddress(contract)}/${tokenId}`);
  }
  getOrdersByUser(address, page = 1, limit = 20) {
    return this.get(
      `/v1/orders/user/${normalizeAddress(address)}?page=${page}&limit=${limit}`
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
      `/v1/tokens/owned/${normalizeAddress(address)}?page=${page}&limit=${limit}`
    );
  }
  getTokenHistory(contract, tokenId, page = 1, limit = 20) {
    return this.get(
      `/v1/tokens/${contract}/${tokenId}/history?page=${page}&limit=${limit}`
    );
  }
  // ─── Collections ───────────────────────────────────────────────────────────
  getCollections(page = 1, limit = 20, isKnown, sort, service) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (isKnown !== void 0) params.set("isKnown", String(isKnown));
    if (sort) params.set("sort", sort);
    if (service) params.set("service", service);
    return this.get(`/v1/collections?${params}`);
  }
  getCollectionsByOwner(owner, page = 1, limit = 50) {
    const params = new URLSearchParams({ owner: normalizeAddress(owner), page: String(page), limit: String(limit) });
    return this.get(`/v1/collections?${params}`);
  }
  getCollection(contract) {
    return this.get(`/v1/collections/${normalizeAddress(contract)}`);
  }
  getCollectionTokens(contract, page = 1, limit = 20) {
    return this.get(
      `/v1/collections/${normalizeAddress(contract)}/tokens?page=${page}&limit=${limit}`
    );
  }
  // ─── Activities ────────────────────────────────────────────────────────────
  getActivities(query = {}) {
    const params = new URLSearchParams();
    if (query.type) params.set("type", query.type);
    if (query.page !== void 0) params.set("page", String(query.page));
    if (query.limit !== void 0) params.set("limit", String(query.limit));
    const qs = params.toString();
    return this.get(`/v1/activities${qs ? `?${qs}` : ""}`);
  }
  getActivitiesByAddress(address, page = 1, limit = 20) {
    return this.get(
      `/v1/activities/${normalizeAddress(address)}?page=${page}&limit=${limit}`
    );
  }
  // ─── Comments ──────────────────────────────────────────────────────────────
  getTokenComments(contract, tokenId, opts = {}) {
    const params = new URLSearchParams();
    if (opts.page !== void 0) params.set("page", String(opts.page));
    if (opts.limit !== void 0) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return this.get(
      `/v1/tokens/${normalizeAddress(contract)}/${tokenId}/comments${qs ? `?${qs}` : ""}`
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
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/${normalizeAddress(contractAddress)}/profile`;
    const res = await fetch(url, { headers: this.baseHeaders });
    return this.checkResponse(res, { allow404: true });
  }
  /**
   * Update collection profile. Requires Clerk JWT for ownership check.
   */
  async updateCollectionProfile(contractAddress, data, clerkToken) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/${normalizeAddress(contractAddress)}/profile`;
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
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/${normalizeAddress(contractAddress)}/gated-content`;
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
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators/${normalizeAddress(walletAddress)}/profile`;
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
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators/${normalizeAddress(walletAddress)}/profile`;
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
      `/v1/tokens/${normalizeAddress(contract)}/${tokenId}/remixes${qs ? `?${qs}` : ""}`
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
      `/v1/pop/eligibility/${normalizeAddress(collection)}/${normalizeAddress(wallet)}`
    );
    return res.data;
  }
  async getPopEligibilityBatch(collection, wallets) {
    const params = new URLSearchParams({ wallets: wallets.map(normalizeAddress).join(",") });
    const res = await this.get(
      `/v1/pop/eligibility/${normalizeAddress(collection)}?${params}`
    );
    return res.data;
  }
  // ─── Collection Drop ────────────────────────────────────────────────────────
  getDropCollections(opts = {}) {
    return this.getCollections(opts.page ?? 1, opts.limit ?? 20, void 0, opts.sort, "COLLECTION_DROP");
  }
  async getDropMintStatus(collection, wallet) {
    const res = await this.get(
      `/v1/drop/mint-status/${normalizeAddress(collection)}/${normalizeAddress(wallet)}`
    );
    return res.data;
  }
};
var PopService = class {
  constructor(_config) {
    this.factoryAddress = POP_FACTORY_CONTRACT_MAINNET;
  }
  _collection(address, account) {
    return new Contract(POPCollectionABI, normalizeAddress(address), account);
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
    this.factoryAddress = DROP_FACTORY_CONTRACT_MAINNET;
    this.config = config;
  }
  _collection(address, account) {
    return new Contract(DropCollectionABI, normalizeAddress(address), account);
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
    this.factoryAddress = config.collection1155Contract ?? COLLECTION_1155_CONTRACT_MAINNET;
  }
  _factory(account) {
    return new Contract(
      IPCollection1155FactoryABI,
      normalizeAddress(this.factoryAddress),
      account
    );
  }
  _collection(address, account) {
    return new Contract(
      IPCollection1155ABI,
      normalizeAddress(address),
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
   * Mint a single token into an existing ERC-1155 collection.
   * Caller must be the collection owner.
   * The `tokenUri` is immutable — validated and stored on the first mint only.
   */
  async mintItem(account, params) {
    const collection = this._collection(params.collection, account);
    const call = collection.populate("mint_item", [
      params.to,
      BigInt(params.tokenId),
      BigInt(params.value),
      params.tokenUri
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Batch-mint multiple token IDs into an existing ERC-1155 collection.
   * All items go to the same `to` address.
   * Caller must be the collection owner.
   */
  async batchMintItem(account, params) {
    const collection = this._collection(params.collection, account);
    const tokenIds = params.items.map((i) => BigInt(i.tokenId));
    const values = params.items.map((i) => BigInt(i.value));
    const tokenUris = params.items.map((i) => i.tokenUri);
    const call = collection.populate("batch_mint_item", [
      params.to,
      tokenIds,
      values,
      tokenUris
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
var CreatorCoinService = class {
  // config is accepted for signature parity with the other services (none needed
  // today — launch is zero-fee and views take an account).
  constructor(_config) {
    this.factoryAddress = CREATOR_COIN_FACTORY_CONTRACT_MAINNET;
  }
  _factory(account) {
    return new Contract(CreatorCoinFactoryABI, this.factoryAddress, account);
  }
  /** Deploy a fixed-supply CreatorCoin (full supply minted to the Factory). */
  async createCreatorCoin(account, params) {
    const salt = params.salt ?? BigInt("0x" + Date.now().toString(16));
    const call = this._factory(account).populate("create_creator_coin", [
      params.owner,
      params.name,
      params.symbol,
      BigInt(params.initialSupply),
      BigInt(salt)
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
  /**
   * Launch a coin on Ekubo (owner-only). Optionally pre-funds the Factory with
   * quote (for the buyback) in the same multicall. Liquidity is permanently
   * locked in the EkuboLauncher.
   */
  async launchOnEkubo(account, params) {
    const ek = params.ekubo ?? VALIDATED_EKUBO_PARAMS;
    const factory = this._factory(account);
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
        calldata: [this.factoryAddress, amt.low, amt.high]
      });
    }
    calls.push(factory.populate("launch_on_ekubo", [launchParameters, ekuboParameters]));
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }
  /** View: is this address a Factory-deployed Creator Coin? */
  async isCreatorCoin(address, account) {
    const r = await this._factory(account).is_creator_coin(address);
    return BigInt(r) === 1n;
  }
};

// src/client.ts
var MedialaneClient = class {
  constructor(rawConfig = {}) {
    this.config = resolveConfig(rawConfig);
    this.marketplace = new MarketplaceModule(this.config);
    this.marketplace1155 = new Medialane1155Module(this.config);
    this.services = {
      pop: new PopService(this.config),
      drop: new DropService(this.config),
      erc1155Collection: new ERC1155CollectionService(this.config),
      creatorCoin: new CreatorCoinService(this.config)
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
      this.api = new ApiClient(this.config.backendUrl, this.config.apiKey, this.config.retryOptions);
    }
  }
  get network() {
    return this.config.network;
  }
  get rpcUrl() {
    return this.config.rpcUrl;
  }
  get marketplaceContract() {
    return this.config.marketplaceContract;
  }
};

// src/types/api.ts
var OPEN_LICENSES = ["CC0", "CC BY", "CC BY-SA", "CC BY-NC"];

// src/services/registry.ts
var SERVICES = {
  "mip-erc721": {
    id: "mip-erc721",
    displayName: "IP Collection",
    description: "Tokenize intellectual property as a per-creator ERC-721 collection.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: COLLECTION_721_CONTRACT_MAINNET,
      startBlock: COLLECTION_721_START_BLOCK_MAINNET
    },
    uiVariant: "standard",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer", "mint", "remix", "license"],
    events: [
      { name: "CollectionCreated", emittedBy: "factory" }
      // Per-instance ERC-721 Transfer emitted by each deployed collection; not
      // yet declared here because the indexer polls discovered instances on a
      // slow schedule. Plan 2026-05-24-data-driven-event-registry.md covers
      // the migration.
    ],
    metadataSchema: { licenseDefault: "CC BY-SA" }
  },
  "ip-erc721": {
    id: "ip-erc721",
    displayName: "Programmable IP (genesis)",
    description: "One shared ERC-721 contract; many wallets mint genesis pieces.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    uiVariant: "standard",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer", "mint", "remix", "license"],
    // No factory — single shared contract. Events declared when the genesis
    // contract address is wired into onchain.factoryAddress here.
    metadataSchema: { licenseDefault: "CC BY-SA" }
  },
  "mip-erc1155": {
    id: "mip-erc1155",
    displayName: "NFT Editions",
    description: "Per-creator ERC-1155 collection; creator mints editions.",
    standard: "ERC1155",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: COLLECTION_1155_CONTRACT_MAINNET,
      classHash: COLLECTION_1155_CLASS_HASH_MAINNET,
      startBlock: COLLECTION_1155_START_BLOCK_MAINNET
    },
    uiVariant: "edition",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer", "mint", "remix", "license"],
    events: [
      { name: "CollectionDeployed", emittedBy: "factory" }
    ],
    metadataSchema: { licenseDefault: "CC BY-SA" }
  },
  "pop-protocol": {
    id: "pop-protocol",
    displayName: "POP Protocol",
    description: "Soulbound proof-of-presence collectibles per event.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: POP_FACTORY_CONTRACT_MAINNET,
      classHash: POP_COLLECTION_CLASS_HASH_MAINNET
    },
    uiVariant: "pop",
    capabilities: ["claim", "transfer"],
    events: [
      { name: "CollectionCreated", emittedBy: "factory" },
      { name: "AllowlistUpdated", emittedBy: "instance", poll: "slow" }
    ],
    metadataSchema: { licenseDefault: "CC BY-SA" }
  },
  "drop-collection": {
    id: "drop-collection",
    displayName: "Collection Drop",
    description: "Sequential mint with claim windows + allowlist.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: DROP_FACTORY_CONTRACT_MAINNET,
      classHash: DROP_COLLECTION_CLASS_HASH_MAINNET
    },
    uiVariant: "drop",
    capabilities: ["claim", "list", "buy", "make_offer", "cancel", "transfer"],
    events: [
      { name: "DropCreated", emittedBy: "factory" },
      { name: "AllowlistUpdated", emittedBy: "instance", poll: "slow" }
    ],
    metadataSchema: { licenseDefault: "CC BY-SA" }
  },
  "creator-coin": {
    id: "creator-coin",
    displayName: "Creator Coin",
    description: "Launch a fixed-supply social token with permanently-locked Ekubo liquidity.",
    standard: "ERC20",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: CREATOR_COIN_FACTORY_CONTRACT_MAINNET,
      classHash: CREATOR_COIN_FACTORY_CLASS_HASH_MAINNET,
      startBlock: CREATOR_COIN_START_BLOCK_MAINNET
    },
    uiVariant: "coin",
    // `swap` is a UI affordance (05 §III): the marketplace renders an embedded
    // Ekubo swap (via StarkZapp) for the coin. Settlement is Ekubo — Medialane
    // operates NO trading venue and custodies nothing. No venue service exists
    // for coins (unlike NFTs, whose Medialane marketplace contract settles them).
    capabilities: ["launch", "swap", "transfer"],
    events: [
      { name: "CreatorCoinCreated", emittedBy: "factory" },
      { name: "CreatorCoinLaunched", emittedBy: "factory" }
    ]
  },
  "medialane-marketplace-erc721": {
    id: "medialane-marketplace-erc721",
    displayName: "Medialane Marketplace (ERC-721)",
    description: "ERC-721 order matching venue.",
    standard: "ERC721",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: MARKETPLACE_721_CONTRACT_MAINNET,
      classHash: MARKETPLACE_721_CLASS_HASH_MAINNET,
      startBlock: MARKETPLACE_721_START_BLOCK_MAINNET
    },
    uiVariant: "standard",
    capabilities: ["list", "buy", "make_offer", "cancel"],
    events: [
      { name: "OrderCreated", emittedBy: "factory" },
      { name: "OrderFulfilled", emittedBy: "factory" },
      { name: "OrderCancelled", emittedBy: "factory" }
    ]
  },
  "medialane-marketplace-erc1155": {
    id: "medialane-marketplace-erc1155",
    displayName: "Medialane Marketplace (ERC-1155)",
    description: "ERC-1155 order matching venue.",
    standard: "ERC1155",
    provenance: "MEDIALANE",
    onchain: {
      factoryAddress: MARKETPLACE_1155_CONTRACT_MAINNET,
      classHash: MARKETPLACE_1155_CLASS_HASH_MAINNET,
      startBlock: MARKETPLACE_1155_START_BLOCK_MAINNET
    },
    uiVariant: "edition",
    capabilities: ["list", "buy", "make_offer", "cancel"],
    events: [
      { name: "OrderCreated", emittedBy: "factory" },
      { name: "OrderFulfilled", emittedBy: "factory" },
      { name: "OrderCancelled", emittedBy: "factory" }
    ]
  },
  "external-erc20": {
    id: "external-erc20",
    displayName: "External ERC-20",
    description: "An ERC-20 token (e.g. an unrug memecoin or a partner coin) not deployed via a Medialane service. Brought in by owner claim or admin/partnership \u2014 never bulk-indexed. Generalizes to future chains.",
    standard: "ERC20",
    provenance: "EXTERNAL",
    uiVariant: "coin",
    capabilities: ["swap", "transfer"]
  },
  "external-erc721": {
    id: "external-erc721",
    displayName: "External ERC-721",
    description: "ERC-721 contract not deployed via a Medialane service.",
    standard: "ERC721",
    provenance: "EXTERNAL",
    uiVariant: "standard",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer"]
  },
  "external-erc1155": {
    id: "external-erc1155",
    displayName: "External ERC-1155",
    description: "ERC-1155 contract not deployed via a Medialane service.",
    standard: "ERC1155",
    provenance: "EXTERNAL",
    uiVariant: "edition",
    capabilities: ["list", "buy", "make_offer", "cancel", "transfer"]
  }
};
function isServiceId(id) {
  return typeof id === "string" && id in SERVICES;
}
function getService(id) {
  return id && id in SERVICES ? SERVICES[id] : void 0;
}
function listServices() {
  return Object.values(SERVICES);
}
function getServicesByCapability(cap) {
  return Object.values(SERVICES).filter(
    (s) => s.capabilities.includes(cap)
  );
}

export { ApiClient, COLLECTION_1155_CLASS_HASH_MAINNET, COLLECTION_1155_CONTRACT_MAINNET, COLLECTION_1155_FACTORY_CLASS_HASH_MAINNET, COLLECTION_1155_START_BLOCK_MAINNET, COLLECTION_721_CONTRACT_MAINNET, COLLECTION_721_START_BLOCK_MAINNET, CREATOR_COIN_CLASS_HASH_MAINNET, CREATOR_COIN_EKUBO_LAUNCHER_MAINNET, CREATOR_COIN_FACTORY_CLASS_HASH_MAINNET, CREATOR_COIN_FACTORY_CONTRACT_MAINNET, CREATOR_COIN_START_BLOCK_MAINNET, CollectionRegistryABI, CreatorCoinFactoryABI, CreatorCoinService, DEFAULT_RPC_URL, DROP_COLLECTION_CLASS_HASH_MAINNET, DROP_FACTORY_CONTRACT_MAINNET, DropCollectionABI, DropFactoryABI, DropService, ERC1155CollectionService, FeeConfigSchema, IPCOLLECTION_CLASS_HASH_MAINNET, IPCollection1155ABI, IPCollection1155FactoryABI, IPCollectionABI, IPMarketplaceABI, IPNFT_CLASS_HASH_MAINNET, IPNftABI, MARKETPLACE_1155_CLASS_HASH_MAINNET, MARKETPLACE_1155_CONTRACT_MAINNET, MARKETPLACE_1155_START_BLOCK_MAINNET, MARKETPLACE_721_CLASS_HASH_MAINNET, MARKETPLACE_721_CONTRACT_MAINNET, MARKETPLACE_721_START_BLOCK_MAINNET, MarketplaceModule, Medialane1155ABI, Medialane1155Module, MedialaneApiError, MedialaneClient, MedialaneError, NFTCOMMENTS_CONTRACT_MAINNET, OPEN_LICENSES, POPCollectionABI, POPFactoryABI, POP_COLLECTION_CLASS_HASH_MAINNET, POP_FACTORY_CONTRACT_MAINNET, PUBLIC_RPC_FALLBACKS, PopService, SUPPORTED_NETWORKS, SUPPORTED_TOKENS, VALIDATED_EKUBO_PARAMS, build1155CancellationTypedData, build1155OrderTypedData, buildCancellationTypedData, buildFeeCall, buildOrderTypedData, createFailoverFetch, encodeByteArray, formatAmount, getListableTokens, getService, getServicesByCapability, getTokenByAddress, getTokenBySymbol, isServiceId, isTransientRpcError, listServices, normalizeAddress, normalizeHash, parseAmount, resolveConfig, resolveFeeConfig, shortenAddress, stringifyBigInts, u256ToBigInt };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map