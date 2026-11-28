import { getSetting, setSetting } from "@/core/preferences/appSettingsRepository";

const QUEUE_KEY = "share_retry_queue" as const;
const MAX_QUEUE_SIZE = 20;

export async function readShareRetryQueue(): Promise<string[]> {
  const stored = await getSetting(QUEUE_KEY).catch(() => null);
  if (!stored) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export async function enqueueShareRetry(url: string): Promise<void> {
  const queue = await readShareRetryQueue();
  if (queue.includes(url)) {
    return;
  }
  const next = [url, ...queue].slice(0, MAX_QUEUE_SIZE);
  await setSetting(QUEUE_KEY, JSON.stringify(next)).catch(() => undefined);
}

export async function removeShareRetry(url: string): Promise<void> {
  const queue = await readShareRetryQueue();
  if (!queue.includes(url)) {
    return;
  }
  await setSetting(
    QUEUE_KEY,
    JSON.stringify(queue.filter((entry) => entry !== url))
  ).catch(() => undefined);
}
