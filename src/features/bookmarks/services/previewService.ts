import { getDatabase } from "@/core/database/database";
import { isVaultBookmark } from "@/core/database/privateVaultRepository";
import {
  getBookmarkById,
  deleteBookmark,
  markBookmarkPreviewFailed,
  updateBookmarkMetadata,
  updateBookmarkPreviewAsset,
} from "@/features/bookmarks/data/bookmarkRepository";
import type { PreviewStatus } from "@/features/bookmarks/types";
import { fetchLinkMetadata } from "@/features/save-link/services/metadataService";
import {
  cachePreviewImage,
  deletePreviewImage,
} from "@/core/files/previewFileStore";

const PREVIEW_RETRY_COOLDOWN_MS = 10 * 60 * 1000;

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
  if (await isVaultBookmark(bookmarkId)) {
    throw new Error("Private previews stay inside the encrypted vault.");
  }
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

/**
 * Refreshes a bounded batch of public bookmarks whose previews are missing or
 * incomplete. Pull-to-refresh uses this so a restored library can repopulate
 * thumbnails without opening each item.
 */
export async function refreshMissingPreviews(limit = 30): Promise<void> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ id: string }>(
    `SELECT b.id
     FROM bookmarks b
     LEFT JOIN folders f ON f.id = b.folder_id
     WHERE (f.is_private IS NULL OR f.is_private = 0)
       AND (
         b.preview_image_path IS NULL
         OR b.preview_status IN ('pending', 'partial', 'failed')
       )
       AND (
         b.preview_fetched_at IS NULL
         OR b.preview_fetched_at < ?
       )
     ORDER BY b.created_at DESC
     LIMIT ?`,
    Date.now() - PREVIEW_RETRY_COOLDOWN_MS,
    limit
  );

  for (const row of rows) {
    await refreshBookmarkPreview(row.id).catch(async () => {
      await markBookmarkPreviewFailed(row.id).catch(() => {
        // Continue with the remaining previews even if the marker fails.
      });
    });
  }
}
