import type { SQLiteDatabase } from "expo-sqlite";
import { File, Paths } from "expo-file-system";
import { Image } from "expo-image";

/**
 * Removes private records and previews left in the unencrypted main database
 * by builds that predate the encrypted vault. The product owner explicitly
 * approved dropping this legacy development data.
 */
export async function cleanupLegacyPlaintextPrivateData(
  main: SQLiteDatabase
): Promise<void> {
  const privateBookmarks = await main.getAllAsync<{
    id: string;
    previewImagePath: string | null;
  }>(
    `SELECT b.id, b.preview_image_path AS previewImagePath
     FROM bookmarks b
     JOIN folders f ON f.id = b.folder_id
     WHERE f.is_private = 1`
  );
  const legacyPrivateFolders = await main.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM folders WHERE is_private = 1"
  );
  if (privateBookmarks.length === 0 && (legacyPrivateFolders?.count ?? 0) === 0) {
    return;
  }

  await main.execAsync("PRAGMA secure_delete = ON;");
  // Image decoders can retain copies outside the preview directory.
  await Image.clearDiskCache().catch(() => undefined);
  await Image.clearMemoryCache().catch(() => undefined);

  for (const bookmark of privateBookmarks) {
    if (bookmark.previewImagePath) {
      try {
        const file = new File(Paths.document, bookmark.previewImagePath);
        if (file.exists) {
          file.delete();
        }
      } catch {
        // Best-effort removal of the legacy plaintext preview.
      }
    }
  }

  for (const bookmark of privateBookmarks) {
    await main
      .runAsync(
        "DELETE FROM app_settings WHERE key IN (?, ?)",
        `reader_progress:${bookmark.id}`,
        `reader_annotations:${bookmark.id}`
      )
      .catch(() => undefined);
  }

  await main.runAsync(
    "DELETE FROM bookmarks WHERE folder_id IN (SELECT id FROM folders WHERE is_private = 1)"
  );
  await main.runAsync("DELETE FROM folders WHERE is_private = 1");
  await main.runAsync(
    "DELETE FROM article_contents WHERE bookmark_id NOT IN (SELECT id FROM bookmarks)"
  );
  await main.execAsync("PRAGMA wal_checkpoint(TRUNCATE);");
  await main.execAsync("VACUUM;");
}
