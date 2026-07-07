import { type MedialaneConfig, resolveConfig, type ResolvedConfig } from "../config.js";
import { MarketplaceModule } from "./marketplace/index.js";
import { Medialane1155Module } from "./marketplace1155/index.js";
import { ApiClient } from "../api/client.js";
import { PopService } from "./services/pop.js";
import { DropService } from "./services/drop.js";
import { ERC1155CollectionService } from "./services/erc1155collection.js";
import { CreatorCoinService } from "./services/creatorCoin.js";
import { TicketService } from "./services/ticket.js";
import { ClubService } from "./services/club.js";
import { SponsorshipService } from "./services/sponsorship.js";

export class MedialaneClient {
  /** On-chain marketplace interactions for ERC-721 assets (create listing, fulfill order, etc.) */
  readonly marketplace: MarketplaceModule;

  /** On-chain marketplace interactions for ERC-1155 assets (Medialane1155 contract). */
  readonly marketplace1155: Medialane1155Module;

  /**
   * Off-chain API client — covers all /v1/* backend endpoints.
   * Requires `backendUrl` in config; pass `apiKey` for authenticated routes.
   */
  readonly api: ApiClient;

  readonly services: {
    readonly pop: PopService;
    readonly drop: DropService;
    readonly erc1155Collection: ERC1155CollectionService;
    readonly creatorCoin: CreatorCoinService;
    readonly ticket: TicketService;
    readonly club: ClubService;
    readonly sponsorship: SponsorshipService;
  };

  private readonly config: ResolvedConfig;

  constructor(rawConfig: MedialaneConfig = {}) {
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
      sponsorship: new SponsorshipService(this.config),
    };

    if (!this.config.backendUrl) {
      // When backendUrl is not configured, `client.api.*()` must fail with a
      // helpful message. Wrap a real ApiClient (built with a sentinel URL so
      // it never silently dispatches) in a Proxy that intercepts ONLY actual
      // ApiClient methods — Symbol access, .then (Promise unwrapping),
      // .toString, .inspect (Node/Bun debug) and other host introspection
      // are returned unchanged so they don't fabricate throwing functions.
      const sentinel = new ApiClient("https://medialane-sdk-no-backend.invalid", this.config.apiKey);
      const apiMethodNames = new Set<string | symbol>(
        Object.getOwnPropertyNames(ApiClient.prototype).filter(
          (k) => k !== "constructor" && typeof (sentinel as unknown as Record<string, unknown>)[k] === "function",
        ),
      );
      this.api = new Proxy(sentinel, {
        get(target, prop, receiver) {
          if (typeof prop === "symbol" || !apiMethodNames.has(prop)) {
            return Reflect.get(target, prop, receiver);
          }
          return () => {
            throw new Error(
              `backendUrl not configured. Pass backendUrl to MedialaneClient to use .api.${String(prop)}()`,
            );
          };
        },
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
}
