import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", "starknet/index": "src/starknet/index.ts", "evm/index": "src/evm/index.ts", "solana/index": "src/solana/index.ts", "stellar/index": "src/stellar/index.ts", "contract/index": "src/contract/index.ts", "server/index": "src/server/index.ts", "wallet/index": "src/wallet/public.ts" },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  external: ["starknet", "viem", "@solana/web3.js", "@stellar/stellar-sdk"],
  outDir: "dist",
});
