import type { SQLiteDatabase } from "expo-sqlite";

import { normalizeUrlForComparison } from "@/shared/utils/url";

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
  after?: (database: SQLiteDatabase) => Promise<void>;
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
  {
    version: 4,
    name: "article_image_cache_version",
    sql: `
      ALTER TABLE article_contents
        ADD COLUMN cache_version INTEGER NOT NULL DEFAULT 1;
    `,
  },
  {
    version: 5,
    name: "vault_transfer_ownership",
    sql: `
      CREATE TABLE IF NOT EXISTS vault_transfers (
        entity_type TEXT NOT NULL CHECK (entity_type IN ('folder', 'bookmark')),
        entity_id TEXT NOT NULL,
        target TEXT NOT NULL CHECK (target IN ('private', 'public')),
        target_folder_id TEXT,
        phase TEXT NOT NULL DEFAULT 'copying'
          CHECK (phase IN ('copying', 'copied')),
        source_updated_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (entity_type, entity_id)
      );

      CREATE INDEX IF NOT EXISTS idx_vault_transfers_target
        ON vault_transfers(target, entity_type);
    `,
  },
  {
    version: 6,
    name: "normalized_bookmark_urls",
    sql: `
      ALTER TABLE bookmarks ADD COLUMN normalized_url TEXT;
    `,
    after: async (database) => {
      const rows = await database.getAllAsync<{
        id: string;
        originalUrl: string;
      }>(
        `SELECT id, original_url AS originalUrl
         FROM bookmarks
         ORDER BY created_at ASC, id ASC`
      );
      const seen = new Set<string>();
      for (const row of rows) {
        const normalized = normalizeUrlForComparison(row.originalUrl);
        if (seen.has(normalized)) {
          // Preserve the legacy duplicate row while keeping the unique
          // comparison index valid.
          continue;
        }
        seen.add(normalized);
        await database.runAsync(
          "UPDATE bookmarks SET normalized_url = ? WHERE id = ?",
          normalized,
          row.id
        );
      }
      await database.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_normalized_url
          ON bookmarks(normalized_url)
          WHERE normalized_url IS NOT NULL;
      `);
    },
  },
  {
    version: 7,
    name: "bookmark_fts",
    sql: "SELECT 1;",
    after: async (database) => {
      const options = await database.getAllAsync<{ compile_options: string }>(
        "PRAGMA compile_options"
      );
      if (!options.some((option) => option.compile_options.includes("FTS5"))) {
        return;
      }
      try {
        await database.execAsync(`
          CREATE VIRTUAL TABLE IF NOT EXISTS bookmark_search USING fts5(
            bookmark_id UNINDEXED,
            title,
            original_url,
            domain,
            description,
            note,
            folder_name,
            tokenize = 'trigram'
          );
          CREATE TRIGGER IF NOT EXISTS bookmark_search_insert
          AFTER INSERT ON bookmarks BEGIN
            INSERT INTO bookmark_search
              (bookmark_id, title, original_url, domain, description, note, folder_name)
            VALUES (new.id, new.title, new.original_url, COALESCE(new.domain, ''),
              COALESCE(new.description, ''), COALESCE(new.note, ''),
              COALESCE((SELECT name FROM folders WHERE id = new.folder_id), ''));
          END;
          CREATE TRIGGER IF NOT EXISTS bookmark_search_update
          AFTER UPDATE ON bookmarks BEGIN
            DELETE FROM bookmark_search WHERE bookmark_id = old.id;
            INSERT INTO bookmark_search
              (bookmark_id, title, original_url, domain, description, note, folder_name)
            VALUES (new.id, new.title, new.original_url, COALESCE(new.domain, ''),
              COALESCE(new.description, ''), COALESCE(new.note, ''),
              COALESCE((SELECT name FROM folders WHERE id = new.folder_id), ''));
          END;
          CREATE TRIGGER IF NOT EXISTS bookmark_search_delete
          AFTER DELETE ON bookmarks BEGIN
            DELETE FROM bookmark_search WHERE bookmark_id = old.id;
          END;
          CREATE TRIGGER IF NOT EXISTS folder_search_update
          AFTER UPDATE OF name ON folders BEGIN
            UPDATE bookmark_search
            SET folder_name = new.name
            WHERE bookmark_id IN (SELECT id FROM bookmarks WHERE folder_id = new.id);
          END;
        `);
        await database.execAsync(`
          INSERT INTO bookmark_search
            (bookmark_id, title, original_url, domain, description, note, folder_name)
          SELECT b.id, b.title, b.original_url, COALESCE(b.domain, ''),
            COALESCE(b.description, ''), COALESCE(b.note, ''),
            COALESCE(f.name, '')
          FROM bookmarks b
          LEFT JOIN folders f ON f.id = b.folder_id;
        `);
      } catch {
        // FTS5/trigram is optional. Search falls back to LIKE.
        await database.execAsync(`
          DROP TRIGGER IF EXISTS bookmark_search_insert;
          DROP TRIGGER IF EXISTS bookmark_search_update;
          DROP TRIGGER IF EXISTS bookmark_search_delete;
          DROP TRIGGER IF EXISTS folder_search_update;
          DROP TABLE IF EXISTS bookmark_search;
        `);
      }
    },
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
      await migration.after?.(database);
      await database.execAsync(`PRAGMA user_version = ${migration.version}`);
    });

    currentVersion = migration.version;
  }
}
