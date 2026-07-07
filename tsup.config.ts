import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", "starknet/index": "src/starknet/index.ts", "evm/index": "src/evm/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ["starknet", "viem"],
  outDir: "dist",
});
