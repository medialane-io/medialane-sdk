import { test, expect } from "bun:test";
import { buildDeployAccountParams } from "./deploy.js";
import { ownerConstructorCalldata, computeAccountAddress } from "./account.js";

const OWNER = "0x61cc05c5da6e9b1403a27ffa564498cd2b8cda1428b053b08dbbd1cceb744c6";

test("buildDeployAccountParams matches the account module's own calldata and address", () => {
  const params = buildDeployAccountParams(OWNER);
  expect(params.constructorCalldata).toEqual(ownerConstructorCalldata(OWNER));
  expect(params.contractAddress).toBe(computeAccountAddress(OWNER, 0));
  expect(params.addressSalt).toBe("0x0");
});

test("buildDeployAccountParams uses the MediaWallet class hash", () => {
  const params = buildDeployAccountParams(OWNER);
  expect(params.classHash).toBe(
    "0x014b210c7d47392691144bafecdca3c6c7791cc295ea305988da0a724c05ac31",
  );
});
