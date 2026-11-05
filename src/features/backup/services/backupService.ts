import { Directory, File, Paths } from "expo-file-system";
import * as LegacyFileSystem from "expo-file-system/legacy";

import { getDatabase } from "@/core/database/database";
import { refreshBookmarkPreview } from "@/features/bookmarks/services/previewService";
import { validateHttpUrl } from "@/shared/utils/url";

export type BackupSummary = {
  folders: number;
  bookmarks: number;
  images: number;
};

type BackupImage = {
  bookmarkId: string;
  extension: string;
  base64: string;
};

export type BackupDocument = {
  format: "paperclip-backup";
  version: 1;
  exportedAt: string;
  scope: "public";
  folders: Record<string, unknown>[];
  bookmarks: Record<string, unknown>[];
  images: BackupImage[];
};

export type PickedBackup = {
  document: BackupDocument;
  counts: BackupSummary;
};

const BACKUP_FORMAT = "paperclip-backup";
const BACKUP_VERSION = 1;
const MAX_BACKUP_CHARACTERS = 50_000_000;
const MAX_IMAGE_BASE64_CHARACTERS = 12_000_000;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

/**
 * Exports public folders and bookmarks plus their cached preview images as a
 * versioned JSON file. Locked/private content is never included.
 */
export async function exportLibraryBackup(): Promise<BackupSummary | null> {
  const permission =
    await LegacyFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  const database = await getDatabase();
  const folderRows = await database.getAllAsync<Record<string, unknown>>(
    `SELECT id, name, icon_key AS iconKey, color_key AS colorKey,
            is_private AS isPrivate, sort_order AS sortOrder,
            last_opened_at AS lastOpenedAt, created_at AS createdAt,
            updated_at AS updatedAt
     FROM folders
     WHERE is_private = 0
     ORDER BY sort_order ASC, name COLLATE NOCASE ASC`
  );

  const bookmarkRows = await database.getAllAsync<Record<string, unknown>>(
    `SELECT id, original_url AS originalUrl, canonical_url AS canonicalUrl,
            title, title_is_user_edited AS titleIsUserEdited,
            description, note, folder_id AS folderId,
            source_name AS sourceName, domain, preview_image_path AS previewImagePath,
            favicon_path AS faviconPath, preview_status AS previewStatus,
            preview_fetched_at AS previewFetchedAt, is_favorite AS isFavorite,
            created_at AS createdAt, updated_at AS updatedAt
     FROM bookmarks
     WHERE folder_id IS NULL
        OR folder_id IN (SELECT id FROM folders WHERE is_private = 0)
     ORDER BY created_at ASC`
  );

  const images: BackupImage[] = [];
  for (const row of bookmarkRows) {
    const bookmarkId = typeof row.id === "string" ? row.id : null;
    const previewImagePath =
      typeof row.previewImagePath === "string" ? row.previewImagePath : null;
    if (!bookmarkId || !previewImagePath) {
      continue;
    }

    const extension = extensionFromPath(previewImagePath);
    if (!extension) {
      continue;
    }

    try {
      const imageFile = new File(Paths.document, previewImagePath);
      if (!imageFile.exists) {
        continue;
      }
      const base64 = await imageFile.base64();
      if (base64.length > MAX_IMAGE_BASE64_CHARACTERS) {
        continue;
      }
      images.push({ bookmarkId, extension, base64 });
    } catch {
      // A missing or unreadable preview does not block the library export.
    }
  }

  const document: BackupDocument = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    scope: "public",
    folders: folderRows,
    bookmarks: bookmarkRows,
    images,
  };
  const json = JSON.stringify(document);
  const fileName = `paperclip-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19)}.json`;
  const fileUri = await LegacyFileSystem.StorageAccessFramework.createFileAsync(
    permission.directoryUri,
    fileName,
    "application/json"
  );
  await LegacyFileSystem.writeAsStringAsync(fileUri, json, {
    encoding: LegacyFileSystem.EncodingType.UTF8,
  });

  return {
    folders: folderRows.length,
    bookmarks: bookmarkRows.length,
    images: images.length,
  };
}

/**
 * Lets the user choose a JSON backup file without broad storage permissions.
 */
export async function pickBackupFile(): Promise<PickedBackup | null> {
  const picked = await File.pickFileAsync({
    mimeTypes: ["application/json"],
  });

  if (picked.canceled) {
    return null;
  }

  const text = await picked.result.text();
  if (text.length > MAX_BACKUP_CHARACTERS) {
    throw new Error("This backup is too large to import.");
  }

  const parsed: unknown = JSON.parse(text);
  const document = validateBackup(parsed);
  return {
    document,
    counts: {
      folders: document.folders.length,
      bookmarks: document.bookmarks.length,
      images: document.images.length,
    },
  };
}

/**
 * Merge-imports a validated backup. Existing IDs and folder-name conflicts are
 * skipped; bookmarks whose folder was not imported fall back to Uncategorized.
 */
export async function applyBackup(
  document: BackupDocument
): Promise<BackupSummary> {
  const database = await getDatabase();
  const inserted = { folders: 0, bookmarks: 0, images: 0 };
  const existingFolders = await database.getAllAsync<{
    id: string;
    name: string;
  }>("SELECT id, name FROM folders");
  const existingFolderIds = new Set(existingFolders.map((row) => row.id));
  const existingNames = new Set(
    existingFolders.map((row) => row.name.trim().toLowerCase())
  );
  const existingBookmarkIds = new Set(
    (
      await database.getAllAsync<{ id: string }>("SELECT id FROM bookmarks")
    ).map((row) => row.id)
  );
  const validFolderIds = new Set<string>();
  const needsPreviewRefresh: string[] = [];

  await database.withTransactionAsync(async () => {
    for (const folder of document.folders) {
      const id = readId(folder.id);
      const name = readString(folder.name);
      if (
        !id ||
        !name ||
        existingFolderIds.has(id) ||
        existingNames.has(name.trim().toLowerCase())
      ) {
        continue;
      }

      await database.runAsync(
        `INSERT OR IGNORE INTO folders
          (id, name, icon_key, color_key, is_private, sort_order,
           last_opened_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        id,
        name,
        readString(folder.iconKey),
        readString(folder.colorKey),
        readNumber(folder.sortOrder) ?? 0,
        readNumber(folder.lastOpenedAt),
        readNumber(folder.createdAt) ?? Date.now(),
        readNumber(folder.updatedAt) ?? Date.now()
      );
      existingFolderIds.add(id);
      existingNames.add(name.trim().toLowerCase());
      validFolderIds.add(id);
      inserted.folders += 1;
    }

    for (const bookmark of document.bookmarks) {
      const id = readId(bookmark.id);
      const originalUrl = readString(bookmark.originalUrl);
      const title = readString(bookmark.title);
      if (
        !id ||
        !originalUrl ||
        !title ||
        !validateHttpUrl(originalUrl).valid ||
        existingBookmarkIds.has(id)
      ) {
        continue;
      }

      const folderId = readId(bookmark.folderId);
      const targetFolder =
        folderId && (validFolderIds.has(folderId) || existingFolderIds.has(folderId))
          ? folderId
          : null;

      const image = document.images.find((entry) => entry.bookmarkId === id);
      const imageExtension = image?.extension.toLowerCase() ?? null;
      let previewImagePath: string | null = null;
      if (image && imageExtension && IMAGE_EXTENSIONS.has(imageExtension)) {
        try {
          const bytes = decodeBase64(image.base64);
          if (!matchesImageSignature(bytes, imageExtension)) {
            throw new Error("Preview image content does not match its extension.");
          }

          const directory = new Directory(
            Paths.document,
            "paperclip",
            "previews",
            "public"
          );
          directory.create({ intermediates: true, idempotent: true });
          const file = new File(directory, `${id}.${imageExtension}`);
          if (file.exists) {
            file.delete();
          }
          file.create({ intermediates: true });
          await file.write(bytes);
          if (!file.exists || file.size === 0) {
            throw new Error("Preview image was not written.");
          }
          previewImagePath = `paperclip/previews/public/${id}.${imageExtension}`;
          inserted.images += 1;
        } catch {
          previewImagePath = null;
        }
      }

      await database.runAsync(
        `INSERT OR IGNORE INTO bookmarks
          (id, original_url, canonical_url, title, title_is_user_edited,
           description, note, folder_id, source_name, domain,
           preview_image_path, favicon_path, preview_status,
           preview_fetched_at, is_favorite, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        originalUrl,
        readString(bookmark.canonicalUrl),
        title,
        readBooleanInt(bookmark.titleIsUserEdited),
        readString(bookmark.description),
        readString(bookmark.note),
        targetFolder,
        readString(bookmark.sourceName),
        readString(bookmark.domain),
        previewImagePath,
        null,
        previewImagePath
          ? "success"
          : normalizePreviewStatus(readString(bookmark.previewStatus)),
        readNumber(bookmark.previewFetchedAt),
        readBooleanInt(bookmark.isFavorite),
        readNumber(bookmark.createdAt) ?? Date.now(),
        readNumber(bookmark.updatedAt) ?? Date.now()
      );
      existingBookmarkIds.add(id);
      inserted.bookmarks += 1;
      if (!previewImagePath) {
        needsPreviewRefresh.push(id);
      }
    }
  });

  for (const bookmarkId of needsPreviewRefresh) {
    void refreshBookmarkPreview(bookmarkId).catch(() => {
      // The import succeeded; preview enrichment can retry later.
    });
  }

  return inserted;
}

function validateBackup(value: unknown): BackupDocument {
  if (!isRecord(value)) {
    throw new Error("This file is not a Paperclip backup.");
  }
  if (value.format !== BACKUP_FORMAT || value.version !== BACKUP_VERSION) {
    throw new Error("This backup version is not supported.");
  }
  if (value.scope !== "public") {
    throw new Error("This backup is not a public-library backup.");
  }
  if (!Array.isArray(value.folders) || !Array.isArray(value.bookmarks)) {
    throw new Error("This backup is missing its library data.");
  }

  const folders = value.folders.filter(isRecord);
  const bookmarks = value.bookmarks.filter(isRecord);
  const rawImages = Array.isArray(value.images) ? value.images : [];
  const images = rawImages.filter(isBackupImage);

  if (
    folders.length !== value.folders.length ||
    bookmarks.length !== value.bookmarks.length ||
    images.length !== rawImages.length
  ) {
    throw new Error("This backup contains invalid records.");
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt:
      typeof value.exportedAt === "string" ? value.exportedAt : "",
    scope: "public",
    folders,
    bookmarks,
    images,
  };
}

function isBackupImage(value: unknown): value is BackupImage {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.bookmarkId === "string" &&
    SAFE_ID_PATTERN.test(value.bookmarkId) &&
    typeof value.extension === "string" &&
    IMAGE_EXTENSIONS.has(value.extension.toLowerCase()) &&
    typeof value.base64 === "string" &&
    value.base64.length <= MAX_IMAGE_BASE64_CHARACTERS &&
    isValidBase64(value.base64)
  );
}

/**
 * Strict standard Base64 validation: length, alphabet, and padding position.
 * A malformed image must reject the whole backup before any library mutation.
 */
function isValidBase64(value: string): boolean {
  const compact = value.replace(/\s+/g, "");
  if (
    compact.length === 0 ||
    compact.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)
  ) {
    return false;
  }

  const firstPadding = compact.indexOf("=");
  return (
    firstPadding === -1 ||
    firstPadding === compact.length - 1 ||
    firstPadding === compact.length - 2
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readId(value: unknown): string | null {
  return typeof value === "string" && SAFE_ID_PATTERN.test(value) ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readBooleanInt(value: unknown): number {
  return value === true || value === 1 ? 1 : 0;
}

function normalizePreviewStatus(value: string | null): string {
  return value === "success" ||
    value === "partial" ||
    value === "unavailable" ||
    value === "failed"
    ? value
    : "pending";
}

function extensionFromPath(path: string): string | null {
  const extension = path.split(".").pop()?.toLowerCase();
  return extension && IMAGE_EXTENSIONS.has(extension) ? extension : null;
}

/**
 * Rejects preview payloads whose magic bytes do not match the declared
 * extension before anything is written to app storage.
 */
function matchesImageSignature(bytes: Uint8Array, extension: string): boolean {
  if (bytes.length < 12) {
    return false;
  }

  if (extension === "jpg" || extension === "jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (extension === "png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (extension === "gif") {
    return (
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      (bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39)) &&
      bytes[5] === 0x61
    );
  }
  if (extension === "webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  if (extension === "avif") {
    return (
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70
    );
  }

  return false;
}

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeBase64(input: string): Uint8Array {
  const payload = input.includes(",") ? input.slice(input.indexOf(",") + 1) : input;
  const clean = payload.replace(/[^A-Za-z0-9+/=]/g, "");
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  const output = new Uint8Array(Math.max(0, (clean.length * 3) / 4 - padding));
  let buffer = 0;
  let bits = 0;
  let index = 0;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (!char || char === "=") {
      break;
    }
    const value = BASE64_ALPHABET.indexOf(char);
    if (value < 0) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output[index] = (buffer >> bits) & 0xff;
      index += 1;
    }
  }

  return output.slice(0, index);
}

