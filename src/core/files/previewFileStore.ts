import { Directory, File, Paths } from "expo-file-system";

import { isSafeRemoteHttpUrl } from "@/shared/utils/safeRemoteUrl";

const PREVIEW_DIRECTORY_SEGMENTS = ["paperclip", "previews", "public"] as const;
const PREVIEW_DIRECTORY_PATH = PREVIEW_DIRECTORY_SEGMENTS.join("/");
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_IMAGE_BYTES = 5_000_000;
const RESOLVED_URI_CACHE_LIMIT = 256;
const resolvedUriCache = new Map<string, string>();

function rememberResolvedUri(path: string, uri: string): string {
  if (resolvedUriCache.size >= RESOLVED_URI_CACHE_LIMIT) {
    const oldest = resolvedUriCache.keys().next().value;
    if (oldest) {
      resolvedUriCache.delete(oldest);
    }
  }
  resolvedUriCache.set(path, uri);
  return uri;
}

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

function detectImageExtension(bytes: ArrayBuffer): string | null {
  const view = new Uint8Array(bytes.slice(0, 16));
  if (view.length >= 3 && view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) {
    return "jpg";
  }
  if (
    view.length >= 8 &&
    view[0] === 0x89 &&
    view[1] === 0x50 &&
    view[2] === 0x4e &&
    view[3] === 0x47
  ) {
    return "png";
  }
  if (
    view.length >= 6 &&
    view[0] === 0x47 &&
    view[1] === 0x49 &&
    view[2] === 0x46
  ) {
    return "gif";
  }
  if (
    view.length >= 12 &&
    view[0] === 0x52 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x46 &&
    view[8] === 0x57 &&
    view[9] === 0x45 &&
    view[10] === 0x42 &&
    view[11] === 0x50
  ) {
    return "webp";
  }
  if (
    view.length >= 12 &&
    view[4] === 0x66 &&
    view[5] === 0x74 &&
    view[6] === 0x79 &&
    view[7] === 0x70 &&
    ((view[8] === 0x61 && view[9] === 0x76 && view[10] === 0x69 && view[11] === 0x66) ||
      (view[8] === 0x61 && view[9] === 0x76 && view[10] === 0x69 && view[11] === 0x73))
  ) {
    return "avif";
  }
  return null;
}

function getPreviewDirectory(): Directory {
  const directory = new Directory(Paths.document, ...PREVIEW_DIRECTORY_SEGMENTS);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
}

/** Resolves a stored relative preview path to a displayable file URI. */
export function resolvePreviewImageUri(relativePath: string): string | null {
  const path = relativePath.trim();
  if (!path) {
    return null;
  }
  const cached = resolvedUriCache.get(path);
  if (cached) {
    return cached;
  }
  if (path.startsWith("data:")) {
    return rememberResolvedUri(path, path);
  }
  if (isSafeRemoteHttpUrl(path)) {
    return rememberResolvedUri(path, path);
  }

  try {
    if (path.startsWith("file://") || path.startsWith("content://")) {
      return rememberResolvedUri(path, path);
    }
    if (path.startsWith("/")) {
      const absolute = new File(path);
      return absolute.exists
        ? rememberResolvedUri(path, absolute.uri)
        : null;
    }

    const segments = path
      .replace(/\\/g, "/")
      .split("/")
      .filter((segment) => segment.length > 0);
    if (segments.length === 0) {
      return null;
    }
    const file = new File(Paths.document, ...segments);
    return file.exists ? rememberResolvedUri(path, file.uri) : null;
  } catch {
    return null;
  }
}

export type DownloadedPreviewImage = {
  bytes: ArrayBuffer;
  extension: string;
};

async function fetchPreviewResponse(
  imageUrl: string,
  signal: AbortSignal
): Promise<Response> {
  let currentUrl = imageUrl;
  for (let hop = 0; hop <= 3; hop += 1) {
    if (!isSafeRemoteHttpUrl(currentUrl)) {
      throw new Error("Unsupported preview image URL.");
    }
    const response = await fetch(currentUrl, {
      signal,
      redirect: "manual",
      headers: { Accept: "image/*" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("Preview image redirect had no destination.");
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    if (response.url && !isSafeRemoteHttpUrl(response.url)) {
      throw new Error("Preview image redirected to an unsupported destination.");
    }
    return response;
  }
  throw new Error("Preview image redirected too many times.");
}

/**
 * Downloads and validates preview bytes without writing to app storage. Callers
 * can perform the filesystem write under the privacy lock after re-checking
 * bookmark ownership.
 */
export async function downloadPreviewImage(
  imageUrl: string
): Promise<DownloadedPreviewImage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchPreviewResponse(imageUrl, controller.signal);

    if (!response.ok) {
      throw new Error(`Preview image request failed with ${response.status}.`);
    }

    const contentType = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    const declaredSize = Number(response.headers.get("content-length") ?? "0");
    if (declaredSize > MAX_IMAGE_BYTES) {
      throw new Error("Preview image is too large.");
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new Error("Preview image is too large.");
    }

    const extension =
      EXTENSION_BY_CONTENT_TYPE[contentType] ?? detectImageExtension(bytes);

    if (!contentType.startsWith("image/") && !extension) {
      throw new Error("Preview asset is not an image.");
    }

    return {
      bytes,
      extension: extension ?? "img",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Writes downloaded preview bytes to a unique app-managed file. */
export async function writePreviewImageBytes(
  bookmarkId: string,
  image: DownloadedPreviewImage
): Promise<string> {
  const directory = getPreviewDirectory();
  const filename = `${bookmarkId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${image.extension}`;
  const file = new File(directory, filename);
  file.create({ intermediates: true });
  await file.write(new Uint8Array(image.bytes));
  return `${PREVIEW_DIRECTORY_PATH}/${filename}`;
}

/**
 * Downloads a preview image into app-managed storage and returns its relative
 * path. The caller persists that path in SQLite.
 */
export async function cachePreviewImage(
  bookmarkId: string,
  imageUrl: string
): Promise<string> {
  const downloaded = await downloadPreviewImage(imageUrl);
  return writePreviewImageBytes(bookmarkId, downloaded);
}

export function tryDeletePreviewImage(relativePath: string | null): boolean {
  if (!relativePath) {
    return true;
  }

  try {
    const file = new File(Paths.document, relativePath);
    if (file.exists) {
      file.delete();
    }
    return true;
  } catch (error) {
    console.warn("Could not remove a preview image.", error);
    return false;
  }
}

export function deletePreviewImage(relativePath: string | null): void {
  tryDeletePreviewImage(relativePath);
}
