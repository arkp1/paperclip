import {
  getBookmarkById,
  deleteBookmark,
  updateBookmarkMetadata,
  updateBookmarkPreviewAsset,
} from "@/features/bookmarks/data/bookmarkRepository";
import type { PreviewStatus } from "@/features/bookmarks/types";
import { fetchLinkMetadata } from "@/features/save-link/services/metadataService";
import {
  cachePreviewImage,
  deletePreviewImage,
} from "@/core/files/previewFileStore";

/**
 * Caches the preview image for a freshly saved bookmark. The row already
 * exists, so a failed image download only degrades the preview; it never
 * invalidates the save.
 */
export async function enrichBookmarkPreview(
  bookmarkId: string,
  imageUrl: string | null
): Promise<void> {
  if (!imageUrl) {
    return;
  }

  try {
    const previewImagePath = await cachePreviewImage(bookmarkId, imageUrl);
    await updateBookmarkPreviewAsset(bookmarkId, {
      previewImagePath,
      previewStatus: "success",
      previewFetchedAt: Date.now(),
    });
  } catch (error) {
    console.warn("Could not cache the preview image.", error);
    await updateBookmarkPreviewAsset(bookmarkId, {
      previewImagePath: null,
      previewStatus: "partial",
      previewFetchedAt: Date.now(),
    }).catch(() => {
      // The bookmark remains saved with its fallback card.
    });
  }
}

/**
 * Re-fetches metadata and the preview image for an existing public bookmark.
 */
export async function refreshBookmarkPreview(bookmarkId: string): Promise<void> {
  const bookmark = await getBookmarkById(bookmarkId);
  if (!bookmark) {
    throw new Error("This bookmark no longer exists.");
  }

  const metadata = await fetchLinkMetadata(bookmark.originalUrl);

  let previewImagePath: string | null = null;
  if (metadata.imageUrl) {
    try {
      previewImagePath = await cachePreviewImage(bookmarkId, metadata.imageUrl);
    } catch (error) {
      console.warn("Could not refresh the preview image.", error);
    }
  }

  const previewStatus: PreviewStatus = previewImagePath
    ? "success"
    : metadata.title || metadata.description
      ? "partial"
      : "unavailable";

  await updateBookmarkMetadata(bookmarkId, {
    title: metadata.title,
    description: metadata.description,
    sourceName: metadata.siteName,
    canonicalUrl: metadata.canonicalUrl,
    previewStatus,
    previewFetchedAt: Date.now(),
    previewImagePath,
  });

  if (
    bookmark.previewImagePath &&
    bookmark.previewImagePath !== previewImagePath
  ) {
    deletePreviewImage(bookmark.previewImagePath);
  }
}

export async function deleteBookmarkWithAssets(bookmarkId: string): Promise<void> {
  const bookmark = await getBookmarkById(bookmarkId);
  await deleteBookmark(bookmarkId);

  if (bookmark?.previewImagePath) {
    deletePreviewImage(bookmark.previewImagePath);
  }
}
