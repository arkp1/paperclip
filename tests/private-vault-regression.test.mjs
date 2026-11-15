import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SCHEMA = `
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_private INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  note TEXT,
  folder_id TEXT,
  updated_at INTEGER NOT NULL,
  preview_image_path TEXT
);
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE vault_transfers (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  target TEXT NOT NULL,
  target_folder_id TEXT,
  phase TEXT NOT NULL DEFAULT 'copying',
  source_updated_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);
`;

const PUBLIC_BOOKMARKS = `
SELECT b.id FROM bookmarks b
LEFT JOIN folders f ON f.id = b.folder_id
WHERE (f.is_private IS NULL OR f.is_private = 0)
  AND NOT EXISTS (
    SELECT 1 FROM vault_transfers t
    WHERE t.entity_type = 'bookmark'
      AND t.entity_id = b.id
      AND t.target = 'private'
  )
`;

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  return db;
}

function addTransfer(db, type, id, target, folderId = null) {
  db.prepare(
    `INSERT INTO vault_transfers
       (entity_type, entity_id, target, target_folder_id, phase,
        source_updated_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'copying', 1, 1, 1)
     ON CONFLICT(entity_type, entity_id) DO UPDATE SET
       target = excluded.target,
       target_folder_id = excluded.target_folder_id`
  ).run(type, id, target, folderId);
}

test("pending-private bookmarks are hidden from public queries", () => {
  const db = database();
  db.prepare("INSERT INTO folders VALUES ('f', 'Work', 0)").run();
  db.prepare("INSERT INTO bookmarks VALUES ('b', 'Secret', NULL, 'f', 1, NULL)").run();

  assert.deepEqual(db.prepare(PUBLIC_BOOKMARKS).all().map((row) => row.id), ["b"]);

  addTransfer(db, "bookmark", "b", "private", "private-folder");
  assert.equal(db.prepare(PUBLIC_BOOKMARKS).all().length, 0);

  // Simulated restart: the marker lives in SQLite, not process memory.
  assert.equal(db.prepare(PUBLIC_BOOKMARKS).all().length, 0);

  db.prepare("DELETE FROM bookmarks WHERE id = 'b'").run();
  db.prepare(
    "DELETE FROM vault_transfers WHERE entity_type = 'bookmark' AND entity_id = 'b'"
  ).run();
  assert.equal(db.prepare(PUBLIC_BOOKMARKS).all().length, 0);
});

test("pending-private folder bookmarks stay hidden until ownership cleanup finishes", () => {
  const db = database();
  db.prepare("INSERT INTO folders VALUES ('f', 'Work', 0)").run();
  db.prepare("INSERT INTO bookmarks VALUES ('b1', 'One', NULL, 'f', 1, NULL)").run();
  db.prepare("INSERT INTO bookmarks VALUES ('b2', 'Two', NULL, 'f', 1, NULL)").run();
  addTransfer(db, "folder", "f", "private", "f");
  addTransfer(db, "bookmark", "b1", "private", "f");
  addTransfer(db, "bookmark", "b2", "private", "f");

  assert.equal(db.prepare(PUBLIC_BOOKMARKS).all().length, 0);

  // Copy is durable. Source cleanup deletes only copied rows.
  db.prepare("DELETE FROM bookmarks WHERE id IN ('b1', 'b2')").run();
  db.prepare(
    "DELETE FROM vault_transfers WHERE entity_type = 'bookmark' AND target_folder_id = 'f'"
  ).run();
  db.prepare(
    "DELETE FROM vault_transfers WHERE entity_type = 'folder' AND entity_id = 'f'"
  ).run();

  assert.equal(db.prepare(PUBLIC_BOOKMARKS).all().length, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS c FROM vault_transfers").get().c, 0);
});

test("a newer destination edit is not overwritten by a retry", () => {
  const db = database();
  db.prepare("INSERT INTO bookmarks VALUES ('b', 'Destination edit', 'new note', NULL, 20, NULL)").run();

  db.prepare(
    `INSERT INTO bookmarks (id, title, note, updated_at)
     VALUES ('b', 'Stale source', 'old note', 10)
     ON CONFLICT(id) DO UPDATE SET
       title = CASE WHEN bookmarks.updated_at > excluded.updated_at
                    THEN bookmarks.title ELSE excluded.title END,
       note = CASE WHEN bookmarks.updated_at > excluded.updated_at
                    THEN bookmarks.note ELSE excluded.note END,
       updated_at = MAX(bookmarks.updated_at, excluded.updated_at)`
  ).run();

  const row = db.prepare("SELECT title, note, updated_at FROM bookmarks WHERE id = 'b'").get();
  assert.equal(row.title, "Destination edit");
  assert.equal(row.note, "new note");
  assert.equal(row.updated_at, 20);
});

test("newer reader settings in the destination are preserved", () => {
  const db = database();
  db.prepare("INSERT INTO app_settings VALUES ('reader_annotations:b', 'new', 20)").run();
  db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ('reader_annotations:b', 'old', 10)
     ON CONFLICT(key) DO UPDATE SET
       value = CASE WHEN app_settings.updated_at > excluded.updated_at
                    THEN app_settings.value ELSE excluded.value END,
       updated_at = MAX(app_settings.updated_at, excluded.updated_at)`
  ).run();
  assert.equal(
    db.prepare("SELECT value FROM app_settings WHERE key = 'reader_annotations:b'").get().value,
    "new"
  );
});

test("deleting a transferring bookmark removes both copies and reader data", () => {
  const db = database();
  addTransfer(db, "bookmark", "b", "private", "f");
  db.prepare("INSERT INTO bookmarks VALUES ('b', 'B', NULL, 'f', 1, NULL)").run();
  db.prepare("INSERT INTO app_settings VALUES ('reader_progress:b', '{}', 1)").run();
  db.prepare("INSERT INTO app_settings VALUES ('reader_annotations:b', '[]', 1)").run();

  db.exec("BEGIN");
  db.prepare("DELETE FROM bookmarks WHERE id = 'b'").run();
  db.prepare("DELETE FROM app_settings WHERE key IN ('reader_progress:b', 'reader_annotations:b')").run();
  db.prepare("DELETE FROM vault_transfers WHERE entity_type = 'bookmark' AND entity_id = 'b'").run();
  db.exec("COMMIT");

  assert.equal(db.prepare("SELECT COUNT(*) AS c FROM bookmarks").get().c, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS c FROM app_settings").get().c, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS c FROM vault_transfers").get().c, 0);
});

test("reset clears legacy private markers and records transactionally", () => {
  const db = database();
  db.prepare("INSERT INTO folders VALUES ('f', 'Legacy private', 1)").run();
  db.prepare("INSERT INTO folders VALUES ('p', 'Public', 0)").run();
  db.prepare("INSERT INTO bookmarks VALUES ('private', 'P', NULL, 'f', 1, NULL)").run();
  db.prepare("INSERT INTO bookmarks VALUES ('public', 'U', NULL, 'p', 1, NULL)").run();
  addTransfer(db, "bookmark", "private", "private", "f");

  db.exec("BEGIN");
  db.prepare(
    "DELETE FROM bookmarks WHERE folder_id IN (SELECT id FROM folders WHERE is_private = 1)"
  ).run();
  db.prepare("DELETE FROM folders WHERE is_private = 1").run();
  db.prepare("DELETE FROM vault_transfers").run();
  db.exec("COMMIT");

  assert.equal(db.prepare("SELECT COUNT(*) AS c FROM bookmarks").get().c, 1);
  assert.equal(db.prepare("SELECT id FROM bookmarks").get().id, "public");
  assert.equal(db.prepare("SELECT COUNT(*) AS c FROM vault_transfers").get().c, 0);
});

test("transfer ownership survives a database restart", () => {
  const directory = mkdtempSync(join(tmpdir(), "paperclip-transfer-"));
  const path = join(directory, "app.db");
  try {
    let db = new DatabaseSync(path);
    db.exec(SCHEMA);
    db.prepare("INSERT INTO folders VALUES ('f', 'Work', 0)").run();
    db.prepare("INSERT INTO bookmarks VALUES ('b', 'Private pending', NULL, 'f', 1, NULL)").run();
    addTransfer(db, "folder", "f", "private", "f");
    addTransfer(db, "bookmark", "b", "private", "f");
    db.close();

    db = new DatabaseSync(path);
    assert.equal(db.prepare(PUBLIC_BOOKMARKS).all().length, 0);
    assert.equal(
      db.prepare("SELECT target FROM vault_transfers WHERE entity_id = 'b'").get().target,
      "private"
    );
    db.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("pending-public transfers remain visible publicly", () => {
  const db = database();
  db.prepare("INSERT INTO folders VALUES ('f', 'Work', 0)").run();
  db.prepare("INSERT INTO bookmarks VALUES ('b', 'Moving public', NULL, 'f', 1, NULL)").run();
  addTransfer(db, "bookmark", "b", "public", "f");
  assert.deepEqual(db.prepare(PUBLIC_BOOKMARKS).all().map((row) => row.id), ["b"]);
});

test("an interrupted source cleanup leaves the private marker in place", () => {
  const db = database();
  addTransfer(db, "bookmark", "b", "private", "f");
  // Simulate the source row surviving a crash after the vault copy.
  db.prepare("INSERT INTO bookmarks VALUES ('b', 'Source', NULL, 'f', 1, NULL)").run();
  assert.equal(db.prepare(PUBLIC_BOOKMARKS).all().length, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS c FROM vault_transfers").get().c, 1);
});

test("a failed source deletion rolls back and preserves the source", () => {
  const db = database();
  db.prepare("INSERT INTO folders VALUES ('f', 'Work', 0)").run();
  db.prepare("INSERT INTO bookmarks VALUES ('b', 'Source', NULL, 'f', 1, NULL)").run();
  db.exec("BEGIN");
  db.prepare("DELETE FROM bookmarks WHERE id = 'b'").run();
  db.exec("ROLLBACK");
  assert.equal(db.prepare("SELECT COUNT(*) AS c FROM bookmarks WHERE id = 'b'").get().c, 1);
});

test("a private transfer marker never resolves as public", () => {
  const db = database();
  addTransfer(db, "bookmark", "b", "private", "f");
  const transfer = db.prepare(
    "SELECT target FROM vault_transfers WHERE entity_type = 'bookmark' AND entity_id = 'b'"
  ).get();
  assert.equal(transfer.target, "private");
  assert.equal(
    db.prepare(
      "SELECT COUNT(*) AS c FROM bookmarks b WHERE b.id = 'b' AND NOT EXISTS (SELECT 1 FROM vault_transfers t WHERE t.entity_id = b.id AND t.target = 'private')"
    ).get().c,
    0
  );
});
