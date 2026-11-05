export type HttpUrlValidation =
  | { valid: true; url: string; domain: string }
  | { valid: false; message: string };

/**
 * Accepts only complete http(s) URLs. The original string is preserved (after
 * trimming) so query parameters required to open the content are not lost.
 */
export function validateHttpUrl(rawUrl: string): HttpUrlValidation {
  const trimmed = rawUrl.trim();

  if (trimmed.length === 0) {
    return { valid: false, message: "Paste a link to save." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      message: "Enter a full URL, including https://.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      message: "Only http and https links can be saved.",
    };
  }

  if (!parsed.hostname) {
    return { valid: false, message: "Enter a link with a website address." };
  }

  if (isLoopbackIpv6(parsed.hostname)) {
    return { valid: false, message: "That destination is not allowed." };
  }

  return {
    valid: true,
    url: trimmed,
    domain: parsed.hostname.replace(/^www\./i, ""),
  };
}

function isLoopbackIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return normalized === "::1" || normalized === "0:0:0:0:0:0:0:1";
}

/**
 * Best-effort comparison form used for duplicate detection. It is not stored;
 * the original URL is always the value that gets saved.
 */
export function normalizeUrlForComparison(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    parsed.hash = "";
    const path =
      parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/+$/, "");
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${path}${parsed.search}`;
  } catch {
    return rawUrl.trim();
  }
}
