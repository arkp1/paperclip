import { useCallback, useEffect, useState } from "react";

import { getSetting, setSetting } from "@/core/preferences/appSettingsRepository";
import type { BookmarkViewMode } from "@/features/bookmarks/types";

const VIEW_MODE_SETTING_KEY = "bookmark_view";
const DEFAULT_VIEW_MODE: BookmarkViewMode = "list";

let cachedViewMode: BookmarkViewMode | null = null;
const viewModeListeners = new Set<(mode: BookmarkViewMode) => void>();

function broadcastViewMode(mode: BookmarkViewMode) {
  for (const listener of viewModeListeners) {
    listener(mode);
  }
}

function isBookmarkViewMode(value: unknown): value is BookmarkViewMode {
  return value === "grid" || value === "list" || value === "cards";
}

/**
 * One persisted view preference shared by folder, All bookmarks, and
 * Uncategorized screens. The module cache avoids a visible flash when moving
 * between those screens.
 */
export function useBookmarkViewMode() {
  const [viewMode, setViewModeState] = useState<BookmarkViewMode>(
    cachedViewMode ?? DEFAULT_VIEW_MODE
  );

  useEffect(() => {
    if (cachedViewMode) {
      return;
    }

    let cancelled = false;

    void getSetting(VIEW_MODE_SETTING_KEY)
      .then((stored) => {
        if (!cancelled && isBookmarkViewMode(stored)) {
          cachedViewMode = stored;
          setViewModeState(stored);
          broadcastViewMode(stored);
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
    viewModeListeners.add(setViewModeState);
    return () => {
      viewModeListeners.delete(setViewModeState);
    };
  }, []);

  const setViewMode = useCallback((next: BookmarkViewMode) => {
    cachedViewMode = next;
    setViewModeState(next);
    broadcastViewMode(next);
    void setSetting(VIEW_MODE_SETTING_KEY, next).catch(() => {
      console.warn("Could not persist the bookmark view preference.");
    });
  }, []);

  return { viewMode, setViewMode };
}
