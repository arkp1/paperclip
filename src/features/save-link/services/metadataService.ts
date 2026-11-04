import { validateHttpUrl } from "@/shared/utils/url";

export type LinkMetadata = {
  title: string | null;
  description: string | null;
  siteName: string | null;
  canonicalUrl: string | null;
  imageUrl: string | null;
};

export class MetadataUnavailableError extends Error {
  constructor(message = "Preview metadata is unavailable.") {
    super(message);
    this.name = "MetadataUnavailableError";
  }
}

const REQUEST_TIMEOUT_MS = 8_000;
const YOUTUBE_TIMEOUT_MS = 6_000;
const REDDIT_TIMEOUT_MS = 6_000;
const MAX_HTML_CHARACTERS = 512_000;
const MAX_OEMBED_CHARACTERS = 64_000;
const MAX_REDDIT_CHARACTERS = 512_000;
const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_SITE_NAME_LENGTH = 100;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const REDDIT_PREVIEW_USER_AGENT = "Twitterbot/1.0";

const PRIVATE_HOST_PATTERN =
  /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i;

/**
 * Bounded metadata retrieval used only from the Save Link screen. It never
 * runs page JavaScript and rejects private/loopback destinations.
 *
 * NOTE: React Native's fetch follows redirects internally, so redirect
 * destinations are not re-validated here. This is a known limitation to address
 * with a native safe-fetch bridge before share-intent capture ships.
 */
export async function fetchLinkMetadata(rawUrl: string): Promise<LinkMetadata> {
  const validation = validateHttpUrl(rawUrl);
  if (!validation.valid) {
    throw new MetadataUnavailableError(validation.message);
  }

  const target = new URL(validation.url);
  if (isPrivateHost(target.hostname)) {
    throw new MetadataUnavailableError("That destination is not allowed.");
  }

  if (isYouTubeHost(target.hostname)) {
    try {
      return await fetchYouTubeMetadata(validation.url);
    } catch {
      // Fall through to the regular HTML fetch if oEmbed is unavailable.
    }
  }

  if (isRedditHost(target.hostname)) {
    const redditMetadata = await fetchRedditMetadata(validation.url);
    if (redditMetadata) {
      return redditMetadata;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(validation.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "text/html,application/xhtml+xml" },
    });

    if (!response.ok) {
      throw new MetadataUnavailableError();
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      throw new MetadataUnavailableError("This link is not a web page.");
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > MAX_HTML_CHARACTERS) {
      throw new MetadataUnavailableError("This page is too large to preview.");
    }

    const html = (await response.text()).slice(0, MAX_HTML_CHARACTERS);
    return parseMetadata(html, validation.url);
  } catch (error) {
    if (error instanceof MetadataUnavailableError) {
      throw error;
    }
    throw new MetadataUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRedditSocialPreview(
  url: string
): Promise<LinkMetadata | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REDDIT_TIMEOUT_MS);

  try {
    // Reddit serves compact Open Graph tags and its generated share card to
    // social crawlers. This is the same preview X/Twitter shows for the link.
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": REDDIT_PREVIEW_USER_AGENT,
      },
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      return null;
    }

    const html = (await response.text()).slice(0, MAX_HTML_CHARACTERS);
    const metadata = parseMetadata(html, url);
    if (!metadata.imageUrl) {
      return null;
    }

    const cleanedTitle = metadata.title
      ? metadata.title.replace(
          /^From the .+? community on Reddit:\s*/i,
          ""
        )
      : null;

    return {
      ...metadata,
      title: cleanedTitle ?? metadata.title,
      siteName: "Reddit",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchYouTubeMetadata(url: string): Promise<LinkMetadata> {
  const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
    url
  )}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), YOUTUBE_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new MetadataUnavailableError();
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("json")) {
      throw new MetadataUnavailableError();
    }

    const body = (await response.text()).slice(0, MAX_OEMBED_CHARACTERS);
    const data: unknown = JSON.parse(body);
    if (!isRecord(data)) {
      throw new MetadataUnavailableError();
    }

    const title =
      typeof data.title === "string" ? normalizeText(data.title) : null;
    if (!title) {
      throw new MetadataUnavailableError();
    }

    return {
      title: truncate(title, MAX_TITLE_LENGTH),
      description: null,
      siteName: "YouTube",
      canonicalUrl: url,
      imageUrl:
        typeof data.thumbnail_url === "string"
          ? normalizeYouTubeThumbnail(data.thumbnail_url, url)
          : null,
    };
  } catch (error) {
    if (error instanceof MetadataUnavailableError) {
      throw error;
    }
    throw new MetadataUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeYouTubeThumbnail(
  candidate: string,
  fallbackUrl: string
): string | null {
  const safeUrl = readSafeRemoteUrl(candidate, fallbackUrl);
  if (!safeUrl) {
    return null;
  }

  try {
    const parsed = new URL(safeUrl);
    if (parsed.hostname.endsWith("ytimg.com")) {
      parsed.pathname = parsed.pathname.replace(
        /\/(hq|sd|)default\.jpg$/i,
        "/mqdefault.jpg"
      );
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isYouTubeHost(hostname: string): boolean {
  return YOUTUBE_HOSTS.has(hostname.toLowerCase().replace(/^www\./, ""));
}

function isRedditHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "reddit.com" ||
    normalized.endsWith(".reddit.com") ||
    normalized === "redd.it"
  );
}

async function fetchRedditMetadata(url: string): Promise<LinkMetadata | null> {
  const preview = await fetchRedditSocialPreview(url);
  if (preview) {
    return preview;
  }

  const oembedEndpoint = `https://www.reddit.com/oembed?url=${encodeURIComponent(
    url
  )}`;
  const oembedController = new AbortController();
  const oembedTimeout = setTimeout(
    () => oembedController.abort(),
    REDDIT_TIMEOUT_MS
  );

  let title: string | null = null;
  let canonicalUrl = url;

  try {
    const response = await fetch(oembedEndpoint, {
      signal: oembedController.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("json")) {
      return null;
    }

    const data: unknown = JSON.parse(
      (await response.text()).slice(0, MAX_OEMBED_CHARACTERS)
    );
    if (!isRecord(data) || typeof data.title !== "string") {
      return null;
    }

    title = normalizeText(data.title);
    if (!title) {
      return null;
    }

    if (typeof data.html === "string") {
      const href = data.html.match(/href="([^"]*\/comments\/[^"]+)"/i)?.[1];
      if (href) {
        canonicalUrl =
          readSafeRemoteUrl(decodeHtmlEntities(href), url) ?? canonicalUrl;
      }
    }
  } catch {
    return null;
  } finally {
    clearTimeout(oembedTimeout);
  }

  let imageUrl: string | null = null;
  const embedController = new AbortController();
  const embedTimeout = setTimeout(
    () => embedController.abort(),
    REDDIT_TIMEOUT_MS
  );

  try {
    const embedUrl = new URL(canonicalUrl);
    embedUrl.hostname = "embed.reddit.com";
    embedUrl.search = "";
    embedUrl.hash = "";

    const response = await fetch(embedUrl.toString(), {
      signal: embedController.signal,
      headers: { Accept: "text/html" },
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.toLowerCase().includes("text/html")) {
        const html = (await response.text())
          .slice(0, MAX_REDDIT_CHARACTERS)
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&");
        const candidates =
          html.match(/https:\/\/(?:preview|i)\.redd\.it\/[^"'\s\\]+/g) ?? [];
        const selected =
          candidates.find((candidate) =>
            /\.(jpe?g|png|webp|gif)(\?|$)/i.test(candidate)
          ) ?? candidates[0];
        imageUrl = selected ? readSafeRemoteUrl(selected, canonicalUrl) : null;
      }
    }
  } catch {
    // The title is still useful if the embed page is unavailable.
  } finally {
    clearTimeout(embedTimeout);
  }

  return {
    title: truncate(title, MAX_TITLE_LENGTH),
    description: null,
    siteName: "Reddit",
    canonicalUrl,
    imageUrl,
  };
}

function parseMetadata(html: string, fallbackUrl: string): LinkMetadata {  const documentTitle = readElementText(html, "title");
  const ogTitle = readMetaContent(html, "og:title") ?? readMetaContent(html, "twitter:title");
  const description =
    readMetaContent(html, "og:description") ??
    readMetaContent(html, "twitter:description") ??
    readMetaContent(html, "description");
  const siteName = readMetaContent(html, "og:site_name");
  const imageCandidate =
    readMetaContent(html, "og:image") ??
    readMetaContent(html, "twitter:image") ??
    readLinkHref(html, "image_src");
  const canonicalCandidate =
    readLinkHref(html, "canonical") ?? readMetaContent(html, "og:url");

  return {
    title: truncate(ogTitle ?? documentTitle, MAX_TITLE_LENGTH),
    description: truncate(description, MAX_DESCRIPTION_LENGTH),
    siteName: truncate(siteName, MAX_SITE_NAME_LENGTH),
    canonicalUrl: readSafeRemoteUrl(canonicalCandidate, fallbackUrl),
    imageUrl: readSafeRemoteUrl(imageCandidate, fallbackUrl),
  };
}

function readMetaContent(html: string, key: string): string | null {
  const tagPattern = new RegExp(
    `<meta\\s+[^>]*(?:property|name)\\s*=\\s*["']${escapeRegExp(key)}["'][^>]*>`,
    "i"
  );
  const tag = html.match(tagPattern)?.[0];
  if (!tag) {
    return null;
  }

  const content = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
  return content ? normalizeText(decodeHtmlEntities(content)) : null;
}

function readElementText(html: string, tagName: string): string | null {
  const match = html.match(
    new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i")
  );
  if (!match?.[1]) {
    return null;
  }
  return normalizeText(decodeHtmlEntities(stripTags(match[1])));
}

function readLinkHref(html: string, rel: string): string | null {
  const tagPattern = new RegExp(
    `<link\\s+[^>]*rel\\s*=\\s*["']${escapeRegExp(rel)}["'][^>]*>`,
    "i"
  );
  const tag = html.match(tagPattern)?.[0];
  if (!tag) {
    return null;
  }

  const href = tag.match(/href\s*=\s*["']([^"']*)["']/i)?.[1];
  return href ? decodeHtmlEntities(href).trim() : null;
}

function readSafeRemoteUrl(candidate: string | null, fallbackUrl: string): string | null {
  if (!candidate) {
    return null;
  }

  try {
    const parsed = new URL(candidate, fallbackUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (isPrivateHost(parsed.hostname)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeText(value: string): string | null {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function truncate(value: string | null, maxLength: number): string | null {
  return value ? value.slice(0, maxLength) : null;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const lowered = entity.toLowerCase();
    if (lowered.startsWith("#x")) {
      const codePoint = Number.parseInt(lowered.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    if (lowered.startsWith("#")) {
      const codePoint = Number.parseInt(lowered.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    switch (lowered) {
      case "amp":
        return "&";
      case "quot":
        return '"';
      case "apos":
      case "#39":
        return "'";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "nbsp":
        return " ";
      default:
        return match;
    }
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPrivateHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    PRIVATE_HOST_PATTERN.test(normalized) ||
    normalized.endsWith(".local") ||
    normalized === "[::1]" ||
    normalized === "::1"
  );
}
