/**
 * Extracts the first complete http(s) URL from untrusted shared text.
 * Trailing punctuation is removed, but surrounding prose is preserved.
 */
export function extractSharedUrl(rawValue: string): string {
  const match = rawValue.match(/https?:\/\/[^\s<>"']+/i)?.[0];
  return (match ?? rawValue.trim()).replace(/[.,;)]+$/, "");
}
