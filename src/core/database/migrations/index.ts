import type { SQLiteDatabase } from "expo-sqlite";

const INITIAL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon_key TEXT,
    color_key TEXT,
    is_private INTEGER NOT NULL DEFAULT 0
        CHECK (is_private IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    last_opened_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_name_unique
    ON folders(name COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_folders_sort_order
    ON folders(sort_order, name COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_folders_recent
    ON folders(last_opened_at DESC)
    WHERE last_opened_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY NOT NULL,
    original_url TEXT NOT NULL,
    canonical_url TEXT,
    title TEXT NOT NULL,
    title_is_user_edited INTEGER NOT NULL DEFAULT 0
        CHECK (title_is_user_edited IN (0, 1)),
    description TEXT,
    note TEXT,
    folder_id TEXT,
    source_name TEXT,
    domain TEXT,
    preview_image_path TEXT,
    favicon_path TEXT,
    preview_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (preview_status IN (
            'pending', 'success', 'partial', 'unavailable', 'failed'
        )),
    preview_fetched_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (folder_id)
        REFERENCES folders(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_folder_created
    ON bookmarks(folder_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookmarks_created
    ON bookmarks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookmarks_domain
    ON bookmarks(domain COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);
`;

type Migration = {
  version: number;
  name: string;
  sql: string;
};

const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    sql: INITIAL_SCHEMA_SQL,
  },
  {
    version: 2,
    name: "bookmark_favorites",
    sql: `
      ALTER TABLE bookmarks
        ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0
        CHECK (is_favorite IN (0, 1));

      CREATE INDEX IF NOT EXISTS idx_bookmarks_favorite
        ON bookmarks(is_favorite, created_at DESC);
    `,
  },
  {
    version: 3,
    name: "article_cache",
    sql: `
      CREATE TABLE IF NOT EXISTS article_contents (
        bookmark_id TEXT PRIMARY KEY NOT NULL,
        blocks TEXT NOT NULL,
        word_count INTEGER NOT NULL DEFAULT 0,
        fetched_at INTEGER NOT NULL,
        FOREIGN KEY (bookmark_id)
          REFERENCES bookmarks(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE
      );
    `,
  },
];

/**
 * Applies migrations in order using SQLite's user_version counter. Each
 * migration runs in its own transaction so a failure cannot report a newer
 * schema version than the one actually applied.
 */
export async function runMigrations(database: SQLiteDatabase): Promise<void> {
  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  let currentVersion = versionRow?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }

    await database.withTransactionAsync(async () => {
      await database.execAsync(migration.sql);
      await database.execAsync(`PRAGMA user_version = ${migration.version}`);
    });

    currentVersion = migration.version;
  }
}
