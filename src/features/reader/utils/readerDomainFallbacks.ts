import { getSetting, setSetting } from "@/core/preferences/appSettingsRepository";

const SETTING_KEY = "reader_browser_domains";
const MAX_DOMAINS = 40;

function domainFor(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

async function readDomains(): Promise<string[]> {
  const raw = await getSetting(SETTING_KEY).catch(() => null);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export async function shouldBypassReaderForDomain(
  url: string
): Promise<boolean> {
  const domain = domainFor(url);
  return domain ? (await readDomains()).includes(domain) : false;
}

export async function rememberReaderFallbackDomain(url: string): Promise<void> {
  const domain = domainFor(url);
  if (!domain) {
    return;
  }
  const domains = await readDomains();
  if (domains.includes(domain)) {
    return;
  }
  await setSetting(
    SETTING_KEY,
    JSON.stringify([domain, ...domains].slice(0, MAX_DOMAINS))
  );
}
