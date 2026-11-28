import { File } from "expo-file-system";

import { getDatabase } from "@/core/database/database";
import { resolvePreviewImageUri } from "@/core/files/previewFileStore";
import {
  countPublicBookmarks,
  listPublicBookmarks,
} from "@/features/bookmarks/data/bookmarkRepository";
import { runWithConcurrency } from "@/shared/utils/runWithConcurrency";

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
let cachedWidgetData: WidgetData | null = null;

export function getCachedWidgetData(): WidgetData | null {
  return cachedWidgetData;
}

export async function loadWidgetData(): Promise<WidgetData> {
  try {
    await getDatabase();
    const [total, recent] = await Promise.all([
      countPublicBookmarks("all"),
      listPublicBookmarks("all", 8, 0, "recent"),
    ]);
    const bookmarks: WidgetBookmark[] = recent.map((bookmark) => ({
      id: bookmark.id,
      title: bookmark.title || bookmark.domain || "Saved link",
      source: bookmark.domain ?? bookmark.sourceName ?? "Paperclip",
    }));
    await runWithConcurrency(bookmarks, 3, async (bookmark) => {
      const source = recent.find((candidate) => candidate.id === bookmark.id);
      if (source) {
        bookmark.thumbnail = await readThumbnail(source.previewImagePath);
      }
    });
    const data: WidgetData = { total, bookmarks };
    cachedWidgetData = data;
    return data;
  } catch {
    return cachedWidgetData ?? EMPTY_DATA;
  }
}

const MAX_WIDGET_THUMBNAIL_BYTES = 32_000;
const thumbnailCache = new Map<string, `data:image${string}` | undefined>();
const MAX_THUMBNAIL_CACHE_ENTRIES = 32;

function rememberThumbnail(
  relativePath: string,
  value: `data:image${string}` | undefined
): `data:image${string}` | undefined {
  if (thumbnailCache.size >= MAX_THUMBNAIL_CACHE_ENTRIES) {
    const oldest = thumbnailCache.keys().next().value;
    if (oldest) {
      thumbnailCache.delete(oldest);
    }
  }
  thumbnailCache.set(relativePath, value);
  return value;
}

async function readThumbnail(
  relativePath: string | null
): Promise<`data:image${string}` | undefined> {
  if (!relativePath) {
    return undefined;
  }
  if (thumbnailCache.has(relativePath)) {
    return thumbnailCache.get(relativePath);
  }
  try {
    const uri = resolvePreviewImageUri(relativePath);
    if (!uri) {
      return rememberThumbnail(relativePath, undefined);
    }
    const { manipulateAsync, SaveFormat } = await import(
      "expo-image-manipulator"
    );
    const thumbnail = await manipulateAsync(uri, [{ resize: { width: 96 } }], {
      compress: 0.55,
      format: SaveFormat.JPEG,
    });
    const file = new File(thumbnail.uri);
    if (!file.exists || file.size > MAX_WIDGET_THUMBNAIL_BYTES) {
      return rememberThumbnail(relativePath, undefined);
    }
    return rememberThumbnail(
      relativePath,
      `data:image/jpeg;base64,${await file.base64()}` as const
    );
  } catch {
    return rememberThumbnail(relativePath, undefined);
  }
}
