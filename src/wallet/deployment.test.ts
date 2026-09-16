import { test, expect } from "bun:test";
import type { ProviderInterface } from "starknet";
import { completeDeployment, type DeploymentDeps } from "./deployment.js";
import type { ExecutedTransaction, SealedOwner } from "./types.js";

const SEALED: SealedOwner = {
  credentialId: "cred1",
  ownerPubKey: "0x677874f055a89ae0c0bc8cfba7ca10828ec9b3a6757ce9d926d6446ebe91668",
  address: "0x6958ce9523a63b831c5d3a691059affe47dfaab5124a9d7bf10f80a080b8cf",
  iv: "iv1",
  ciphertext: "ct1",
};
const PRIVATE_KEY = "0x012b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b";

function setup(
  overrides: Partial<DeploymentDeps> = {},
  behaviour: { sponsored?: () => Promise<ExecutedTransaction>; selfFunded?: () => Promise<ExecutedTransaction> } = {},
) {
  const log: string[] = [];
  let unlocks = 0;
  let creates = 0;
  const saved: SealedOwner[] = [];
  let announced = 0;

  const deps: DeploymentDeps = {
    store: {
      load: () => SEALED,
      save: (sealed) => void saved.push(sealed),
      notifyChange: () => void (announced += 1),
    },
    passkey: {
      createOwnerKey: async () => {
        creates += 1;
        return { sealed: SEALED, privateKeyHex: PRIVATE_KEY };
      },
      unlockOwnerKey: async () => {
        unlocks += 1;
        return PRIVATE_KEY;
      },
    },
    provider: () => ({}) as ProviderInterface,
    backendUrl: "/api/proxy",
    requestSiwsTokenImpl: async () => "siws-token",
    deploySponsoredImpl: async () => {
      log.push("sponsored");
      return (behaviour.sponsored ? behaviour.sponsored() : Promise.resolve({ transactionHash: "0xsponsored" }));
    },
    deploySelfFundedImpl: async () => {
      log.push("self-funded");
      return (behaviour.selfFunded ? behaviour.selfFunded() : Promise.resolve({ transactionHash: "0xselffunded" }));
    },
    ...overrides,
  };

  return { deps, log, counts: () => ({ unlocks, creates, saved: saved.length, announced }) };
}

test("an existing wallet unlocks once, and that key covers deploy and sign-in", async () => {
  const { deps, log, counts } = setup({ deployProxyUrl: "/api/wallet/deploy-sponsored" });
  const steps: string[] = [];
  const result = await completeDeployment(deps, (step) => steps.push(step));

  expect(result.siwsToken).toBe("siws-token");
  expect(steps).toEqual(["deploying", "signing-in"]);
  expect(log).toEqual(["sponsored"]);
  expect(counts()).toEqual({ unlocks: 1, creates: 0, saved: 0, announced: 1 });
});

test("a first wallet is created and saved before it is deployed", async () => {
  const { deps, counts } = setup({
    deployProxyUrl: "/api/wallet/deploy-sponsored",
    store: { load: () => null, save: () => {}, notifyChange: () => {} },
  });
  const steps: string[] = [];
  await completeDeployment(deps, (step) => steps.push(step));

  expect(steps).toEqual(["creating-passkey", "deploying", "signing-in"]);
  expect(counts().creates).toBe(1);
  expect(counts().unlocks).toBe(0);
});

test("forcing a new wallet ignores the one already stored", async () => {
  const { deps, counts } = setup({ deployProxyUrl: "/api/wallet/deploy-sponsored" });
  await completeDeployment(deps, () => {}, { forceNew: true });
  expect(counts().creates).toBe(1);
  expect(counts().unlocks).toBe(0);
});

test("an app with no deploy proxy pays for its own deployment", async () => {
  const { deps, log } = setup();
  await completeDeployment(deps, () => {});
  expect(log).toEqual(["self-funded"]);
});

test("a sponsor that cannot deploy falls back to the user paying, once", async () => {
  const { deps, log } = setup(
    { deployProxyUrl: "/api/wallet/deploy-sponsored" },
    { sponsored: async () => { throw new Error("sponsor down"); } },
  );
  const result = await completeDeployment(deps, () => {});
  expect(log).toEqual(["sponsored", "self-funded"]);
  expect(result.siwsToken).toBe("siws-token");
});

test("when both deploys fail, neither failure is hidden", async () => {
  const { deps } = setup(
    { deployProxyUrl: "/api/wallet/deploy-sponsored" },
    {
      sponsored: async () => { throw new Error("sponsor down"); },
      selfFunded: async () => { throw new Error("no funds"); },
    },
  );
  await expect(completeDeployment(deps, () => {})).rejects.toThrow(/sponsor down.*no funds/);
});
