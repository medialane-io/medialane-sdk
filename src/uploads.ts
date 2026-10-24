export type UploadKind = "image" | "document" | "media";

const MB = 1024 * 1024;

export const MAX_UPLOAD_BYTES = 90 * MB;

export function formatFileSize(bytes: number): string {
  const mb = bytes / MB;
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
}

export function uploadSizeError(file: { size: number }, kind: UploadKind = "image"): string | null {
  if (file.size <= MAX_UPLOAD_BYTES) return null;
  const noun = kind === "image" ? "image" : "file";
  return `That ${noun} is ${formatFileSize(file.size)}. Please choose one under ${formatFileSize(MAX_UPLOAD_BYTES)}.`;
}
