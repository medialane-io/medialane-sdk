// @medialane/sdk/starknet — the Starknet chain adapter. Starknet is an equal
// adapter, not the SDK's core (chain-sovereignty I2/I4; platform-federation
// spec §2). Peer dependency: starknet >= 6.

export { MedialaneClient } from "./client.js";
export { MarketplaceModule, MedialaneError } from "./marketplace/index.js";
export { Medialane1155Module } from "./marketplace1155/index.js";

// First-class Starknet venue adapter (implements the chain-neutral VenueAdapter
// over the VenueSigner capability port). StarknetIssuance is deferred until the
// app's mint flow is refactored onto IssuanceAdapter.
export { StarknetVenue } from "./venue.js";
export type { StarknetVenueDeps, ResolvedOrder } from "./venue.js";

// The capability port the app implements over its wallet layer, and its Starknet
// specialization (SNIP-12 typed data in, felt-array signature out).
export type { VenueSigner } from "../adapters/types.js";
import type { TypedData, Call } from "starknet";
import type { VenueSigner as _VenueSigner } from "../adapters/types.js";
export type StarknetVenueSigner = _VenueSigner<TypedData, Call>;

// Platform-layer fee call builder (creators-fund fee)
export { buildFeeCall } from "./fee/build-fee-call.js";
export type { FeeSurface, BuildFeeCallParams } from "./fee/build-fee-call.js";

// Admin signed-request auth + SIWS (Starknet-signed session protocol)
export * from "./admin-auth/index.js";
export * from "./siws/index.js";

// Cairo ABIs
export { IPMarketplaceABI, POPCollectionABI, POPFactoryABI, DropCollectionABI, DropFactoryABI, IPCollectionABI, IPNftABI, Medialane1155ABI, IPCollection1155FactoryABI, IPCollection1155ABI, CreatorCoinFactoryABI, IPTicketCollectionABI, IPTicketCollectionFactoryABI, IPClubABI, IPClubNFTABI, IPClubFactoryABI, IPClubCollectionABI, IPSponsorshipABI, IPSponsorshipLicenseABI, IPGenesisABI } from "./abis/index.js";

// Starknet services
export { PopService } from "./services/pop.js";
export { DropService } from "./services/drop.js";
export { TicketService } from "./services/ticket.js";
export { ClubService } from "./services/club.js";
export { SponsorshipService } from "./services/sponsorship.js";
export { ERC1155CollectionService } from "./services/erc1155collection.js";
export {
  CreatorCoinService,
  VALIDATED_EKUBO_PARAMS,
  getCreatorCoinPrice,
  buildCreateCreatorCoinCall,
  buildLaunchOnEkuboCalls,
  parseCreatorCoinCreated,
} from "./services/creatorCoin.js";
export {
  validateName as validateCoinName,
  validateSymbol as validateCoinSymbol,
  validateSupply as validateCoinSupply,
  toRaw as coinToRaw,
  teamCoinsRaw,
  buybackQuoteRaw,
  fdvHuman,
  LAUNCH_PRICE_QUOTE_PER_COIN,
  MIN_SUPPLY as COIN_MIN_SUPPLY,
  MAX_SUPPLY as COIN_MAX_SUPPLY,
} from "./services/coinLaunchMath.js";
export type {
  CreatorCoinReceiptLike,
  CreateCreatorCoinParams,
  EkuboLaunchParams,
  EkuboPoolParams,
  CreatorCoinPrice,
} from "./services/creatorCoin.js";
export type {
  DeployCollectionParams,
  MintEditionParams,
  BatchMintEditionParams,
  AddSupplyParams,
} from "./services/erc1155collection.js";

// Cairo ByteArray encoding
export { encodeByteArray } from "./bytearray.js";

// SNIP-12 signing builders (for advanced / ChipiPay integrations)
export {
  buildOrderTypedData,
  buildCancellationTypedData,
  build1155OrderTypedData,
  build1155CancellationTypedData,
} from "./marketplace/signing.js";
