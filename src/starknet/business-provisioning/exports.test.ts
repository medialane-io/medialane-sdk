import { test, expect } from "bun:test";

test("business provisioning primitives are exported from the starknet subpath barrel", async () => {
  const mod = await import("../index.js");
  expect(typeof mod.deriveOwnerKeyPair).toBe("function");
  expect(typeof mod.computeAccountAddress).toBe("function");
  expect(typeof mod.ownerConstructorCalldata).toBe("function");
  expect(typeof mod.computeOwnerGuid).toBe("function");
  expect(typeof mod.buildChangeOwnersCall).toBe("function");
  expect(typeof mod.buildDeployAccountParams).toBe("function");
});
