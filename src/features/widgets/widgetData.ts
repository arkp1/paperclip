import { File } from "expo-file-system";

import { getDatabase } from "@/core/database/database";
import { resolvePreviewImageUri } from "@/core/files/previewFileStore";
import {
  countPublicBookmarks,
  listPublicBookmarks,
} from "@/features/bookmarks/data/bookmarkRepository";

export type WidgetBookmark = {
  id: string;
  title: string;
  source: string;
  thumbnail?: `data:image${string}`;
};

export type WidgetData = {
  total: number;
  bookmarks: WidgetBookmark[];
};

const EMPTY_DATA: WidgetData = { total: 0, bookmarks: [] };

export async function loadWidgetData(): Promise<WidgetData> {
  try {
    await getDatabase();
    const [total, recent] = await Promise.all([
      countPublicBookmarks("all"),
      listPublicBookmarks("all", 8, 0, "recent"),
    ]);
    return {
      total,
      bookmarks: await Promise.all(
        recent.map(async (bookmark) => ({
          id: bookmark.id,
          title: bookmark.title || bookmark.domain || "Saved link",
          source: bookmark.domain ?? bookmark.sourceName ?? "Paperclip",
          thumbnail: await readThumbnail(bookmark.previewImagePath),
        }))
      ),
    };
  } catch {
    return EMPTY_DATA;
  }
}

const MAX_WIDGET_THUMBNAIL_BYTES = 64_000;

async function readThumbnail(
  relativePath: string | null
): Promise<`data:image${string}` | undefined> {
  if (!relativePath) {
    return undefined;
  }
  try {
    const uri = resolvePreviewImageUri(relativePath);
    if (!uri) {
      return undefined;
    }
    const file = new File(uri);
    if (!file.exists || file.size > MAX_WIDGET_THUMBNAIL_BYTES) {
      return undefined;
    }
    const extension = uri.split(".").pop()?.toLowerCase();
    const mime = extension === "png" ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${await file.base64()}` as const;
  } catch {
    return undefined;
  }
}
