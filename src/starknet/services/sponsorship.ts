import { newContract } from "../marketplace/utils.js";
import { CairoOption, CairoOptionVariant, RpcProvider, cairo, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { normalizeAddress } from "../../utils/address.js";
import { IPSponsorshipABI } from "../abis/index.js";
import { getStarknetCoordinates } from "../../chains.js";
import type { CreateSponsorshipOfferParams, ProposeSponsorshipParams } from "../../types/services.js";
import type { TxResult } from "../../types/marketplace.js";

export type { CreateSponsorshipOfferParams, ProposeSponsorshipParams };

export interface SponsorshipOfferRecord {
  author: string;
  nftContract: string;
  tokenId: bigint;
  minAmount: bigint;
  duration: number;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;
  specificSponsor: string | null;
  open: boolean;
  royaltyBps: bigint;
}

export interface SponsorshipProposalRecord {
  proposer: string;
  nftContract: string;
  tokenId: bigint;
  amount: bigint;
  duration: number;
  /** Unix seconds; 0 = no deadline. */
  validUntil: number;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;
  open: boolean;
  royaltyBps: bigint;
}

/**
 * IP Sponsorship v3 — one contract is both the offer/bid/proposal registry
 * AND the issued license collection (a standard ERC-721; embeds
 * ERC721Component directly, no separate receipt contract, no `set_minter`
 * bootstrap). `transferable`/expiry are declarative terms only — never
 * contract-enforced against a transfer — carried in `license_terms_uri`
 * metadata and the `LicenseMinted` event; the indexer, not this contract,
 * derives validity. A license moves through the standard ERC-721
 * `transfer_from`/`safe_transfer_from` on this same contract address, so
 * there is no bespoke transfer wrapper here.
 */
export class SponsorshipService {
  private readonly sponsorshipAddress?: string;
  private readonly config: ResolvedConfig;

  constructor(config: ResolvedConfig) {
    this.config = config;
    this.sponsorshipAddress = getStarknetCoordinates(config.chain).ipSponsorship;
  }

  private _contract(account: AccountInterface, address?: string) {
    const resolved = address ?? this.sponsorshipAddress;
    if (!resolved) {
      throw new Error("IP-Sponsorship address not configured for this chain");
    }
    return newContract(IPSponsorshipABI as any, normalizeAddress("STARKNET", resolved), account as any);
  }

  private _contractRead(address?: string) {
    const resolved = address ?? this.sponsorshipAddress;
    if (!resolved) {
      throw new Error("IP-Sponsorship address not configured for this chain");
    }
    const provider = new RpcProvider({ nodeUrl: this.config.rpcUrl });
    return newContract(IPSponsorshipABI as any, normalizeAddress("STARKNET", resolved), provider);
  }

  // ── Offers (owner-initiated) ───────────────────────────────────────────────

  /** The offer author must currently own (nftContract, tokenId) — enforced on-chain at create and accept. */
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

  /** Reversible — gates new bids/acceptance only. */
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

  /** A bid is a signal plus an open ERC-20 allowance — no tokens move until accepted. Prepends the approve. */
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

  /**
   * Author-only. Re-verifies IP ownership, settles the sponsor's payment
   * (allowance pull, no escrow), and mints the license — a real ERC-721 on
   * this same contract — to the sponsor, all atomically in one call.
   */
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

  // ── Proposals (sponsor-initiated) ──────────────────────────────────────────
  // The symmetric counterpart to offers/bids: a sponsor proposes fixed terms
  // on an asset with no open offer yet; only the asset's current owner may
  // accept or reject. Unlike an offer, the SPONSOR chooses `paymentToken` here
  // — an accepting owner's UI should surface only recognized tokens, since a
  // bad-faith ERC-20 could return `true` on `transfer_from` without moving funds.

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

  /** Proposer-only. Advisory against an acceptance in flight in the same block. */
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

  /**
   * Asset-owner-only (re-verified on-chain — a proposal binds to the asset,
   * not a person: whoever owns it at acceptance time is paid and issues the
   * license). Settles payment and mints the license atomically, same as
   * `acceptBid`.
   */
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

  /** Asset-owner-only. */
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

  // ── Reads ───────────────────────────────────────────────────────────────────

  async getOffer(params: { offerId: bigint | string; sponsorshipAddress?: string }): Promise<SponsorshipOfferRecord> {
    const o = await this._contractRead(params.sponsorshipAddress).call("get_offer", [
      cairo.uint256(params.offerId),
    ]) as any;
    return {
      author: o.author as string,
      nftContract: o.nft_contract as string,
      tokenId: BigInt(o.token_id),
      minAmount: BigInt(o.min_amount),
      duration: Number(o.duration),
      paymentToken: o.payment_token as string,
      licenseTermsUri: o.license_terms_uri as string,
      transferable: Boolean(o.transferable),
      specificSponsor: o.specific_sponsor?.variant === "Some"
        ? (o.specific_sponsor.values?.[0] ?? o.specific_sponsor.value)
        : null,
      open: Boolean(o.open),
      royaltyBps: BigInt(o.royalty_bps),
    };
  }

  async getBid(params: { offerId: bigint | string; sponsor: string; sponsorshipAddress?: string }): Promise<bigint> {
    const result = await this._contractRead(params.sponsorshipAddress).call("get_bid", [
      cairo.uint256(params.offerId),
      params.sponsor,
    ]);
    return BigInt(result as any);
  }

  async getProposal(params: { proposalId: bigint | string; sponsorshipAddress?: string }): Promise<SponsorshipProposalRecord> {
    const p = await this._contractRead(params.sponsorshipAddress).call("get_proposal", [
      cairo.uint256(params.proposalId),
    ]) as any;
    return {
      proposer: p.proposer as string,
      nftContract: p.nft_contract as string,
      tokenId: BigInt(p.token_id),
      amount: BigInt(p.amount),
      duration: Number(p.duration),
      validUntil: Number(p.valid_until),
      paymentToken: p.payment_token as string,
      licenseTermsUri: p.license_terms_uri as string,
      transferable: Boolean(p.transferable),
      open: Boolean(p.open),
      royaltyBps: BigInt(p.royalty_bps),
    };
  }

  async getLastOfferId(params?: { sponsorshipAddress?: string }): Promise<bigint> {
    const result = await this._contractRead(params?.sponsorshipAddress).call("get_last_offer_id", []);
    return BigInt(result as any);
  }

  async getLastProposalId(params?: { sponsorshipAddress?: string }): Promise<bigint> {
    const result = await this._contractRead(params?.sponsorshipAddress).call("get_last_proposal_id", []);
    return BigInt(result as any);
  }

  async getLastLicenseId(params?: { sponsorshipAddress?: string }): Promise<bigint> {
    const result = await this._contractRead(params?.sponsorshipAddress).call("get_last_license_id", []);
    return BigInt(result as any);
  }

  /** EIP-2981 — royalty recipient (the license's issuing author) and amount owed on a resale at `salePrice`. */
  async royaltyInfo(params: {
    licenseId: bigint | string;
    salePrice: bigint | string;
    sponsorshipAddress?: string;
  }): Promise<{ recipient: string; amount: bigint }> {
    const [recipient, amount] = await this._contractRead(params.sponsorshipAddress).call("royalty_info", [
      cairo.uint256(params.licenseId),
      cairo.uint256(params.salePrice),
    ]) as any;
    return { recipient: recipient as string, amount: BigInt(amount) };
  }
}
