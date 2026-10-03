import { test, expect } from "bun:test";
import { createDeploymentCoordinator, type DeploymentResult, type DeploymentStep } from "./deployment.js";

const RESULT = { sealed: {}, siwsToken: "siws-token" } as unknown as DeploymentResult;

function deferredRun() {
  let runs = 0;
  let finish!: (result: DeploymentResult) => void;
  let fail!: (err: Error) => void;
  let emit!: (step: DeploymentStep) => void;
  const execute = (onStep: (step: DeploymentStep) => void) => {
    runs += 1;
    emit = onStep;
    return new Promise<DeploymentResult>((resolve, reject) => {
      finish = resolve;
      fail = reject;
    });
  };
  return { execute, runs: () => runs, finish: (r = RESULT) => finish(r), fail: (e: Error) => fail(e), emit: (s: DeploymentStep) => emit(s) };
}

test("a second call while one is running joins it instead of starting another", async () => {
  const d = deferredRun();
  const coordinator = createDeploymentCoordinator(d.execute);
  const first = coordinator.run(() => {});
  const second = coordinator.run(() => {});
  d.finish();
  expect(await first).toBe(RESULT);
  expect(await second).toBe(RESULT);
  expect(d.runs()).toBe(1);
});

test("a joining caller hears the current step at once and every step after", async () => {
  const d = deferredRun();
  const coordinator = createDeploymentCoordinator(d.execute);
  const first: string[] = [];
  const second: string[] = [];
  const pending = coordinator.run((s) => first.push(s));
  d.emit("deploying");
  const joined = coordinator.run((s) => second.push(s));
  d.emit("signing-in");
  d.finish();
  await Promise.all([pending, joined]);
  expect(first).toEqual(["deploying", "signing-in"]);
  expect(second).toEqual(["deploying", "signing-in"]);
});

test("it reports deploying only while a run is in flight", async () => {
  const d = deferredRun();
  const coordinator = createDeploymentCoordinator(d.execute);
  expect(coordinator.isDeploying()).toBe(false);
  const pending = coordinator.run(() => {});
  expect(coordinator.isDeploying()).toBe(true);
  d.finish();
  await pending;
  expect(coordinator.isDeploying()).toBe(false);
});

test("after a failure the next call starts fresh", async () => {
  const d = deferredRun();
  const coordinator = createDeploymentCoordinator(d.execute);
  const failed = coordinator.run(() => {});
  d.fail(new Error("boom"));
  await expect(failed).rejects.toThrow("boom");
  expect(coordinator.isDeploying()).toBe(false);
  const retry = coordinator.run(() => {});
  d.finish();
  await retry;
  expect(d.runs()).toBe(2);
});

test("forcing a new wallet while one is being set up is refused", async () => {
  const d = deferredRun();
  const coordinator = createDeploymentCoordinator(d.execute);
  const pending = coordinator.run(() => {});
  await expect(coordinator.run(() => {}, { forceNew: true })).rejects.toThrow("already in progress");
  d.finish();
  await pending;
  expect(d.runs()).toBe(1);
});
