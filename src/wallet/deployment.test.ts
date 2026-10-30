import { test, expect } from "bun:test";
import type { ProviderInterface } from "starknet";
import { completeDeployment, deploySponsored, isAccountRefusal, SponsoredDeployError, type DeploymentDeps } from "./deployment.js";
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
  let pending: SealedOwner | null = null;

  const deps: DeploymentDeps = {
    store: {
      load: () => SEALED,
      save: (sealed) => {
        log.push("saved");
        saved.push(sealed);
      },
      loadPending: () => pending,
      savePending: (sealed) => {
        log.push("pending-saved");
        pending = sealed;
      },
      clearPending: () => {
        log.push("pending-cleared");
        pending = null;
      },
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
    isDeployedImpl: async () => false,
    waitUntilDeployedImpl: async () => {
      log.push("waited");
    },
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

  return {
    deps,
    log,
    setPending: (sealed: SealedOwner | null) => void (pending = sealed),
    counts: () => ({ unlocks, creates, saved: saved.length, announced }),
  };
}

test("an existing wallet unlocks once and setup ends when it is deployed", async () => {
  const { deps, log, counts } = setup({ deployProxyUrl: "/api/wallet/deploy-sponsored" });
  const steps: string[] = [];
  const result = await completeDeployment(deps, (step) => steps.push(step));

  expect(result).toEqual({ sealed: SEALED });
  expect(steps).toEqual(["deploying"]);
  expect(log).toEqual(["sponsored", "waited"]);
  expect(counts()).toEqual({ unlocks: 1, creates: 0, saved: 0, announced: 1 });
});

test("a first wallet is created and saved before it is deployed", async () => {
  const { deps, counts } = setup({
    deployProxyUrl: "/api/wallet/deploy-sponsored",
    store: { load: () => null, save: () => {}, loadPending: () => null, savePending: () => {}, clearPending: () => {}, notifyChange: () => {} },
  });
  const steps: string[] = [];
  await completeDeployment(deps, (step) => steps.push(step));

  expect(steps).toEqual(["creating-passkey", "deploying"]);
  expect(counts().creates).toBe(1);
  expect(counts().unlocks).toBe(0);
});

test("replacing a wallet ignores the one already stored", async () => {
  const { deps, counts } = setup({ deployProxyUrl: "/api/wallet/deploy-sponsored" });
  await completeDeployment(deps, () => {}, { replace: true });
  expect(counts().creates).toBe(1);
  expect(counts().unlocks).toBe(0);
});

const NEW_WALLET: SealedOwner = { ...SEALED, credentialId: "cred2", address: "0xaaa", ownerPubKey: "0xbbb" };
const OLD_DEPLOYED = async (_provider: unknown, address: string) => address === SEALED.address;

test("a replacement is held as pending and only becomes the device's wallet once it is deployed", async () => {
  const { deps, log } = setup({
    deployProxyUrl: "/api/wallet/deploy-sponsored",
    passkey: {
      createOwnerKey: async () => ({ sealed: NEW_WALLET, privateKeyHex: PRIVATE_KEY }),
      unlockOwnerKey: async () => PRIVATE_KEY,
    },
    isDeployedImpl: OLD_DEPLOYED,
  });
  const result = await completeDeployment(deps, () => {}, { replace: true });
  expect(result).toEqual({ sealed: NEW_WALLET });
  expect(log).toEqual(["pending-saved", "sponsored", "waited", "saved", "pending-cleared"]);
});

test("a replacement that fails leaves the stored wallet and keeps the new key pending", async () => {
  const { deps, log, counts } = setup(
    {
      deployProxyUrl: "/api/wallet/deploy-sponsored",
      passkey: {
        createOwnerKey: async () => ({ sealed: NEW_WALLET, privateKeyHex: PRIVATE_KEY }),
        unlockOwnerKey: async () => PRIVATE_KEY,
      },
      isDeployedImpl: OLD_DEPLOYED,
    },
    { sponsored: async () => { throw new Error("sponsor down"); } },
  );
  await expect(completeDeployment(deps, () => {}, { replace: true })).rejects.toThrow("sponsor down");
  expect(log).toEqual(["pending-saved", "sponsored"]);
  expect(counts().saved).toBe(0);
});

test("a replacement is never paid for by the user, because only the sponsored deploy tells the account", async () => {
  const { deps, log } = setup(
    {
      deployProxyUrl: "/api/wallet/deploy-sponsored",
      passkey: {
        createOwnerKey: async () => ({ sealed: NEW_WALLET, privateKeyHex: PRIVATE_KEY }),
        unlockOwnerKey: async () => PRIVATE_KEY,
      },
      isDeployedImpl: OLD_DEPLOYED,
    },
    { sponsored: async () => { throw new Error("sponsor down"); } },
  );
  await expect(completeDeployment(deps, () => {}, { replace: true })).rejects.toThrow("sponsor down");
  expect(log).not.toContain("self-funded");
});

test("setup resumes an unfinished replacement instead of creating another wallet", async () => {
  const { deps, log, counts, setPending } = setup({
    deployProxyUrl: "/api/wallet/deploy-sponsored",
    isDeployedImpl: OLD_DEPLOYED,
  });
  setPending(NEW_WALLET);
  const result = await completeDeployment(deps, () => {});
  expect(result).toEqual({ sealed: NEW_WALLET });
  expect(counts().creates).toBe(0);
  expect(counts().unlocks).toBe(1);
  expect(log).toEqual(["sponsored", "waited", "saved", "pending-cleared"]);
});

test("a pending key for a wallet that is already deployed is not a replacement", async () => {
  const { deps, counts, setPending } = setup({
    deployProxyUrl: "/api/wallet/deploy-sponsored",
    isDeployedImpl: async () => true,
  });
  setPending(NEW_WALLET);
  await completeDeployment(deps, () => {});
  expect(counts().creates).toBe(1);
});

test("the sponsor is told whether this is a replacement", async () => {
  const asked: Array<boolean | undefined> = [];
  const { deps } = setup({
    deployProxyUrl: "/api/wallet/deploy-sponsored",
    isDeployedImpl: OLD_DEPLOYED,
    deploySponsoredImpl: async (input) => {
      asked.push(input.replace);
      return { transactionHash: "0x1" };
    },
  });
  await completeDeployment(deps, () => {});
  await completeDeployment(deps, () => {}, { replace: true });
  expect(asked).toEqual([false, true]);
});

test("an account that refuses the wallet is not retried with the user's own funds", async () => {
  for (const status of [401, 409]) {
    const { deps, log } = setup(
      { deployProxyUrl: "/api/wallet/deploy-sponsored" },
      { sponsored: async () => { throw new SponsoredDeployError("Your account is already set up.", status, "already_set_up"); } },
    );
    await expect(completeDeployment(deps, () => {})).rejects.toThrow("Your account is already set up.");
    expect(log).toEqual(["sponsored"]);
  }
});

test("the sponsored deploy sends the replace request and reports a refusal with its status and code", async () => {
  const bodies: unknown[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    if (String(url).endsWith("/build")) {
      return Response.json({
        typedData: {
          types: {
            StarknetDomain: [
              { name: "name", type: "shortstring" },
              { name: "version", type: "shortstring" },
              { name: "chainId", type: "shortstring" },
              { name: "revision", type: "shortstring" },
            ],
            Message: [{ name: "value", type: "felt" }],
          },
          primaryType: "Message",
          domain: { name: "test", version: "1", chainId: "SN_MAIN", revision: "1" },
          message: { value: "1" },
        },
        deployment: {},
        calls: [],
      });
    }
    bodies.push(JSON.parse(String(init?.body)));
    return Response.json({ error: "Your account is already set up.", code: "already_set_up" }, { status: 409 });
  }) as unknown as typeof fetch;
  const failure = await deploySponsored({
    proxyUrl: "/p",
    provider: {} as ProviderInterface,
    ownerAddress: SEALED.address,
    ownerPubKey: SEALED.ownerPubKey,
    privateKeyHex: PRIVATE_KEY,
    replace: true,
    fetchImpl,
  }).catch((e) => e);
  expect(failure).toBeInstanceOf(SponsoredDeployError);
  expect(failure).toMatchObject({ status: 409, code: "already_set_up", message: "Your account is already set up." });
  expect(bodies[0]).toMatchObject({ replace: true });
});

test("an app with no deploy proxy pays for its own deployment", async () => {
  const { deps, log } = setup();
  await completeDeployment(deps, () => {});
  expect(log).toEqual(["self-funded", "waited"]);
});

test("a sponsor that cannot deploy falls back to the user paying, once", async () => {
  const { deps, log } = setup(
    { deployProxyUrl: "/api/wallet/deploy-sponsored" },
    { sponsored: async () => { throw new Error("sponsor down"); } },
  );
  const result = await completeDeployment(deps, () => {});
  expect(log).toEqual(["sponsored", "self-funded", "waited"]);
  expect(result).toEqual({ sealed: SEALED });
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

test("setup waits until the wallet is really on chain", async () => {
  const seen: string[] = [];
  const { deps } = setup({
    deployProxyUrl: "/api/wallet/deploy-sponsored",
    waitUntilDeployedImpl: async (_provider, address) => {
      seen.push(address);
    },
  });
  await completeDeployment(deps, () => {});
  expect(seen).toEqual([SEALED.address]);
});

test("a wallet that never appears fails with a message worth showing", async () => {
  const { deps } = setup({
    deployProxyUrl: "/api/wallet/deploy-sponsored",
    waitUntilDeployedImpl: async () => {
      throw new Error("Your wallet was submitted but has not appeared on Starknet yet. Please try again in a moment.");
    },
  });
  await expect(completeDeployment(deps, () => {})).rejects.toThrow(/has not appeared on Starknet/);
});

test("a stored wallet already on chain is not reused: a new wallet is created and deployed", async () => {
  const { deps, log, counts } = setup({
    deployProxyUrl: "/api/wallet/deploy-sponsored",
    isDeployedImpl: async () => true,
  });
  const steps: string[] = [];
  await completeDeployment(deps, (step) => steps.push(step));
  expect(steps).toEqual(["creating-passkey", "deploying"]);
  expect(log).toEqual(["saved", "sponsored", "waited"]);
  expect(counts()).toEqual({ unlocks: 0, creates: 1, saved: 1, announced: 1 });
});

test("a failed on-chain check keeps the stored wallet", async () => {
  const { deps, log } = setup({
    deployProxyUrl: "/api/wallet/deploy-sponsored",
    isDeployedImpl: async () => {
      throw new Error("rpc down");
    },
  });
  await completeDeployment(deps, () => {});
  expect(log).toEqual(["sponsored", "waited"]);
});

test("only a sign-in or already-set-up answer from the account counts as a refusal", () => {
  expect(isAccountRefusal(new SponsoredDeployError("x", 401))).toBe(true);
  expect(isAccountRefusal(new SponsoredDeployError("x", 409))).toBe(true);
  expect(isAccountRefusal(new SponsoredDeployError("x", 503))).toBe(false);
  expect(isAccountRefusal(new Error("x"))).toBe(false);
});
