import { MedialaneApiError, parseRetryAfter } from "../errors.js";
import { Transport, type BearerSource, type TransportOptions } from "./transport.js";
import { createOrdersApi, type OrdersApi } from "./domains/orders.js";
import { createTokensApi, type TokensApi } from "./domains/tokens.js";
import { createCollectionsApi, type CollectionsApi } from "./domains/collections.js";
import { createActivityApi, createSearchApi, type ActivityApi, type SearchApi } from "./domains/activity.js";
import { createIntentsApi, type IntentsApi } from "./domains/intents.js";
import { createMetadataApi, type MetadataApi } from "./domains/metadata.js";
import { createCreatorsApi, type CreatorsApi } from "./domains/creators.js";
import { createAccountApi, type AccountApi } from "./domains/account.js";
import { createPortalApi, type PortalApi } from "./domains/portal.js";
import { createBusinessApi, type BusinessApi } from "./domains/business.js";
import { createRemixApi, type RemixApi } from "./domains/remix.js";
import { createCoinsApi, type CoinsApi } from "./domains/coins.js";
import { createDropsApi, type DropsApi } from "./domains/drops.js";
import { createSponsorshipApi, type SponsorshipApi } from "./domains/sponsorship.js";
import { createRewardsApi, type RewardsApi } from "./domains/rewards.js";
import { createPlatformApi, type PlatformApi } from "./domains/platform.js";
import { createChainReadsApi, type ChainReadsApi } from "./domains/chainReads.js";

export { MedialaneApiError, parseRetryAfter };

export type ApiClientOptions = TransportOptions;

export class ApiClient {
  private readonly transport: Transport;

  readonly orders: OrdersApi;
  readonly tokens: TokensApi;
  readonly collections: CollectionsApi;
  readonly activity: ActivityApi;
  readonly search: SearchApi;
  readonly intents: IntentsApi;
  readonly metadata: MetadataApi;
  readonly creators: CreatorsApi;
  readonly account: AccountApi;
  readonly portal: PortalApi;
  readonly business: BusinessApi;
  readonly remix: RemixApi;
  readonly coins: CoinsApi;
  readonly drops: DropsApi;
  readonly sponsorship: SponsorshipApi;
  readonly rewards: RewardsApi;
  readonly platform: PlatformApi;
  readonly chainReads: ChainReadsApi;

  constructor(options: ApiClientOptions) {
    this.transport = new Transport(options);
    const t = this.transport;
    this.orders = createOrdersApi(t);
    this.tokens = createTokensApi(t);
    this.collections = createCollectionsApi(t);
    this.activity = createActivityApi(t);
    this.search = createSearchApi(t);
    this.intents = createIntentsApi(t);
    this.metadata = createMetadataApi(t);
    this.creators = createCreatorsApi(t);
    this.account = createAccountApi(t);
    this.portal = createPortalApi(t);
    this.business = createBusinessApi(t);
    this.remix = createRemixApi(t);
    this.coins = createCoinsApi(t);
    this.drops = createDropsApi(t);
    this.sponsorship = createSponsorshipApi(t);
    this.rewards = createRewardsApi(t);
    this.platform = createPlatformApi(t);
    this.chainReads = createChainReadsApi(t);
  }

  withBearer(bearer: BearerSource | undefined): ApiClient {
    return new ApiClient({ ...this.transport.settings(), bearer });
  }
}
