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
  const contentHeight = Math.max(260, height - 250);
  const charsPerLine = Math.max(18, width / (fontSize * charWidthFactor));
  const viewportBudget = Math.max(
    280,
    Math.floor((contentHeight / lineHeight) * charsPerLine * 0.82)
  );
  const pages: ReaderPage[] = [];
  let current: ArticleBlock[] = [];
  let used = 220;

  for (const originalBlock of blocks) {
    const blocksForPage =
      originalBlock.type === "image"
        ? [originalBlock]
        : splitLongTextBlock(originalBlock, Math.floor(viewportBudget * 0.92));

    for (const block of blocksForPage) {
      const size =
        block.type === "image"
          ? 0
          : block.text.length + (block.type === "heading" ? 100 : 0);
      if (current.length > 0 && used + size > viewportBudget) {
        pages.push({ key: `page-${pages.length}`, blocks: current });
        current = [];
        used = 0;
      }
      current.push(block);
      used += size + paragraphSpacing;
    }
  }

  if (current.length > 0) {
    pages.push({ key: `page-${pages.length}`, blocks: current });
  }

  if (pages.length > 0) {
    const merged: ReaderPage[] = [];
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const imageOnly =
        page.blocks.length > 0 &&
        page.blocks.every((block) => block.type === "image");
      if (!imageOnly) {
        merged.push(page);
        continue;
      }

      const next = pages[index + 1];
      if (next) {
        next.blocks = [...page.blocks, ...next.blocks];
        continue;
      }

      if (merged.length > 0) {
        merged[merged.length - 1].blocks.push(...page.blocks);
      } else {
        merged.push(page);
      }
    }

    return merged.map((page, index) => ({
      ...page,
      key: `page-${index}`,
    }));
  }

  return [{ key: "page-0", blocks: [] }];
}

export function splitLongTextBlock(
  block: Extract<ArticleBlock, { text: string }>,
  maxLength: number
): ArticleBlock[] {
  if (block.text.length <= maxLength) {
    return [block];
  }

  const parts: ArticleBlock[] = [];
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
