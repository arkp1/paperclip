const URL_PATTERN = /\bhttps?:\/\/[^\s"'<>]+/gi;
const SECRET_QUERY_PATTERN =
  /([?&](?:token|key|secret|password|sig|signature|auth)=)[^&\s]+/gi;

/** Removes URLs and common secret query values from a log message. */
export function sanitizeLogText(value: string): string {
  return value
    .replace(URL_PATTERN, "[url]")
    .replace(SECRET_QUERY_PATTERN, "$1[redacted]");
}

export function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeLogText(value);
  }
  if (value instanceof Error) {
    return sanitizeLogText(`${value.name}: ${value.message}`);
  }
  return value;
}

let installed = false;

/**
 * Sanitizes console warnings/errors at the app boundary. Features should not
 * log raw error messages that may contain full URLs or query tokens.
 */
export function installSafeConsole(): void {
  if (installed) {
    return;
  }
  installed = true;
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);
  console.warn = (...args: unknown[]) => {
    originalWarn(...args.map(sanitizeLogValue));
  };
  console.error = (...args: unknown[]) => {
    originalError(...args.map(sanitizeLogValue));
  };
}
