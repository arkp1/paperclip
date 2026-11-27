import { useEffect, useRef } from "react";

import { subscribeBookmarkChanges } from "@/features/bookmarks/services/bookmarkEvents";

/**
 * Mirrors saved-library changes to the home-screen widgets. Widgets are a
 * cache of public data only; locked private bookmarks are excluded by the
 * repository query.
 */
export function WidgetRefreshBridge() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        timer.current = null;
        void import("@/features/widgets/widgetUpdater")
          .then((module) => module.refreshPaperclipWidgets())
          .catch(() => undefined);
      }, 500);
    };

    const unsubscribe = subscribeBookmarkChanges(schedule);
    return () => {
      unsubscribe();
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  return null;
}
