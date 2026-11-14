import { getSetting, setSetting } from "@/core/preferences/appSettingsRepository";
import { isVaultBookmark } from "@/core/database/privateVaultRepository";
import {
  getVaultSetting,
  setVaultSetting,
} from "@/core/database/privateVault";

export type ReadingProgress = {
  progress: number;
  offset: number;
  pageIndex: number;
  mode: "scroll" | "pages";
  completed: boolean;
  updatedAt: number;
};

const DEFAULT_PROGRESS: ReadingProgress = {
  progress: 0,
  offset: 0,
  pageIndex: 0,
  mode: "scroll",
  completed: false,
  updatedAt: 0,
};

function keyFor(bookmarkId: string) {
  return `reader_progress:${bookmarkId}` as const;
}

export async function loadReadingProgress(
  bookmarkId: string
): Promise<ReadingProgress> {
  try {
    const raw = (await isVaultBookmark(bookmarkId))
      ? await getVaultSetting(keyFor(bookmarkId))
      : await getSetting(keyFor(bookmarkId));
    if (!raw) {
      return DEFAULT_PROGRESS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_PROGRESS;
    }
    const value = parsed as Partial<ReadingProgress>;
    return {
      progress:
        typeof value.progress === "number"
          ? Math.max(0, Math.min(1, value.progress))
          : 0,
      offset:
        typeof value.offset === "number" && Number.isFinite(value.offset)
          ? Math.max(0, value.offset)
          : 0,
      pageIndex:
        typeof value.pageIndex === "number" && value.pageIndex >= 0
          ? Math.round(value.pageIndex)
          : 0,
      mode: value.mode === "pages" ? "pages" : "scroll",
      completed: value.completed === true,
      updatedAt:
        typeof value.updatedAt === "number" ? value.updatedAt : 0,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export async function saveReadingProgress(
  bookmarkId: string,
  progress: ReadingProgress
): Promise<void> {
  const serialized = JSON.stringify({
    ...progress,
    updatedAt: Date.now(),
  });
  if (await isVaultBookmark(bookmarkId)) {
    await setVaultSetting(keyFor(bookmarkId), serialized);
    return;
  }
  await setSetting(keyFor(bookmarkId), serialized);
}
