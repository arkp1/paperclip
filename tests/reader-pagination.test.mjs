import assert from "node:assert/strict";
import { test } from "node:test";

import {
  paginate,
  splitLongTextBlock,
  stableBlockKey,
} from "../src/features/reader/utils/paginate.ts";

test("empty article produces one empty page", () => {
  const pages = paginate([], 16, 360, 700, 1.6, 12, 0.52);
  assert.equal(pages.length, 1);
  assert.deepEqual(pages[0], { key: "page-0", blocks: [] });
});

test("long blocks split without losing text", () => {
  const block = {
    type: "paragraph",
    text: "one two three four five six seven eight nine ten",
  };
  const parts = splitLongTextBlock(block, 15);
  assert.ok(parts.length > 1);
  assert.equal(parts.map((part) => part.text).join(" "), block.text);
});

test("pagination splits content into multiple pages", () => {
  const blocks = Array.from({ length: 12 }, (_, index) => ({
    type: "paragraph",
    text: `Paragraph ${index} ${"word ".repeat(80)}`,
  }));
  const pages = paginate(blocks, 16, 360, 700, 1.6, 12, 0.52);
  assert.ok(pages.length > 1);
  assert.equal(pages[0].key, "page-0");
  assert.ok(pages.every((page) => page.blocks.length > 0));
});

test("images share a page with short text when space allows", () => {
  const blocks = [
    { type: "image", src: "https://example.com/a.jpg", alt: "A" },
    { type: "paragraph", text: "A short caption-sized sentence." },
  ];
  const pages = paginate(blocks, 16, 360, 700, 1.6, 12, 0.52);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].blocks.length, 2);
});

test("a following paragraph fills the remainder of an image/heading page", () => {
  const blocks = [
    { type: "image", src: "https://example.com/a.jpg", alt: "A" },
    { type: "heading", text: "Xreal One Pro AR glasses" },
    {
      type: "paragraph",
      text: "Who says you cannot travel with a big screen? ".repeat(8),
    },
  ];
  const pages = paginate(blocks, 16, 360, 800, 1.6, 12, 0.52);
  const paragraph = pages[0].blocks.find((block) => block.type === "paragraph");
  assert.ok(paragraph);
  assert.equal(blocks[2].text.startsWith(paragraph.text), true);
});



test("stable block keys are deterministic and occurrence-aware", () => {
  assert.equal(stableBlockKey("article", 0), stableBlockKey("article", 0));
  assert.notEqual(stableBlockKey("article", 0), stableBlockKey("article", 1));
  assert.notEqual(stableBlockKey("article", 0), stableBlockKey("other", 0));
});
