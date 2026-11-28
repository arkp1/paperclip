import assert from "node:assert/strict";
import test from "node:test";

import { githubRepositoryPreview } from "../src/features/save-link/utils/githubPreview.ts";

test("builds a social thumbnail for a GitHub repository", () => {
  assert.deepEqual(githubRepositoryPreview("https://github.com/arkp1/paperclip"), {
    title: "arkp1/paperclip",
    description: null,
    siteName: "GitHub",
    canonicalUrl: "https://github.com/arkp1/paperclip",
    imageUrl: "https://opengraph.githubassets.com/1/arkp1/paperclip",
  });
});

test("normalizes repository subpages and git suffixes", () => {
  assert.equal(
    githubRepositoryPreview("https://www.github.com/arkp1/paperclip.git/issues/1")
      ?.imageUrl,
    "https://opengraph.githubassets.com/1/arkp1/paperclip"
  );
});

test("ignores GitHub navigation and non-repository pages", () => {
  assert.equal(githubRepositoryPreview("https://github.com/features"), null);
  assert.equal(githubRepositoryPreview("https://gist.github.com/user/abc"), null);
});
