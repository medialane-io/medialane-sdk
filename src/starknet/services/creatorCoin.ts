import { newContract } from "../marketplace/utils.js";
import { RpcProvider, hash, uint256, type AccountInterface, type Call, type Contract, type ProviderInterface } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { CreatorCoinFactoryABI } from "../abis/index.js";
import { getStarknetCoordinates } from "../../chains.js";
import { normalizeAddress } from "../../utils/address.js";
import type { TxResult } from "../../types/marketplace.js";
import { SUGGESTED_DEFAULT_PRICE, COIN_DECIMALS } from "./coinLaunchMath.js";

export interface CreateCreatorCoinParams {

  owner: string;
  name: string;
  symbol: string;

  initialSupply: bigint | string;

  salt?: bigint | string;
}

export interface EkuboPoolParams {
  fee: bigint | string;
  tickSpacing: bigint | string;
  startingPrice: { mag: bigint | string; sign: boolean };
  bound: bigint | string;
}

export interface EkuboLaunchParams {
  creatorCoin: string;

  quoteToken: string;

  initialHolders: string[];
  initialHoldersAmounts: (bigint | string)[];

  transferRestrictionDelay?: number;

  maxPercentageBuyLaunch?: number;

  ekubo: EkuboPoolParams;

  quoteFundAmount?: bigint | string;
}

export const VALIDATED_EKUBO_PARAMS: EkuboPoolParams = {
  fee: "0xc49ba5e353f7d00000000000000000",
  tickSpacing: 5982n,
  startingPrice: { mag: 4600158n, sign: true },
  bound: 88719042n,
};

const TICK_BASE = 1.000001;

export function priceToEkuboParams(
  quoteDecimals: number,
  price: number = SUGGESTED_DEFAULT_PRICE,
): EkuboPoolParams {
  const decAdj = 10 ** (COIN_DECIMALS - quoteDecimals);
  const rawRatio = price / decAdj;

  const tickSpacing = Number(VALIDATED_EKUBO_PARAMS.tickSpacing);
  const rawTick = Math.log(rawRatio) / Math.log(TICK_BASE);
  const roundedTick = Math.trunc(rawTick / tickSpacing) * tickSpacing;

  return {
    fee: VALIDATED_EKUBO_PARAMS.fee,
    tickSpacing: VALIDATED_EKUBO_PARAMS.tickSpacing,
    startingPrice: { mag: BigInt(Math.abs(roundedTick)), sign: roundedTick < 0 },
    bound: VALIDATED_EKUBO_PARAMS.bound,
  };
}

export function validatePrice(quoteDecimals: number, price: number): string | null {
  if (!isFinite(price) || price <= 0) return "Price must be a positive number";
  const decAdj = 10 ** (COIN_DECIMALS - quoteDecimals);
  const rawRatio = price / decAdj;
  if (!isFinite(rawRatio) || rawRatio <= 0) return "Price must be a positive number";
  const rawTick = Math.log(rawRatio) / Math.log(TICK_BASE);
  if (!isFinite(rawTick)) return "Price is outside the supported range";
  const bound = Number(VALIDATED_EKUBO_PARAMS.bound);
  if (Math.abs(rawTick) >= bound) return "Price is outside the supported range";
  return null;
}

export const MAX_TEAM_ALLOCATION_PERCENT = 10;

export const MAX_HOLDERS_AT_LAUNCH = 10;

export interface CreatorCoinGuarantees {
  isLaunched: boolean;

  launchedAtBlock: number | null;

  totalSupplyRaw: string;

  teamAllocationRaw: string;

  teamAllocationPercent: number | null;

  liquidityPositionId: string | null;
}

function u256(parts: string[], offset = 0): bigint {
  return BigInt(parts[offset] ?? "0x0") + (BigInt(parts[offset + 1] ?? "0x0") << 128n);
}

export async function getCreatorCoinGuarantees(
  coinAddress: string,
  provider: ProviderInterface,
): Promise<CreatorCoinGuarantees | null> {
  const call = (entrypoint: string) =>
    provider.callContract({ contractAddress: coinAddress, entrypoint, calldata: [] });

  const [launchedRes, allocRes] = await Promise.all([
    call("is_launched").catch(() => null),
    call("get_team_allocation").catch(() => null),
  ]);

  if (!launchedRes || !allocRes) return null;

  const [supplyRes, blockRes, liquidityRes] = await Promise.all([
    call("total_supply"),
    call("launched_at_block_number").catch(() => null),
    call("liquidity_type").catch(() => null),
  ]);

  const isLaunched = BigInt(launchedRes[0] ?? "0x0") !== 0n;
  const totalSupply = u256(supplyRes);
  const teamAllocation = u256(allocRes);

  const teamAllocationPercent =
    totalSupply > 0n ? Number((teamAllocation * 10_000n) / totalSupply) / 100 : null;

  const launchedAtBlock =
    isLaunched && blockRes?.[0] != null ? Number(BigInt(blockRes[0])) : null;

  const liquidityPositionId =
    liquidityRes && BigInt(liquidityRes[0] ?? "0x1") === 0n && liquidityRes[2] != null
      ? BigInt(liquidityRes[2]).toString()
      : null;

  return {
    isLaunched,
    launchedAtBlock,
    totalSupplyRaw: totalSupply.toString(),
    teamAllocationRaw: teamAllocation.toString(),
    teamAllocationPercent,
    liquidityPositionId,
  };
}

let _factoryContract: Contract | null = null;
function factoryContract(): Contract {
  if (!_factoryContract) {
    _factoryContract = newContract(
      CreatorCoinFactoryABI as any,
      getStarknetCoordinates("STARKNET").creatorCoinFactory!,
    );
  }
  return _factoryContract;
}

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

export function buildLaunchOnEkuboCalls(params: EkuboLaunchParams): Call[] {
  const ek = params.ekubo;

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

export interface CreatorCoinReceiptLike {
  events?: Array<{ from_address?: string; keys?: string[]; data?: string[] }>;
}

const CREATOR_COIN_CREATED_SELECTOR = hash.getSelectorFromName("CreatorCoinCreated");

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
    return normalizeAddress("STARKNET",data[data.length - 1]);
  }
  throw new Error("Coin deployed but the coin address could not be read from the receipt");
}

export class CreatorCoinService {
  private readonly factoryAddress: string;
  private readonly config: ResolvedConfig;

  constructor(config: ResolvedConfig) {
    this.factoryAddress = getStarknetCoordinates(config.chain).creatorCoinFactory!;
    this.config = config;
  }

  private _factory(account: AccountInterface) {
    return newContract(CreatorCoinFactoryABI as any, this.factoryAddress, account as any);
  }

  async createCreatorCoin(
    account: AccountInterface,
    params: CreateCreatorCoinParams
  ): Promise<TxResult> {
    const res = await account.execute([buildCreateCreatorCoinCall(params)]);
    return { txHash: res.transaction_hash };
  }

  async launchOnEkubo(account: AccountInterface, params: EkuboLaunchParams): Promise<TxResult> {
    const res = await account.execute(buildLaunchOnEkuboCalls(params));
    return { txHash: res.transaction_hash };
  }

  async isCreatorCoin(address: string, account: AccountInterface): Promise<boolean> {
    const r = await this._factory(account).is_creator_coin(address);
    return BigInt(r as any) === 1n;
  }

  async getGuarantees(coinAddress: string): Promise<CreatorCoinGuarantees | null> {
    return getCreatorCoinGuarantees(coinAddress, new RpcProvider({ nodeUrl: this.config.rpcUrl }));
  }
}
