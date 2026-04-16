import { type MedialaneConfig, resolveConfig, type ResolvedConfig } from "./config.js";
import { MarketplaceModule } from "./marketplace/index.js";
import { Medialane1155Module } from "./marketplace1155/index.js";
import { ApiClient } from "./api/client.js";
import { PopService } from "./services/pop.js";
import { DropService } from "./services/drop.js";

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
  };

  private readonly config: ResolvedConfig;

  constructor(rawConfig: MedialaneConfig = {}) {
    this.config = resolveConfig(rawConfig);

    this.marketplace = new MarketplaceModule(this.config);
    this.marketplace1155 = new Medialane1155Module(this.config);

    this.services = {
      pop: new PopService(this.config),
      drop: new DropService(this.config),
    };

    if (!this.config.backendUrl) {
      this.api = new Proxy({} as ApiClient, {
        get(_target, prop) {
          return () => {
            throw new Error(
              `backendUrl not configured. Pass backendUrl to MedialaneClient to use .api.${String(prop)}()`
            );
          };
        },
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
}
