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

    if (originalBlock.type === "heading") {
      const lines = Math.max(
        1,
        Math.ceil(originalBlock.text.length / charsPerLine)
      );
      const headingHeight = lines * lineHeight + 26;
      const minimumFollowingText = lineHeight * 2;
      if (
        current.length > 0 &&
        usedHeight + headingHeight + minimumFollowingText > contentHeight
      ) {
        pushPage();
      }
      current.push(originalBlock);
      usedHeight += headingHeight;
      continue;
    }

    let remainingText = originalBlock.text;
    while (remainingText.length > 0) {
      const overhead = paragraphSpacing + 4;
      const availableHeight = contentHeight - usedHeight - overhead;
      const linesThatFit = Math.floor(availableHeight / lineHeight);
      const charsThatFit = Math.max(
        0,
        Math.floor(linesThatFit * charsPerLine * 0.94)
      );
      const minimumUsefulChunk = Math.max(40, charsPerLine * 2);

      if (
        current.length > 0 &&
        charsThatFit < minimumUsefulChunk
      ) {
        pushPage();
        continue;
      }

      const chunkLimit = Math.min(
        maxCharsPerPage,
        Math.max(charsPerLine, charsThatFit)
      );
      const chunk = takeTextChunk(remainingText, chunkLimit);
      if (!chunk.text) {
        break;
      }

      const lines = Math.max(1, Math.ceil(chunk.text.length / charsPerLine));
      const blockHeight = lines * lineHeight + overhead;
      if (current.length > 0 && usedHeight + blockHeight > contentHeight) {
        pushPage();
        continue;
      }

      current.push({ ...originalBlock, text: chunk.text });
      usedHeight += blockHeight;
      remainingText = chunk.rest;
      if (remainingText.length > 0) {
        pushPage();
      }
    }
  }

  pushPage();
  return pages.length > 0
    ? pages.map((page, index) => ({ ...page, key: `page-${index}` }))
    : [{ key: "page-0", blocks: [] }];
}

export type ReaderTextBlock = Extract<ArticleBlock, { text: string }>;

function takeTextChunk(
  text: string,
  maxLength: number
): { text: string; rest: string } {
  if (text.length <= maxLength) {
    return { text, rest: "" };
  }
  let cut = text.lastIndexOf(" ", maxLength);
  if (cut < Math.floor(maxLength * 0.55)) {
    cut = maxLength;
  }
  return {
    text: text.slice(0, cut).trim(),
    rest: text.slice(cut).trim(),
  };
}

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
