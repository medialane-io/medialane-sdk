import { describe, expect, test } from "bun:test";
import { CallData, hash, num, uint256, type Call } from "starknet";
import { getCoordinates } from "../chains.js";
import { getTokenBySymbol } from "../utils/token.js";
import { ownerConstructorCalldata } from "./media-wallet/account.js";
import { buildSetFirstGuardianCall } from "./media-wallet/guardian.js";
import { deploymentIsMediaWallet, isMediaWalletSetupCall, sameCalls, typedDataMatchesCalls } from "./sponsored-checks.js";

const CALL: Call = { contractAddress: "0x1", entrypoint: "approve", calldata: ["0x2", "0x3"] };
const outside = (c: Call) => ({ To: c.contractAddress, Selector: num.toHex(hash.getSelectorFromName(c.entrypoint)), Calldata: c.calldata });
const typedDataFor = (calls: Call[], extra: unknown[] = []) => ({ message: { Calls: [...calls.map(outside), ...extra] } });

describe("typedDataMatchesCalls", () => {
  test("typed data for exactly these calls matches", () => {
    expect(typedDataMatchesCalls(typedDataFor([CALL]), [CALL])).toBe(true);
  });

  test("a trailing empty fee call is allowed", () => {
    expect(typedDataMatchesCalls(typedDataFor([CALL], [{ To: "0x0", Selector: "0x0", Calldata: [] }]), [CALL])).toBe(true);
  });

  test("felts written differently still match", () => {
    const padded = { message: { Calls: [{ To: "0x0001", Selector: outside(CALL).Selector.toUpperCase().replace("0X", "0x"), Calldata: ["2", "0x03"] }] } };
    expect(typedDataMatchesCalls(padded, [CALL])).toBe(true);
  });

  test("another target, entrypoint, calldata or extra call does not match", () => {
    expect(typedDataMatchesCalls(typedDataFor([{ ...CALL, contractAddress: "0x9" }]), [CALL])).toBe(false);
    expect(typedDataMatchesCalls(typedDataFor([{ ...CALL, entrypoint: "transfer" }]), [CALL])).toBe(false);
    expect(typedDataMatchesCalls(typedDataFor([{ ...CALL, calldata: ["0x2", "0x4"] }]), [CALL])).toBe(false);
    expect(typedDataMatchesCalls(typedDataFor([CALL, CALL]), [CALL])).toBe(false);
  });

  test("typed data without calls does not match", () => {
    expect(typedDataMatchesCalls(null, [CALL])).toBe(false);
    expect(typedDataMatchesCalls({ message: {} }, [CALL])).toBe(false);
  });
});

describe("sameCalls", () => {
  test("the same calls written differently are the same", () => {
    expect(sameCalls([CALL], [{ contractAddress: "0x01", entrypoint: "approve", calldata: ["2", "3"] }])).toBe(true);
  });

  test("sameCalls rejects a different entrypoint, target or calldata length", () => {
    expect(sameCalls([CALL], [{ ...CALL, entrypoint: "transfer" }])).toBe(false);
    expect(sameCalls([CALL], [{ ...CALL, contractAddress: "0x2" }])).toBe(false);
    expect(sameCalls([CALL], [{ ...CALL, calldata: ["0x2"] }])).toBe(false);
    expect(sameCalls([CALL], [CALL, CALL])).toBe(false);
  });
});

const CH = getCoordinates("STARKNET").mediaWalletClassHash!;
const OWNER_PUBKEY = "0x02c1a3f0d5b7e9c8a4d6f2b1e3c5a7098d4f6b2e1c3a5079b8d6f4e2c1a30597";
const OWNER_CALLDATA = ownerConstructorCalldata(OWNER_PUBKEY).map((v) => num.toHex(v));
const OWNER = hash.calculateContractAddressFromHash("0x0", CH, OWNER_CALLDATA, 0);
const walletDeployment = (address = OWNER) => ({ address, class_hash: CH, salt: "0x0", calldata: OWNER_CALLDATA, version: 1 });

describe("deploymentIsMediaWallet", () => {
  test("accepts a Media Wallet deployment at the address its key produces", () => {
    expect(deploymentIsMediaWallet(walletDeployment(), OWNER, CH)).toBe(true);
  });

  test("refuses another class or another address", () => {
    expect(deploymentIsMediaWallet({ ...walletDeployment(), class_hash: "0x123" }, OWNER, CH)).toBe(false);
    expect(deploymentIsMediaWallet(walletDeployment("0x9"), OWNER, CH)).toBe(false);
    expect(deploymentIsMediaWallet(null, OWNER, CH)).toBe(false);
  });

  test("refuses an address that its salt and constructor data do not produce", () => {
    const other = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    expect(deploymentIsMediaWallet(walletDeployment(other), other, CH)).toBe(false);
    expect(deploymentIsMediaWallet({ address: OWNER, class_hash: CH }, OWNER, CH)).toBe(false);
  });
});

describe("isMediaWalletSetupCall", () => {
  const strk = getTokenBySymbol("STRK")!.address;
  const zeroTransfer: Call = { contractAddress: strk, entrypoint: "transfer", calldata: CallData.compile([OWNER, uint256.bnToUint256(0)]) as string[] };

  test("setting the wallet's first guardian is a setup call", () => {
    expect(isMediaWalletSetupCall(buildSetFirstGuardianCall(OWNER, "0x123"), OWNER)).toBe(true);
  });

  test("a zero STRK transfer to the wallet itself is a setup call", () => {
    expect(isMediaWalletSetupCall(zeroTransfer, OWNER)).toBe(true);
  });

  test("only the two setup shapes count as setup calls", () => {
    expect(isMediaWalletSetupCall(buildSetFirstGuardianCall("0x777", "0x123"), OWNER)).toBe(false);
    expect(isMediaWalletSetupCall({ ...buildSetFirstGuardianCall(OWNER, "0x123"), calldata: ["0x1", "0x5", "0x1", "0x0", "0x123"] }, OWNER)).toBe(false);
    expect(isMediaWalletSetupCall({ ...zeroTransfer, calldata: CallData.compile([OWNER, uint256.bnToUint256(1)]) as string[] }, OWNER)).toBe(false);
    expect(isMediaWalletSetupCall({ ...zeroTransfer, calldata: CallData.compile(["0x777", uint256.bnToUint256(0)]) as string[] }, OWNER)).toBe(false);
    expect(isMediaWalletSetupCall({ ...zeroTransfer, contractAddress: "0x999" }, OWNER)).toBe(false);
    expect(isMediaWalletSetupCall({ contractAddress: OWNER, entrypoint: "change_owners", calldata: [] }, OWNER)).toBe(false);
  });
});
