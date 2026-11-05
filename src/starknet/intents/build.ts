import type { Call, TypedData } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import type { IntentKind } from "../../contract/intents.js";
import type { ApiOrder } from "../../types/api.js";

export interface BuiltIntent {
  calls: Call[];
  typedData?: TypedData;
}

export interface IntentReaders {
  counterOf(marketplace: string, offerer: string): Promise<string>;
  royaltyCapOf(nftContract: string, tokenId: string): Promise<string>;
  orderOf(orderHash: string): Promise<ApiOrder | null>;
}

export interface IntentDefinition<P = unknown, I = unknown> {
  inputs(params: P, readers: IntentReaders): Promise<I>;
  build(params: P, inputs: I, config: ResolvedConfig): BuiltIntent;
}

export class UnknownIntentKindError extends Error {
  constructor(kind: string) {
    super(`No builder for the ${kind} intent`);
    this.name = "UnknownIntentKindError";
  }
}

const DEFINITIONS: Partial<Record<IntentKind, IntentDefinition<never, never>>> = {};

function definitionOf(kind: IntentKind): IntentDefinition<unknown, unknown> {
  const definition = DEFINITIONS[kind];
  if (!definition) throw new UnknownIntentKindError(kind);
  return definition as IntentDefinition<unknown, unknown>;
}

export function canBuildIntent(kind: IntentKind): boolean {
  return DEFINITIONS[kind] !== undefined;
}

export function resolveIntentInputs(kind: IntentKind, params: unknown, readers: IntentReaders): Promise<unknown> {
  try {
    return definitionOf(kind).inputs(params, readers);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function buildIntent(kind: IntentKind, params: unknown, inputs: unknown, config: ResolvedConfig): BuiltIntent {
  return definitionOf(kind).build(params, inputs, config);
}
