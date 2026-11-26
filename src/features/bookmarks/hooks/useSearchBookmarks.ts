import { useCallback, useEffect, useState } from "react";

import { searchPublicBookmarks } from "@/features/bookmarks/data/bookmarkRepository";
import type { BookmarkView } from "@/features/bookmarks/types";
import { subscribeReadingProgress } from "@/features/reader/services/readingProgressEvents";
import { subscribeBookmarkChanges } from "@/features/bookmarks/services/bookmarkEvents";

const SEARCH_DEBOUNCE_MS = 200;

type SearchState = {
  results: BookmarkView[];
  status: "idle" | "loading" | "ready" | "error";
  errorMessage: string | null;
};

export function useSearchBookmarks(query: string) {
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<SearchState>({
    results: [],
    status: "idle",
    errorMessage: null,
  });

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      setState({ results: [], status: "idle", errorMessage: null });
      return;
    }

    let cancelled = false;
    setState((previous) => ({ ...previous, status: "loading" }));

    const timer = setTimeout(() => {
      void searchPublicBookmarks(trimmedQuery)
        .then((results) => {
          if (!cancelled) {
            setState({ results, status: "ready", errorMessage: null });
          }
        })
        .catch((error: unknown) => {
          console.warn("Search failed.", error);
          if (!cancelled) {
            setState({
              results: [],
              status: "error",
              errorMessage: "Search could not be completed.",
            });
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, refreshToken]);

  const reload = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(
    () =>
      subscribeReadingProgress((bookmarkId, progress) => {
        setState((previous) => ({
          ...previous,
          results: previous.results.map((bookmark) =>
            bookmark.id === bookmarkId
              ? { ...bookmark, readingProgress: progress }
              : bookmark
          ),
        }));
      }),
    []
  );

  useEffect(
    () =>
      subscribeBookmarkChanges(() => {
        reload();
      }),
    [reload]
  );

  return { ...state, reload };
}
