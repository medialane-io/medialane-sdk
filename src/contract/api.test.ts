import { describe, expect, test } from "bun:test";
import { DEFAULT_BATCH_SIZE, MAX_RECIPIENTS, collectionProfileSchema, creatorProfileSchema, emissionSchema, ordersListQuery, provisioningRegisterSchema, submitReportSchema } from "./index.js";

const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) => (r.success ? [] : r.error!.issues.map((i) => i.message));

describe("ordersListQuery", () => {
  test("defaults", () => {
    expect(ordersListQuery.parse({})).toEqual({ sort: "recent", page: 1, limit: 20 });
  });

  test("numbers are read from strings and bounded", () => {
    expect(ordersListQuery.parse({ page: "2", limit: "50" })).toMatchObject({ page: 2, limit: 50 });
    expect(ordersListQuery.safeParse({ limit: "101" }).success).toBe(false);
    expect(ordersListQuery.safeParse({ page: "0" }).success).toBe(false);
  });

  test("a status or sort outside the lists is rejected", () => {
    expect(ordersListQuery.safeParse({ status: "OPEN" }).success).toBe(false);
    expect(ordersListQuery.safeParse({ sort: "cheapest" }).success).toBe(false);
  });

  test("minPrice cannot exceed maxPrice", () => {
    expect(messages(ordersListQuery.safeParse({ minPrice: "10", maxPrice: "5" }))).toContain("minPrice must be less than or equal to maxPrice");
    expect(ordersListQuery.safeParse({ minPrice: "5", maxPrice: "5" }).success).toBe(true);
  });
});

describe("profile schemas", () => {
  test("an empty url becomes null and a non-http url is rejected", () => {
    expect(collectionProfileSchema.parse({ websiteUrl: "  " }).websiteUrl).toBeNull();
    expect(collectionProfileSchema.parse({ websiteUrl: "https://example.test" }).websiteUrl).toBe("https://example.test");
    expect(messages(collectionProfileSchema.safeParse({ websiteUrl: "ftp://example.test" }))).toContain("URL must use http or https scheme");
  });

  test("the gated content title is capped at 100 characters", () => {
    expect(collectionProfileSchema.safeParse({ gatedContentTitle: "x".repeat(101) }).success).toBe(false);
  });

  test("a field the profile does not take is dropped", () => {
    expect(creatorProfileSchema.parse({ name: "Ana", username: "ana" })).toEqual({ name: "Ana" });
  });
});

describe("emissionSchema", () => {
  const base = { service: "mip-erc721", owner: "0x1", recipients: ["a@b.test"], collectionId: "1", tokenUri: "ipfs://x" };

  test("defaults the chain and batch size", () => {
    const parsed = emissionSchema.parse(base);
    expect([parsed.chain, parsed.batchSize]).toEqual(["STARKNET", DEFAULT_BATCH_SIZE]);
  });

  test("needs a collection and a token source", () => {
    expect(messages(emissionSchema.safeParse({ ...base, collectionId: undefined }))).toContain("collectionId or collectionContract is required");
    expect(messages(emissionSchema.safeParse({ ...base, tokenUri: undefined }))).toContain("tokenUri, or tokenId and amount, is required");
    expect(emissionSchema.safeParse({ ...base, tokenUri: undefined, tokenId: "1", amount: "1" }).success).toBe(true);
  });

  test("recipients are limited", () => {
    expect(emissionSchema.safeParse({ ...base, recipients: [] }).success).toBe(false);
    expect(emissionSchema.safeParse({ ...base, recipients: Array(MAX_RECIPIENTS + 1).fill("a@b.test") }).success).toBe(false);
  });
});

describe("provisioningRegisterSchema", () => {
  test("defaults the chain and needs an email", () => {
    expect(provisioningRegisterSchema.parse({ email: "a@b.test" })).toEqual({ chain: "STARKNET", email: "a@b.test" });
    expect(provisioningRegisterSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("submitReportSchema", () => {
  const base = { targetType: "TOKEN", targetKey: "TOKEN:0x1:1", categories: ["SPAM"] };

  test("accepts a report and needs a category from the list", () => {
    expect(submitReportSchema.safeParse(base).success).toBe(true);
    expect(messages(submitReportSchema.safeParse({ ...base, categories: [] }))).toContain("At least one category is required");
    expect(submitReportSchema.safeParse({ ...base, categories: ["RUDE"] }).success).toBe(false);
  });

  test("needs a target key", () => {
    expect(submitReportSchema.safeParse({ ...base, targetKey: "" }).success).toBe(false);
  });
});
