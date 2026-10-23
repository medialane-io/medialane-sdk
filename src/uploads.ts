export type UploadKind = "image" | "document" | "media";

export interface UploadLimit {
  mimeTypes: readonly string[];
  extensions: readonly string[];
}

const MB = 1024 * 1024;

export const MAX_UPLOAD_BYTES = 90 * MB;

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".avif"];

export const UPLOAD_LIMITS: Record<UploadKind, UploadLimit> = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp", "image/avif"],
    extensions: IMAGE_EXTENSIONS,
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
    extensions: [".pdf", ".doc", ".docx", ".odt", ".rtf", ".txt", ".md"],
  },
  media: {
    mimeTypes: [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif",
      "video/mp4", "video/webm", "video/ogg",
      "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/flac",
      "application/pdf",
    ],
    extensions: [...IMAGE_EXTENSIONS, ".mp4", ".webm", ".ogv", ".ogg", ".mp3", ".wav", ".flac", ".pdf"],
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

export function acceptFor(kind: UploadKind): string {
  const { mimeTypes, extensions } = UPLOAD_LIMITS[kind];
  return [...mimeTypes, ...extensions].join(",");
}

function typeList(extensions: readonly string[]): string {
  const names = extensions.map((ext) => ext.slice(1).toUpperCase());
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : names.join("");
}

export function uploadError(file: { size: number; type: string; name?: string }, kind: UploadKind = "image"): string | null {
  const { mimeTypes, extensions } = UPLOAD_LIMITS[kind];
  const name = (file.name ?? "").toLowerCase();
  const allowed = mimeTypes.includes(file.type) || (file.type === "" && extensions.some((ext) => name.endsWith(ext)));
  if (!allowed) return `Choose ${kind === "image" ? "an image" : "a file"} in ${typeList(extensions)}.`;
  return uploadSizeError(file, kind);
}
