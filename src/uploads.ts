export type UploadKind = "image" | "document" | "media";

export interface UploadLimit {
  mimeTypes: readonly string[];
}

const MB = 1024 * 1024;

export const MAX_UPLOAD_BYTES = 90 * MB;

export const UPLOAD_LIMITS: Record<UploadKind, UploadLimit> = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp"],
  },
  document: {
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.oasis.opendocument.text",
      "application/rtf",
      "text/plain",
      "text/markdown",
      "application/octet-stream",
    ],
  },
  media: {
    mimeTypes: [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif",
      "video/mp4", "video/webm", "video/ogg",
      "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/flac",
      "application/pdf",
    ],
  },
};

export function formatFileSize(bytes: number): string {
  const mb = bytes / MB;
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
}

export function uploadSizeError(file: { size: number }, kind: UploadKind = "image"): string | null {
  if (file.size <= MAX_UPLOAD_BYTES) return null;
  const noun = kind === "image" ? "image" : "file";
  return `That ${noun} is ${formatFileSize(file.size)}. Please choose one under ${formatFileSize(MAX_UPLOAD_BYTES)}.`;
}
