import type { ProviderInterface } from "starknet";

export async function erc20Balance(
  provider: Pick<ProviderInterface, "callContract">,
  token: string,
  holder: string,
): Promise<bigint> {
  const read = (entrypoint: string) => provider.callContract({ contractAddress: token, entrypoint, calldata: [holder] }, "latest");
  const [low = "0x0", high = "0x0"] = await read("balanceOf").catch(() => read("balance_of"));
  return BigInt(low) + (BigInt(high) << 128n);
}
