import type { Transport } from "../transport.js";
import type { ApiMetadataSignedUrl, ApiMetadataUpload, ApiResponse } from "../../types/api.js";

export interface MetadataApi {
  signedUrl(kind?: "image" | "document" | "media"): Promise<ApiResponse<ApiMetadataSignedUrl>>;
  upload(metadata: Record<string, unknown>): Promise<ApiResponse<ApiMetadataUpload>>;
  uploadDirectory(files: { name: string; content: unknown }[]): Promise<{ cid: string; baseUri: string }>;
  resolve(uri: string): Promise<ApiResponse<unknown>>;
  uploadFile(file: File): Promise<ApiResponse<ApiMetadataUpload>>;
}

export function createMetadataApi(t: Transport): MetadataApi {
  return {
    signedUrl(kind) {
      return t.get("/v1/metadata/signed-url", { kind });
    },
    upload(metadata) {
      return t.post("/v1/metadata/upload", metadata);
    },
    async uploadDirectory(files) {
      return (await t.post<{ data: { cid: string; baseUri: string } }>("/v1/metadata/upload-directory", { files })).data;
    },
    resolve(uri) {
      return t.get("/v1/metadata/resolve", { uri });
    },
    uploadFile(file) {
      const formData = new FormData();
      formData.append("file", file);
      return t.request("/v1/metadata/upload-file", { method: "POST", body: formData });
    },
  };
}
