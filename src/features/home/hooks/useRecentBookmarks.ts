import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { listPublicBookmarks } from "@/features/bookmarks/data/bookmarkRepository";
import type { BookmarkView } from "@/features/bookmarks/types";
import { RECENT_BOOKMARKS_LIMIT } from "@/features/home/constants";

type RecentBookmarksState = {
  bookmarks: BookmarkView[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
};

export function useRecentBookmarks() {
  const [state, setState] = useState<RecentBookmarksState>({
    bookmarks: [],
    status: "loading",
    errorMessage: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const bookmarks = await listPublicBookmarks("all", RECENT_BOOKMARKS_LIMIT);
      setState({ bookmarks, status: "ready", errorMessage: null });
    } catch (error) {
      console.warn("Could not load recently saved links.", error);
      setState((previous) => ({
        bookmarks: previous.bookmarks,
        status: "error",
        errorMessage: "Could not load your recently saved links.",
      }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { ...state, refreshing, refresh, reload: load };
}
