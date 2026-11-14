import { getDatabase } from "@/core/database/database";
import {
  countVaultFolders,
  createVaultFolder,
  deleteVaultFolder,
  getVaultFolderById,
  getVaultFolders,
  isVaultFolder,
  markVaultFolderOpened,
  movePublicFolderToVault,
  moveVaultFolderToPublic,
  updateVaultFolderColor,
  updateVaultFolderName,
} from "@/core/database/privateVaultRepository";
import { isPrivateVaultOpen } from "@/core/database/privateVault";
import { deletePreviewImage } from "@/core/files/previewFileStore";
import { isPrivateSpaceUnlocked } from "@/core/security/privateSpaceSession";
import { createId } from "@/core/utils/id";
import { isFolderColorKey, type FolderColorKey } from "@/theme/colors";
import {
  FolderNameTakenError,
  FolderNotFoundError,
  InvalidFolderNameError,
} from "@/features/folders/errors";
import type {
  CreateFolderInput,
  Folder,
  FolderDeleteStrategy,
} from "@/features/folders/types";
import { validateFolderName } from "@/features/folders/validation";

type FolderRow = {
  id: string;
  name: string;
  iconKey: string | null;
  colorKey: string | null;
  isPrivate: number;
  sortOrder: number;
  lastOpenedAt: number | null;
  createdAt: number;
  updatedAt: number;
  bookmarkCount: number | null;
};

/**
 * Counts for private folders are masked at the query boundary. They are only
 * exposed once a private session can legitimately read that folder.
 */
const FOLDER_SELECT = `
SELECT
  f.id,
  f.name,
  f.icon_key AS iconKey,
  f.color_key AS colorKey,
  f.is_private AS isPrivate,
  f.sort_order AS sortOrder,
  f.last_opened_at AS lastOpenedAt,
  f.created_at AS createdAt,
  f.updated_at AS updatedAt,
  CASE WHEN f.is_private = 1 THEN NULL ELSE COUNT(b.id) END AS bookmarkCount
FROM folders f
LEFT JOIN bookmarks b ON b.folder_id = f.id
`;

function mapFolderRow(row: FolderRow): Folder {
  const colorKey: FolderColorKey | null = isFolderColorKey(row.colorKey)
    ? row.colorKey
    : null;

  return {
    id: row.id,
    name: row.name,
    iconKey: row.iconKey,
    colorKey,
    isPrivate: row.isPrivate === 1,
    sortOrder: row.sortOrder,
    lastOpenedAt: row.lastOpenedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    bookmarkCount: row.bookmarkCount,
  };
}

const PRIVATE_FOLDER_SELECT = `
SELECT
  f.id,
  f.name,
  f.icon_key AS iconKey,
  f.color_key AS colorKey,
  f.is_private AS isPrivate,
  f.sort_order AS sortOrder,
  f.last_opened_at AS lastOpenedAt,
  f.created_at AS createdAt,
  f.updated_at AS updatedAt,
  COUNT(b.id) AS bookmarkCount
FROM folders f
LEFT JOIN bookmarks b ON b.folder_id = f.id
`;

export async function getAllFolders(): Promise<Folder[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<FolderRow>(
    `${FOLDER_SELECT}
     WHERE f.is_private = 0
     GROUP BY f.id
     ORDER BY f.sort_order ASC, f.name COLLATE NOCASE ASC`
  );
  return rows.map(mapFolderRow);
}

export async function getPrivateFolders(): Promise<Folder[]> {
  if (!isPrivateSpaceUnlocked()) {
    throw new Error("Private folders are locked.");
  }
  return getVaultFolders();
}

export async function countPrivateFolders(): Promise<number> {
  return countVaultFolders();
}

/**
 * Home shows recently opened folders first. Folders that have never been
 * opened fall back to their creation time so a freshly created folder is still
 * reachable from Home; the written specification allows this documented
 * fallback and it is applied consistently by this single query.
 */
export async function getRecentFolders(limit: number): Promise<Folder[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<FolderRow>(
    `${FOLDER_SELECT}
     WHERE f.is_private = 0
     GROUP BY f.id
     ORDER BY COALESCE(f.last_opened_at, f.created_at) DESC
     LIMIT ?`,
    limit
  );
  return rows.map(mapFolderRow);
}

export async function setFolderColor(
  folderId: string,
  colorKey: FolderColorKey | null
): Promise<void> {
  if (await isVaultFolder(folderId)) {
    await updateVaultFolderColor(folderId, colorKey);
    return;
  }
  const database = await getDatabase();
  const result = await database.runAsync(
    "UPDATE folders SET color_key = ?, updated_at = ? WHERE id = ?",
    colorKey,
    Date.now(),
    folderId
  );

  if (result.changes === 0) {
    throw new FolderNotFoundError();
  }
}

export async function setFolderPrivate(
  folderId: string,
  isPrivate: boolean
): Promise<void> {
  if (isPrivate) {
    if (!isPrivateSpaceUnlocked()) {
      throw new Error("Unlock the private space first.");
    }
    if (await isVaultFolder(folderId)) {
      return;
    }
    await movePublicFolderToVault(folderId);
    return;
  }

  if (await isVaultFolder(folderId)) {
    await moveVaultFolderToPublic(folderId);
    return;
  }

  const database = await getDatabase();
  const result = await database.runAsync(
    "UPDATE folders SET is_private = 0, updated_at = ? WHERE id = ?",
    Date.now(),
    folderId
  );

  if (result.changes === 0) {
    throw new FolderNotFoundError();
  }
}

export async function getFolderById(id: string): Promise<Folder | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<FolderRow>(
    `${FOLDER_SELECT}
     WHERE f.id = ?
     GROUP BY f.id`,
    id
  );
  if (row) {
    return mapFolderRow(row);
  }
  if (isPrivateVaultOpen()) {
    return getVaultFolderById(id);
  }
  return null;
}

export async function createFolder(input: CreateFolderInput): Promise<Folder> {
  const validation = validateFolderName(input.name);
  if (!validation.valid) {
    throw new InvalidFolderNameError(validation.message);
  }

  const database = await getDatabase();
  const now = Date.now();
  const id = createId();

  try {
    await database.withTransactionAsync(async () => {
      const nextOrderRow = await database.getFirstAsync<{ nextSortOrder: number }>(
        "SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextSortOrder FROM folders"
      );

      await database.runAsync(
        `INSERT INTO folders
           (id, name, icon_key, color_key, is_private, sort_order, last_opened_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, NULL, ?, ?)`,
        id,
        validation.name,
        input.iconKey ?? null,
        input.colorKey ?? null,
        nextOrderRow?.nextSortOrder ?? 0,
        now,
        now
      );
    });
  } catch (error) {
    throw mapFolderWriteError(error);
  }

  const folder = await getFolderById(id);
  if (!folder) {
    throw new Error("The folder was saved but could not be read back.");
  }
  return folder;
}

export async function createPrivateFolder(
  input: CreateFolderInput
): Promise<Folder> {
  const validation = validateFolderName(input.name);
  if (!validation.valid) {
    throw new InvalidFolderNameError(validation.message);
  }
  try {
    return await createVaultFolder(
      validation.name,
      input.colorKey ?? "lavender"
    );
  } catch (error) {
    throw mapFolderWriteError(error);
  }
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const validation = validateFolderName(name);
  if (!validation.valid) {
    throw new InvalidFolderNameError(validation.message);
  }

  if (await isVaultFolder(id)) {
    await updateVaultFolderName(id, validation.name);
    return;
  }

  const database = await getDatabase();

  try {
    const result = await database.runAsync(
      "UPDATE folders SET name = ?, updated_at = ? WHERE id = ?",
      validation.name,
      Date.now(),
      id
    );
    if (result.changes === 0) {
      throw new FolderNotFoundError();
    }
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      throw error;
    }
    throw mapFolderWriteError(error);
  }
}

export async function deleteFolder(
  id: string,
  strategy: FolderDeleteStrategy
): Promise<void> {
  if (await isVaultFolder(id)) {
    await deleteVaultFolder(id, strategy);
    return;
  }

  const database = await getDatabase();
  const previewPaths =
    strategy === "deleteBookmarks"
      ? await database.getAllAsync<{ previewImagePath: string | null }>(
          `SELECT preview_image_path AS previewImagePath
           FROM bookmarks
           WHERE folder_id = ? AND preview_image_path IS NOT NULL`,
          id
        )
      : [];

  await database.withTransactionAsync(async () => {
    if (strategy === "deleteBookmarks") {
      await database.runAsync("DELETE FROM bookmarks WHERE folder_id = ?", id);
    } else {
      await database.runAsync(
        "UPDATE bookmarks SET folder_id = NULL, updated_at = ? WHERE folder_id = ?",
        Date.now(),
        id
      );
    }

    const result = await database.runAsync("DELETE FROM folders WHERE id = ?", id);
    if (result.changes === 0) {
      throw new FolderNotFoundError();
    }
  });

  for (const row of previewPaths) {
    if (row.previewImagePath) {
      deletePreviewImage(row.previewImagePath);
    }
  }
}

/**
 * Records a successful folder open for Home's recent ordering. This does not
 * touch updated_at because access history is not a content change.
 */
export async function markFolderOpened(id: string, openedAt: number): Promise<void> {
  if (await isVaultFolder(id)) {
    await markVaultFolderOpened(id, openedAt);
    return;
  }
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE folders SET last_opened_at = ? WHERE id = ?",
    openedAt,
    id
  );
}

function mapFolderWriteError(error: unknown): Error {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("unique") && message.includes("folders.name")) {
      return new FolderNameTakenError();
    }
    return error;
  }
  return new Error("The folder could not be saved.");
}
