import { File, Paths } from "expo-file-system";
import { Image } from "expo-image";

import { getDatabase } from "@/core/database/database";
import { getPrivateVault } from "@/core/database/privateVault";
import { deletePreviewImage } from "@/core/files/previewFileStore";
import {
  FolderNotFoundError,
} from "@/features/folders/errors";
import type { FolderDeleteStrategy } from "@/features/folders/types";

type PublicFolderRow = {
  id: string;
  name: string;
  iconKey: string | null;
  colorKey: string | null;
  sortOrder: number;
  lastOpenedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

type PublicBookmarkRow = {
  id: string;
  originalUrl: string;
  canonicalUrl: string | null;
  title: string;
  titleIsUserEdited: number;
  description: string | null;
  note: string | null;
  folderId: string | null;
  sourceName: string | null;
  domain: string | null;
  faviconPath: string | null;
  previewStatus: string;
  isFavorite: number;
  createdAt: number;
  updatedAt: number;
  previewImagePath: string | null;
};

type VaultBookmarkRow = Omit<PublicBookmarkRow, "previewImagePath"> & {
  previewDataUri: string | null;
};

type ArticleRow = {
  blocks: string;
  wordCount: number;
  fetchedAt: number;
  cacheVersion: number;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function mimeFromPath(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

function bytesToBase64(bytes: Uint8Array): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    output += alphabet[a >> 2];
    output += alphabet[((a & 3) << 4) | (b >> 4)];
    output += index + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : "=";
    output += index + 2 < bytes.length ? alphabet[c & 63] : "=";
  }
  return output;
}

function base64ToBytes(value: string): Uint8Array {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = value.replace(/[^A-Za-z0-9+/=]/g, "");
  const output: number[] = [];
  for (let index = 0; index < clean.length; index += 4) {
    const a = alphabet.indexOf(clean[index] ?? "A");
    const b = alphabet.indexOf(clean[index + 1] ?? "A");
    const c = clean[index + 2] === "=" ? 0 : alphabet.indexOf(clean[index + 2] ?? "A");
    const d = clean[index + 3] === "=" ? 0 : alphabet.indexOf(clean[index + 3] ?? "A");
    output.push((a << 2) | (b >> 4));
    if (clean[index + 2] !== "=") {
      output.push(((b & 15) << 4) | (c >> 2));
    }
    if (clean[index + 3] !== "=") {
      output.push(((c & 3) << 6) | d);
    }
  }
  return new Uint8Array(output);
}

async function readPreviewDataUri(
  relativePath: string | null
): Promise<string | null> {
  if (!relativePath) {
    return null;
  }
  try {
    const file = new File(Paths.document, relativePath);
    if (!file.exists) {
      return null;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    return `data:${mimeFromPath(relativePath)};base64,${bytesToBase64(bytes)}`;
  } catch (error) {
    throw new Error(
      `Could not read the private preview asset: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function writePreviewDataUri(
  bookmarkId: string,
  dataUri: string | null,
  onCreated?: (relativePath: string) => void
): Promise<string | null> {
  if (!dataUri) {
    return null;
  }
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUri);
  if (!match) {
    throw new Error("The private preview asset is malformed.");
  }
  const mime = match[1] ?? "application/octet-stream";
  const extension = EXTENSION_BY_MIME[mime] ?? "img";
  const directory = Paths.document;
  const relativePath = `paperclip/previews/public/${bookmarkId}.${extension}`;
  try {
    const file = new File(directory, relativePath);
    file.create({ intermediates: true, overwrite: true });
    // Track the file before writing so a partial write can be rolled back.
    onCreated?.(relativePath);
    await file.write(base64ToBytes(match[2] ?? ""));
    return relativePath;
  } catch (error) {
    throw new Error(
      `Could not write the restored preview asset: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function readArticle(
  database: Awaited<ReturnType<typeof getDatabase>>,
  bookmarkId: string
): Promise<ArticleRow | null> {
  return database.getFirstAsync<ArticleRow>(
    `SELECT blocks, word_count AS wordCount, fetched_at AS fetchedAt,
            cache_version AS cacheVersion
     FROM article_contents WHERE bookmark_id = ?`,
    bookmarkId
  );
}

async function readSetting(
  database: Awaited<ReturnType<typeof getDatabase>>,
  key: string
): Promise<string | null> {
  const row = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?",
    key
  );
  return row?.value ?? null;
}

async function copyPublicBookmarkToVault(
  vault: Awaited<ReturnType<typeof getPrivateVault>>,
  bookmark: PublicBookmarkRow,
  previewDataUri: string | null
): Promise<void> {
  await vault.runAsync(
    `INSERT INTO bookmarks
     (id, original_url, canonical_url, title, title_is_user_edited, description,
      note, folder_id, source_name, domain, favicon_path, preview_status,
      preview_data_uri, is_favorite, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       original_url = excluded.original_url,
       canonical_url = excluded.canonical_url,
       title = excluded.title,
       title_is_user_edited = excluded.title_is_user_edited,
       description = excluded.description,
       note = excluded.note,
       folder_id = excluded.folder_id,
       source_name = excluded.source_name,
       domain = excluded.domain,
       favicon_path = excluded.favicon_path,
       preview_status = excluded.preview_status,
       preview_data_uri = COALESCE(excluded.preview_data_uri, preview_data_uri),
       is_favorite = excluded.is_favorite,
       updated_at = excluded.updated_at`,
    bookmark.id,
    bookmark.originalUrl,
    bookmark.canonicalUrl,
    bookmark.title,
    bookmark.titleIsUserEdited,
    bookmark.description,
    bookmark.note,
    bookmark.folderId,
    bookmark.sourceName,
    bookmark.domain,
    bookmark.faviconPath,
    bookmark.previewStatus,
    previewDataUri,
    bookmark.isFavorite,
    bookmark.createdAt,
    bookmark.updatedAt
  );

  const article = await readArticle(await getDatabase(), bookmark.id);
  if (article) {
    await vault.runAsync(
      `INSERT INTO article_contents
       (bookmark_id, blocks, word_count, fetched_at, cache_version)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(bookmark_id) DO UPDATE SET
         blocks = excluded.blocks,
         word_count = excluded.word_count,
         fetched_at = excluded.fetched_at,
         cache_version = excluded.cache_version`,
      bookmark.id,
      article.blocks,
      article.wordCount,
      article.fetchedAt,
      article.cacheVersion
    );
  }

  const main = await getDatabase();
  for (const prefix of ["reader_progress", "reader_annotations"]) {
    const key = `${prefix}:${bookmark.id}`;
    const value = await readSetting(main, key);
    if (value !== null) {
      await vault.runAsync(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        key,
        value,
        Date.now()
      );
    }
  }
}

export async function movePublicFolderToVaultSafe(
  folderId: string,
  allowLegacyPrivateSource = false
): Promise<void> {
  const main = await getDatabase();
  const folder = await main.getFirstAsync<PublicFolderRow>(
    `SELECT id, name, icon_key AS iconKey, color_key AS colorKey,
            sort_order AS sortOrder, last_opened_at AS lastOpenedAt,
            created_at AS createdAt, updated_at AS updatedAt
     FROM folders WHERE id = ?${allowLegacyPrivateSource ? "" : " AND is_private = 0"}`,
    folderId
  );
  if (!folder) {
    throw new FolderNotFoundError();
  }
  const bookmarks = await main.getAllAsync<PublicBookmarkRow>(
    `SELECT id, original_url AS originalUrl, canonical_url AS canonicalUrl,
            title, title_is_user_edited AS titleIsUserEdited, description,
            note, folder_id AS folderId, source_name AS sourceName, domain,
            preview_image_path AS previewImagePath, favicon_path AS faviconPath,
            preview_status AS previewStatus, is_favorite AS isFavorite,
            created_at AS createdAt, updated_at AS updatedAt
     FROM bookmarks WHERE folder_id = ?`,
    folderId
  );
  const vault = await getPrivateVault();
  const previewUris = new Map<string, string | null>();
  for (const bookmark of bookmarks) {
    previewUris.set(
      bookmark.id,
      await readPreviewDataUri(bookmark.previewImagePath)
    );
  }

  await vault.withTransactionAsync(async () => {
    await vault.runAsync(
      `INSERT INTO folders
       (id, name, icon_key, color_key, sort_order, last_opened_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         icon_key = excluded.icon_key,
         color_key = excluded.color_key,
         sort_order = excluded.sort_order,
         last_opened_at = excluded.last_opened_at,
         updated_at = excluded.updated_at`,
      folder.id,
      folder.name,
      folder.iconKey,
      folder.colorKey,
      folder.sortOrder,
      folder.lastOpenedAt,
      folder.createdAt,
      folder.updatedAt
    );
    for (const bookmark of bookmarks) {
      await copyPublicBookmarkToVault(
        vault,
        { ...bookmark, folderId },
        previewUris.get(bookmark.id) ?? null
      );
    }
  });

  const remaining = await main.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM bookmarks
     WHERE folder_id = ? AND id NOT IN (${bookmarks.map(() => "?").join(",") || "''"})`,
    folderId,
    ...bookmarks.map((bookmark) => bookmark.id)
  );
  if ((remaining?.count ?? 0) > 0) {
    throw new Error(
      "The folder changed while it was being moved. No source data was deleted; retry the move."
    );
  }

  // Remove plaintext assets only after the encrypted copies are durable.
  for (const bookmark of bookmarks) {
    if (bookmark.previewImagePath) {
      const file = new File(Paths.document, bookmark.previewImagePath);
      if (file.exists) {
        file.delete();
      }
    }
  }

  await main.execAsync("PRAGMA secure_delete = ON;");
  await main.withTransactionAsync(async () => {
    for (const bookmark of bookmarks) {
      await main.runAsync("DELETE FROM bookmarks WHERE id = ?", bookmark.id);
      await main.runAsync(
        "DELETE FROM app_settings WHERE key IN (?, ?)",
        `reader_progress:${bookmark.id}`,
        `reader_annotations:${bookmark.id}`
      );
    }
    const remainingFolderBookmarks = await main.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM bookmarks WHERE folder_id = ?",
      folderId
    );
    if ((remainingFolderBookmarks?.count ?? 0) > 0) {
      throw new Error(
        "The folder changed while it was being moved. The source folder was preserved."
      );
    }
    const deleted = await main.runAsync("DELETE FROM folders WHERE id = ?", folderId);
    if (deleted.changes === 0) {
      throw new FolderNotFoundError();
    }
  });
  await main.execAsync("PRAGMA wal_checkpoint(TRUNCATE);");
  await main.execAsync("VACUUM;");
}

function keyFor(id: string, prefix: string) {
  return `${prefix}:${id}`;
}

async function copyVaultBookmarkToPublic(
  vault: Awaited<ReturnType<typeof getPrivateVault>>,
  main: Awaited<ReturnType<typeof getDatabase>>,
  bookmark: VaultBookmarkRow,
  targetFolderId: string | null,
  restoredPreviewFiles: string[]
): Promise<void> {
  const previewImagePath = await writePreviewDataUri(
    bookmark.id,
    bookmark.previewDataUri,
    (relativePath) => restoredPreviewFiles.push(relativePath)
  );
  await main.runAsync(
    `INSERT INTO bookmarks
     (id, original_url, canonical_url, title, title_is_user_edited, description,
      note, folder_id, source_name, domain, preview_image_path, favicon_path,
      preview_status, is_favorite, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       original_url = excluded.original_url,
       canonical_url = excluded.canonical_url,
       title = excluded.title,
       title_is_user_edited = excluded.title_is_user_edited,
       description = excluded.description,
       note = excluded.note,
       folder_id = excluded.folder_id,
       source_name = excluded.source_name,
       domain = excluded.domain,
       preview_image_path = excluded.preview_image_path,
       favicon_path = excluded.favicon_path,
       preview_status = excluded.preview_status,
       is_favorite = excluded.is_favorite,
       updated_at = excluded.updated_at`,
    bookmark.id,
    bookmark.originalUrl,
    bookmark.canonicalUrl,
    bookmark.title,
    bookmark.titleIsUserEdited,
    bookmark.description,
    bookmark.note,
    targetFolderId,
    bookmark.sourceName,
    bookmark.domain,
    previewImagePath,
    bookmark.faviconPath,
    bookmark.previewStatus,
    bookmark.isFavorite,
    bookmark.createdAt,
    bookmark.updatedAt
  );

  const article = await readArticle(vault, bookmark.id);
  if (article) {
    await main.runAsync(
      `INSERT INTO article_contents
       (bookmark_id, blocks, word_count, fetched_at, cache_version)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(bookmark_id) DO UPDATE SET
         blocks = excluded.blocks,
         word_count = excluded.word_count,
         fetched_at = excluded.fetched_at,
         cache_version = excluded.cache_version`,
      bookmark.id,
      article.blocks,
      article.wordCount,
      article.fetchedAt,
      article.cacheVersion
    );
  }

  for (const prefix of ["reader_progress", "reader_annotations"]) {
    const key = keyFor(bookmark.id, prefix);
    const value = await readSetting(vault, key);
    if (value !== null) {
      await main.runAsync(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        key,
        value,
        Date.now()
      );
    }
  }
}

export async function moveVaultFolderToPublicSafe(
  folderId: string
): Promise<void> {
  const vault = await getPrivateVault();
  const folder = await vault.getFirstAsync<PublicFolderRow>(
    `SELECT id, name, icon_key AS iconKey, color_key AS colorKey,
            sort_order AS sortOrder, last_opened_at AS lastOpenedAt,
            created_at AS createdAt, updated_at AS updatedAt
     FROM folders WHERE id = ?`,
    folderId
  );
  if (!folder) {
    throw new FolderNotFoundError();
  }
  const bookmarks = await vault.getAllAsync<VaultBookmarkRow>(
    `SELECT id, original_url AS originalUrl, canonical_url AS canonicalUrl,
            title, title_is_user_edited AS titleIsUserEdited, description,
            note, folder_id AS folderId, source_name AS sourceName, domain,
            favicon_path AS faviconPath, preview_status AS previewStatus,
            is_favorite AS isFavorite, created_at AS createdAt, updated_at AS updatedAt,
            preview_data_uri AS previewDataUri
     FROM bookmarks WHERE folder_id = ?`,
    folderId
  );
  const main = await getDatabase();
  const restoredPreviewFiles: string[] = [];

  try {
    await main.withTransactionAsync(async () => {
      await main.runAsync(
        `INSERT INTO folders
         (id, name, icon_key, color_key, is_private, sort_order, last_opened_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           icon_key = excluded.icon_key,
           color_key = excluded.color_key,
           is_private = 0,
           sort_order = excluded.sort_order,
           last_opened_at = excluded.last_opened_at,
           updated_at = excluded.updated_at`,
        folder.id,
        folder.name,
        folder.iconKey,
        folder.colorKey,
        folder.sortOrder,
        folder.lastOpenedAt,
        folder.createdAt,
        folder.updatedAt
      );
      for (const bookmark of bookmarks) {
        await copyVaultBookmarkToPublic(
          vault,
          main,
          bookmark,
          folderId,
          restoredPreviewFiles
        );
      }
    });
  } catch (error) {
    for (const path of restoredPreviewFiles) {
      deletePreviewImage(path);
    }
    throw error;
  }

  await vault.withTransactionAsync(async () => {
    for (const bookmark of bookmarks) {
      await vault.runAsync("DELETE FROM bookmarks WHERE id = ?", bookmark.id);
      await vault.runAsync(
        "DELETE FROM app_settings WHERE key IN (?, ?)",
        keyFor(bookmark.id, "reader_progress"),
        keyFor(bookmark.id, "reader_annotations")
      );
    }
    const remaining = await vault.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM bookmarks WHERE folder_id = ?",
      folderId
    );
    if ((remaining?.count ?? 0) > 0) {
      throw new Error(
        "The private folder changed while it was being moved. No source data was deleted."
      );
    }
    await vault.runAsync("DELETE FROM folders WHERE id = ?", folderId);
  });
}

export async function movePublicBookmarkToVaultSafe(
  id: string,
  folderId: string
): Promise<void> {
  const main = await getDatabase();
  const bookmark = await main.getFirstAsync<PublicBookmarkRow>(
    `SELECT id, original_url AS originalUrl, canonical_url AS canonicalUrl,
            title, title_is_user_edited AS titleIsUserEdited, description,
            note, folder_id AS folderId, source_name AS sourceName, domain,
            preview_image_path AS previewImagePath, favicon_path AS faviconPath,
            preview_status AS previewStatus, is_favorite AS isFavorite,
            created_at AS createdAt, updated_at AS updatedAt
     FROM bookmarks WHERE id = ?`,
    id
  );
  if (!bookmark) {
    throw new Error("This bookmark no longer exists.");
  }
  const vault = await getPrivateVault();
  const exists = await vault.getFirstAsync<{ id: string }>(
    "SELECT id FROM folders WHERE id = ?",
    folderId
  );
  if (!exists) {
    throw new FolderNotFoundError();
  }
  const preview = await readPreviewDataUri(bookmark.previewImagePath);
  await vault.withTransactionAsync(async () => {
    await copyPublicBookmarkToVault(
      vault,
      { ...bookmark, folderId },
      preview
    );
  });
  if (bookmark.previewImagePath) {
    const file = new File(Paths.document, bookmark.previewImagePath);
    if (file.exists) {
      file.delete();
    }
  }
  await main.execAsync("PRAGMA secure_delete = ON;");
  await main.withTransactionAsync(async () => {
    await main.runAsync("DELETE FROM bookmarks WHERE id = ?", id);
    await main.runAsync(
      "DELETE FROM app_settings WHERE key IN (?, ?)",
      keyFor(id, "reader_progress"),
      keyFor(id, "reader_annotations")
    );
  });
  await main.execAsync("PRAGMA wal_checkpoint(TRUNCATE);");
  await main.execAsync("VACUUM;");
}

export async function moveVaultBookmarkToPublicSafe(
  id: string,
  folderId: string | null
): Promise<void> {
  const vault = await getPrivateVault();
  const bookmark = await vault.getFirstAsync<VaultBookmarkRow>(
    `SELECT id, original_url AS originalUrl, canonical_url AS canonicalUrl,
            title, title_is_user_edited AS titleIsUserEdited, description,
            note, folder_id AS folderId, source_name AS sourceName, domain,
            favicon_path AS faviconPath, preview_status AS previewStatus,
            is_favorite AS isFavorite, created_at AS createdAt, updated_at AS updatedAt,
            preview_data_uri AS previewDataUri
     FROM bookmarks WHERE id = ?`,
    id
  );
  if (!bookmark) {
    throw new Error("Private bookmark not found.");
  }
  const main = await getDatabase();
  if (folderId) {
    const folder = await main.getFirstAsync<{ id: string }>(
      "SELECT id FROM folders WHERE id = ? AND is_private = 0",
      folderId
    );
    if (!folder) {
      throw new FolderNotFoundError();
    }
  }
  const restoredPreviewFiles: string[] = [];
  try {
    await main.withTransactionAsync(async () => {
      await copyVaultBookmarkToPublic(
        vault,
        main,
        bookmark,
        folderId,
        restoredPreviewFiles
      );
    });
  } catch (error) {
    for (const path of restoredPreviewFiles) {
      deletePreviewImage(path);
    }
    throw error;
  }
  await vault.withTransactionAsync(async () => {
    await vault.runAsync("DELETE FROM bookmarks WHERE id = ?", id);
    await vault.runAsync(
      "DELETE FROM app_settings WHERE key IN (?, ?)",
      keyFor(id, "reader_progress"),
      keyFor(id, "reader_annotations")
    );
  });
}

export async function migrateLegacyPrivateFoldersToVault(): Promise<void> {
  const main = await getDatabase();
  const folders = await main.getAllAsync<{ id: string }>(
    "SELECT id FROM folders WHERE is_private = 1"
  );
  for (const folder of folders) {
    // Source remains marked private until the encrypted copy and assets are
    // durable, so an interrupted run is safely retried on the next unlock.
    await movePublicFolderToVaultSafe(folder.id, true);
  }
  if (folders.length > 0) {
    await Image.clearDiskCache().catch(() => undefined);
    await Image.clearMemoryCache().catch(() => undefined);
  }
}

export async function deleteVaultFolderSafe(
  id: string,
  strategy: FolderDeleteStrategy
): Promise<void> {
  const vault = await getPrivateVault();
  const count = await vault.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM bookmarks WHERE folder_id = ?",
    id
  );
  if (strategy === "keepBookmarks" && (count?.count ?? 0) > 0) {
    throw new Error(
      "Private links cannot be moved to public Uncategorized. Delete the links or move the folder back to public first."
    );
  }
  await vault.withTransactionAsync(async () => {
    if (strategy === "deleteBookmarks") {
      const rows = await vault.getAllAsync<{ id: string }>(
        "SELECT id FROM bookmarks WHERE folder_id = ?",
        id
      );
      for (const bookmark of rows) {
        await vault.runAsync(
          "DELETE FROM app_settings WHERE key IN (?, ?)",
          keyFor(bookmark.id, "reader_progress"),
          keyFor(bookmark.id, "reader_annotations")
        );
      }
      await vault.runAsync("DELETE FROM bookmarks WHERE folder_id = ?", id);
    }
    await vault.runAsync("DELETE FROM folders WHERE id = ?", id);
  });
}
