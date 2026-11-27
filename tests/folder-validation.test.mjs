import assert from "node:assert/strict";
import { test } from "node:test";

import {
  FOLDER_NAME_MAX_LENGTH,
  validateFolderName,
} from "../src/features/folders/validation.ts";

test("accepts and trims ordinary folder names", () => {
  const result = validateFolderName("  Technology  ");
  assert.deepEqual(result, { valid: true, name: "Technology" });
});

test("rejects empty and overlong names", () => {
  assert.equal(validateFolderName("   ").valid, false);
  assert.equal(
    validateFolderName("x".repeat(FOLDER_NAME_MAX_LENGTH + 1)).valid,
    false
  );
});

test("rejects every built-in collection name case-insensitively", () => {
  for (const name of [
    "All bookmarks",
    "uncategorized",
    "Favourites",
    "favorites",
    "Private",
  ]) {
    assert.equal(validateFolderName(name).valid, false, name);
  }
});
