import type { IntentsApi } from "../../api/domains/intents.js";
import type { IntentKind } from "../../contract/intents.js";
import { ACTION_PROBLEM, MedialaneApiError, UserFacingError } from "../../errors.js";
import type { ApiCheckoutIntentResult, ApiIntentCreated, CreateCheckoutIntentParams, IntentParamsByKind } from "../../types/api.js";
import { generateSalt } from "../marketplace/utils.js";
import { buildIntent, canBuildIntent, resolveIntentInputs, type BuildableIntentKind, type BuiltIntent } from "./build.js";
import { ORDER_START_DELAY_SECONDS } from "./orders.js";
import { createIntentReaders, type IntentReaderSources } from "./readers.js";

export interface LocalBuild {
  kind: BuildableIntentKind;
  built: BuiltIntent;
}

export type CreatedIntent = ApiIntentCreated & { local?: LocalBuild };

export interface IntentCreationSources extends IntentReaderSources {
  intents: Pick<IntentsApi, "create">;
}

export interface CheckoutCreationSources extends IntentReaderSources {
  intents: Pick<IntentsApi, "checkout">;
}

function toWire(built: BuiltIntent) {
  return {
    calls: built.calls.map((call) => ({
      contractAddress: call.contractAddress,
      entrypoint: call.entrypoint,
      calldata: ((call.calldata ?? []) as unknown[]).map(String),
    })),
    ...(built.typedData ? { typedData: built.typedData as unknown as Record<string, unknown> } : {}),
  };
}

const TIMED_KINDS: ReadonlySet<BuildableIntentKind> = new Set(["listing", "offer", "counter-offer"]);

function withTiming(kind: BuildableIntentKind, params: Record<string, unknown>): Record<string, unknown> {
  if (!TIMED_KINDS.has(kind)) return params;
  return {
    ...params,
    salt: params.salt ?? generateSalt(),
    startTime: params.startTime ?? Math.floor(Date.now() / 1000) + ORDER_START_DELAY_SECONDS,
  };
}

export async function createIntent<K extends IntentKind>(
  sources: IntentCreationSources,
  kind: K,
  params: IntentParamsByKind[K],
): Promise<CreatedIntent> {
  if (!canBuildIntent(kind)) return sources.intents.create(kind, params);

  const timed = withTiming(kind, params as Record<string, unknown>);
  const inputs = await resolveIntentInputs(kind, timed, createIntentReaders(sources));
  const built = buildIntent(kind, timed, inputs, sources.config);

  const created: ApiIntentCreated = await sources.intents
    .create(kind, { ...timed, built: toWire(built) } as IntentParamsByKind[K])
    .catch(mismatchAsActionProblem);

  const local = { kind, built };
  return created.requiresSignature
    ? { ...created, typedData: built.typedData, local }
    : { ...created, calls: built.calls as typeof created.calls, local };
}

function mismatchAsActionProblem(err: unknown): never {
  if (err instanceof MedialaneApiError && err.serverCode === "intent_mismatch") throw new UserFacingError(ACTION_PROBLEM);
  throw err;
}

export async function createCheckout(
  sources: CheckoutCreationSources,
  params: CreateCheckoutIntentParams,
): Promise<ApiCheckoutIntentResult[]> {
  const readers = createIntentReaders(sources);
  const items = await Promise.all(
    (params.items ?? []).map(async (item) => {
      const fulfill = { fulfiller: params.fulfiller, orderHash: item.orderHash, quantity: item.quantity };
      const built = buildIntent("fulfill", fulfill, await resolveIntentInputs("fulfill", fulfill, readers), sources.config);
      return { item: { ...item, built: toWire(built) }, built };
    }),
  );
  const builtByHash = new Map(items.map(({ item, built }) => [item.orderHash, built]));
  const results = await sources.intents
    .checkout({ ...params, items: items.map(({ item }) => item) })
    .catch(mismatchAsActionProblem);
  return results.map((result) => {
    const built = builtByHash.get(result.orderHash);
    return result.id && built ? { ...result, calls: built.calls } : result;
  });
}
