import * as SQLite from "expo-sqlite";

import { cleanupLegacyPlaintextPrivateData } from "./legacyPrivateDataCleanup";
import { runMigrations } from "./migrations";

const DATABASE_NAME = "paperclip.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Opens the single Paperclip database and applies pending migrations.
 * The promise is cached so concurrent callers share one connection, and it is
 * cleared on failure so the database gate can retry.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openAndPrepareDatabase().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

async function openAndPrepareDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await database.execAsync("PRAGMA journal_mode = WAL;");
  await database.execAsync("PRAGMA foreign_keys = ON;");
  await runMigrations(database);
  await cleanupLegacyPlaintextPrivateData(database);
  return database;
}
