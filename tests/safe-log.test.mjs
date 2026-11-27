import assert from "node:assert/strict";
import { test } from "node:test";

import { sanitizeLogText, sanitizeLogValue } from "../src/shared/utils/safeLog.ts";

test("redacts URLs and secret query values", () => {
  const message = sanitizeLogText(
    "Fetch https://example.com/a?token=abc123 failed with token=secret"
  );
  assert.equal(message.includes("example.com"), false);
  assert.equal(message.includes("abc123"), false);
  assert.equal(message.includes("[url]"), true);
});

test("sanitizes Error messages", () => {
  const sanitized = sanitizeLogValue(
    new Error("Request to https://example.com/path?password=hunter2 failed")
  );
  assert.equal(String(sanitized).includes("example.com"), false);
  assert.equal(String(sanitized).includes("hunter2"), false);
});

test("leaves ordinary diagnostics intact", () => {
  assert.equal(sanitizeLogValue("Could not load the library."), "Could not load the library.");
});
