import assert from "node:assert/strict";
import test from "node:test";

import { extractSharedUrl } from "../src/features/save-link/utils/sharePayload.ts";

test("extracts a URL surrounded by share text", () => {
  assert.equal(
    extractSharedUrl("Look at this https://example.com/article?x=1, amazing"),
    "https://example.com/article?x=1"
  );
});

test("extracts a URL from a title and removes trailing punctuation", () => {
  assert.equal(
    extractSharedUrl("https://example.com/post)."),
    "https://example.com/post"
  );
});

test("preserves plain text when no URL is present", () => {
  assert.equal(extractSharedUrl("  just some words  "), "just some words");
});
