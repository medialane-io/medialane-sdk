import { test, expect } from "bun:test";
import { buildDeployWalletCall } from "./deploy-wallet.js";

const OWNER = "0x61cc05c5da6e9b1403a27ffa564498cd2b8cda1428b053b08dbbd1cceb744c6";

test("buildDeployWalletCall targets factory.deploy_wallet(owner, salt)", () => {
  const call = buildDeployWalletCall("0xfac", OWNER, 0);
  expect(call.contractAddress).toBe("0xfac");
  expect(call.entrypoint).toBe("deploy_wallet");
  expect((call.calldata as string[])[0]).toBe(BigInt(OWNER).toString());
  expect((call.calldata as string[])[1]).toBe("0");
});

test("buildDeployWalletCall defaults salt to 0", () => {
  const call = buildDeployWalletCall("0xfac", OWNER);
  expect((call.calldata as string[])[1]).toBe("0");
});
