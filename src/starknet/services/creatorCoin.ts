import { Contract, RpcProvider, hash, uint256, type AccountInterface, type Call, type ProviderInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { CreatorCoinFactoryABI } from "../abis/index.js";
import { getStarknetCoordinates } from "../../chains.js";
import { getTokenByAddress } from "../../utils/token.js";
import { normalizeAddress } from "../../utils/address.js";
import type { TxResult } from "../../types/marketplace.js";

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

/** A Creator Coin's live spot price, read from its Ekubo pool. */
export interface CreatorCoinPrice {
  /** Quote tokens per 1 coin, human units (e.g. 0.0101 = 0.0101 STRK/coin). */
  quotePerCoin: number;
  /** The quote token the coin is paired against on Ekubo. */
  quoteToken: string;
  quoteSymbol: string | null;
  quoteDecimals: number;
}

const COIN_DECIMALS = 18; // CreatorCoin is always 18 decimals

/**
 * Read a Creator Coin's live spot price directly from its Ekubo pool (read-only).
 *
 * Self-contained: discovers the pool params (quote token, fee, tick spacing) from the
 * coin's own `launched_with_liquidity_parameters`, reads `Core.get_pool_price`, and
 * converts the `sqrt_ratio` to quote-per-coin (handling token0/1 ordering + decimals).
 * Returns `null` if the coin isn't launched on Ekubo. No backend, no swap-quote
 * dependency — works for day-one coins that AVNU doesn't index yet.
 */
export async function getCreatorCoinPrice(
  coinAddress: string,
  provider: ProviderInterface,
): Promise<CreatorCoinPrice | null> {
  // Option<LiquidityParameters::Ekubo({ ekubo_pool_parameters:{fee,tick_spacing,
  //   starting_price(mag,sign),bound}, quote_address })>
  // felts: [opt(0=Some), variant(0=Ekubo), fee, tick_spacing, sp_mag, sp_sign, bound, quote]
  const r = await provider.callContract({
    contractAddress: coinAddress,
    entrypoint: "launched_with_liquidity_parameters",
    calldata: [],
  });
  if (BigInt(r[0]) !== 0n || BigInt(r[1]) !== 0n) return null; // not launched, or not Ekubo
  const fee = r[2];
  const tickSpacing = r[3];
  // Zero-pad to 64 hex so it matches SUPPORTED_TOKENS (the RPC returns it unpadded).
  const quoteToken = normalizeAddress("STARKNET","0x" + BigInt(r[7]).toString(16));
  const token = getTokenByAddress(quoteToken);
  const quoteDecimals = token?.decimals ?? 18;

  const ci = BigInt(coinAddress);
  const qi = BigInt(quoteToken);
  const [t0, t1] = ci < qi ? [coinAddress, quoteToken] : [quoteToken, coinAddress];
  const quoteIsToken0 = qi === BigInt(t0);

  // Core.get_pool_price(PoolKey{token0,token1,fee,tick_spacing,extension}) -> PoolPrice{sqrt_ratio:u256, tick:i129}
  const pp = await provider.callContract({
    contractAddress: getStarknetCoordinates("STARKNET").ekuboCore!,
    entrypoint: "get_pool_price",
    calldata: [t0, t1, fee, tickSpacing, "0x0"],
  });
  const sqrt = BigInt(pp[0]) + (BigInt(pp[1] ?? "0x0") << 128n);
  // price(token1/token0) = (sqrt_ratio / 2^128)^2, raw units; coin is 18 decimals.
  const priceT1perT0 = (Number(sqrt) / 2 ** 128) ** 2;
  const decAdj = 10 ** (COIN_DECIMALS - quoteDecimals);
  const quotePerCoin = (quoteIsToken0 ? 1 / priceT1perT0 : priceT1perT0) * decAdj;

  return { quotePerCoin, quoteToken, quoteSymbol: token?.symbol ?? null, quoteDecimals };
}

// ── Account-free call builders ───────────────────────────────────────────────
// Apps that execute through their own pipeline (io's ChipiPay atomic chokepoint,
// paymaster flows) need the calls, not an executor. The service methods below
// build on these — one calldata source for every app.

// Lazy — constructing at module scope breaks the "no side effects at import
// time" convention and crashes CJS-interop consumers whose ABI barrel hasn't
// evaluated yet (dapp webpack build, 2026-06-10).
let _factoryContract: Contract | null = null;
function factoryContract(): Contract {
  if (!_factoryContract) {
    _factoryContract = new Contract(
      CreatorCoinFactoryABI as any,
      getStarknetCoordinates("STARKNET").creatorCoinFactory!,
    );
  }
  return _factoryContract;
}

/** Build the `create_creator_coin` call (full supply minted to the Factory). */
export function buildCreateCreatorCoinCall(params: CreateCreatorCoinParams): Call {
  const salt = params.salt ?? BigInt("0x" + Date.now().toString(16));
  return factoryContract().populate("create_creator_coin", [
    params.owner,
    params.name,
    params.symbol,
    BigInt(params.initialSupply),
    BigInt(salt),
  ]);
}

/**
 * Build the Ekubo launch multicall: optional quote `transfer` (pre-funds the
 * Factory for the team-allocation buyback) + `launch_on_ekubo`.
 */
export function buildLaunchOnEkuboCalls(params: EkuboLaunchParams): Call[] {
  const ek = params.ekubo ?? VALIDATED_EKUBO_PARAMS;

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
      calldata: [getStarknetCoordinates("STARKNET").creatorCoinFactory!, amt.low, amt.high],
    });
  }
  calls.push(factoryContract().populate("launch_on_ekubo", [launchParameters, ekuboParameters]));
  return calls;
}

/** Minimal receipt shape — works with any starknet.js receipt version. */
export interface CreatorCoinReceiptLike {
  events?: Array<{ from_address?: string; keys?: string[]; data?: string[] }>;
}

const CREATOR_COIN_CREATED_SELECTOR = hash.getSelectorFromName("CreatorCoinCreated");

/**
 * Pull the deployed coin address from a `create_creator_coin` tx receipt.
 * Event data = [owner, name, symbol, supply_low, supply_high, coin_address].
 * Throws when the receipt carries no matching Factory event.
 */
export function parseCreatorCoinCreated(receipt: CreatorCoinReceiptLike): string {
  const factory = normalizeAddress("STARKNET",getStarknetCoordinates("STARKNET").creatorCoinFactory!);
  for (const ev of receipt?.events ?? []) {
    let from: string;
    try {
      from = normalizeAddress("STARKNET",ev.from_address ?? "");
    } catch {
      continue;
    }
    if (from !== factory) continue;
    const k0 = ev.keys?.[0];
    if (!k0 || normalizeAddress("STARKNET",k0) !== normalizeAddress("STARKNET",CREATOR_COIN_CREATED_SELECTOR)) continue;
    const data = ev.data ?? [];
    if (data.length < 1) continue;
    return normalizeAddress("STARKNET",data[data.length - 1]); // coin_address is last
  }
  throw new Error("Coin deployed but the coin address could not be read from the receipt");
}

/**
 * On-chain Creator Coin interactions (Ekubo-only launchpad).
 * Faithful fork of unruggable.meme — permanent LP lock + team-allocation buyback.
 */
export class CreatorCoinService {
  private readonly factoryAddress: string;
  private readonly config: ResolvedConfig;

  constructor(config: ResolvedConfig) {
    this.factoryAddress = getStarknetCoordinates(config.chain).creatorCoinFactory!;
    this.config = config;
  }

  private _factory(account: AccountInterface) {
    return new Contract(CreatorCoinFactoryABI as any, this.factoryAddress, account as any);
  }

  /** Deploy a fixed-supply CreatorCoin (full supply minted to the Factory). */
  async createCreatorCoin(
    account: AccountInterface,
    params: CreateCreatorCoinParams
  ): Promise<TxResult> {
    const res = await account.execute([buildCreateCreatorCoinCall(params)]);
    return { txHash: res.transaction_hash };
  }

  /**
   * Launch a coin on Ekubo (owner-only). Optionally pre-funds the Factory with
   * quote (for the buyback) in the same multicall. Liquidity is permanently
   * locked in the EkuboLauncher.
   */
  async launchOnEkubo(account: AccountInterface, params: EkuboLaunchParams): Promise<TxResult> {
    const res = await account.execute(buildLaunchOnEkuboCalls(params));
    return { txHash: res.transaction_hash };
  }

  /** View: is this address a Factory-deployed Creator Coin? */
  async isCreatorCoin(address: string, account: AccountInterface): Promise<boolean> {
    const r = await this._factory(account).is_creator_coin(address);
    return BigInt(r as any) === 1n;
  }

  /** Read a coin's live Ekubo spot price (quote-per-coin) via the configured RPC.
   *  Read-only; returns null if the coin isn't launched on Ekubo. */
  async getPrice(coinAddress: string): Promise<CreatorCoinPrice | null> {
    return getCreatorCoinPrice(coinAddress, new RpcProvider({ nodeUrl: this.config.rpcUrl }));
  }
}
