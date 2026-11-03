const PRIVATE_HOST_PATTERN =
  /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i;

export function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    PRIVATE_HOST_PATTERN.test(normalized) ||
    normalized.endsWith(".local") ||
    normalized === "[::1]" ||
    normalized === "::1"
  );
}

export function isSafeRemoteHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      !isPrivateHostname(parsed.hostname)
    );
  } catch {
    return false;
  }
}
