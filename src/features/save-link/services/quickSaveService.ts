import {
  createBookmark,
  findBookmarkByUrl,
} from "@/features/bookmarks/data/bookmarkRepository";
import { refreshBookmarkPreview } from "@/features/bookmarks/services/previewService";
import { validateHttpUrl } from "@/shared/utils/url";

export type QuickSaveResult =
  | { status: "saved"; bookmarkId: string }
  | { status: "duplicate" }
  | { status: "invalid" }
  | { status: "error" };

/**
 * Saves a shared link immediately without opening the form. Metadata and the
 * preview are refreshed in the background after the row exists.
 */
export async function quickSaveLink(rawUrl: string): Promise<QuickSaveResult> {
  const validation = validateHttpUrl(rawUrl);
  if (!validation.valid) {
    return { status: "invalid" };
  }

  try {
    const existing = await findBookmarkByUrl(validation.url);
    if (existing) {
      return { status: "duplicate" };
    }

    const saved = await createBookmark({
      originalUrl: validation.url,
      canonicalUrl: null,
      title: validation.domain,
      titleIsUserEdited: false,
      description: null,
      note: null,
      folderId: null,
      sourceName: validation.domain,
      domain: validation.domain,
      previewStatus: "pending",
    });

    void refreshBookmarkPreview(saved.id).catch(() => {
      // The link is saved even if enrichment fails.
    });

    return { status: "saved", bookmarkId: saved.id };
  } catch (error) {
    console.warn("Could not quick-save the shared link.", error);
    return { status: "error" };
  }
}
