import { type MedialaneConfig, resolveConfig, type ResolvedConfig } from "./config.js";
import { MarketplaceModule } from "./marketplace/index.js";
import { ApiClient } from "./api/client.js";

export class MedialaneClient {
  readonly marketplace: MarketplaceModule;
  readonly indexer: ApiClient;
  readonly tokens: ApiClient;
  readonly collections: ApiClient;

  private readonly config: ResolvedConfig;

  constructor(rawConfig: MedialaneConfig = {}) {
    this.config = resolveConfig(rawConfig);

    this.marketplace = new MarketplaceModule(this.config);

    if (!this.config.backendUrl) {
      const noBackend = new Proxy({} as ApiClient, {
        get(_target, prop) {
          return () => {
            throw new Error(
              `backendUrl not configured. Pass backendUrl to MedialaneClient to use .${String(prop)}()`
            );
          };
        },
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
}
