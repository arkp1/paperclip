import { getDatabase } from "@/core/database/database";
import {
  getPrivateVault,
  getPrivateVaultGeneration,
  isPrivateVaultGenerationCurrent,
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
import {
  deleteVaultFolderSafe,
  movePublicBookmarkToVaultSafe,
  movePublicFolderToVaultSafe,
  moveVaultBookmarkToPublicSafe,
  moveVaultFolderToPublicSafe,
} from "@/core/database/vaultTransfers";
import { getBookmarkTransfer } from "@/core/database/vaultTransferState";

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
  const generation = getPrivateVaultGeneration();
  const database = await getPrivateVault();
  const rows = await database.getAllAsync<FolderRow>(
    `${VAULT_FOLDER_SELECT}
     GROUP BY f.id
     ORDER BY f.sort_order ASC, f.name COLLATE NOCASE ASC`
  );
  if (!isPrivateVaultGenerationCurrent(generation)) {
    return [];
  }
  return rows.map(mapFolder);
}

export async function countVaultFolders(): Promise<number> {
  if (!isPrivateVaultOpen()) {
    return 0;
  }
  const generation = getPrivateVaultGeneration();
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM folders"
  );
  return isPrivateVaultGenerationCurrent(generation) ? (row?.count ?? 0) : 0;
}

export async function getVaultFolderById(id: string): Promise<Folder | null> {
  if (!isPrivateVaultOpen()) {
    return null;
  }
  const generation = getPrivateVaultGeneration();
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<FolderRow>(
    `${VAULT_FOLDER_SELECT}
     WHERE f.id = ?
     GROUP BY f.id`,
    id
  );
  if (!isPrivateVaultGenerationCurrent(generation)) {
    return null;
  }
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
  strategy: FolderDeleteStrategy
): Promise<void> {
  return deleteVaultFolderSafe(id, strategy);
}

export async function listVaultBookmarksInFolder(
  folderId: string,
  sort: BookmarkSortMode
): Promise<Bookmark[]> {
  const generation = getPrivateVaultGeneration();
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
       b.domain, b.preview_data_uri AS previewImagePath, NULL AS faviconPath,
       b.preview_status AS previewStatus, b.is_favorite AS isFavorite,
       b.created_at AS createdAt, b.updated_at AS updatedAt
     FROM bookmarks b
     WHERE b.folder_id = ?
     ORDER BY ${order}`,
    folderId
  );
  if (!isPrivateVaultGenerationCurrent(generation)) {
    return [];
  }
  return rows.map(mapBookmark);
}

export async function getVaultBookmarkById(
  id: string
): Promise<Bookmark | null> {
  if (!isPrivateVaultOpen()) {
    return null;
  }
  const generation = getPrivateVaultGeneration();
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<BookmarkRow>(
    `SELECT
       b.id, b.original_url AS originalUrl, b.canonical_url AS canonicalUrl,
       b.title, b.title_is_user_edited AS titleIsUserEdited, b.description,
       b.note, b.folder_id AS folderId, b.source_name AS sourceName,
       b.domain, b.preview_data_uri AS previewImagePath, NULL AS faviconPath,
       b.preview_status AS previewStatus, b.is_favorite AS isFavorite,
       b.created_at AS createdAt, b.updated_at AS updatedAt
     FROM bookmarks b WHERE b.id = ?`,
    id
  );
  if (!isPrivateVaultGenerationCurrent(generation)) {
    return null;
  }
  return row ? mapBookmark(row) : null;
}

export async function isVaultFolder(id: string): Promise<boolean> {
  if (!isPrivateVaultOpen()) {
    return false;
  }
  const generation = getPrivateVaultGeneration();
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<{ id: string }>(
    "SELECT id FROM folders WHERE id = ?",
    id
  );
  return isPrivateVaultGenerationCurrent(generation) && Boolean(row);
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
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      "DELETE FROM app_settings WHERE key IN (?, ?)",
      `reader_progress:${id}`,
      `reader_annotations:${id}`
    );
    await database.runAsync("DELETE FROM bookmarks WHERE id = ?", id);
  });
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
  const generation = getPrivateVaultGeneration();
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<{ id: string }>(
    "SELECT id FROM bookmarks WHERE id = ?",
    id
  );
  return isPrivateVaultGenerationCurrent(generation) && Boolean(row);
}

export type BookmarkPrivacy = "private" | "public" | "unavailable";

/**
 * Classifies a bookmark without treating a closed vault as public membership.
 * A locked vault returns "unavailable" for private records so callers fail
 * closed instead of writing sensitive settings to the public database.
 */
export async function getBookmarkPrivacy(
  id: string
): Promise<BookmarkPrivacy> {
  const transfer = await getBookmarkTransfer(id);
  if (transfer?.target === "private") {
    return isPrivateVaultOpen() ? "private" : "unavailable";
  }

  const main = await getDatabase();
  if (transfer?.target === "public") {
    const publicRow = await main.getFirstAsync<{ id: string }>(
      "SELECT id FROM bookmarks WHERE id = ?",
      id
    );
    if (publicRow) {
      return "public";
    }
  }

  if (isPrivateVaultOpen()) {
    const generation = getPrivateVaultGeneration();
    const privateDatabase = await getPrivateVault();
    const privateRow = await privateDatabase.getFirstAsync<{ id: string }>(
      "SELECT id FROM bookmarks WHERE id = ?",
      id
    );
    if (!isPrivateVaultGenerationCurrent(generation)) {
      return "unavailable";
    }
    if (privateRow) {
      return "private";
    }
  }
  const publicRow = await main.getFirstAsync<{ isPrivate: number }>(
    `SELECT COALESCE(f.is_private, 0) AS isPrivate
     FROM bookmarks b
     LEFT JOIN folders f ON f.id = b.folder_id
     WHERE b.id = ?`,
    id
  );
  if (!publicRow) {
    return "unavailable";
  }
  // A legacy private row still in the public DB is not a safe public result;
  // it must be migrated into the vault after authentication.
  return publicRow.isPrivate === 1 ? "unavailable" : "public";
}

export async function moveVaultFolderToPublic(folderId: string): Promise<void> {
  return moveVaultFolderToPublicSafe(folderId);
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
  return moveVaultBookmarkToPublicSafe(id, folderId);
}

export async function movePublicBookmarkToVault(
  id: string,
  folderId: string
): Promise<void> {
  return movePublicBookmarkToVaultSafe(id, folderId);
}

export async function getVaultArticle(
  bookmarkId: string
): Promise<{
  blocks: string;
  wordCount: number;
  fetchedAt: number;
  cacheVersion: number;
} | null> {
  const generation = getPrivateVaultGeneration();
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<{
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
  if (!isPrivateVaultGenerationCurrent(generation)) {
    return null;
  }
  return row;
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
  return movePublicFolderToVaultSafe(folderId);
}
