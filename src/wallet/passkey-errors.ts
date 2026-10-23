export class PasskeyCancelledError extends Error {
  constructor(message = "Passkey prompt was cancelled.") {
    super(message);
    this.name = "PasskeyCancelledError";
  }
}

export class DeviceKeyMissingError extends Error {
  constructor() {
    super("This browser no longer holds the wallet key. Recover the wallet with its recovery key.");
    this.name = "DeviceKeyMissingError";
  }
}

export type PasskeyUnsupportedReason = "no-webauthn" | "no-prf";

export class PasskeyUnsupportedError extends Error {
  readonly reason: PasskeyUnsupportedReason;
  constructor(reason: PasskeyUnsupportedReason) {
    super(
      reason === "no-webauthn"
        ? "Passkeys are not available in this environment."
        : "This passkey did not return a PRF secret, so it cannot seal a wallet key.",
    );
    this.name = "PasskeyUnsupportedError";
    this.reason = reason;
  }
}
