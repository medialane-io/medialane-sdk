import type { IntentsApi } from "../../api/domains/intents.js";
import type { IntentKind } from "../../contract/intents.js";
import { ACTION_PROBLEM, MedialaneApiError, UserFacingError } from "../../errors.js";
import type { ApiIntentCreated, IntentParamsByKind } from "../../types/api.js";
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

  let created: ApiIntentCreated;
  try {
    created = await sources.intents.create(kind, { ...timed, built } as IntentParamsByKind[K]);
  } catch (err) {
    if (err instanceof MedialaneApiError && err.serverCode === "intent_mismatch") {
      throw new UserFacingError(ACTION_PROBLEM);
    }
    throw err;
  }

  const local = { kind, built };
  return created.requiresSignature
    ? { ...created, typedData: built.typedData, local }
    : { ...created, calls: built.calls as typeof created.calls, local };
}
