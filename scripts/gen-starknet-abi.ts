import { readFileSync, writeFileSync } from "node:fs";

const [source, exportName, out] = process.argv.slice(2);
if (!source || !exportName || !out) {
  console.error("usage: bun scripts/gen-starknet-abi.ts <contract_class.json> <ExportName> <out.ts>");
  process.exit(1);
}
const contractClass = JSON.parse(readFileSync(source, "utf8"));
const abi = typeof contractClass.abi === "string" ? JSON.parse(contractClass.abi) : contractClass.abi;
writeFileSync(
  out,
  `export const ${exportName} = ${JSON.stringify(abi, null, 2)} as const;\n`,
);
