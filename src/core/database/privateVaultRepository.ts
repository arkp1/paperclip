import { getDatabase } from "@/core/database/database";
import {
  getPrivateVault,
  isPrivateVaultOpen,
} from "@/core/database/privateVault";
import { createId } from "@/core/utils/id";
import {
  FolderNameTakenError,
  FolderNotFoundError,
  InvalidFolderNameError,
} from "@/features/folders/errors";
import type {
  Folder,
  FolderDeleteStrategy,
} from "@/features/folders/types";
import type {
  Bookmark,
  BookmarkSortMode,
  PreviewStatus,
} from "@/features/bookmarks/types";
import { isFolderColorKey, type FolderColorKey } from "@/theme/colors";
import { Paths, File } from "expo-file-system";
import { Image } from "expo-image";

type FolderRow = {
  id: string;
  name: string;
  iconKey: string | null;
  colorKey: string | null;
  sortOrder: number;
  lastOpenedAt: number | null;
  createdAt: number;
  updatedAt: number;
  bookmarkCount: number | null;
};

type BookmarkRow = {
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
  previewImagePath: string | null;
  faviconPath: string | null;
  previewStatus: string;
  isFavorite: number;
  createdAt: number;
  updatedAt: number;
};

const PREVIEW_STATUSES: readonly PreviewStatus[] = [
  "pending",
  "success",
  "partial",
  "unavailable",
  "failed",
];

function toPreviewStatus(value: string): PreviewStatus {
  return PREVIEW_STATUSES.includes(value as PreviewStatus)
    ? (value as PreviewStatus)
    : "pending";
}

function mapFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name,
    iconKey: row.iconKey,
    colorKey: isFolderColorKey(row.colorKey) ? row.colorKey : null,
    isPrivate: true,
    sortOrder: row.sortOrder,
    lastOpenedAt: row.lastOpenedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    bookmarkCount: row.bookmarkCount,
  };
}

function mapBookmark(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    originalUrl: row.originalUrl,
    canonicalUrl: row.canonicalUrl,
    title: row.title,
    titleIsUserEdited: row.titleIsUserEdited === 1,
    description: row.description,
    note: row.note,
    folderId: row.folderId,
    sourceName: row.sourceName,
    domain: row.domain,
    previewImagePath: row.previewImagePath,
    faviconPath: row.faviconPath,
    previewStatus: toPreviewStatus(row.previewStatus),
    isFavorite: row.isFavorite === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const VAULT_FOLDER_SELECT = `
SELECT
  f.id, f.name, f.icon_key AS iconKey, f.color_key AS colorKey,
  f.sort_order AS sortOrder, f.last_opened_at AS lastOpenedAt,
  f.created_at AS createdAt, f.updated_at AS updatedAt,
  COUNT(b.id) AS bookmarkCount
FROM folders f
LEFT JOIN bookmarks b ON b.folder_id = f.id
`;

export async function getVaultFolders(): Promise<Folder[]> {
  const database = await getPrivateVault();
  const rows = await database.getAllAsync<FolderRow>(
    `${VAULT_FOLDER_SELECT}
     GROUP BY f.id
     ORDER BY f.sort_order ASC, f.name COLLATE NOCASE ASC`
  );
  return rows.map(mapFolder);
}

export async function countVaultFolders(): Promise<number> {
  if (!isPrivateVaultOpen()) {
    return 0;
  }
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM folders"
  );
  return row?.count ?? 0;
}

export async function getVaultFolderById(id: string): Promise<Folder | null> {
  if (!isPrivateVaultOpen()) {
    return null;
  }
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<FolderRow>(
    `${VAULT_FOLDER_SELECT}
     WHERE f.id = ?
     GROUP BY f.id`,
    id
  );
  return row ? mapFolder(row) : null;
}

export async function createVaultFolder(
  name: string,
  colorKey: FolderColorKey
): Promise<Folder> {
  const database = await getPrivateVault();
  const now = Date.now();
  const id = createId();
  try {
    await database.runAsync(
      `INSERT INTO folders
       (id, name, icon_key, color_key, sort_order, last_opened_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      name,
      null,
      colorKey,
      0,
      null,
      now,
      now
    );
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) {
      throw new FolderNameTakenError();
    }
    throw error;
  }
  const created = await getVaultFolderById(id);
  if (!created) {
    throw new InvalidFolderNameError("The folder could not be read back.");
  }
  return created;
}

export async function updateVaultFolderName(
  id: string,
  name: string
): Promise<void> {
  const database = await getPrivateVault();
  try {
    const result = await database.runAsync(
      "UPDATE folders SET name = ?, updated_at = ? WHERE id = ?",
      name,
      Date.now(),
      id
    );
    if (result.changes === 0) {
      throw new FolderNotFoundError();
    }
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) {
      throw new FolderNameTakenError();
    }
    throw error;
  }
}

export async function updateVaultFolderColor(
  id: string,
  colorKey: FolderColorKey | null
): Promise<void> {
  const database = await getPrivateVault();
  const result = await database.runAsync(
    "UPDATE folders SET color_key = ?, updated_at = ? WHERE id = ?",
    colorKey,
    Date.now(),
    id
  );
  if (result.changes === 0) {
    throw new FolderNotFoundError();
  }
}

export async function markVaultFolderOpened(
  id: string,
  openedAt: number
): Promise<void> {
  const database = await getPrivateVault();
  await database.runAsync(
    "UPDATE folders SET last_opened_at = ?, updated_at = ? WHERE id = ?",
    openedAt,
    Date.now(),
    id
  );
}

export async function deleteVaultFolder(
  id: string,
  _strategy: FolderDeleteStrategy
): Promise<void> {
  const database = await getPrivateVault();
  await database.withTransactionAsync(async () => {
    // Private contents must never be moved into public Uncategorized.
    await database.runAsync("DELETE FROM bookmarks WHERE folder_id = ?", id);
    await database.runAsync("DELETE FROM folders WHERE id = ?", id);
  });
}

export async function listVaultBookmarksInFolder(
  folderId: string,
  sort: BookmarkSortMode
): Promise<Bookmark[]> {
  const database = await getPrivateVault();
  const order =
    sort === "oldest"
      ? "b.created_at ASC"
      : sort === "title"
        ? "b.title COLLATE NOCASE ASC, b.created_at DESC"
        : "b.created_at DESC";
  const rows = await database.getAllAsync<BookmarkRow>(
    `SELECT
       b.id, b.original_url AS originalUrl, b.canonical_url AS canonicalUrl,
       b.title, b.title_is_user_edited AS titleIsUserEdited, b.description,
       b.note, b.folder_id AS folderId, b.source_name AS sourceName,
       b.domain, NULL AS previewImagePath, NULL AS faviconPath,
       b.preview_status AS previewStatus, b.is_favorite AS isFavorite,
       b.created_at AS createdAt, b.updated_at AS updatedAt
     FROM bookmarks b
     WHERE b.folder_id = ?
     ORDER BY ${order}`,
    folderId
  );
  return rows.map(mapBookmark);
}

export async function getVaultBookmarkById(
  id: string
): Promise<Bookmark | null> {
  if (!isPrivateVaultOpen()) {
    return null;
  }
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<BookmarkRow>(
    `SELECT
       b.id, b.original_url AS originalUrl, b.canonical_url AS canonicalUrl,
       b.title, b.title_is_user_edited AS titleIsUserEdited, b.description,
       b.note, b.folder_id AS folderId, b.source_name AS sourceName,
       b.domain, NULL AS previewImagePath, NULL AS faviconPath,
       b.preview_status AS previewStatus, b.is_favorite AS isFavorite,
       b.created_at AS createdAt, b.updated_at AS updatedAt
     FROM bookmarks b WHERE b.id = ?`,
    id
  );
  return row ? mapBookmark(row) : null;
}

export async function isVaultFolder(id: string): Promise<boolean> {
  if (!isPrivateVaultOpen()) {
    return false;
  }
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<{ id: string }>(
    "SELECT id FROM folders WHERE id = ?",
    id
  );
  return Boolean(row);
}

export async function updateVaultBookmarkFavorite(
  id: string,
  favorite: boolean
): Promise<void> {
  const database = await getPrivateVault();
  const result = await database.runAsync(
    "UPDATE bookmarks SET is_favorite = ?, updated_at = ? WHERE id = ?",
    favorite ? 1 : 0,
    Date.now(),
    id
  );
  if (result.changes === 0) {
    throw new Error("Private bookmark not found.");
  }
}

export async function updateVaultBookmarkContent(
  id: string,
  input: {
    title: string;
    note: string | null;
  }
): Promise<void> {
  const database = await getPrivateVault();
  const result = await database.runAsync(
    "UPDATE bookmarks SET title = ?, note = ?, title_is_user_edited = 1, updated_at = ? WHERE id = ?",
    input.title,
    input.note,
    Date.now(),
    id
  );
  if (result.changes === 0) {
    throw new Error("Private bookmark not found.");
  }
}

export async function deleteVaultBookmark(id: string): Promise<void> {
  const database = await getPrivateVault();
  await database.runAsync("DELETE FROM bookmarks WHERE id = ?", id);
}

export async function moveVaultBookmark(
  id: string,
  folderId: string | null
): Promise<void> {
  const database = await getPrivateVault();
  if (folderId) {
    const folder = await database.getFirstAsync<{ id: string }>(
      "SELECT id FROM folders WHERE id = ?",
      folderId
    );
    if (!folder) {
      throw new FolderNotFoundError();
    }
  }
  const result = await database.runAsync(
    "UPDATE bookmarks SET folder_id = ?, updated_at = ? WHERE id = ?",
    folderId,
    Date.now(),
    id
  );
  if (result.changes === 0) {
    throw new Error("Private bookmark not found.");
  }
}

export async function isVaultBookmark(id: string): Promise<boolean> {
  if (!isPrivateVaultOpen()) {
    return false;
  }
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<{ id: string }>(
    "SELECT id FROM bookmarks WHERE id = ?",
    id
  );
  return Boolean(row);
}

export async function moveVaultFolderToPublic(folderId: string): Promise<void> {
  const vault = await getPrivateVault();
  const folder = await vault.getFirstAsync<FolderRow>(
    `SELECT id, name, icon_key AS iconKey, color_key AS colorKey,
            sort_order AS sortOrder, last_opened_at AS lastOpenedAt,
            created_at AS createdAt, updated_at AS updatedAt,
            NULL AS bookmarkCount
     FROM folders WHERE id = ?`,
    folderId
  );
  if (!folder) {
    throw new FolderNotFoundError();
  }
  const bookmarks = await vault.getAllAsync<BookmarkRow>(
    `SELECT id, original_url AS originalUrl, canonical_url AS canonicalUrl,
            title, title_is_user_edited AS titleIsUserEdited, description,
            note, folder_id AS folderId, source_name AS sourceName, domain,
            preview_status AS previewStatus, is_favorite AS isFavorite,
            created_at AS createdAt, updated_at AS updatedAt,
            NULL AS previewImagePath, NULL AS faviconPath
     FROM bookmarks WHERE folder_id = ?`,
    folderId
  );
  const main = await getDatabase();

  await main.withTransactionAsync(async () => {
    await main.runAsync(
      `INSERT INTO folders
       (id, name, icon_key, color_key, is_private, sort_order, last_opened_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`,
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
      await main.runAsync(
        `INSERT INTO bookmarks
         (id, original_url, canonical_url, title, title_is_user_edited,
          description, note, folder_id, source_name, domain, preview_image_path,
          favicon_path, preview_status, is_favorite, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)`,
        bookmark.id,
        bookmark.originalUrl,
        bookmark.canonicalUrl,
        bookmark.title,
        bookmark.titleIsUserEdited,
        bookmark.description,
        bookmark.note,
        folderId,
        bookmark.sourceName,
        bookmark.domain,
        bookmark.previewStatus,
        bookmark.isFavorite,
        bookmark.createdAt,
        bookmark.updatedAt
      );
    }
  });

  await vault.withTransactionAsync(async () => {
    await vault.runAsync("DELETE FROM bookmarks WHERE folder_id = ?", folderId);
    await vault.runAsync("DELETE FROM folders WHERE id = ?", folderId);
  });
}

export async function moveVaultArticleToPublic(
  bookmarkId: string
): Promise<void> {
  const vault = await getPrivateVault();
  const row = await vault.getFirstAsync<{
    blocks: string;
    wordCount: number;
    fetchedAt: number;
    cacheVersion: number;
  }>(
    `SELECT blocks, word_count AS wordCount, fetched_at AS fetchedAt,
            cache_version AS cacheVersion
     FROM article_contents WHERE bookmark_id = ?`,
    bookmarkId
  );
  if (!row) {
    return;
  }
  const main = await getDatabase();
  await main.runAsync(
    `INSERT INTO article_contents
     (bookmark_id, blocks, word_count, fetched_at, cache_version)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(bookmark_id) DO UPDATE SET
       blocks = excluded.blocks,
       word_count = excluded.word_count,
       fetched_at = excluded.fetched_at,
       cache_version = excluded.cache_version`,
    bookmarkId,
    row.blocks,
    row.wordCount,
    row.fetchedAt,
    row.cacheVersion
  );
  await vault.runAsync(
    "DELETE FROM article_contents WHERE bookmark_id = ?",
    bookmarkId
  );
}

export async function moveVaultBookmarkToPublic(
  id: string,
  folderId: string | null
): Promise<void> {
  const vault = await getPrivateVault();
  const bookmark = await vault.getFirstAsync<BookmarkRow>(
    `SELECT id, original_url AS originalUrl, canonical_url AS canonicalUrl,
            title, title_is_user_edited AS titleIsUserEdited, description,
            note, folder_id AS folderId, source_name AS sourceName, domain,
            preview_status AS previewStatus, is_favorite AS isFavorite,
            created_at AS createdAt, updated_at AS updatedAt,
            NULL AS previewImagePath, NULL AS faviconPath
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
  await main.runAsync(
    `INSERT INTO bookmarks
     (id, original_url, canonical_url, title, title_is_user_edited, description,
      note, folder_id, source_name, domain, preview_image_path, favicon_path,
      preview_status, is_favorite, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)`,
    bookmark.id,
    bookmark.originalUrl,
    bookmark.canonicalUrl,
    bookmark.title,
    bookmark.titleIsUserEdited,
    bookmark.description,
    bookmark.note,
    folderId,
    bookmark.sourceName,
    bookmark.domain,
    bookmark.previewStatus,
    bookmark.isFavorite,
    bookmark.createdAt,
    bookmark.updatedAt
  );
  await vault.runAsync("DELETE FROM bookmarks WHERE id = ?", id);
}

export async function getVaultArticle(
  bookmarkId: string
): Promise<{
  blocks: string;
  wordCount: number;
  fetchedAt: number;
  cacheVersion: number;
} | null> {
  const database = await getPrivateVault();
  return database.getFirstAsync(
    `SELECT blocks, word_count AS wordCount, fetched_at AS fetchedAt,
            cache_version AS cacheVersion
     FROM article_contents WHERE bookmark_id = ?`,
    bookmarkId
  );
}

export async function saveVaultArticle(
  bookmarkId: string,
  blocks: string,
  wordCount: number,
  fetchedAt: number,
  cacheVersion: number
): Promise<void> {
  const database = await getPrivateVault();
  await database.runAsync(
    `INSERT INTO article_contents
     (bookmark_id, blocks, word_count, fetched_at, cache_version)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(bookmark_id) DO UPDATE SET
       blocks = excluded.blocks,
       word_count = excluded.word_count,
       fetched_at = excluded.fetched_at,
       cache_version = excluded.cache_version`,
    bookmarkId,
    blocks,
    wordCount,
    fetchedAt,
    cacheVersion
  );
}

/**
 * Moves a public folder and its metadata into the encrypted vault. Preview
 * files are removed rather than copied because the vault intentionally avoids
 * plaintext private assets.
 */
export async function movePublicFolderToVault(folderId: string): Promise<void> {
  const main = await getDatabase();
  const folder = await main.getFirstAsync<FolderRow>(
    `SELECT id, name, icon_key AS iconKey, color_key AS colorKey,
            sort_order AS sortOrder, last_opened_at AS lastOpenedAt,
            created_at AS createdAt, updated_at AS updatedAt,
            NULL AS bookmarkCount
     FROM folders WHERE id = ?`,
    folderId
  );
  if (!folder) {
    throw new FolderNotFoundError();
  }
  const bookmarks = await main.getAllAsync<BookmarkRow>(
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

  await main.runAsync(
    "UPDATE folders SET is_private = 1, updated_at = ? WHERE id = ?",
    Date.now(),
    folderId
  );

  try {
    await vault.withTransactionAsync(async () => {
      await vault.runAsync(
        `INSERT INTO folders
         (id, name, icon_key, color_key, sort_order, last_opened_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
        await vault.runAsync(
          `INSERT INTO bookmarks
           (id, original_url, canonical_url, title, title_is_user_edited,
            description, note, folder_id, source_name, domain, favicon_path,
            preview_status, is_favorite, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          bookmark.id,
          bookmark.originalUrl,
          bookmark.canonicalUrl,
          bookmark.title,
          bookmark.titleIsUserEdited,
          bookmark.description,
          bookmark.note,
          folderId,
          bookmark.sourceName,
          bookmark.domain,
          null,
          bookmark.previewStatus,
          bookmark.isFavorite,
          bookmark.createdAt,
          bookmark.updatedAt
        );
      }
    });
  } catch (error) {
    await main.runAsync(
      "UPDATE folders SET is_private = 0, updated_at = ? WHERE id = ?",
      Date.now(),
      folderId
    );
    throw error;
  }

  for (const bookmark of bookmarks) {
    if (bookmark.previewImagePath) {
      try {
        const file = new File(Paths.document, bookmark.previewImagePath);
        if (file.exists) {
          file.delete();
        }
      } catch {
        // Best-effort plaintext asset removal.
      }
    }
    await main
      .runAsync(
        "DELETE FROM app_settings WHERE key IN (?, ?)",
        `reader_progress:${bookmark.id}`,
        `reader_annotations:${bookmark.id}`
      )
      .catch(() => undefined);
  }

  await main.runAsync("DELETE FROM bookmarks WHERE folder_id = ?", folderId);
  await main.runAsync("DELETE FROM folders WHERE id = ?", folderId);
  await Image.clearDiskCache().catch(() => undefined);
  await Image.clearMemoryCache().catch(() => undefined);
}
