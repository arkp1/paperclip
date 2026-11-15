import { Directory, File, Paths } from "expo-file-system";

import { isSafeRemoteHttpUrl } from "@/shared/utils/safeRemoteUrl";

const PREVIEW_DIRECTORY_SEGMENTS = ["paperclip", "previews", "public"] as const;
const PREVIEW_DIRECTORY_PATH = PREVIEW_DIRECTORY_SEGMENTS.join("/");
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_IMAGE_BYTES = 5_000_000;

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function getPreviewDirectory(): Directory {
  const directory = new Directory(Paths.document, ...PREVIEW_DIRECTORY_SEGMENTS);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
}

/** Resolves a stored relative preview path to a displayable file URI. */
export function resolvePreviewImageUri(relativePath: string): string | null {
  if (relativePath.startsWith("data:")) {
    return relativePath;
  }
  try {
    const file = new File(Paths.document, relativePath);
    return file.exists ? file.uri : null;
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

    if (!contentType.startsWith("image/")) {
      throw new Error("Preview asset is not an image.");
    }

    const declaredSize = Number(response.headers.get("content-length") ?? "0");
    if (declaredSize > MAX_IMAGE_BYTES) {
      throw new Error("Preview image is too large.");
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new Error("Preview image is too large.");
    }

    return {
      bytes,
      extension: EXTENSION_BY_CONTENT_TYPE[contentType] ?? "img",
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

export function deletePreviewImage(relativePath: string | null): void {
  if (!relativePath) {
    return;
  }

  try {
    const file = new File(Paths.document, relativePath);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn("Could not remove a preview image.", error);
  }
}
