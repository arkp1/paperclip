const SOCIAL_OR_MEDIA_HOSTS = [
  "x.com",
  "twitter.com",
  "instagram.com",
  "facebook.com",
  "threads.net",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "reddit.com",
  "redd.it",
  "pinterest.com",
  "snapchat.com",
  "linkedin.com",
];

const NON_ARTICLE_EXTENSION = /\.(pdf|jpe?g|png|gif|webp|avif|mp4|mov|webm|mp3|m4a|zip|apk)(\?|$)/i;

/**
 * Article-like links open in the in-app reader. Social, video, and direct
 * media links are intentionally excluded.
 */
export function isReadableArticleUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (
      SOCIAL_OR_MEDIA_HOSTS.some(
        (blocked) => host === blocked || host.endsWith(`.${blocked}`)
      )
    ) {
      return false;
    }

    return !NON_ARTICLE_EXTENSION.test(url.pathname);
  } catch {
    return false;
  }
}
