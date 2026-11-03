import { useCallback, useEffect, useState } from "react";

import { listBookmarksInFolder } from "@/features/bookmarks/data/bookmarkRepository";
import type { Bookmark, BookmarkSortMode } from "@/features/bookmarks/types";
import { PrivateFolderLockedError } from "@/features/folders/errors";

type FolderBookmarksState = {
  bookmarks: Bookmark[];
  status: "loading" | "ready" | "locked" | "error";
  errorMessage: string | null;
};

export function useFolderBookmarks(folderId: string, sortMode: BookmarkSortMode) {
  const [state, setState] = useState<FolderBookmarksState>({
    bookmarks: [],
    status: "loading",
    errorMessage: null,
  });

  const load = useCallback(async () => {
    try {
      const bookmarks = await listBookmarksInFolder(folderId, sortMode);
      setState({ bookmarks, status: "ready", errorMessage: null });
    } catch (error) {
      if (error instanceof PrivateFolderLockedError) {
        setState({ bookmarks: [], status: "locked", errorMessage: null });
        return;
      }
      console.warn("Could not load this folder's bookmarks.", error);
      setState({
        bookmarks: [],
        status: "error",
        errorMessage: "Could not load the links in this folder.",
      });
    }
  }, [folderId, sortMode]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
