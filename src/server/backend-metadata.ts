export interface BackendMetadataConfig {
  backendUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
}

function endpoint(config: BackendMetadataConfig, path: string): string {
  return `${config.backendUrl.replace(/\/$/, "")}/v1/metadata/${path}`;
}

function headers(config: BackendMetadataConfig, extra?: Record<string, string>): Record<string, string> {
  return { "x-api-key": config.apiKey, ...extra };
}

export interface BackendUploadResult {
  cid: string;
  uri: string;
}

export async function uploadJsonToBackend(config: BackendMetadataConfig, json: unknown): Promise<BackendUploadResult> {
  const res = await (config.fetchImpl ?? fetch)(endpoint(config, "upload"), {
    method: "POST",
    headers: headers(config, { "Content-Type": "application/json" }),
    body: JSON.stringify(json),
  });
  const data = (await res.json().catch(() => ({}))) as { data?: { cid: string; url: string }; error?: string };
  if (!res.ok || !data.data) throw new Error(data.error ?? "Metadata upload failed");
  return { cid: data.data.cid, uri: data.data.url };
}

export async function uploadFileToBackend(config: BackendMetadataConfig, file: File): Promise<BackendUploadResult> {
  const form = new FormData();
  form.append("file", file, file.name);
  const res = await (config.fetchImpl ?? fetch)(endpoint(config, "upload-file"), {
    method: "POST",
    headers: headers(config),
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as { data?: { cid: string; url: string }; error?: string };
  if (!res.ok || !data.data) throw new Error(data.error ?? "File upload failed");
  return { cid: data.data.cid, uri: data.data.url };
}

export async function uploadDirectoryToBackend(
  config: BackendMetadataConfig,
  files: { name: string; content: unknown }[],
): Promise<{ cid: string; baseUri: string }> {
  const res = await (config.fetchImpl ?? fetch)(endpoint(config, "upload-directory"), {
    method: "POST",
    headers: headers(config, { "Content-Type": "application/json" }),
    body: JSON.stringify({ files }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    data?: { cid: string; baseUri: string };
    error?: string;
  };
  if (!res.ok || !data.data) throw new Error(data.error ?? "Directory pin failed");
  return data.data;
}

export async function getBackendSignedUrl(
  config: BackendMetadataConfig,
  kind: "image" | "document" | "media" = "image",
): Promise<string> {
  const res = await (config.fetchImpl ?? fetch)(`${endpoint(config, "signed-url")}?kind=${kind}`, {
    method: "GET",
    headers: headers(config),
  });
  const data = (await res.json().catch(() => ({}))) as { data?: { url: string }; error?: string };
  if (!res.ok || !data.data) throw new Error(data.error ?? "Failed to create upload URL");
  return data.data.url;
}
