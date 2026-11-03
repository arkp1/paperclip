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
  try {
    const file = new File(Paths.document, relativePath);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

/**
 * Downloads a preview image into app-managed storage and returns its relative
 * path. The caller persists that path in SQLite.
 */
export async function cachePreviewImage(
  bookmarkId: string,
  imageUrl: string
): Promise<string> {
  if (!isSafeRemoteHttpUrl(imageUrl)) {
    throw new Error("Unsupported preview image URL.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
    });

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

    const extension = EXTENSION_BY_CONTENT_TYPE[contentType] ?? "img";
    const directory = getPreviewDirectory();
    const filename = `${bookmarkId}.${extension}`;
    const file = new File(directory, filename);

    if (file.exists) {
      file.delete();
    }
    file.create({ intermediates: true });

    await file.write(bytes);

    return `${PREVIEW_DIRECTORY_PATH}/${filename}`;
  } finally {
    clearTimeout(timeout);
  }
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
