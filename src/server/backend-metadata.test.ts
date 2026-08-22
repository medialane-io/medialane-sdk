import { test, expect } from "bun:test";
import {
  uploadJsonToBackend,
  uploadFileToBackend,
  uploadDirectoryToBackend,
  getBackendSignedUrl,
} from "./backend-metadata.js";

function config(res: () => Response) {
  const seen: { url?: string; init?: RequestInit } = {};
  return {
    seen,
    config: {
      backendUrl: "https://api.test/",
      apiKey: "k",
      fetchImpl: (async (url: string, init?: RequestInit) => {
        seen.url = String(url);
        seen.init = init;
        return res();
      }) as unknown as typeof fetch,
    },
  };
}

const ok = (data: unknown) => () => new Response(JSON.stringify({ data }), { status: 200 });
const fail = (error: string) => () => new Response(JSON.stringify({ error }), { status: 400 });

test("uploads json to the metadata endpoint with the api key", async () => {
  const { seen, config: c } = config(ok({ cid: "bafy", url: "ipfs://bafy" }));
  const out = await uploadJsonToBackend(c, { name: "x" });
  expect(seen.url).toBe("https://api.test/v1/metadata/upload");
  expect(new Headers(seen.init!.headers).get("x-api-key")).toBe("k");
  expect(out).toEqual({ cid: "bafy", uri: "ipfs://bafy" });
});

test("trims a trailing slash from the backend url", async () => {
  const { seen, config: c } = config(ok({ cid: "b", url: "u" }));
  await uploadJsonToBackend(c, {});
  expect(seen.url).not.toContain("//v1");
});

test("surfaces the backend error message rather than a generic one", async () => {
  const { config: c } = config(fail("quota exceeded"));
  await expect(uploadJsonToBackend(c, {})).rejects.toThrow("quota exceeded");
});

test("uploads a file as multipart without forcing a content type", async () => {
  const { seen, config: c } = config(ok({ cid: "b", url: "u" }));
  await uploadFileToBackend(c, new File(["x"], "a.png", { type: "image/png" }));
  expect(seen.url).toBe("https://api.test/v1/metadata/upload-file");
  expect(new Headers(seen.init!.headers).get("content-type")).toBeNull();
});

test("pins a directory and returns the base uri", async () => {
  const { seen, config: c } = config(ok({ cid: "bafydir", baseUri: "ipfs://bafydir" }));
  const out = await uploadDirectoryToBackend(c, [{ name: "1.json", content: {} }]);
  expect(seen.url).toBe("https://api.test/v1/metadata/upload-directory");
  expect(out).toEqual({ cid: "bafydir", baseUri: "ipfs://bafydir" });
});

test("requests a signed url for the given kind", async () => {
  const { seen, config: c } = config(ok({ url: "https://upload.test/signed" }));
  const url = await getBackendSignedUrl(c, "media");
  expect(seen.url).toBe("https://api.test/v1/metadata/signed-url?kind=media");
  expect(url).toBe("https://upload.test/signed");
});

test("defaults the signed-url kind to image", async () => {
  const { seen, config: c } = config(ok({ url: "u" }));
  await getBackendSignedUrl(c);
  expect(seen.url).toContain("kind=image");
});
