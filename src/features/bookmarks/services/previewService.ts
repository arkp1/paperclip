import { getDatabase } from "@/core/database/database";
import { withPrivacyWriteLock } from "@/core/database/privacyWriteLock";
import {
  getBookmarkPrivacy,
} from "@/core/database/privateVaultRepository";
import { PUBLIC_BOOKMARK_TRANSFER_FILTER } from "@/core/database/vaultTransferState";
import {
  getBookmarkById,
  getPublicBookmarkById,
  deleteBookmark,
  markBookmarkPreviewFailed,
  updateBookmarkMetadata,
  updateBookmarkPreviewAsset,
} from "@/features/bookmarks/data/bookmarkRepository";
import type { PreviewStatus } from "@/features/bookmarks/types";
import { fetchLinkMetadata } from "@/features/save-link/services/metadataService";
import {
  downloadPreviewImage,
  writePreviewImageBytes,
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
    const downloaded = await downloadPreviewImage(imageUrl);
    await withPrivacyWriteLock(async () => {
      if ((await getBookmarkPrivacy(bookmarkId)) !== "public") {
        return;
      }
      const previewImagePath = await writePreviewImageBytes(
        bookmarkId,
        downloaded
      );
      if ((await getBookmarkPrivacy(bookmarkId)) !== "public") {
        deletePreviewImage(previewImagePath);
        return;
      }
      await updateBookmarkPreviewAsset(bookmarkId, {
        previewImagePath,
        previewStatus: "success",
        previewFetchedAt: Date.now(),
      });
    });
  } catch (error) {
    console.warn("Could not cache the preview image.", error);
    try {
      await withPrivacyWriteLock(async () => {
        if ((await getBookmarkPrivacy(bookmarkId)) !== "public") {
          return;
        }
        await updateBookmarkPreviewAsset(bookmarkId, {
          previewImagePath: null,
          previewStatus: "partial",
          previewFetchedAt: Date.now(),
        }).catch(() => {
          // The bookmark remains saved with its fallback card.
        });
      });
    } catch (fallbackError) {
      console.warn("Could not record the preview fallback.", fallbackError);
    }
  }
}

/**
 * Re-fetches metadata and the preview image for an existing public bookmark.
 */
export async function refreshBookmarkPreview(bookmarkId: string): Promise<void> {
  const bookmark = await getPublicBookmarkById(bookmarkId);
  if (!bookmark || (await getBookmarkPrivacy(bookmarkId)) !== "public") {
    throw new Error("This bookmark is not public.");
  }

  const metadata = await fetchLinkMetadata(bookmark.originalUrl);
  let downloaded: Awaited<ReturnType<typeof downloadPreviewImage>> | null = null;
  if (metadata.imageUrl) {
    try {
      downloaded = await downloadPreviewImage(metadata.imageUrl);
    } catch (error) {
      console.warn("Could not download the preview image.", error);
    }
  }

  await withPrivacyWriteLock(async () => {
    if ((await getBookmarkPrivacy(bookmarkId)) !== "public") {
      throw new Error("The bookmark moved to the private vault.");
    }

    let previewImagePath: string | null = null;
    if (downloaded) {
      previewImagePath = await writePreviewImageBytes(bookmarkId, downloaded);
    }

    if ((await getBookmarkPrivacy(bookmarkId)) !== "public") {
      if (previewImagePath) {
        deletePreviewImage(previewImagePath);
      }
      throw new Error("The bookmark moved to the private vault.");
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
  });
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
       AND ${PUBLIC_BOOKMARK_TRANSFER_FILTER}
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
