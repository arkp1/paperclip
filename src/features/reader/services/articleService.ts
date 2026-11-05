import { getDatabase } from "@/core/database/database";
import { getReadableBookmarkById } from "@/features/bookmarks/data/bookmarkRepository";
import { isReadableArticleUrl } from "@/features/reader/utils/isReadableArticleUrl";

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
const MAX_HTML_BYTES = 3_000_000;
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 10_000;
const PRIVATE_HOST_PATTERN =
  /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|198\.(1[89]|2\d)\.|\[?(::1|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|fe[89ab][0-9a-f]:))/i;

/**
 * Loads cached article text for a bookmark, or downloads and caches it.
 * Access is checked before reading the cache so a locked private bookmark
 * cannot return previously cached text.
 */
export async function loadArticle(
  bookmarkId: string,
  force = false
): Promise<CachedArticle> {
  const bookmark = await getReadableBookmarkById(bookmarkId);
  if (!bookmark) {
    throw new Error("This saved link no longer exists.");
  }

  if (!force) {
    const cached = await getCachedArticle(bookmarkId);
    if (cached) {
      return cached;
    }
  }

  let fetched: CachedArticle;
  try {
    fetched = await fetchArticle(bookmark.originalUrl);
  } catch (error) {
    const stale = await getCachedArticle(bookmarkId, true);
    if (stale) {
      return stale;
    }
    throw error;
  }

  await saveArticle(bookmarkId, fetched);
  return fetched;
}

/**
 * Best-effort article cache warm-up for a newly saved bookmark.
 */
export async function cacheArticleInBackground(bookmarkId: string): Promise<void> {
  try {
    await loadArticle(bookmarkId, true);
  } catch {
    // Reading view can retry later; saving the bookmark is unaffected.
  }
}

async function getCachedArticle(
  bookmarkId: string,
  allowStale = false
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

  if (!row || (!allowStale && Date.now() - row.fetchedAt > CACHE_MAX_AGE_MS)) {
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
  assertFetchableArticleUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let currentUrl = url;

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      assertFetchableArticleUrl(currentUrl);

      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
        headers: { Accept: "text/html,application/xhtml+xml" },
      });

      if (response.url) {
        assertFetchableArticleUrl(response.url);
      }

      if (isRedirectStatus(response.status)) {
        if (redirects === MAX_REDIRECTS) {
          throw new Error("The article redirected too many times.");
        }

        const location = response.headers.get("location");
        await response.body?.cancel().catch(() => undefined);
        if (!location) {
          throw new Error("The article redirect was invalid.");
        }

        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        throw new Error("The article could not be downloaded.");
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("html")) {
        throw new Error("This link is not an article page.");
      }

      const html = await readBoundedHtml(response);
      const blocks = extractBlocks(html);
      if (blocks.length === 0) {
        throw new Error("No readable article text was found.");
      }

      const wordCount = blocks.reduce(
        (count, block) => count + block.text.split(/\s+/).length,
        0
      );

      return { blocks, wordCount, fetchedAt: Date.now() };
    }

    throw new Error("The article could not be downloaded.");
  } finally {
    clearTimeout(timeout);
  }
}

function assertFetchableArticleUrl(rawUrl: string): void {
  const parsed = new URL(rawUrl);
  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    PRIVATE_HOST_PATTERN.test(parsed.hostname.toLowerCase()) ||
    !isReadableArticleUrl(rawUrl)
  ) {
    throw new Error("This link cannot be read in the app.");
  }
}

function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function readBoundedHtml(response: Response): Promise<string> {
  const body = response.body;
  const declaredSize = Number(response.headers.get("content-length") ?? "0");
  if (declaredSize > MAX_HTML_BYTES) {
    await body?.cancel().catch(() => undefined);
    throw new Error("The article page is too large.");
  }

  if (!body || typeof body.getReader !== "function" || typeof TextDecoder === "undefined") {
    return (await response.text()).slice(0, MAX_HTML_CHARACTERS);
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }

      totalBytes += value.byteLength;
      if (totalBytes > MAX_HTML_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new Error("The article page is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8")
    .decode(merged)
    .slice(0, MAX_HTML_CHARACTERS);
}

function extractBlocks(html: string): ArticleBlock[] {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(
      /<(script|style|nav|header|footer|aside|form|svg|noscript)(?=\s|>)[\s\S]*?<\/\1\s*>/gi,
      " "
    );

  const article =
    cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    cleaned;

  const blocks: ArticleBlock[] = [];
  const blockPattern =
    /<(h[1-4]|p|li|blockquote)(?=\s|>)[^>]*>([\s\S]*?)<\/\1\s*>/gi;
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
      safeCodePoint(Number.parseInt(code, 10))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      safeCodePoint(Number.parseInt(code, 16))
    );
}

function safeCodePoint(code: number): string {
  if (
    !Number.isInteger(code) ||
    code < 0 ||
    code > 0x10ffff ||
    (code >= 0xd800 && code <= 0xdfff)
  ) {
    return "\uFFFD";
  }

  try {
    return String.fromCodePoint(code);
  } catch {
    return "\uFFFD";
  }
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
