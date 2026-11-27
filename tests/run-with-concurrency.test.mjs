import assert from "node:assert/strict";
import { test } from "node:test";

import { runWithConcurrency } from "../src/shared/utils/runWithConcurrency.ts";

test("runs every item with a bounded number of workers", async () => {
  const items = [1, 2, 3, 4, 5, 6, 7];
  const seen = [];
  let active = 0;
  let peak = 0;

  await runWithConcurrency(items, 3, async (item) => {
    active += 1;
    peak = Math.max(peak, active);
    seen.push(item);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active -= 1;
  });

  assert.deepEqual(seen.sort((a, b) => a - b), items);
  assert.equal(peak, 3);
});

test("handles empty input and clamps invalid concurrency", async () => {
  let calls = 0;
  await runWithConcurrency([], 3, async () => {
    calls += 1;
  });
  assert.equal(calls, 0);

  await runWithConcurrency([1, 2], 0, async () => {
    calls += 1;
  });
  assert.equal(calls, 2);
});
