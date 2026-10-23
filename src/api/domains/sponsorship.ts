import type { Transport } from "../transport.js";
import type {
  ApiResponse,
  ApiSponsorshipBid,
  ApiSponsorshipLicense,
  ApiSponsorshipLicensesQuery,
  ApiSponsorshipOffer,
  ApiSponsorshipOffersQuery,
  ApiSponsorshipProposal,
  ApiSponsorshipProposalsQuery,
} from "../../types/api.js";

export interface SponsorshipApi {
  offers(query?: ApiSponsorshipOffersQuery): Promise<ApiResponse<ApiSponsorshipOffer[]>>;
  findOffer(offerId: string): Promise<ApiSponsorshipOffer | null>;
  bids(offerId: string): Promise<ApiSponsorshipBid[]>;
  proposals(query?: ApiSponsorshipProposalsQuery): Promise<ApiResponse<ApiSponsorshipProposal[]>>;
  findProposal(proposalId: string): Promise<ApiSponsorshipProposal | null>;
  licenses(query?: ApiSponsorshipLicensesQuery): Promise<ApiResponse<ApiSponsorshipLicense[]>>;
}

export function createSponsorshipApi(t: Transport): SponsorshipApi {
  return {
    offers(query = {}) {
      return t.get("/v1/sponsorship/offers", {
        limit: query.limit ?? 50,
        nftContract: query.nftContract,
        author: query.author,
        owner: query.owner,
        open: query.open,
      });
    },
    async findOffer(offerId) {
      const res = await t.find<{ data: ApiSponsorshipOffer }>(`/v1/sponsorship/offers/${encodeURIComponent(offerId)}`);
      return res?.data ?? null;
    },
    async bids(offerId) {
      return (await t.get<{ data: ApiSponsorshipBid[] }>(`/v1/sponsorship/offers/${encodeURIComponent(offerId)}/bids`)).data;
    },
    proposals(query = {}) {
      return t.get("/v1/sponsorship/proposals", {
        limit: query.limit ?? 50,
        nftContract: query.nftContract,
        proposer: query.proposer,
        owner: query.owner,
        open: query.open,
      });
    },
    async findProposal(proposalId) {
      const res = await t.find<{ data: ApiSponsorshipProposal }>(`/v1/sponsorship/proposals/${encodeURIComponent(proposalId)}`);
      return res?.data ?? null;
    },
    licenses(query = {}) {
      return t.get("/v1/sponsorship/licenses", { limit: query.limit ?? 50, holder: query.holder, author: query.author });
    },
  };
}
