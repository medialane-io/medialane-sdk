import { shortString, type Call } from "starknet";
import type { BuildableIntentKind, BuiltIntent } from "./build.js";

type Message = Record<string, unknown>;

function toFelt(value: unknown): string {
  const text = String(value);
  if (text.startsWith("0x")) return text;
  try {
    return "0x" + BigInt(text).toString(16);
  } catch {
    return shortString.encodeShortString(text);
  }
}

function orderCalldata(message: Message): string[] {
  const offer = message.offer as Message;
  const consideration = message.consideration as Message;
  return [
    message.offerer,
    message.marketplace,
    offer.item_type,
    offer.token,
    offer.identifier_or_criteria,
    offer.amount,
    consideration.item_type,
    consideration.token,
    consideration.identifier_or_criteria,
    consideration.amount,
    consideration.recipient,
    message.royalty_max_bps,
    message.start_time,
    message.end_time,
    message.salt,
    message.counter,
  ].map(toFelt);
}

export function populateSignedCalls(kind: BuildableIntentKind, built: BuiltIntent, signature: string[]): Call[] {
  const message = (built.typedData as { message?: Message } | undefined)?.message;
  if (!message) throw new Error("This intent has no typed data to sign");
  const sig = signature.map(toFelt);
  const payload = kind === "cancel" ? [toFelt(message.order_hash), toFelt(message.offerer)] : orderCalldata(message);
  const calls = built.calls.map((call) => ({ ...call }));
  const last = calls[calls.length - 1]!;
  last.calldata = [...payload, sig.length.toString(), ...sig];
  return calls;
}
