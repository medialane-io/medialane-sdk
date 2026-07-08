import { parseAbi, hashTypedData, parseEventLogs } from 'viem';

// src/evm/typedData.ts
var EVM_ORDER_TYPES = {
  OfferItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifier", type: "uint256" },
    { name: "amount", type: "uint256" }
  ],
  ConsiderationItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifier", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "recipient", type: "address" }
  ],
  OrderParameters: [
    { name: "offerer", type: "address" },
    { name: "offer", type: "OfferItem" },
    { name: "consideration", type: "ConsiderationItem" },
    { name: "royaltyMaxBps", type: "uint256" },
    { name: "startTime", type: "uint256" },
    { name: "endTime", type: "uint256" },
    { name: "salt", type: "uint256" },
    { name: "counter", type: "uint256" }
  ]
};
function evmOrderDomain(chainId, verifyingContract) {
  return { name: "Medialane", version: "1", chainId, verifyingContract };
}
function evmOrderDigest(chainId, verifyingContract, parameters) {
  return hashTypedData({
    domain: evmOrderDomain(chainId, verifyingContract),
    types: EVM_ORDER_TYPES,
    primaryType: "OrderParameters",
    message: parameters
  });
}

// src/chains.ts
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
var EvmVenueABI = parseAbi([
  "struct OfferItem { uint8 itemType; address token; uint256 identifier; uint256 amount; }",
  "struct ConsiderationItem { uint8 itemType; address token; uint256 identifier; uint256 amount; address recipient; }",
  "struct OrderParameters { address offerer; OfferItem offer; ConsiderationItem consideration; uint256 royaltyMaxBps; uint256 startTime; uint256 endTime; uint256 salt; uint256 counter; }",
  "function registerOrder(OrderParameters parameters, bytes signature)",
  "function fulfillOrder(bytes32 orderHash) payable",
  "function cancelOrder(bytes32 orderHash)",
  "function incrementCounter()",
  "function getOrderHash(OrderParameters parameters) view returns (bytes32)",
  "function getCounter(address offerer) view returns (uint256)",
  "function version() pure returns (string)",
  "event OrderCreated(bytes32 indexed orderHash, address indexed offerer)",
  "event OrderFulfilled(bytes32 indexed orderHash, address indexed offerer, address indexed fulfiller, uint256 saleAmount, address royaltyReceiver, uint256 royaltyAmount)",
  "event OrderCancelled(bytes32 indexed orderHash, address indexed offerer)",
  "event CounterIncremented(address indexed offerer, uint256 newCounter)"
]);
var EvmVenue1155ABI = parseAbi([
  "function fulfillOrder(bytes32 orderHash, uint256 quantity) payable",
  "event OrderFulfilled(bytes32 indexed orderHash, address indexed offerer, address indexed fulfiller, uint256 quantity, uint256 remainingAmount, uint256 saleAmount, address royaltyReceiver, uint256 royaltyAmount)"
]);
var EvmMipRegistryABI = parseAbi([
  "function createCollection(string name, string symbol, string baseUri, uint96 royaltyBps) returns (uint256 collectionId, address collection)",
  "function getCollection(uint256 collectionId) view returns (address collection, address creator)",
  "function collectionCount() view returns (uint256)",
  "event CollectionCreated(uint256 indexed collectionId, address indexed collection, address indexed creator, string name, string symbol, string baseUri)"
]);
var EvmMipCollectionABI = parseAbi([
  "function mint(address to, string metadataUri) returns (uint256 tokenId)",
  "function batchMint(address[] to, string[] metadataUris) returns (uint256[] tokenIds)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function owner() view returns (address)",
  "event TokenMinted(uint256 indexed tokenId, address indexed owner, string metadataUri)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
]);

// src/evm/venue.ts
var EvmVenue = class {
  constructor(opts) {
    this.chain = opts.chain;
    this.chainId = opts.chainId;
    this.publicClient = opts.publicClient;
    this.variant = opts.variant;
    const coords = maybeCoords(opts.chain);
    const contract = opts.contract ?? (opts.variant === "721" ? coords?.marketplace721 : coords?.marketplace1155);
    if (!contract) throw new Error(`No ${opts.variant} venue configured for ${opts.chain}`);
    this.contract = contract;
  }
  /** Builds the order struct, signs the EIP-712 digest, and registers it.
   *  The digest is the canonical order id on EVM chains. */
  async registerOrder(signer, params) {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const counter = await this.getCounter(account.address);
    const nft = {
      itemType: 2,
      token: params.asset.contract,
      identifier: BigInt(params.asset.tokenId),
      amount: 1n
    };
    const payment = {
      itemType: params.paymentToken === NATIVE_SENTINEL ? 0 : 1,
      token: params.paymentToken === NATIVE_SENTINEL ? "0x0000000000000000000000000000000000000000" : params.paymentToken,
      identifier: 0n,
      amount: BigInt(params.amount)
    };
    const order = params.side === "listing" ? {
      offerer: account.address,
      offer: nft,
      consideration: { ...payment, recipient: account.address },
      ...commonFields(params)
    } : {
      offerer: account.address,
      offer: payment,
      consideration: { ...nft, recipient: account.address },
      ...commonFields(params)
    };
    order.counter = counter;
    const signature = await signer.signTypedData({
      account,
      domain: evmOrderDomain(this.chainId, this.contract),
      types: EVM_ORDER_TYPES,
      primaryType: "OrderParameters",
      message: order
    });
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: this.contract,
      abi: EvmVenueABI,
      functionName: "registerOrder",
      args: [order, signature]
    });
    return { txHash, orderRef: evmOrderDigest(this.chainId, this.contract, order) };
  }
  async fulfillOrder(signer, orderRef, opts) {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const value = opts?.value ? BigInt(opts.value) : void 0;
    const txHash = this.variant === "1155" ? await signer.writeContract({
      account,
      chain: signer.chain,
      address: this.contract,
      abi: EvmVenue1155ABI,
      functionName: "fulfillOrder",
      args: [orderRef, BigInt(opts?.quantity ?? "1")],
      value
    }) : await signer.writeContract({
      account,
      chain: signer.chain,
      address: this.contract,
      abi: EvmVenueABI,
      functionName: "fulfillOrder",
      args: [orderRef],
      value
    });
    return { txHash };
  }
  async cancelOrder(signer, orderRef) {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: this.contract,
      abi: EvmVenueABI,
      functionName: "cancelOrder",
      args: [orderRef]
    });
    return { txHash };
  }
  async incrementCounter(signer) {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: this.contract,
      abi: EvmVenueABI,
      functionName: "incrementCounter",
      args: []
    });
    return { txHash };
  }
  async getOrderDetails(orderRef) {
    return this.publicClient.readContract({
      address: this.contract,
      abi: [
        {
          type: "function",
          name: "getOrderDetails",
          stateMutability: "view",
          inputs: [{ name: "orderHash", type: "bytes32" }],
          outputs: [{ name: "", type: "bytes" }]
        }
      ],
      functionName: "getOrderDetails",
      args: [orderRef]
    });
  }
  async getCounter(address) {
    return this.publicClient.readContract({
      address: this.contract,
      abi: EvmVenueABI,
      functionName: "getCounter",
      args: [address]
    });
  }
};
var NATIVE_SENTINEL = "native";
function commonFields(params) {
  return {
    royaltyMaxBps: BigInt(params.royaltyMaxBps),
    startTime: BigInt(params.startTime),
    endTime: BigInt(params.endTime),
    salt: BigInt(params.salt),
    counter: 0n
  };
}
function maybeCoords(chain) {
  try {
    return getCoordinates(chain);
  } catch {
    return void 0;
  }
}
var EvmIssuance = class {
  constructor(opts) {
    this.chain = opts.chain;
    this.publicClient = opts.publicClient;
    const registry = opts.registry ?? maybeCoords2(opts.chain)?.mipRegistry;
    if (!registry) throw new Error(`No MIP registry configured for ${opts.chain}`);
    this.registry = registry;
  }
  async createCollection(signer, params) {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: this.registry,
      abi: EvmMipRegistryABI,
      functionName: "createCollection",
      args: [params.name, params.symbol, params.baseUri, BigInt(params.royaltyBps)]
    });
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    const [created] = parseEventLogs({
      abi: EvmMipRegistryABI,
      eventName: "CollectionCreated",
      logs: receipt.logs
    });
    return { txHash, collection: created?.args.collection ?? "" };
  }
  async mint(signer, params) {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: params.collection,
      abi: EvmMipCollectionABI,
      functionName: "mint",
      args: [params.recipient, params.tokenUri]
    });
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    const [minted] = parseEventLogs({
      abi: EvmMipCollectionABI,
      eventName: "TokenMinted",
      logs: receipt.logs
    });
    return { txHash, tokenId: (minted?.args.tokenId ?? 0n).toString() };
  }
  async batchMint(signer, params) {
    const account = signer.account;
    if (!account) throw new Error("WalletClient has no account");
    const txHash = await signer.writeContract({
      account,
      chain: signer.chain,
      address: params.collection,
      abi: EvmMipCollectionABI,
      functionName: "batchMint",
      args: [params.recipients, params.tokenUris]
    });
    return { txHash };
  }
};
function maybeCoords2(chain) {
  try {
    return getCoordinates(chain);
  } catch {
    return void 0;
  }
}

export { EVM_ORDER_TYPES, EvmIssuance, EvmMipCollectionABI, EvmMipRegistryABI, EvmVenue, EvmVenue1155ABI, EvmVenueABI, NATIVE_SENTINEL, evmOrderDigest, evmOrderDomain };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map