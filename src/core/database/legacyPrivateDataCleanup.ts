import type { SQLiteDatabase } from "expo-sqlite";
import { File, Paths } from "expo-file-system";

const PENDING_CLEANUP_KEY = "security:pending_cleanup";

type PendingCleanup = {
  files: string[];
  settings: string[];
};

async function readPendingCleanup(
  main: SQLiteDatabase
): Promise<PendingCleanup> {
  const row = await main.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?",
    PENDING_CLEANUP_KEY
  );
  if (!row?.value) {
    return { files: [], settings: [] };
  }
  try {
    const parsed = JSON.parse(row.value) as Partial<PendingCleanup>;
    return {
      files: Array.isArray(parsed.files)
        ? parsed.files.filter((value): value is string => typeof value === "string")
        : [],
      settings: Array.isArray(parsed.settings)
        ? parsed.settings.filter(
            (value): value is string => typeof value === "string"
          )
        : [],
    };
  } catch {
    return { files: [], settings: [] };
  }
}

async function savePendingCleanup(
  main: SQLiteDatabase,
  pending: PendingCleanup
): Promise<void> {  if (pending.files.length === 0 && pending.settings.length === 0) {
    await main.runAsync(
      "DELETE FROM app_settings WHERE key = ?",
      PENDING_CLEANUP_KEY
    );
    return;
  }
  await main.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    PENDING_CLEANUP_KEY,
    JSON.stringify(pending),
    Date.now()
  );
}

export async function queuePendingCleanupFiles(
  main: SQLiteDatabase,
  files: string[]
): Promise<void> {
  const pending = await readPendingCleanup(main);
  pending.files = Array.from(new Set([...pending.files, ...files]));
  await savePendingCleanup(main, pending);
}

export async function removePendingCleanupFiles(
  main: SQLiteDatabase,
  files: string[]
): Promise<void> {
  const pending = await readPendingCleanup(main);
  const removed = new Set(files);
  pending.files = pending.files.filter((path) => !removed.has(path));
  await savePendingCleanup(main, pending);
}

/**
 * Retries plaintext cleanup records left by older builds. It deliberately does
 * not delete legacy private folders or bookmarks here: those are migrated into
 * the authenticated vault on unlock, preserving user data.
 */
export async function cleanupLegacyPlaintextPrivateData(
  main: SQLiteDatabase
): Promise<void> {
  const pending = await readPendingCleanup(main);
  if (pending.files.length === 0 && pending.settings.length === 0) {
    return;
  }

  const files: string[] = [];
  for (const path of pending.files) {
    try {
      const file = new File(Paths.document, path);
      if (file.exists) {
        file.delete();
      }
    } catch (error) {
      console.warn("Private preview cleanup is still pending.", error);
      files.push(path);
    }
  }

  const settings: string[] = [];
  for (const key of pending.settings) {
    try {
      await main.runAsync("DELETE FROM app_settings WHERE key = ?", key);
    } catch (error) {
      console.warn("Private reader setting cleanup is still pending.", error);
      settings.push(key);
    }
  }

  await savePendingCleanup(main, { files, settings });
}
