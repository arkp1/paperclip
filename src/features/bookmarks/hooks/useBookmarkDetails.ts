import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getPublicBookmarkById } from "@/features/bookmarks/data/bookmarkRepository";
import type { BookmarkView } from "@/features/bookmarks/types";

type BookmarkDetailsState = {
  bookmark: BookmarkView | null;
  status: "loading" | "ready" | "not_found" | "error";
  errorMessage: string | null;
};

export function useBookmarkDetails(bookmarkId: string) {
  const [state, setState] = useState<BookmarkDetailsState>({
    bookmark: null,
    status: "loading",
    errorMessage: null,
  });

  const load = useCallback(async () => {
    try {
      const bookmark = await getPublicBookmarkById(bookmarkId);
      setState({
        bookmark,
        status: bookmark ? "ready" : "not_found",
        errorMessage: null,
      });
    } catch (error) {
      console.warn("Could not load this bookmark.", error);
      setState({
        bookmark: null,
        status: "error",
        errorMessage: "Could not open this saved link.",
      });
    }
  }, [bookmarkId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { ...state, reload: load };
}
