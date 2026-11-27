const PRIVATE_HOST_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".home.arpa",
  ".nip.io",
  ".sslip.io",
  ".xip.io",
] as const;
const PRIVATE_HOST_NAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "localtest.me",
  "lvh.me",
  "vcap.me",
  "metadata.google.internal",
  "metadata",
]);

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

function parseIpv4(hostname: string): number[] | null {
  const parts = hostname.split(".");
  if (parts.length !== 4) {
    return null;
  }
  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return Number.NaN;
    }
    return Number(part);
  });
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : null;
}

function isPrivateIpv4([a, b, c]: number[]): boolean {
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function parseIpv6Part(part: string): string[] | null {
  if (part.includes(".")) {
    const ipv4 = parseIpv4(part);
    if (!ipv4) {
      return null;
    }
    return [
      ((ipv4[0] << 8) | ipv4[1]).toString(16),
      ((ipv4[2] << 8) | ipv4[3]).toString(16),
    ];
  }
  if (!/^[0-9a-f]{1,4}$/i.test(part)) {
    return null;
  }
  return [part];
}

function parseIpv6(hostname: string): number[] | null {
  const normalized = hostname.replace(/^\[|\]$/g, "").split("%")[0];
  if (!normalized.includes(":")) {
    return null;
  }

  const halves = normalized.split("::");
  if (halves.length > 2) {
    return null;
  }

  const parseHalf = (half: string): string[] | null => {
    if (!half) {
      return [];
    }
    const groups: string[] = [];
    for (const part of half.split(":")) {
      const parsed = parseIpv6Part(part);
      if (!parsed) {
        return null;
      }
      groups.push(...parsed);
    }
    return groups;
  };

  const left = parseHalf(halves[0] ?? "");
  const right = parseHalf(halves[1] ?? "");
  if (!left || !right) {
    return null;
  }

  if (halves.length === 1) {
    return left.length === 8
      ? left.map((part) => Number.parseInt(part, 16))
      : null;
  }

  const missing = 8 - left.length - right.length;
  if (missing < 1) {
    return null;
  }
  const expanded = [
    ...left,
    ...Array<string>(missing).fill("0"),
    ...right,
  ];
  return expanded.map((part) => Number.parseInt(part, 16));
}

function isPrivateIpv6(groups: number[]): boolean {
  const [first, second, third, fourth, fifth, sixth, seventh, eighth] = groups;
  const allZeroBeforeLast =
    first === 0 &&
    second === 0 &&
    third === 0 &&
    fourth === 0 &&
    fifth === 0 &&
    sixth === 0 &&
    seventh === 0;

  if (allZeroBeforeLast && (eighth === 0 || eighth === 1)) {
    return true;
  }
  if ((first & 0xfe00) === 0xfc00) {
    return true;
  }
  if ((first & 0xffc0) === 0xfe80) {
    return true;
  }
  if ((first & 0xff00) === 0xff00) {
    return true;
  }
  if (
    first === 0 &&
    second === 0 &&
    third === 0 &&
    fourth === 0 &&
    fifth === 0 &&
    sixth === 0xffff
  ) {
    return isPrivateIpv4([
      (seventh >> 8) & 0xff,
      seventh & 0xff,
      (eighth >> 8) & 0xff,
      eighth & 0xff,
    ]);
  }
  // IPv4-compatible, discard-only, documentation, Teredo, NAT64, and 6to4
  // ranges are not useful public destinations and are safer to reject.
  if (
    (first === 0 &&
      second === 0 &&
      third === 0 &&
      fourth === 0 &&
      fifth === 0 &&
      sixth === 0) ||
    first === 0x0100 ||
    (first === 0x0064 && second === 0xff9b) ||
    (first === 0x2001 &&
      (second === 0x0db8 || second === 0x0010)) ||
    first === 0x2002
  ) {
    return true;
  }
  return false;
}

export function isPrivateHostname(hostname: string): boolean {
  const normalized = normalizeHost(hostname);
  if (!normalized) {
    return true;
  }
  if (PRIVATE_HOST_NAMES.has(normalized)) {
    return true;
  }
  if (PRIVATE_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix))) {
    return true;
  }

  const withoutBrackets = normalized.replace(/^\[|\]$/g, "");
  const ipv4 = parseIpv4(withoutBrackets);
  if (ipv4) {
    return isPrivateIpv4(ipv4);
  }
  const ipv6 = parseIpv6(normalized);
  if (ipv6) {
    return isPrivateIpv6(ipv6);
  }
  return false;
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

/**
 * Resolves a redirect target and rejects it before the next request is made.
 */
export function resolveSafeRedirectUrl(
  currentUrl: string,
  location: string
): string {
  const next = new URL(location, currentUrl).toString();
  if (!isSafeRemoteHttpUrl(next)) {
    throw new Error("The redirect destination is not allowed.");
  }
  return next;
}
