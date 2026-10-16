import { newContract } from "../marketplace/utils.js";
import { CairoOption, CairoOptionVariant, cairo, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { normalizeAddress } from "../../utils/address.js";
import { IPSponsorshipABI } from "../abis/index.js";
import { getStarknetCoordinates } from "../../chains.js";
import type { CreateSponsorshipOfferParams, ProposeSponsorshipParams } from "../../types/services.js";
import type { TxResult } from "../../types/marketplace.js";

export type { CreateSponsorshipOfferParams, ProposeSponsorshipParams };

export class SponsorshipService {
  private readonly sponsorshipAddress?: string;

  constructor(config: ResolvedConfig) {
    this.sponsorshipAddress = getStarknetCoordinates(config.chain).ipSponsorship;
  }

  private _contract(account: AccountInterface, address?: string) {
    const resolved = address ?? this.sponsorshipAddress;
    if (!resolved) {
      throw new Error("IP-Sponsorship address not configured for this chain");
    }
    return newContract(IPSponsorshipABI as any, normalizeAddress("STARKNET", resolved), account as any);
  }

  async createOffer(
    account: AccountInterface,
    params: CreateSponsorshipOfferParams & { sponsorshipAddress?: string }
  ): Promise<TxResult> {
    const specificSponsor = params.specificSponsor
      ? new CairoOption(CairoOptionVariant.Some, params.specificSponsor)
      : new CairoOption(CairoOptionVariant.None);

    const call = this._contract(account, params.sponsorshipAddress).populate("create_offer", [
      params.nftContract,
      cairo.uint256(params.tokenId),
      cairo.uint256(params.minAmount),
      params.duration,
      params.paymentToken,
      params.licenseTermsUri,
      params.transferable,
      cairo.uint256(params.royaltyBps),
      specificSponsor,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async setOfferOpen(
    account: AccountInterface,
    params: { offerId: bigint | string; open: boolean; sponsorshipAddress?: string }
  ): Promise<TxResult> {
    const call = this._contract(account, params.sponsorshipAddress).populate("set_offer_open", [
      cairo.uint256(params.offerId),
      params.open,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async placeBid(
    account: AccountInterface,
    params: { offerId: bigint | string; amount: bigint | string; paymentToken: string; sponsorshipAddress?: string }
  ): Promise<TxResult> {
    const sponsorshipAddress = params.sponsorshipAddress ?? this.sponsorshipAddress;
    if (!sponsorshipAddress) {
      throw new Error("IP-Sponsorship address not configured for this chain");
    }
    const amount = cairo.uint256(params.amount);
    const approveCall = {
      contractAddress: params.paymentToken,
      entrypoint: "approve",
      calldata: [normalizeAddress("STARKNET", sponsorshipAddress), amount.low.toString(), amount.high.toString()],
    };
    const bidCall = this._contract(account, sponsorshipAddress).populate("place_bid", [
      cairo.uint256(params.offerId),
      amount,
    ]);
    const res = await account.execute([approveCall, bidCall]);
    return { txHash: res.transaction_hash };
  }

  async retractBid(
    account: AccountInterface,
    params: { offerId: bigint | string; sponsorshipAddress?: string }
  ): Promise<TxResult> {
    const call = this._contract(account, params.sponsorshipAddress).populate("retract_bid", [
      cairo.uint256(params.offerId),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async acceptBid(
    account: AccountInterface,
    params: { offerId: bigint | string; sponsor: string; sponsorshipAddress?: string }
  ): Promise<TxResult> {
    const call = this._contract(account, params.sponsorshipAddress).populate("accept_bid", [
      cairo.uint256(params.offerId),
      params.sponsor,
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async proposeSponsorship(
    account: AccountInterface,
    params: ProposeSponsorshipParams & { sponsorshipAddress?: string }
  ): Promise<TxResult> {
    const call = this._contract(account, params.sponsorshipAddress).populate("propose_sponsorship", [
      params.nftContract,
      cairo.uint256(params.tokenId),
      cairo.uint256(params.amount),
      params.duration,
      params.validUntil ?? 0,
      params.paymentToken,
      params.licenseTermsUri,
      params.transferable,
      cairo.uint256(params.royaltyBps),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async withdrawProposal(
    account: AccountInterface,
    params: { proposalId: bigint | string; sponsorshipAddress?: string }
  ): Promise<TxResult> {
    const call = this._contract(account, params.sponsorshipAddress).populate("withdraw_proposal", [
      cairo.uint256(params.proposalId),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async acceptProposal(
    account: AccountInterface,
    params: { proposalId: bigint | string; sponsorshipAddress?: string }
  ): Promise<TxResult> {
    const call = this._contract(account, params.sponsorshipAddress).populate("accept_proposal", [
      cairo.uint256(params.proposalId),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  async rejectProposal(
    account: AccountInterface,
    params: { proposalId: bigint | string; sponsorshipAddress?: string }
  ): Promise<TxResult> {
    const call = this._contract(account, params.sponsorshipAddress).populate("reject_proposal", [
      cairo.uint256(params.proposalId),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }
}
