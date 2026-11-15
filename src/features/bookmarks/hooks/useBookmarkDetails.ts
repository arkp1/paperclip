import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getBookmarkPrivacy } from "@/core/database/privateVaultRepository";
import { getReadableBookmarkById } from "@/features/bookmarks/data/bookmarkRepository";
import { getFolderById } from "@/features/folders/data/folderRepository";
import type { BookmarkView } from "@/features/bookmarks/types";

type BookmarkDetailsState = {
  bookmark: BookmarkView | null;
  isPrivate: boolean;
  status: "loading" | "ready" | "not_found" | "error";
  errorMessage: string | null;
};

export function useBookmarkDetails(bookmarkId: string) {
  const [state, setState] = useState<BookmarkDetailsState>({
    bookmark: null,
    isPrivate: false,
    status: "loading",
    errorMessage: null,
  });

  const load = useCallback(
    async (isActive: () => boolean = () => true) => {
      try {
        const bookmark = await getReadableBookmarkById(bookmarkId);
        if (!isActive()) {
          return;
        }
        if (!bookmark) {
          setState({
            bookmark: null,
            isPrivate: false,
            status: "not_found",
            errorMessage: null,
          });
          return;
        }

        const [folder, privacy] = await Promise.all([
          bookmark.folderId ? getFolderById(bookmark.folderId) : null,
          getBookmarkPrivacy(bookmarkId),
        ]);
        if (!isActive()) {
          return;
        }
        if (privacy === "unavailable") {
          setState({
            bookmark: null,
            isPrivate: true,
            status: "not_found",
            errorMessage: null,
          });
          return;
        }
        setState({
          bookmark: { ...bookmark, folderName: folder?.name ?? null },
          isPrivate: privacy === "private",
          status: "ready",
          errorMessage: null,
        });
      } catch (error) {
        if (!isActive()) {
          return;
        }
        console.warn("Could not load this bookmark.", error);
        setState({
          bookmark: null,
          isPrivate: false,
          status: "error",
          errorMessage: "Could not open this saved link.",
        });
      }
    },
    [bookmarkId]
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void load(() => active);
      return () => {
        active = false;
      };
    }, [load])
  );

  const reload = useCallback(() => load(), [load]);

  return {
    ...state,
    reload,
  };
}
