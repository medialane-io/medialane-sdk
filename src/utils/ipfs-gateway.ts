const CID_PATH_PATTERN = /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[a-z2-7]{58,})(\/[\w.\-/]*)?$/;

export function isValidIpfsCidPath(cidPath: string): boolean {
  if (!CID_PATH_PATTERN.test(cidPath)) return false;
  if (cidPath.split("/").includes("..")) return false;
  return true;
}

export const IPFS_SAFE_CONTENT_TYPE_PREFIXES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml",
  "video/", "audio/", "model/", "font/", "application/json", "application/octet-stream",
] as const;

export function resolveSafeImageContentType(contentType: string): string {
  return IPFS_SAFE_CONTENT_TYPE_PREFIXES.some((p) => contentType.startsWith(p))
    ? contentType
    : "application/octet-stream";
}

export const MAX_IPFS_GATEWAY_RESPONSE_BYTES = 25 * 1024 * 1024;
