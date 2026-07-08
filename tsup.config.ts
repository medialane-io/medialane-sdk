import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", "starknet/index": "src/starknet/index.ts", "evm/index": "src/evm/index.ts", "solana/index": "src/solana/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ["starknet", "viem", "@solana/web3.js"],
  outDir: "dist",
});
