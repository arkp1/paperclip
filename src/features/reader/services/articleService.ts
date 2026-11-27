import { getDatabase } from "@/core/database/database";
import { withPrivacyWriteLock } from "@/core/database/privacyWriteLock";
import {
  getBookmarkPrivacy,
  getVaultArticle,
  saveVaultArticle,
} from "@/core/database/privateVaultRepository";
import { getReadableBookmarkById } from "@/features/bookmarks/data/bookmarkRepository";
import { isReadableArticleUrl } from "@/features/reader/utils/isReadableArticleUrl";
import { isSafeRemoteHttpUrl } from "@/shared/utils/safeRemoteUrl";
import { fetchSafeRemote } from "@/shared/utils/safeFetch";
import { readBoundedText } from "@/shared/utils/boundedResponse";

export type ArticleBlock =
  | {
      type: "heading" | "paragraph" | "quote";
      text: string;
      sourceKey?: string;
    }
  | {
      type: "image";
      src: string;
      alt: string;
      sourceKey?: string;
    };

export type CachedArticle = {
  blocks: ArticleBlock[];
  wordCount: number;
  fetchedAt: number;
};

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const ARTICLE_CACHE_VERSION = 2;
const MAX_HTML_CHARACTERS = 1_500_000;
const MAX_HTML_BYTES = 3_000_000;
const REQUEST_TIMEOUT_MS = 10_000;

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
  const privacy = await getBookmarkPrivacy(bookmarkId);
  if (privacy === "unavailable") {
    throw new Error("The private vault is locked.");
  }
  const row = (privacy === "private")
    ? await getVaultArticle(bookmarkId)
    : await (
        await getDatabase()
      ).getFirstAsync<{
        blocks: string;
        wordCount: number;
        fetchedAt: number;
        cacheVersion: number;
      }>(
        `SELECT blocks, word_count AS wordCount, fetched_at AS fetchedAt,
                cache_version AS cacheVersion
         FROM article_contents
         WHERE bookmark_id = ?`,
        bookmarkId
      );

  if (
    !row ||
    (!allowStale &&
      (row.cacheVersion < ARTICLE_CACHE_VERSION ||
        Date.now() - row.fetchedAt > CACHE_MAX_AGE_MS))
  ) {
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
  return withPrivacyWriteLock(async () => {
    const privacy = await getBookmarkPrivacy(bookmarkId);
    if (privacy === "unavailable") {
      throw new Error("The private vault is locked.");
    }
    if (privacy === "private") {
      await saveVaultArticle(
        bookmarkId,
        JSON.stringify(article.blocks),
        article.wordCount,
        article.fetchedAt,
        ARTICLE_CACHE_VERSION
      );
      return;
    }
    const database = await getDatabase();
    await database.runAsync(
      `INSERT INTO article_contents (bookmark_id, blocks, word_count, fetched_at, cache_version)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(bookmark_id) DO UPDATE SET
         blocks = excluded.blocks,
         word_count = excluded.word_count,
         fetched_at = excluded.fetched_at,
         cache_version = excluded.cache_version`,
      bookmarkId,
      JSON.stringify(article.blocks),
      article.wordCount,
      article.fetchedAt,
      ARTICLE_CACHE_VERSION
    );
  });
}

async function fetchArticle(url: string): Promise<CachedArticle> {
  assertFetchableArticleUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { response, finalUrl } = await fetchSafeRemote(url, {
      signal: controller.signal,
      headers: { Accept: "text/html,application/xhtml+xml" },
    });

    if (!response.ok) {
      throw new Error("The article could not be downloaded.");
    }
    if (!isReadableArticleUrl(finalUrl)) {
      throw new Error("This link cannot be read in the app.");
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("html")) {
      throw new Error("This link is not an article page.");
    }

    const html = await readBoundedText(
      response,
      MAX_HTML_BYTES,
      MAX_HTML_CHARACTERS
    );
    const blocks = extractBlocks(html, finalUrl);
    if (blocks.length === 0) {
      throw new Error("No readable article text was found.");
    }

    const wordCount = blocks.reduce(
      (count, block) =>
        count + (block.type === "image" ? 0 : block.text.split(/\s+/).length),
      0
    );

    return { blocks, wordCount, fetchedAt: Date.now() };
  } finally {
    clearTimeout(timeout);
  }
}

function assertFetchableArticleUrl(rawUrl: string): void {
  if (!isSafeRemoteHttpUrl(rawUrl) || !isReadableArticleUrl(rawUrl)) {
    throw new Error("This link cannot be read in the app.");
  }
}

function extractBlocks(html: string, baseUrl: string): ArticleBlock[] {
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

  const entries: { index: number; block: ArticleBlock }[] = [];
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

    entries.push({
      index: match.index,
      block: {
        type: isHeading ? "heading" : tag === "blockquote" ? "quote" : "paragraph",
        text,
      },
    });
  }

  const imagePattern = /<img(?=\s|>)([^>]*)>/gi;
  const seenImages = new Set<string>();
  while ((match = imagePattern.exec(article))) {
    const attributes = match[1] ?? "";
    const declaredWidth = Number.parseInt(
      readAttribute(attributes, "width") ?? "",
      10
    );
    const declaredHeight = Number.parseInt(
      readAttribute(attributes, "height") ?? "",
      10
    );
    if (
      (Number.isFinite(declaredWidth) && declaredWidth > 0 && declaredWidth < 120) ||
      (Number.isFinite(declaredHeight) && declaredHeight > 0 && declaredHeight < 120)
    ) {
      continue;
    }

    const src =
      readAttribute(attributes, "src") ??
      readAttribute(attributes, "data-src") ??
      readAttribute(attributes, "data-original") ??
      readAttribute(attributes, "srcset")?.split(",")[0]?.trim().split(" ")[0];
    const safeSrc = src ? safeImageUrl(src, baseUrl) : null;
    if (!safeSrc || seenImages.has(safeSrc)) {
      continue;
    }
    const alt = normalizeText(
      decodeEntities(readAttribute(attributes, "alt") ?? "Article image")
    );
    if (
      /\b(whatsapp|facebook|twitter|instagram|linkedin|pinterest|reddit|telegram|share|icon|logo)\b/i.test(
        `${alt} ${safeSrc}`
      )
    ) {
      continue;
    }
    seenImages.add(safeSrc);
    entries.push({
      index: match.index,
      block: {
        type: "image",
        src: safeSrc,
        alt,
      },
    });
  }

  return entries
    .sort((left, right) => left.index - right.index)
    .slice(0, 400)
    .map((entry) => entry.block);
}

function readAttribute(attributes: string, name: string): string | null {
  const match = attributes.match(
    new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
  );
  return match?.[2] ?? match?.[3] ?? match?.[4] ?? null;
}

function safeImageUrl(source: string, baseUrl: string): string | null {
  try {
    const resolved = new URL(decodeEntities(source), baseUrl);
    if (!isSafeRemoteHttpUrl(resolved.toString())) {
      return null;
    }
    return resolved.toString();
  } catch {
    return null;
  }
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
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value)
  ) {
    return false;
  }

  if (value.type === "image") {
    return (
      "src" in value &&
      "alt" in value &&
      typeof value.src === "string" &&
      typeof value.alt === "string"
    );
  }

  return (
    (value.type === "heading" ||
      value.type === "paragraph" ||
      value.type === "quote") &&
    "text" in value &&
    typeof value.text === "string"
  );
}
