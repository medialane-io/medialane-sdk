import { parseAbi } from "viem";

/** Minimal venue ABI — verified against Medialane721.sol / Medialane1155.sol.
 *  The 1155 venue's fulfillOrder additionally takes a quantity. */
export const EvmVenueABI = parseAbi([
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
  "event CounterIncremented(address indexed offerer, uint256 newCounter)",
]);

export const EvmVenue1155ABI = parseAbi([
  "function fulfillOrder(bytes32 orderHash, uint256 quantity) payable",
  "event OrderFulfilled(bytes32 indexed orderHash, address indexed offerer, address indexed fulfiller, uint256 quantity, uint256 remainingAmount, uint256 saleAmount, address royaltyReceiver, uint256 royaltyAmount)",
]);

/** MIP issuance — verified against MIPRegistry.sol / MIPCollection.sol (and
 *  the editions pair, which shares the registry surface). */
export const EvmMipRegistryABI = parseAbi([
  "function createCollection(string name, string symbol, string baseUri, uint96 royaltyBps) returns (uint256 collectionId, address collection)",
  "function getCollection(uint256 collectionId) view returns (address collection, address creator)",
  "function collectionCount() view returns (uint256)",
  "event CollectionCreated(uint256 indexed collectionId, address indexed collection, address indexed creator, string name, string symbol, string baseUri)",
]);

export const EvmMipCollectionABI = parseAbi([
  "function mint(address to, string metadataUri) returns (uint256 tokenId)",
  "function batchMint(address[] to, string[] metadataUris) returns (uint256[] tokenIds)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function owner() view returns (address)",
  "event TokenMinted(uint256 indexed tokenId, address indexed owner, string metadataUri)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);
