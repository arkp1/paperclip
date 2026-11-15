import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";

const VAULT_DATABASE = "paperclip-private.db";
const VAULT_KEY_NAME = "paperclip.private.vault.key.v1";

let vaultPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let sessionAuthorized = false;
let sessionVisible = false;
let sessionGeneration = 0;

const VAULT_SCHEMA = `
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  icon_key TEXT,
  color_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  last_opened_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_private_folder_name
  ON folders(name COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY NOT NULL,
  original_url TEXT NOT NULL,
  canonical_url TEXT,
  title TEXT NOT NULL,
  title_is_user_edited INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  note TEXT,
  folder_id TEXT,
  source_name TEXT,
  domain TEXT,
  favicon_path TEXT,
  preview_status TEXT NOT NULL DEFAULT 'pending',
  preview_data_uri TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_private_bookmarks_folder
  ON bookmarks(folder_id, created_at DESC);

CREATE TABLE IF NOT EXISTS article_contents (
  bookmark_id TEXT PRIMARY KEY NOT NULL,
  blocks TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  fetched_at INTEGER NOT NULL,
  cache_version INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

async function getOrCreateKey(): Promise<{ key: string; created: boolean }> {
  const existing = await SecureStore.getItemAsync(VAULT_KEY_NAME);
  if (existing) {
    return { key: existing, created: false };
  }
  const bytes = await Crypto.getRandomBytesAsync(32);
  const key = bytesToHex(bytes);
  await SecureStore.setItemAsync(VAULT_KEY_NAME, key);
  return { key, created: true };
}

function deleteVaultFiles(): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = new File(Paths.document, "SQLite", `${VAULT_DATABASE}${suffix}`);
    if (file.exists) {
      file.delete();
    }
  }
}

async function assertVaultFileIsEncrypted(
  database: SQLite.SQLiteDatabase
): Promise<void> {
  const locations = await database.getAllAsync<{
    name: string;
    file: string;
  }>("PRAGMA database_list");
  const location = locations.find((entry) => entry.name === "main");
  if (!location?.file) {
    throw new Error("Could not locate the private vault file.");
  }
  const uri = location.file.startsWith("file:")
    ? location.file
    : `file://${location.file}`;
  let file = new File(uri);
  if (!file.exists) {
    file = new File(Paths.document, "SQLite", VAULT_DATABASE);
  }
  if (!file.exists) {
    throw new Error("The private vault file does not exist.");
  }
  const header = new Uint8Array(
    await file.slice(0, 16).arrayBuffer()
  ).slice(0, 16);
  const plaintextHeader = [
    0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61,
    0x74, 0x20, 0x33, 0x00,
  ];
  const looksLikePlainSqlite = plaintextHeader.every(
    (byte, index) => header[index] === byte
  );
  if (looksLikePlainSqlite) {
    throw new Error("The private vault file was not encrypted.");
  }
}

async function openEncryptedVault(key: string): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(VAULT_DATABASE);
  try {
    await database.execAsync(`PRAGMA key = '${key}';`);
    let cipherVersion: string | undefined;
    try {
      const version = await database.getFirstAsync<Record<string, string>>(
        "PRAGMA cipher_version"
      );
      cipherVersion = version ? Object.values(version)[0] : undefined;
    } catch {
      cipherVersion = undefined;
    }
    if (!cipherVersion) {
      throw new Error(
        "SQLCipher is not available in this build. Rebuild the development client."
      );
    }
    await database.execAsync("PRAGMA journal_mode = WAL;");
    await database.execAsync("PRAGMA foreign_keys = ON;");
    await database.execAsync(VAULT_SCHEMA);
    const columns = await database.getAllAsync<{ name: string }>(
      "PRAGMA table_info(bookmarks)"
    );
    if (!columns.some((column) => column.name === "preview_data_uri")) {
      await database.execAsync(
        "ALTER TABLE bookmarks ADD COLUMN preview_data_uri TEXT;"
      );
    }
    await assertVaultFileIsEncrypted(database);
    return database;
  } catch (error) {
    await database.closeAsync().catch(() => undefined);
    throw error;
  }
}

async function openAndPrepareVault(): Promise<SQLite.SQLiteDatabase> {
  const { key, created } = await getOrCreateKey();
  const vaultFile = new File(Paths.document, "SQLite", VAULT_DATABASE);
  if (created && vaultFile.exists) {
    throw new Error(
      "The private vault key is missing, but the encrypted vault still exists. Restore the SecureStore key or explicitly reset the private vault."
    );
  }
  return openEncryptedVault(key);
}

export function authorizePrivateVaultSession(): void {
  sessionAuthorized = true;
  sessionVisible = false;
  sessionGeneration += 1;
}

export function revokePrivateVaultSession(): void {
  sessionAuthorized = false;
  sessionVisible = false;
  sessionGeneration += 1;
}

export function setPrivateVaultVisible(visible: boolean): void {
  sessionVisible = visible;
}

export function getPrivateVaultGeneration(): number {
  return sessionGeneration;
}

export function isPrivateVaultGenerationCurrent(generation: number): boolean {
  return sessionAuthorized && generation === sessionGeneration;
}

export function assertPrivateVaultGeneration(generation: number): void {
  if (!isPrivateVaultGenerationCurrent(generation)) {
    throw new Error("The private vault session is no longer valid.");
  }
}

export async function openPrivateVaultForSession(): Promise<SQLite.SQLiteDatabase> {
  authorizePrivateVaultSession();
  try {
    return await getPrivateVault();
  } catch (error) {
    revokePrivateVaultSession();
    throw error;
  }
}

export function getPrivateVault(): Promise<SQLite.SQLiteDatabase> {
  if (!sessionAuthorized) {
    return Promise.reject(new Error("The private vault is locked."));
  }
  if (!vaultPromise) {
    vaultPromise = openAndPrepareVault().catch((error: unknown) => {
      vaultPromise = null;
      throw error;
    });
  }
  return vaultPromise;
}

export function isPrivateVaultOpen(): boolean {
  return sessionAuthorized && sessionVisible && vaultPromise !== null;
}

export async function closePrivateVault(): Promise<void> {
  revokePrivateVaultSession();
  if (!vaultPromise) {
    return;
  }
  const pending = vaultPromise;
  vaultPromise = null;
  try {
    const database = await pending;
    await database.closeAsync();
  } catch {
    // The connection may already be closed after a failed open.
  }
}

/**
 * Explicit recovery operation. Never invoked automatically: deleting the
 * encrypted database permanently removes the private library.
 */
export async function resetPrivateVault(): Promise<void> {
  await closePrivateVault();
  deleteVaultFiles();
  await SecureStore.deleteItemAsync(VAULT_KEY_NAME).catch(() => undefined);
}

export async function getVaultSetting(key: string): Promise<string | null> {
  const generation = getPrivateVaultGeneration();
  const database = await getPrivateVault();
  const row = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?",
    key
  );
  assertPrivateVaultGeneration(generation);
  return row?.value ?? null;
}

export async function setVaultSetting(
  key: string,
  value: string
): Promise<void> {
  const generation = getPrivateVaultGeneration();
  const database = await getPrivateVault();
  assertPrivateVaultGeneration(generation);
  await database.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    Date.now()
  );
}
