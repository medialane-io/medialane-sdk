import { Contract, uint256, type AccountInterface, type Call } from "starknet";
import type { ResolvedConfig } from "../config.js";
import { CreatorCoinFactoryABI } from "../abis/index.js";
import { CREATOR_COIN_FACTORY_CONTRACT_MAINNET } from "../constants.js";
import type { TxResult } from "../types/marketplace.js";

export interface CreateCreatorCoinParams {
  /** Owner of the new coin — the only address allowed to launch it. */
  owner: string;
  name: string;
  symbol: string;
  /** Full fixed supply (raw, 18 decimals). Minted to the Factory until launch. */
  initialSupply: bigint | string;
  /** Deterministic deploy salt. Defaults to a timestamp-derived value. */
  salt?: bigint | string;
}

/** Ekubo pool params (off-chain tick). The `startingPrice` is an Ekubo i129 tick. */
export interface EkuboPoolParams {
  fee: bigint | string;
  tickSpacing: bigint | string;
  startingPrice: { mag: bigint | string; sign: boolean };
  bound: bigint | string;
}

export interface EkuboLaunchParams {
  creatorCoin: string;
  /** Quote token (e.g. STRK). Must NOT itself be a Creator Coin. */
  quoteToken: string;
  /** Team-allocation recipients (≤10% of supply, summed). */
  initialHolders: string[];
  initialHoldersAmounts: (bigint | string)[];
  /** Anti-snipe window in seconds. 0 = none. */
  transferRestrictionDelay?: number;
  /** Max % of supply buyable per tx during the window, in bps (≥50 = 0.5%). */
  maxPercentageBuyLaunch?: number;
  /** Ekubo pool params. Defaults to {@link VALIDATED_EKUBO_PARAMS} (0.01 quote/coin). */
  ekubo?: EkuboPoolParams;
  /**
   * Quote (raw units) to transfer to the Factory in the same multicall, used to
   * buy the team allocation back out of the pool. Must cover
   * `sum(initialHoldersAmounts) × price` (leftover is returned to the caller).
   * If omitted, the Factory must already hold enough quote.
   */
  quoteFundAmount?: bigint | string;
}

/**
 * Smoke-validated Ekubo params (mainnet 2026-06-04): 0.01 quote/coin for an
 * 18-decimal quote. `sign: true` yields 0.01 quote/coin regardless of token0/1
 * ordering — the launcher compensates internally.
 *
 * TODO: a `priceToEkuboParams(price, quoteDecimals, tickSpacing)` helper (port of
 * unrug's `ekubo/helpers.cairo` tick math) so callers can pick an arbitrary price.
 */
export const VALIDATED_EKUBO_PARAMS: EkuboPoolParams = {
  fee: "0xc49ba5e353f7d00000000000000000",
  tickSpacing: 5982n,
  startingPrice: { mag: 4600158n, sign: true },
  bound: 88719042n,
};

/**
 * On-chain Creator Coin interactions (Ekubo-only launchpad).
 * Faithful fork of unruggable.meme — permanent LP lock + team-allocation buyback.
 */
export class CreatorCoinService {
  private readonly factoryAddress: string;

  // config is accepted for signature parity with the other services (none needed
  // today — launch is zero-fee and views take an account).
  constructor(_config: ResolvedConfig) {
    this.factoryAddress = CREATOR_COIN_FACTORY_CONTRACT_MAINNET;
  }

  private _factory(account: AccountInterface) {
    return new Contract(CreatorCoinFactoryABI as any, this.factoryAddress, account as any);
  }

  /** Deploy a fixed-supply CreatorCoin (full supply minted to the Factory). */
  async createCreatorCoin(
    account: AccountInterface,
    params: CreateCreatorCoinParams
  ): Promise<TxResult> {
    const salt = params.salt ?? BigInt("0x" + Date.now().toString(16));
    const call = this._factory(account).populate("create_creator_coin", [
      params.owner,
      params.name,
      params.symbol,
      BigInt(params.initialSupply),
      BigInt(salt),
    ]);
    const res = await account.execute([call]);
    return { txHash: res.transaction_hash };
  }

  /**
   * Launch a coin on Ekubo (owner-only). Optionally pre-funds the Factory with
   * quote (for the buyback) in the same multicall. Liquidity is permanently
   * locked in the EkuboLauncher.
   */
  async launchOnEkubo(account: AccountInterface, params: EkuboLaunchParams): Promise<TxResult> {
    const ek = params.ekubo ?? VALIDATED_EKUBO_PARAMS;
    const factory = this._factory(account);

    const launchParameters = {
      creator_coin_address: params.creatorCoin,
      transfer_restriction_delay: params.transferRestrictionDelay ?? 0,
      max_percentage_buy_launch: params.maxPercentageBuyLaunch ?? 200,
      quote_address: params.quoteToken,
      initial_holders: params.initialHolders,
      initial_holders_amounts: params.initialHoldersAmounts.map((a) => BigInt(a)),
    };
    const ekuboParameters = {
      fee: BigInt(ek.fee),
      tick_spacing: BigInt(ek.tickSpacing),
      starting_price: { mag: BigInt(ek.startingPrice.mag), sign: ek.startingPrice.sign },
      bound: BigInt(ek.bound),
    };

    const calls: Call[] = [];
    if (params.quoteFundAmount !== undefined) {
      const amt = uint256.bnToUint256(BigInt(params.quoteFundAmount));
      calls.push({
        contractAddress: params.quoteToken,
        entrypoint: "transfer",
        calldata: [this.factoryAddress, amt.low, amt.high],
      });
    }
    calls.push(factory.populate("launch_on_ekubo", [launchParameters, ekuboParameters]));

    const res = await account.execute(calls);
    return { txHash: res.transaction_hash };
  }

  /** View: is this address a Factory-deployed Creator Coin? */
  async isCreatorCoin(address: string, account: AccountInterface): Promise<boolean> {
    const r = await this._factory(account).is_creator_coin(address);
    return BigInt(r as any) === 1n;
  }
}
