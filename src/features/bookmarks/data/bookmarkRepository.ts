import { getDatabase } from "@/core/database/database";
import { isPrivateSpaceUnlocked } from "@/core/security/privateSpaceSession";
import { createId } from "@/core/utils/id";
import {
  FolderNotFoundError,
  PrivateFolderLockedError,
} from "@/features/folders/errors";
import type {
  Bookmark,
  BookmarkCollection,
  BookmarkSortMode,
  BookmarkView,
  CreateBookmarkInput,
  PreviewStatus,
} from "@/features/bookmarks/types";
import { normalizeUrlForComparison } from "@/shared/utils/url";

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

type BookmarkListRow = BookmarkRow & {
  folderName: string | null;
};

const PREVIEW_STATUSES: readonly PreviewStatus[] = [
  "pending",
  "success",
  "partial",
  "unavailable",
  "failed",
];

const PUBLIC_BOOKMARKS_FILTER = "(f.is_private IS NULL OR f.is_private = 0)";

const BOOKMARK_SELECT = `
SELECT
  b.id,
  b.original_url AS originalUrl,
  b.canonical_url AS canonicalUrl,
  b.title,
  b.title_is_user_edited AS titleIsUserEdited,
  b.description,
  b.note,
  b.folder_id AS folderId,
  b.source_name AS sourceName,
  b.domain,
  b.preview_image_path AS previewImagePath,
  b.favicon_path AS faviconPath,
  b.preview_status AS previewStatus,
  b.is_favorite AS isFavorite,
  b.created_at AS createdAt,
  b.updated_at AS updatedAt,
  f.name AS folderName
FROM bookmarks b
LEFT JOIN folders f ON f.id = b.folder_id
`;

function toPreviewStatus(value: string): PreviewStatus {
  return PREVIEW_STATUSES.includes(value as PreviewStatus)
    ? (value as PreviewStatus)
    : "pending";
}

function mapBookmarkRow(row: BookmarkRow): Bookmark {
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

function collectionFilter(collection: BookmarkCollection): string {
  if (collection === "uncategorized") {
    return "AND b.folder_id IS NULL";
  }
  if (collection === "favorites") {
    return "AND b.is_favorite = 1";
  }
  return "";
}

function bookmarkOrderBy(sort: BookmarkSortMode): string {
  switch (sort) {
    case "oldest":
      return "b.created_at ASC";
    case "title":
      return "b.title COLLATE NOCASE ASC, b.created_at DESC";
    case "recent":
    default:
      return "b.created_at DESC";
  }
}

export async function countPublicBookmarks(
  collection: BookmarkCollection
): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM bookmarks b
     LEFT JOIN folders f ON f.id = b.folder_id
     WHERE ${PUBLIC_BOOKMARKS_FILTER}
     ${collectionFilter(collection)}`
  );
  return row?.count ?? 0;
}

export async function listPublicBookmarks(
  collection: BookmarkCollection,
  limit = 100,
  offset = 0,
  sort: BookmarkSortMode = "recent"
): Promise<BookmarkView[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<BookmarkListRow>(
    `${BOOKMARK_SELECT}
     WHERE ${PUBLIC_BOOKMARKS_FILTER}
     ${collectionFilter(collection)}
     ORDER BY ${bookmarkOrderBy(sort)}
     LIMIT ? OFFSET ?`,
    limit,
    offset
  );
  return rows.map((row) => ({ ...mapBookmarkRow(row), folderName: row.folderName }));
}

export async function getPublicBookmarkById(
  id: string
): Promise<BookmarkView | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<BookmarkListRow>(
    `${BOOKMARK_SELECT}
     WHERE b.id = ? AND ${PUBLIC_BOOKMARKS_FILTER}`,
    id
  );

  return row
    ? { ...mapBookmarkRow(row), folderName: row.folderName ?? null }
    : null;
}

/**
 * Reader access: public bookmarks always, private bookmarks only while the
 * private-space session is unlocked.
 */
export async function getReadableBookmarkById(
  id: string
): Promise<Bookmark | null> {
  const bookmark = await getBookmarkById(id);
  if (!bookmark) {
    return null;
  }

  if (bookmark.folderId) {
    const database = await getDatabase();
    const folder = await database.getFirstAsync<{ isPrivate: number }>(
      "SELECT is_private AS isPrivate FROM folders WHERE id = ?",
      bookmark.folderId
    );
    if (folder?.isPrivate === 1 && !isPrivateSpaceUnlocked()) {
      return null;
    }
  }

  return bookmark;
}

export async function listBookmarksInFolder(
  folderId: string,
  sort: BookmarkSortMode = "recent"
): Promise<Bookmark[]> {
  const database = await getDatabase();

  const folder = await database.getFirstAsync<{ isPrivate: number }>(
    "SELECT is_private AS isPrivate FROM folders WHERE id = ?",
    folderId
  );
  if (!folder) {
    throw new FolderNotFoundError();
  }
  if (folder.isPrivate === 1 && !isPrivateSpaceUnlocked()) {
    throw new PrivateFolderLockedError();
  }

  const rows = await database.getAllAsync<BookmarkRow>(
    `${BOOKMARK_SELECT}
     WHERE b.folder_id = ?
     ORDER BY ${bookmarkOrderBy(sort)}
     LIMIT ? OFFSET ?`,
    folderId,
    200,
    0
  );
  return rows.map(mapBookmarkRow);
}

export async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  const database = await getDatabase();
  const id = createId();
  const now = Date.now();

  await database.runAsync(
    `INSERT INTO bookmarks
       (id, original_url, canonical_url, title, title_is_user_edited, description,
        note, folder_id, source_name, domain, preview_image_path, favicon_path,
        preview_status, preview_fetched_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, ?, ?)`,
    id,
    input.originalUrl,
    input.canonicalUrl,
    input.title,
    input.titleIsUserEdited ? 1 : 0,
    input.description,
    input.note,
    input.folderId,
    input.sourceName,
    input.domain,
    input.previewStatus,
    now,
    now
  );

  const bookmark = await getBookmarkById(id);
  if (!bookmark) {
    throw new Error("The link was saved but could not be read back.");
  }
  return bookmark;
}

export async function getBookmarkById(id: string): Promise<Bookmark | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<BookmarkRow>(
    `${BOOKMARK_SELECT}
     WHERE b.id = ?`,
    id
  );
  return row ? mapBookmarkRow(row) : null;
}

/**
 * Duplicate detection is a product-level check, not a unique constraint. Only
 * public bookmarks are considered so a locked private folder cannot be probed.
 */
export async function findBookmarkByUrl(rawUrl: string): Promise<Bookmark | null> {
  const database = await getDatabase();
  const normalized = normalizeUrlForComparison(rawUrl);

  const rows = await database.getAllAsync<BookmarkRow>(
    `${BOOKMARK_SELECT}
     WHERE ${PUBLIC_BOOKMARKS_FILTER}
     ORDER BY b.created_at DESC
     LIMIT 500`
  );

  const match = rows.find(
    (row) => normalizeUrlForComparison(row.originalUrl) === normalized
  );

  return match ? mapBookmarkRow(match) : null;
}

export async function setBookmarkFavorite(
  id: string,
  isFavorite: boolean
): Promise<void> {
  const database = await getDatabase();
  const result = await database.runAsync(
    "UPDATE bookmarks SET is_favorite = ?, updated_at = ? WHERE id = ?",
    isFavorite ? 1 : 0,
    Date.now(),
    id
  );

  if (result.changes === 0) {
    throw new Error("This bookmark no longer exists.");
  }
}

export async function updateBookmarkContent(
  id: string,
  input: { title: string; note: string | null }
): Promise<void> {
  const title = input.title.trim();
  if (title.length === 0) {
    throw new Error("A bookmark needs a title.");
  }

  const database = await getDatabase();
  const result = await database.runAsync(
    `UPDATE bookmarks
     SET title = ?, title_is_user_edited = 1, note = ?, updated_at = ?
     WHERE id = ?`,
    title,
    input.note,
    Date.now(),
    id
  );

  if (result.changes === 0) {
    throw new Error("This bookmark no longer exists.");
  }
}

export async function moveBookmark(id: string, folderId: string | null): Promise<void> {
  const database = await getDatabase();
  const result = await database.runAsync(
    "UPDATE bookmarks SET folder_id = ?, updated_at = ? WHERE id = ?",
    folderId,
    Date.now(),
    id
  );

  if (result.changes === 0) {
    throw new Error("This bookmark no longer exists.");
  }
}

export async function updateBookmarkPreviewAsset(
  id: string,
  input: {
    previewImagePath: string | null;
    previewStatus: PreviewStatus;
    previewFetchedAt: number;
  }
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE bookmarks
     SET preview_image_path = ?, preview_status = ?, preview_fetched_at = ?, updated_at = ?
     WHERE id = ?`,
    input.previewImagePath,
    input.previewStatus,
    input.previewFetchedAt,
    Date.now(),
    id
  );
}

export async function updateBookmarkMetadata(
  id: string,
  input: {
    title: string | null;
    description: string | null;
    sourceName: string | null;
    canonicalUrl: string | null;
    previewStatus: PreviewStatus;
    previewFetchedAt: number;
    previewImagePath: string | null;
  }
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE bookmarks
     SET title = CASE
           WHEN title_is_user_edited = 0 AND ? IS NOT NULL THEN ?
           ELSE title
         END,
         description = COALESCE(?, description),
         source_name = COALESCE(?, source_name),
         canonical_url = COALESCE(?, canonical_url),
         preview_status = ?,
         preview_fetched_at = ?,
         preview_image_path = ?,
         updated_at = ?
     WHERE id = ?`,
    input.title,
    input.title,
    input.description,
    input.sourceName,
    input.canonicalUrl,
    input.previewStatus,
    input.previewFetchedAt,
    input.previewImagePath,
    Date.now(),
    id
  );
}

export async function deleteBookmark(id: string): Promise<void> {
  const database = await getDatabase();
  const result = await database.runAsync("DELETE FROM bookmarks WHERE id = ?", id);

  if (result.changes === 0) {
    throw new Error("This bookmark no longer exists.");
  }
}

export async function searchPublicBookmarks(  rawQuery: string,
  limit = 60
): Promise<BookmarkView[]> {
  const query = rawQuery.trim();
  if (query.length === 0) {
    return [];
  }

  const pattern = `%${escapeLikePattern(query)}%`;
  const database = await getDatabase();

  const rows = await database.getAllAsync<BookmarkListRow>(
    `${BOOKMARK_SELECT}
     WHERE ${PUBLIC_BOOKMARKS_FILTER}
       AND (
         b.title LIKE ? ESCAPE '\\'
         OR b.original_url LIKE ? ESCAPE '\\'
         OR b.domain LIKE ? ESCAPE '\\'
         OR b.description LIKE ? ESCAPE '\\'
         OR b.note LIKE ? ESCAPE '\\'
         OR f.name LIKE ? ESCAPE '\\'
       )
     ORDER BY b.created_at DESC
     LIMIT ?`,
    pattern,
    pattern,
    pattern,
    pattern,
    pattern,
    pattern,
    limit
  );

  return rows.map((row) => ({ ...mapBookmarkRow(row), folderName: row.folderName }));
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}
