import { getDatabase } from "@/core/database/database";
import {
  countPublicBookmarks,
  listPublicBookmarks,
} from "@/features/bookmarks/data/bookmarkRepository";

export type WidgetBookmark = {
  id: string;
  title: string;
  source: string;
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
      bookmarks: recent.map((bookmark) => ({
        id: bookmark.id,
        title: bookmark.title || bookmark.domain || "Saved link",
        source: bookmark.domain ?? bookmark.sourceName ?? "Paperclip",
      })),
    };
  } catch {
    return EMPTY_DATA;
  }
}
