import type { TypedData, Call } from "starknet";
import type { VenueSigner } from "../adapters/types.js";

export type StarknetVenueSigner = VenueSigner<TypedData, Call>;
