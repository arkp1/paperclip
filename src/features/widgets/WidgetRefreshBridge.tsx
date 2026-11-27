import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { subscribeBookmarkChanges } from "@/features/bookmarks/services/bookmarkEvents";

/**
 * Mirrors saved-library changes to the home-screen widgets when Paperclip
 * leaves the foreground. Updating there avoids starting a widget headless task
 * in the middle of a save/navigation interaction.
 */
export function WidgetRefreshBridge() {
  const dirty = useRef(false);

  useEffect(() => {
    const markDirty = () => {
      dirty.current = true;
    };
    const unsubscribe = subscribeBookmarkChanges(markDirty);
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active" || !dirty.current) {
        return;
      }
      dirty.current = false;
      void import("@/features/widgets/widgetUpdater")
        .then((module) => module.refreshPaperclipWidgets())
        .catch(() => undefined);
    });

    return () => {
      unsubscribe();
      appState.remove();
    };
  }, []);

  return null;
}
