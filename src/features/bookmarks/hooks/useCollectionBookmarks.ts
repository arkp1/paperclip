import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import {
  countPublicBookmarks,
  listPublicBookmarks,
} from "@/features/bookmarks/data/bookmarkRepository";
import type {
  BookmarkCollection,
  BookmarkSortMode,
  BookmarkView,
} from "@/features/bookmarks/types";
import { subscribeReadingProgress } from "@/features/reader/services/readingProgressEvents";

const PAGE_SIZE = 50;

type CollectionState = {
  bookmarks: BookmarkView[];
  total: number;
  hasMore: boolean;
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
};

export function useCollectionBookmarks(
  collection: BookmarkCollection,
  sortMode: BookmarkSortMode
) {
  const [state, setState] = useState<CollectionState>({
    bookmarks: [],
    total: 0,
    hasMore: false,
    status: "loading",
    errorMessage: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const run = generation.current + 1;
    generation.current = run;
    try {
      const [bookmarks, total] = await Promise.all([
        listPublicBookmarks(collection, PAGE_SIZE, 0, sortMode),
        countPublicBookmarks(collection),
      ]);
      if (run !== generation.current) {
        return;
      }
      setState({
        bookmarks,
        total,
        hasMore: bookmarks.length < total,
        status: "ready",
        errorMessage: null,
      });
    } catch (error) {
      if (run !== generation.current) {
        return;
      }
      console.warn("Could not load bookmarks.", error);
      setState((previous) => ({
        ...previous,
        status: "error",
        errorMessage: "Could not load these bookmarks.",
      }));
    }
  }, [collection, sortMode]);

  const loadMore = useCallback(async () => {
    if (state.status !== "ready" || !state.hasMore || loadingMore) {
      return;
    }
    const run = generation.current;
    setLoadingMore(true);
    try {
      const next = await listPublicBookmarks(
        collection,
        PAGE_SIZE,
        state.bookmarks.length,
        sortMode
      );
      if (run !== generation.current) {
        return;
      }
      setState((previous) => {
        const seen = new Set(previous.bookmarks.map((bookmark) => bookmark.id));
        const appended = next.filter((bookmark) => !seen.has(bookmark.id));
        const bookmarks = [...previous.bookmarks, ...appended];
        return {
          ...previous,
          bookmarks,
          hasMore: bookmarks.length < previous.total && next.length === PAGE_SIZE,
        };
      });
    } catch (error) {
      console.warn("Could not load more bookmarks.", error);
    } finally {
      if (run === generation.current) {
        setLoadingMore(false);
      }
    }
  }, [collection, loadingMore, sortMode, state.bookmarks.length, state.hasMore, state.status]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useEffect(
    () =>
      subscribeReadingProgress((bookmarkId, progress) => {
        setState((previous) => ({
          ...previous,
          bookmarks: previous.bookmarks.map((bookmark) =>
            bookmark.id === bookmarkId
              ? { ...bookmark, readingProgress: progress }
              : bookmark
          ),
        }));
      }),
    []
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return {
    ...state,
    refreshing,
    loadingMore,
    refresh,
    reload: load,
    loadMore,
  };
}
