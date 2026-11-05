import type { RpcProvider } from "starknet";
import { type MedialaneConfig, resolveConfig, type ResolvedConfig } from "../config.js";
import { ApiClient } from "../api/client.js";
import { createChainProvider } from "./chain-provider.js";
import type { IntentKind } from "../contract/intents.js";
import type { IntentParamsByKind } from "../types/api.js";
import { createIntent, type CreatedIntent } from "./intents/create.js";

const NO_BACKEND = "backendUrl not configured. Pass backendUrl to MedialaneClient to use";

export class MedialaneClient {
  readonly api: ApiClient;

  private readonly config: ResolvedConfig;

  private _provider: RpcProvider | undefined;

  constructor(rawConfig: MedialaneConfig = {}) {
    this.config = resolveConfig(rawConfig);
    const config = this.config;

    this.api = config.backendUrl
      ? new ApiClient({ baseUrl: config.backendUrl, apiKey: config.apiKey, retry: config.retryOptions, chain: config.chain })
      : new ApiClient({
          baseUrl: "https://medialane-sdk-no-backend.invalid",
          apiKey: config.apiKey,
          fetch: () => {
            throw new Error(`${NO_BACKEND} .api`);
          },
        });
  }

  get chain() {
    return this.config.chain;
  }

  get provider(): RpcProvider {
    if (!this.config.backendUrl) {
      throw new Error(`${NO_BACKEND} .provider`);
    }
    return (this._provider ??= createChainProvider(this.config.backendUrl, this.config.apiKey));
  }

  async createIntent<K extends IntentKind>(kind: K, params: IntentParamsByKind[K]): Promise<CreatedIntent> {
    return createIntent({ provider: this.provider, orders: this.api.orders, intents: this.api.intents, config: this.config }, kind, params);
  }
}
