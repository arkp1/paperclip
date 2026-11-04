import { getDatabase } from "@/core/database/database";
import { getReadableBookmarkById } from "@/features/bookmarks/data/bookmarkRepository";

export type ArticleBlock = {
  type: "heading" | "paragraph" | "quote";
  text: string;
};

export type CachedArticle = {
  blocks: ArticleBlock[];
  wordCount: number;
  fetchedAt: number;
};

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_HTML_CHARACTERS = 1_500_000;
const REQUEST_TIMEOUT_MS = 10_000;
const PRIVATE_HOST_PATTERN =
  /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i;

export async function loadArticle(
  bookmarkId: string,
  force = false
): Promise<CachedArticle> {
  if (!force) {
    const cached = await getCachedArticle(bookmarkId);
    if (cached) {
      return cached;
    }
  }

  const bookmark = await getReadableBookmarkById(bookmarkId);
  if (!bookmark) {
    throw new Error("This saved link no longer exists.");
  }

  const fetched = await fetchArticle(bookmark.originalUrl);
  await saveArticle(bookmarkId, fetched);
  return fetched;
}

export async function cacheArticleInBackground(bookmarkId: string): Promise<void> {
  try {
    await loadArticle(bookmarkId, true);
  } catch {
    // Reading view can retry later; saving the bookmark is unaffected.
  }
}

async function getCachedArticle(
  bookmarkId: string
): Promise<CachedArticle | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    blocks: string;
    wordCount: number;
    fetchedAt: number;
  }>(
    `SELECT blocks, word_count AS wordCount, fetched_at AS fetchedAt
     FROM article_contents
     WHERE bookmark_id = ?`,
    bookmarkId
  );

  if (!row || Date.now() - row.fetchedAt > CACHE_MAX_AGE_MS) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(row.blocks);
    if (!Array.isArray(parsed)) {
      return null;
    }
    const blocks = parsed.filter(isArticleBlock);
    return blocks.length > 0
      ? { blocks, wordCount: row.wordCount, fetchedAt: row.fetchedAt }
      : null;
  } catch {
    return null;
  }
}

async function saveArticle(
  bookmarkId: string,
  article: CachedArticle
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO article_contents (bookmark_id, blocks, word_count, fetched_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(bookmark_id) DO UPDATE SET
       blocks = excluded.blocks,
       word_count = excluded.word_count,
       fetched_at = excluded.fetched_at`,
    bookmarkId,
    JSON.stringify(article.blocks),
    article.wordCount,
    article.fetchedAt
  );
}

async function fetchArticle(url: string): Promise<CachedArticle> {
  const parsed = new URL(url);
  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    PRIVATE_HOST_PATTERN.test(parsed.hostname.toLowerCase())
  ) {
    throw new Error("This link cannot be read in the app.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "text/html,application/xhtml+xml" },
    });

    if (!response.ok) {
      throw new Error("The article could not be downloaded.");
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("html")) {
      throw new Error("This link is not an article page.");
    }

    const html = (await response.text()).slice(0, MAX_HTML_CHARACTERS);
    const blocks = extractBlocks(html);
    if (blocks.length === 0) {
      throw new Error("No readable article text was found.");
    }

    const wordCount = blocks.reduce(
      (count, block) => count + block.text.split(/\s+/).length,
      0
    );

    return { blocks, wordCount, fetchedAt: Date.now() };
  } finally {
    clearTimeout(timeout);
  }
}

function extractBlocks(html: string): ArticleBlock[] {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(
      /<(script|style|nav|header|footer|aside|form|svg|noscript)[\s\S]*?<\/\1>/gi,
      " "
    );

  const article =
    cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    cleaned;

  const blocks: ArticleBlock[] = [];
  const blockPattern = /<(h[1-4]|p|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(article))) {
    const tag = (match[1] ?? "").toLowerCase();
    const text = normalizeText(decodeEntities(stripTags(match[2] ?? "")));
    if (!text) {
      continue;
    }

    const isHeading = tag.startsWith("h");
    if (!isHeading && text.length < 40) {
      continue;
    }

    blocks.push({
      type: isHeading ? "heading" : tag === "blockquote" ? "quote" : "paragraph",
      text,
    });
  }

  return blocks.slice(0, 400);
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    );
}

function isArticleBlock(value: unknown): value is ArticleBlock {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "text" in value &&
    (value.type === "heading" ||
      value.type === "paragraph" ||
      value.type === "quote") &&
    typeof value.text === "string"
  );
}
