import { CairoOption, CairoOptionVariant, Contract, cairo, type AccountInterface } from "starknet";
import type { ResolvedConfig } from "../config.js";
import { normalizeAddress } from "../utils/address.js";
import { IPSponsorshipABI, IPGenesisABI } from "../abis/index.js";
import { getCoordinates } from "../chains.js";
import type { CreateSponsorshipOfferParams } from "../types/services.js";
import type { TxResult } from "../types/marketplace.js";

export type { CreateSponsorshipOfferParams };

export class SponsorshipService {
  private readonly sponsorshipAddress?: string;
  private readonly licenseReceiptAddress?: string;

  constructor(config: ResolvedConfig) {
    this.sponsorshipAddress = getCoordinates(config.chain).ipSponsorship;
    this.licenseReceiptAddress = getCoordinates(config.chain).ipSponsorshipLicense;
  }

  private _sponsorship(account: AccountInterface, address?: string) {
    const resolved = address ?? this.sponsorshipAddress;
    if (!resolved) {
      throw new Error("IP-Sponsorship address not configured for this chain");
    }
    return new Contract(IPSponsorshipABI as any, normalizeAddress("STARKNET", resolved), account as any);
  }

  /** The offer author must currently own (nftContract, tokenId) — enforced on-chain at create and accept. */
  async createOffer(
    account: AccountInterface,
    params: CreateSponsorshipOfferParams & { sponsorshipAddress?: string }
  ): Promise<TxResult> {
    const specificSponsor = params.specificSponsor
      ? new CairoOption(CairoOptionVariant.Some, params.specificSponsor)
      : new CairoOption(CairoOptionVariant.None);

    const call = this._sponsorship(account, params.sponsorshipAddress).populate("create_offer", [
      params.nftContract,
      cairo.uint256(params.tokenId),
      cairo.uint256(params.minAmount),
      params.duration,
      params.paymentToken,
      params.licenseTermsUri,
      params.transferable,
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
    const call = this._sponsorship(account, params.sponsorshipAddress).populate("set_offer_open", [
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
    const bidCall = this._sponsorship(account, sponsorshipAddress).populate("place_bid", [
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
    const call = this._sponsorship(account, params.sponsorshipAddress).populate("retract_bid", [
      cairo.uint256(params.offerId),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /**
   * Author-only. Settles the sponsor's payment (allowance pull, no escrow) and
   * mints a non-authoritative receipt NFT to the sponsor via the dedicated
   * sponsorship-license IPGenesis instance — never the genesis-mint instance.
   * `is_license_valid()` on IPSponsorship remains the sole authority for
   * gating/perks; the receipt is a wallet-visible courtesy only.
   */
  async acceptBid(
    account: AccountInterface,
    params: {
      offerId: bigint | string;
      sponsor: string;
      licenseTermsUri: string;
      sponsorshipAddress?: string;
      licenseReceiptAddress?: string;
    }
  ): Promise<TxResult> {
    const receiptAddress = params.licenseReceiptAddress ?? this.licenseReceiptAddress;
    if (!receiptAddress) {
      throw new Error("IP-Sponsorship-License receipt address not configured for this chain");
    }
    const acceptCall = this._sponsorship(account, params.sponsorshipAddress).populate("accept_bid", [
      cairo.uint256(params.offerId),
      params.sponsor,
    ]);
    const receipt = new Contract(IPGenesisABI as any, normalizeAddress("STARKNET", receiptAddress), account as any);
    const mintCall = receipt.populate("mint_item", [params.sponsor, params.licenseTermsUri]);
    const res = await account.execute([acceptCall, mintCall]);
    return { txHash: res.transaction_hash };
  }

  /**
   * Best-effort — bundles a receipt-NFT transfer alongside `transfer_license`
   * when both `licenseReceiptAddress` and `receiptTokenId` are supplied.
   * IPSponsorship's own license ownership stays authoritative regardless of
   * whether the receipt NFT is kept in sync.
   */
  async transferLicense(
    account: AccountInterface,
    params: {
      licenseId: bigint | string;
      to: string;
      sponsorshipAddress?: string;
      licenseReceiptAddress?: string;
      receiptTokenId?: bigint | string;
    }
  ): Promise<TxResult> {
    const calls = [
      this._sponsorship(account, params.sponsorshipAddress).populate("transfer_license", [
        cairo.uint256(params.licenseId),
        params.to,
      ]),
    ];
    const receiptAddress = params.licenseReceiptAddress ?? this.licenseReceiptAddress;
    if (receiptAddress && params.receiptTokenId != null) {
      const receipt = new Contract(IPGenesisABI as any, normalizeAddress("STARKNET", receiptAddress), account as any);
      calls.push(receipt.populate("transfer_from", [account.address, params.to, cairo.uint256(params.receiptTokenId)]));
    }
    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }
}
