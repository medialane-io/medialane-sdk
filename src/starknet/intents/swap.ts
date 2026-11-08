import type { Call } from "starknet";
import { getCoordinates } from "../../chains.js";
import { sameFelt } from "../../utils/felt.js";

export interface SwapRequest {
  taker: string;
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmountRaw?: string;
  buyAmountRaw?: string;
}

const calldataOf = (call: Call): string[] => ((call.calldata ?? []) as unknown[]).map(String);
const u256At = (calldata: string[], index: number): bigint => BigInt(calldata[index]!) + (BigInt(calldata[index + 1]!) << 128n);

export function swapCallsWithinBounds(request: SwapRequest, calls: readonly Call[]): boolean {
  try {
    const exchange = getCoordinates("STARKNET").swapExchange;
    const [approve, swap, reset, ...extra] = calls;
    if (!approve || !swap || extra.length > 0) return false;

    const approvesExchange = (call: Call) =>
      sameFelt(call.contractAddress, request.sellTokenAddress) &&
      call.entrypoint === "approve" &&
      calldataOf(call).length === 3 &&
      sameFelt(calldataOf(call)[0], exchange);
    if (!approvesExchange(approve)) return false;
    if (reset && !(approvesExchange(reset) && u256At(calldataOf(reset), 1) === 0n)) return false;

    const args = calldataOf(swap);
    if (!sameFelt(swap.contractAddress, exchange)) return false;
    if (!sameFelt(args[0], request.sellTokenAddress) || !sameFelt(args[8], request.taker)) return false;
    if (!sameFelt(args[9], 0) || !sameFelt(args[10], 0)) return false;
    const allowance = u256At(calldataOf(approve), 1);

    if (request.sellAmountRaw) {
      const sold = u256At(args, 1);
      return (
        swap.entrypoint === "multi_route_swap" &&
        sameFelt(args[3], request.buyTokenAddress) &&
        sold === BigInt(request.sellAmountRaw) &&
        allowance === sold
      );
    }
    if (!request.buyAmountRaw) return false;
    const maxSold = u256At(args, 3);
    return (
      swap.entrypoint === "swap_exact_token_to" &&
      sameFelt(args[5], request.buyTokenAddress) &&
      u256At(args, 6) === BigInt(request.buyAmountRaw) &&
      u256At(args, 1) <= maxSold &&
      allowance === maxSold
    );
  } catch {
    return false;
  }
}
