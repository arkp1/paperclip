import type { ArticleBlock } from "@/features/reader/services/articleService";

export type ReaderPage = {
  key: string;
  blocks: ArticleBlock[];
};

/**
 * Groups article blocks into swipe-sized pages. This is an estimate based on
 * font size and viewport; each page is a non-scrolling horizontal page.
 */
export function stableBlockKey(identity: string, occurrence: number): string {
  let hash = 2166136261;
  for (let index = 0; index < identity.length; index += 1) {
    hash ^= identity.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `block-${(hash >>> 0).toString(36)}-${occurrence}`;
}

export function paginate(
  blocks: ArticleBlock[],
  fontSize: number,
  width: number,
  height: number,
  lineHeightMultiplier: number,
  paragraphSpacing: number,
  charWidthFactor: number
): ReaderPage[] {
  const lineHeight = fontSize * lineHeightMultiplier;
  const contentHeight = Math.max(220, height - 200);
  const charsPerLine = Math.max(18, width / (fontSize * charWidthFactor));
  const maxCharsPerPage = Math.max(
    120,
    Math.floor((contentHeight / lineHeight) * charsPerLine * 0.94)
  );
  const imageBlockHeight = 180;
  const pages: ReaderPage[] = [];
  let current: ArticleBlock[] = [];
  let usedHeight = 0;

  const pushPage = () => {
    if (current.length > 0) {
      pages.push({ key: `page-${pages.length}`, blocks: current });
      current = [];
      usedHeight = 0;
    }
  };

  for (const originalBlock of blocks) {
    if (originalBlock.type === "image") {
      if (current.length > 0 && usedHeight + imageBlockHeight > contentHeight) {
        pushPage();
      }
      current.push(originalBlock);
      usedHeight += imageBlockHeight;
      continue;
    }

    const chunks = splitLongTextBlock(originalBlock, maxCharsPerPage);
    for (const block of chunks) {
      const lines = Math.max(1, Math.ceil(block.text.length / charsPerLine));
      const blockHeight =
        lines * lineHeight +
        (block.type === "heading" ? 26 : paragraphSpacing + 4);
      if (current.length > 0 && usedHeight + blockHeight > contentHeight) {
        pushPage();
      }
      current.push(block);
      usedHeight += blockHeight;
    }
  }

  pushPage();
  return pages.length > 0
    ? pages.map((page, index) => ({ ...page, key: `page-${index}` }))
    : [{ key: "page-0", blocks: [] }];
}

export type ReaderTextBlock = Extract<ArticleBlock, { text: string }>;

export function splitLongTextBlock(
  block: ReaderTextBlock,
  maxLength: number
): ReaderTextBlock[] {
  if (block.text.length <= maxLength) {
    return [block];
  }

  const parts: ReaderTextBlock[] = [];
  let remaining = block.text;
  while (remaining.length > maxLength) {
    let cut = remaining.lastIndexOf(" ", maxLength);
    if (cut < Math.floor(maxLength * 0.55)) {
      cut = maxLength;
    }
    parts.push({ ...block, text: remaining.slice(0, cut).trim() });
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) {
    parts.push({ ...block, text: remaining });
  }
  return parts;
}
