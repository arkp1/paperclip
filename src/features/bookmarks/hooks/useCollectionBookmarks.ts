import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import {
  listPublicBookmarks,
} from "@/features/bookmarks/data/bookmarkRepository";
import type {
  BookmarkCollection,
  BookmarkSortMode,
  BookmarkView,
} from "@/features/bookmarks/types";

type CollectionState = {
  bookmarks: BookmarkView[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
};

export function useCollectionBookmarks(
  collection: BookmarkCollection,
  sortMode: BookmarkSortMode
) {
  const [state, setState] = useState<CollectionState>({
    bookmarks: [],
    status: "loading",
    errorMessage: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const bookmarks = await listPublicBookmarks(collection, 100, 0, sortMode);
      setState({ bookmarks, status: "ready", errorMessage: null });
    } catch (error) {
      console.warn("Could not load bookmarks.", error);
      setState((previous) => ({
        bookmarks: previous.bookmarks,
        status: "error",
        errorMessage: "Could not load these bookmarks.",
      }));
    }
  }, [collection, sortMode]);

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
