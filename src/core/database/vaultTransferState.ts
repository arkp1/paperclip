import { getDatabase } from "@/core/database/database";

export type TransferTarget = "private" | "public";

export type VaultTransfer = {
  entityType: "folder" | "bookmark";
  entityId: string;
  target: TransferTarget;
  targetFolderId: string | null;
  phase: "copying" | "copied";
  sourceUpdatedAt: number | null;
};

export async function beginBookmarkTransfer(
  bookmarkId: string,
  target: TransferTarget,
  targetFolderId: string | null,
  sourceUpdatedAt: number | null
): Promise<void> {
  const database = await getDatabase();
  const now = Date.now();
  await database.runAsync(
    `INSERT INTO vault_transfers
       (entity_type, entity_id, target, target_folder_id, phase,
        source_updated_at, created_at, updated_at)
     VALUES ('bookmark', ?, ?, ?, 'copying', ?, ?, ?)
     ON CONFLICT(entity_type, entity_id) DO UPDATE SET
       target = excluded.target,
       target_folder_id = excluded.target_folder_id,
       phase = 'copying',
       source_updated_at = excluded.source_updated_at,
       updated_at = excluded.updated_at`,
    bookmarkId,
    target,
    targetFolderId,
    sourceUpdatedAt,
    now,
    now
  );
}

export async function beginFolderTransfer(
  folderId: string,
  target: TransferTarget,
  bookmarkIds: string[],
  sourceUpdatedAt: number | null
): Promise<void> {
  const database = await getDatabase();
  const now = Date.now();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO vault_transfers
         (entity_type, entity_id, target, target_folder_id, phase,
          source_updated_at, created_at, updated_at)
       VALUES ('folder', ?, ?, ?, 'copying', ?, ?, ?)
       ON CONFLICT(entity_type, entity_id) DO UPDATE SET
         target = excluded.target,
         target_folder_id = excluded.target_folder_id,
         phase = 'copying',
         source_updated_at = excluded.source_updated_at,
         updated_at = excluded.updated_at`,
      folderId,
      target,
      folderId,
      sourceUpdatedAt,
      now,
      now
    );
    for (const bookmarkId of bookmarkIds) {
      await database.runAsync(
        `INSERT INTO vault_transfers
           (entity_type, entity_id, target, target_folder_id, phase,
            source_updated_at, created_at, updated_at)
         VALUES ('bookmark', ?, ?, ?, 'copying', NULL, ?, ?)
         ON CONFLICT(entity_type, entity_id) DO UPDATE SET
           target = excluded.target,
           target_folder_id = excluded.target_folder_id,
           phase = 'copying',
           updated_at = excluded.updated_at`,
        bookmarkId,
        target,
        folderId,
        now,
        now
      );
    }
  });
}

export async function markBookmarkTransferCopied(
  bookmarkId: string
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE vault_transfers
     SET phase = 'copied', updated_at = ?
     WHERE entity_type = 'bookmark' AND entity_id = ?`,
    Date.now(),
    bookmarkId
  );
}

export async function completeBookmarkTransfer(
  bookmarkId: string
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "DELETE FROM vault_transfers WHERE entity_type = 'bookmark' AND entity_id = ?",
    bookmarkId
  );
}

export async function completeFolderTransfer(folderId: string): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      "DELETE FROM vault_transfers WHERE entity_type = 'bookmark' AND target_folder_id = ?",
      folderId
    );
    await database.runAsync(
      "DELETE FROM vault_transfers WHERE entity_type = 'folder' AND entity_id = ?",
      folderId
    );
  });
}

export async function getBookmarkTransfer(
  bookmarkId: string
): Promise<VaultTransfer | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    entityType: "bookmark";
    entityId: string;
    target: TransferTarget;
    targetFolderId: string | null;
    phase: "copying" | "copied";
    sourceUpdatedAt: number | null;
  }>(
    `SELECT entity_type AS entityType, entity_id AS entityId, target,
            target_folder_id AS targetFolderId, phase,
            source_updated_at AS sourceUpdatedAt
     FROM vault_transfers
     WHERE entity_type = 'bookmark' AND entity_id = ?`,
    bookmarkId
  );
  if (!row) {
    return null;
  }
  return {
    entityType: row.entityType,
    entityId: row.entityId,
    target: row.target,
    targetFolderId: row.targetFolderId,
    phase: row.phase,
    sourceUpdatedAt: row.sourceUpdatedAt,
  };
}

export async function isBookmarkPendingPrivate(
  bookmarkId: string
): Promise<boolean> {
  const transfer = await getBookmarkTransfer(bookmarkId);
  return transfer?.target === "private";
}

export async function isFolderPendingPrivate(folderId: string): Promise<boolean> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ target: TransferTarget }>(
    "SELECT target FROM vault_transfers WHERE entity_type = 'folder' AND entity_id = ?",
    folderId
  );
  return row?.target === "private";
}

export async function listPendingTransfers(): Promise<VaultTransfer[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    entityType: "folder" | "bookmark";
    entityId: string;
    target: TransferTarget;
    targetFolderId: string | null;
    phase: "copying" | "copied";
    sourceUpdatedAt: number | null;
  }>(
    `SELECT entity_type AS entityType, entity_id AS entityId, target,
            target_folder_id AS targetFolderId, phase,
            source_updated_at AS sourceUpdatedAt
     FROM vault_transfers
     ORDER BY entity_type ASC, created_at ASC`
  );
  return rows.map((row) => ({
    entityType: row.entityType,
    entityId: row.entityId,
    target: row.target,
    targetFolderId: row.targetFolderId,
    phase: row.phase,
    sourceUpdatedAt: row.sourceUpdatedAt,
  }));
}

export async function clearAllTransfers(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM vault_transfers");
}

/**
 * SQL fragment for public bookmark queries. Pending-private bookmarks are
 * hidden immediately, before any copy is attempted.
 */
export const PUBLIC_BOOKMARK_TRANSFER_FILTER = `NOT EXISTS (
  SELECT 1 FROM vault_transfers t
  WHERE t.entity_type = 'bookmark'
    AND t.entity_id = b.id
    AND t.target = 'private'
)`;

export const PUBLIC_FOLDER_TRANSFER_FILTER = `NOT EXISTS (
  SELECT 1 FROM vault_transfers t
  WHERE t.entity_type = 'folder'
    AND t.entity_id = f.id
    AND t.target = 'private'
)`;
