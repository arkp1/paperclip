import { useCallback, useEffect, useState } from "react";

import { getSetting, setSetting } from "@/core/preferences/appSettingsRepository";
import type { BookmarkSortMode } from "@/features/bookmarks/types";

const SORT_SETTING_KEY = "bookmark_sort";
const DEFAULT_SORT_MODE: BookmarkSortMode = "recent";

let cachedSortMode: BookmarkSortMode | null = null;
const sortModeListeners = new Set<(mode: BookmarkSortMode) => void>();

function broadcastSortMode(mode: BookmarkSortMode) {
  for (const listener of sortModeListeners) {
    listener(mode);
  }
}

function isBookmarkSortMode(value: unknown): value is BookmarkSortMode {
  return value === "recent" || value === "oldest" || value === "title";
}

export function useBookmarkSortMode() {
  const [sortMode, setSortModeState] = useState<BookmarkSortMode>(
    cachedSortMode ?? DEFAULT_SORT_MODE
  );

  useEffect(() => {
    if (cachedSortMode) {
      return;
    }

    let cancelled = false;

    void getSetting(SORT_SETTING_KEY)
      .then((stored) => {
        if (!cancelled && isBookmarkSortMode(stored)) {
          cachedSortMode = stored;
          setSortModeState(stored);
          broadcastSortMode(stored);
        }
      })
      .catch(() => {
        // Keep the default when the preference cannot be read.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    sortModeListeners.add(setSortModeState);
    return () => {
      sortModeListeners.delete(setSortModeState);
    };
  }, []);

  const setSortMode = useCallback((next: BookmarkSortMode) => {
    cachedSortMode = next;
    setSortModeState(next);
    broadcastSortMode(next);
    void setSetting(SORT_SETTING_KEY, next).catch(() => {
      console.warn("Could not persist the bookmark sort preference.");
    });
  }, []);

  return { sortMode, setSortMode };
}
