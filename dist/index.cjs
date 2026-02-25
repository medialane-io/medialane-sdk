'use strict';

var zod = require('zod');
var starknet = require('starknet');

// src/config.ts

// src/constants.ts
var MARKETPLACE_CONTRACT_MAINNET = "0x059deafbbafbf7051c315cf75a94b03c5547892bc0c6dfa36d7ac7290d4cc33a";
var COLLECTION_CONTRACT_MAINNET = "0x05e73b7be06d82beeb390a0e0d655f2c9e7cf519658e04f05d9c690ccc41da03";
var SUPPORTED_TOKENS = [
  {
    symbol: "USDC",
    address: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
    decimals: 6
  },
  {
    symbol: "USDT",
    address: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
    decimals: 6
  },
  {
    symbol: "ETH",
    address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    decimals: 18
  },
  {
    symbol: "STRK",
    address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18
  }
];
var SUPPORTED_NETWORKS = ["mainnet", "sepolia"];
var DEFAULT_RPC_URLS = {
  mainnet: "https://starknet-mainnet.public.blastapi.io",
  sepolia: "https://starknet-sepolia.public.blastapi.io"
};

// src/config.ts
var MedialaneConfigSchema = zod.z.object({
  network: zod.z.enum(SUPPORTED_NETWORKS).default("mainnet"),
  rpcUrl: zod.z.string().url().optional(),
  backendUrl: zod.z.string().url().optional(),
  marketplaceContract: zod.z.string().optional()
});
function resolveConfig(raw) {
  const parsed = MedialaneConfigSchema.parse(raw);
  return {
    network: parsed.network,
    rpcUrl: parsed.rpcUrl ?? DEFAULT_RPC_URLS[parsed.network],
    backendUrl: parsed.backendUrl,
    marketplaceContract: parsed.marketplaceContract ?? MARKETPLACE_CONTRACT_MAINNET
  };
}
function buildOrderTypedData(message, chainId) {
  return {
    domain: {
      name: "Medialane",
      version: "1",
      chainId,
      revision: starknet.TypedDataRevision.ACTIVE
    },
    primaryType: "OrderParameters",
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" }
      ],
      OrderParameters: [
        { name: "offerer", type: "ContractAddress" },
        { name: "offer", type: "OfferItem" },
        { name: "consideration", type: "ConsiderationItem" },
        { name: "start_time", type: "felt" },
        { name: "end_time", type: "felt" },
        { name: "salt", type: "felt" },
        { name: "nonce", type: "felt" }
      ],
      OfferItem: [
        { name: "item_type", type: "shortstring" },
        { name: "token", type: "ContractAddress" },
        { name: "identifier_or_criteria", type: "felt" },
        { name: "start_amount", type: "felt" },
        { name: "end_amount", type: "felt" }
      ],
      ConsiderationItem: [
        { name: "item_type", type: "shortstring" },
        { name: "token", type: "ContractAddress" },
        { name: "identifier_or_criteria", type: "felt" },
        { name: "start_amount", type: "felt" },
        { name: "end_amount", type: "felt" },
        { name: "recipient", type: "ContractAddress" }
      ]
    },
    message
  };
}
function buildFulfillmentTypedData(message, chainId) {
  return {
    domain: {
      name: "Medialane",
      version: "1",
      chainId,
      revision: starknet.TypedDataRevision.ACTIVE
    },
    primaryType: "OrderFulfillment",
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" }
      ],
      OrderFulfillment: [
        { name: "order_hash", type: "felt" },
        { name: "fulfiller", type: "ContractAddress" },
        { name: "nonce", type: "felt" }
      ]
    },
    message
  };
}
function buildCancellationTypedData(message, chainId) {
  return {
    domain: {
      name: "Medialane",
      version: "1",
      chainId,
      revision: starknet.TypedDataRevision.ACTIVE
    },
    primaryType: "OrderCancellation",
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" }
      ],
      OrderCancellation: [
        { name: "order_hash", type: "felt" },
        { name: "offerer", type: "ContractAddress" },
        { name: "nonce", type: "felt" }
      ]
    },
    message
  };
}

// src/abis.ts
var IPMarketplaceABI = [
  {
    type: "impl",
    name: "UpgradeableImpl",
    interface_name: "openzeppelin_upgrades::interface::IUpgradeable"
  },
  {
    type: "interface",
    name: "openzeppelin_upgrades::interface::IUpgradeable",
    items: [
      {
        type: "function",
        name: "upgrade",
        inputs: [{ name: "new_class_hash", type: "core::starknet::class_hash::ClassHash" }],
        outputs: [],
        state_mutability: "external"
      }
    ]
  },
  {
    type: "impl",
    name: "MedialaneImpl",
    interface_name: "mediolano_core::core::interface::IMedialane"
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OfferItem",
    members: [
      { name: "item_type", type: "core::felt252" },
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "identifier_or_criteria", type: "core::felt252" },
      { name: "start_amount", type: "core::felt252" },
      { name: "end_amount", type: "core::felt252" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::ConsiderationItem",
    members: [
      { name: "item_type", type: "core::felt252" },
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "identifier_or_criteria", type: "core::felt252" },
      { name: "start_amount", type: "core::felt252" },
      { name: "end_amount", type: "core::felt252" },
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OrderParameters",
    members: [
      { name: "offerer", type: "core::starknet::contract_address::ContractAddress" },
      { name: "offer", type: "mediolano_core::core::types::OfferItem" },
      { name: "consideration", type: "mediolano_core::core::types::ConsiderationItem" },
      { name: "start_time", type: "core::felt252" },
      { name: "end_time", type: "core::felt252" },
      { name: "salt", type: "core::felt252" },
      { name: "nonce", type: "core::felt252" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::Order",
    members: [
      { name: "parameters", type: "mediolano_core::core::types::OrderParameters" },
      { name: "signature", type: "core::array::Array::<core::felt252>" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OrderFulfillment",
    members: [
      { name: "order_hash", type: "core::felt252" },
      { name: "fulfiller", type: "core::starknet::contract_address::ContractAddress" },
      { name: "nonce", type: "core::felt252" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::FulfillmentRequest",
    members: [
      { name: "fulfillment", type: "mediolano_core::core::types::OrderFulfillment" },
      { name: "signature", type: "core::array::Array::<core::felt252>" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OrderCancellation",
    members: [
      { name: "order_hash", type: "core::felt252" },
      { name: "offerer", type: "core::starknet::contract_address::ContractAddress" },
      { name: "nonce", type: "core::felt252" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::CancelRequest",
    members: [
      { name: "cancelation", type: "mediolano_core::core::types::OrderCancellation" },
      { name: "signature", type: "core::array::Array::<core::felt252>" }
    ]
  },
  {
    type: "enum",
    name: "mediolano_core::core::types::OrderStatus",
    variants: [
      { name: "None", type: "()" },
      { name: "Created", type: "()" },
      { name: "Filled", type: "()" },
      { name: "Cancelled", type: "()" }
    ]
  },
  {
    type: "enum",
    name: "core::option::Option::<core::starknet::contract_address::ContractAddress>",
    variants: [
      { name: "Some", type: "core::starknet::contract_address::ContractAddress" },
      { name: "None", type: "()" }
    ]
  },
  {
    type: "struct",
    name: "mediolano_core::core::types::OrderDetails",
    members: [
      { name: "offerer", type: "core::starknet::contract_address::ContractAddress" },
      { name: "offer", type: "mediolano_core::core::types::OfferItem" },
      { name: "consideration", type: "mediolano_core::core::types::ConsiderationItem" },
      { name: "start_time", type: "core::integer::u64" },
      { name: "end_time", type: "core::integer::u64" },
      { name: "order_status", type: "mediolano_core::core::types::OrderStatus" },
      {
        name: "fulfiller",
        type: "core::option::Option::<core::starknet::contract_address::ContractAddress>"
      }
    ]
  },
  {
    type: "interface",
    name: "mediolano_core::core::interface::IMedialane",
    items: [
      {
        type: "function",
        name: "register_order",
        inputs: [{ name: "order", type: "mediolano_core::core::types::Order" }],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "fulfill_order",
        inputs: [
          {
            name: "fulfillment_request",
            type: "mediolano_core::core::types::FulfillmentRequest"
          }
        ],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "cancel_order",
        inputs: [{ name: "cancel_request", type: "mediolano_core::core::types::CancelRequest" }],
        outputs: [],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "get_order_details",
        inputs: [{ name: "order_hash", type: "core::felt252" }],
        outputs: [{ type: "mediolano_core::core::types::OrderDetails" }],
        state_mutability: "view"
      },
      {
        type: "function",
        name: "get_order_hash",
        inputs: [
          { name: "parameters", type: "mediolano_core::core::types::OrderParameters" },
          { name: "signer", type: "core::starknet::contract_address::ContractAddress" }
        ],
        outputs: [{ type: "core::felt252" }],
        state_mutability: "view"
      }
    ]
  },
  {
    type: "impl",
    name: "NoncesImpl",
    interface_name: "openzeppelin_utils::cryptography::interface::INonces"
  },
  {
    type: "interface",
    name: "openzeppelin_utils::cryptography::interface::INonces",
    items: [
      {
        type: "function",
        name: "nonces",
        inputs: [
          { name: "owner", type: "core::starknet::contract_address::ContractAddress" }
        ],
        outputs: [{ type: "core::felt252" }],
        state_mutability: "view"
      }
    ]
  },
  {
    type: "impl",
    name: "SRC5Impl",
    interface_name: "openzeppelin_introspection::interface::ISRC5"
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      { name: "False", type: "()" },
      { name: "True", type: "()" }
    ]
  },
  {
    type: "interface",
    name: "openzeppelin_introspection::interface::ISRC5",
    items: [
      {
        type: "function",
        name: "supports_interface",
        inputs: [{ name: "interface_id", type: "core::felt252" }],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view"
      }
    ]
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      { name: "manager", type: "core::starknet::contract_address::ContractAddress" },
      { name: "native_token_address", type: "core::starknet::contract_address::ContractAddress" }
    ]
  },
  {
    type: "event",
    name: "mediolano_core::core::events::OrderCreated",
    kind: "struct",
    members: [
      { name: "order_hash", type: "core::felt252", kind: "key" },
      {
        name: "offerer",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key"
      }
    ]
  },
  {
    type: "event",
    name: "mediolano_core::core::events::OrderFulfilled",
    kind: "struct",
    members: [
      { name: "order_hash", type: "core::felt252", kind: "key" },
      {
        name: "offerer",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key"
      },
      {
        name: "fulfiller",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key"
      }
    ]
  },
  {
    type: "event",
    name: "mediolano_core::core::events::OrderCancelled",
    kind: "struct",
    members: [
      { name: "order_hash", type: "core::felt252", kind: "key" },
      {
        name: "offerer",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key"
      }
    ]
  },
  {
    type: "event",
    name: "mediolano_core::core::medialane::Medialane::Event",
    kind: "enum",
    variants: [
      {
        name: "OrderCreated",
        type: "mediolano_core::core::events::OrderCreated",
        kind: "nested"
      },
      {
        name: "OrderFulfilled",
        type: "mediolano_core::core::events::OrderFulfilled",
        kind: "nested"
      },
      {
        name: "OrderCancelled",
        type: "mediolano_core::core::events::OrderCancelled",
        kind: "nested"
      }
    ]
  }
];

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

// src/marketplace/orders.ts
var MedialaneError = class extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    this.name = "MedialaneError";
  }
};
function toSignatureArray(sig) {
  if (Array.isArray(sig)) return sig;
  const s = sig;
  return [s.r.toString(), s.s.toString()];
}
function getChainId(config) {
  return config.network === "mainnet" ? starknet.constants.StarknetChainId.SN_MAIN : starknet.constants.StarknetChainId.SN_SEPOLIA;
}
function makeContract(config) {
  const provider = new starknet.RpcProvider({ nodeUrl: config.rpcUrl });
  const contract = new starknet.Contract(
    IPMarketplaceABI,
    config.marketplaceContract,
    provider
  );
  return { contract, provider };
}
function resolveToken(currency) {
  const token = SUPPORTED_TOKENS.find(
    (t) => t.symbol === currency.toUpperCase() || t.address.toLowerCase() === currency.toLowerCase()
  );
  if (!token) throw new MedialaneError(`Unsupported currency: ${currency}`);
  return token;
}
function computePriceWei(price, decimals) {
  return BigInt(Math.floor(parseFloat(price) * Math.pow(10, decimals))).toString();
}
async function createListing(account, params, config) {
  const { nftContract, tokenId, price, currency, durationSeconds } = params;
  const { contract, provider } = makeContract(config);
  const token = resolveToken(currency);
  const priceWei = computePriceWei(price, token.decimals);
  const now = Math.floor(Date.now() / 1e3);
  const startTime = now + 300;
  const endTime = now + durationSeconds;
  const salt = Math.floor(Math.random() * 1e6).toString();
  const currentNonce = await contract.nonces(account.address);
  const orderParams = {
    offerer: account.address,
    offer: {
      item_type: "ERC721",
      token: nftContract,
      identifier_or_criteria: tokenId,
      start_amount: "1",
      end_amount: "1"
    },
    consideration: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      start_amount: priceWei,
      end_amount: priceWei,
      recipient: account.address
    },
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    salt,
    nonce: currentNonce.toString()
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
        item_type: starknet.shortString.encodeShortString(orderParams.offer.item_type)
      },
      consideration: {
        ...orderParams.consideration,
        item_type: starknet.shortString.encodeShortString(orderParams.consideration.item_type)
      }
    },
    signature: signatureArray
  });
  const tokenIdUint256 = starknet.cairo.uint256(tokenId);
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
    throw new MedialaneError("Failed to create listing", err);
  }
}
async function makeOffer(account, params, config) {
  const { nftContract, tokenId, price, currency, durationSeconds } = params;
  const { contract, provider } = makeContract(config);
  const token = resolveToken(currency);
  const priceWei = computePriceWei(price, token.decimals);
  const now = Math.floor(Date.now() / 1e3);
  const startTime = now + 300;
  const endTime = now + durationSeconds;
  const salt = Math.floor(Math.random() * 1e6).toString();
  const currentNonce = await contract.nonces(account.address);
  const orderParams = {
    offerer: account.address,
    offer: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      start_amount: priceWei,
      end_amount: priceWei
    },
    consideration: {
      item_type: "ERC721",
      token: nftContract,
      identifier_or_criteria: tokenId,
      start_amount: "1",
      end_amount: "1",
      recipient: account.address
    },
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    salt,
    nonce: currentNonce.toString()
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
        item_type: starknet.shortString.encodeShortString(orderParams.offer.item_type)
      },
      consideration: {
        ...orderParams.consideration,
        item_type: starknet.shortString.encodeShortString(orderParams.consideration.item_type)
      }
    },
    signature: signatureArray
  });
  const amountUint256 = starknet.cairo.uint256(priceWei);
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
    throw new MedialaneError("Failed to make offer", err);
  }
}
async function fulfillOrder(account, params, config) {
  const { orderHash } = params;
  const { contract, provider } = makeContract(config);
  const currentNonce = await contract.nonces(account.address);
  const chainId = getChainId(config);
  const fulfillmentParams = {
    order_hash: orderHash,
    fulfiller: account.address,
    nonce: currentNonce.toString()
  };
  const typedData = stringifyBigInts(
    buildFulfillmentTypedData(fulfillmentParams, chainId)
  );
  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);
  const fulfillPayload = stringifyBigInts({
    fulfillment: fulfillmentParams,
    signature: signatureArray
  });
  const call = contract.populate("fulfill_order", [fulfillPayload]);
  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to fulfill order", err);
  }
}
async function cancelOrder(account, params, config) {
  const { orderHash } = params;
  const { contract, provider } = makeContract(config);
  const currentNonce = await contract.nonces(account.address);
  const chainId = getChainId(config);
  const cancelParams = {
    order_hash: orderHash,
    offerer: account.address,
    nonce: currentNonce.toString()
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
    throw new MedialaneError("Failed to cancel order", err);
  }
}
async function checkoutCart(account, items, config) {
  if (items.length === 0) throw new MedialaneError("Cart is empty");
  const { contract, provider } = makeContract(config);
  const tokenTotals = /* @__PURE__ */ new Map();
  for (const item of items) {
    const prev = tokenTotals.get(item.considerationToken) ?? 0n;
    tokenTotals.set(item.considerationToken, prev + BigInt(item.considerationAmount));
  }
  const approveCalls = Array.from(tokenTotals.entries()).map(([tokenAddr, totalWei]) => {
    const amount = starknet.cairo.uint256(totalWei.toString());
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
  const currentNonce = await contract.nonces(account.address);
  const baseNonce = BigInt(currentNonce.toString());
  const chainId = getChainId(config);
  const fulfillCalls = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const nonce = (baseNonce + BigInt(i)).toString();
    const fulfillmentParams = {
      order_hash: item.orderHash,
      fulfiller: account.address,
      nonce
    };
    const typedData = stringifyBigInts(
      buildFulfillmentTypedData(fulfillmentParams, chainId)
    );
    const signature = await account.signMessage(typedData);
    const signatureArray = toSignatureArray(signature);
    const fulfillPayload = stringifyBigInts({
      fulfillment: fulfillmentParams,
      signature: signatureArray
    });
    fulfillCalls.push(contract.populate("fulfill_order", [fulfillPayload]));
  }
  try {
    const tx = await account.execute([...approveCalls, ...fulfillCalls]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Cart checkout failed", err);
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
  // ─── Typed data builders (for ChipiPay / custom signing flows) ───────────
  buildListingTypedData(params, chainId) {
    return buildOrderTypedData(params, chainId);
  }
  buildFulfillmentTypedData(params, chainId) {
    return buildFulfillmentTypedData(params, chainId);
  }
  buildCancellationTypedData(params, chainId) {
    return buildCancellationTypedData(params, chainId);
  }
};

// src/api/client.ts
var MedialaneApiError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "MedialaneApiError";
  }
};
var ApiClient = class {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  async request(path) {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const res = await fetch(url);
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = await res.json();
        if (body.error) message = body.error;
      } catch {
      }
      throw new MedialaneApiError(res.status, message);
    }
    return res.json();
  }
  // ─── Orders ──────────────────────────────────────────────────────────────
  getOrders(query = {}) {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.collection) params.set("collection", query.collection);
    if (query.currency) params.set("currency", query.currency);
    if (query.sort) params.set("sort", query.sort);
    if (query.page !== void 0) params.set("page", String(query.page));
    if (query.limit !== void 0) params.set("limit", String(query.limit));
    if (query.offerer) params.set("offerer", query.offerer);
    const qs = params.toString();
    return this.request(`/v1/orders${qs ? `?${qs}` : ""}`);
  }
  getOrder(orderHash) {
    return this.request(`/v1/orders/${orderHash}`);
  }
  getListingsForToken(contract, tokenId) {
    return this.request(`/v1/orders/token/${contract}/${tokenId}`);
  }
  getOrdersByUser(address, page = 1, limit = 20) {
    return this.request(
      `/v1/orders/user/${address}?page=${page}&limit=${limit}`
    );
  }
  // ─── Tokens ──────────────────────────────────────────────────────────────
  getToken(contract, tokenId, wait = false) {
    return this.request(
      `/v1/tokens/${contract}/${tokenId}${wait ? "?wait=true" : ""}`
    );
  }
  getTokensByOwner(address, page = 1, limit = 20) {
    return this.request(
      `/v1/tokens/owned/${address}?page=${page}&limit=${limit}`
    );
  }
  // ─── Collections ─────────────────────────────────────────────────────────
  getCollections(page = 1, limit = 20) {
    return this.request(
      `/v1/collections?page=${page}&limit=${limit}`
    );
  }
  getCollection(contract) {
    return this.request(`/v1/collections/${contract}`);
  }
};

// src/client.ts
var MedialaneClient = class {
  constructor(rawConfig = {}) {
    this.config = resolveConfig(rawConfig);
    this.marketplace = new MarketplaceModule(this.config);
    if (!this.config.backendUrl) {
      const noBackend = new Proxy({}, {
        get(_target, prop) {
          return () => {
            throw new Error(
              `backendUrl not configured. Pass backendUrl to MedialaneClient to use .${String(prop)}()`
            );
          };
        }
      });
      this.indexer = noBackend;
      this.tokens = noBackend;
      this.collections = noBackend;
    } else {
      const api = new ApiClient(this.config.backendUrl);
      this.indexer = api;
      this.tokens = api;
      this.collections = api;
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

// src/utils/address.ts
function normalizeAddress(address) {
  const hex = address.replace(/^0x/, "").toLowerCase();
  return "0x" + hex.padStart(64, "0");
}
function shortenAddress(address, chars = 4) {
  const norm = normalizeAddress(address);
  return `${norm.slice(0, chars + 2)}...${norm.slice(-chars)}`;
}

// src/utils/token.ts
function parseAmount(human, decimals) {
  const factor = Math.pow(10, decimals);
  return BigInt(Math.floor(parseFloat(human) * factor)).toString();
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

exports.ApiClient = ApiClient;
exports.COLLECTION_CONTRACT_MAINNET = COLLECTION_CONTRACT_MAINNET;
exports.DEFAULT_RPC_URLS = DEFAULT_RPC_URLS;
exports.IPMarketplaceABI = IPMarketplaceABI;
exports.MARKETPLACE_CONTRACT_MAINNET = MARKETPLACE_CONTRACT_MAINNET;
exports.MarketplaceModule = MarketplaceModule;
exports.MedialaneApiError = MedialaneApiError;
exports.MedialaneClient = MedialaneClient;
exports.MedialaneError = MedialaneError;
exports.SUPPORTED_NETWORKS = SUPPORTED_NETWORKS;
exports.SUPPORTED_TOKENS = SUPPORTED_TOKENS;
exports.buildCancellationTypedData = buildCancellationTypedData;
exports.buildFulfillmentTypedData = buildFulfillmentTypedData;
exports.buildOrderTypedData = buildOrderTypedData;
exports.formatAmount = formatAmount;
exports.getTokenByAddress = getTokenByAddress;
exports.getTokenBySymbol = getTokenBySymbol;
exports.normalizeAddress = normalizeAddress;
exports.parseAmount = parseAmount;
exports.resolveConfig = resolveConfig;
exports.shortenAddress = shortenAddress;
exports.stringifyBigInts = stringifyBigInts;
exports.u256ToBigInt = u256ToBigInt;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map