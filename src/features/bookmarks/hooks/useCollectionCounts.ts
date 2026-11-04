import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { countPublicBookmarks } from "@/features/bookmarks/data/bookmarkRepository";
import { countPrivateFolders } from "@/features/folders/data/folderRepository";

type CountsState = {
  allCount: number;
  uncategorizedCount: number;
  favoriteCount: number;
  privateFolderCount: number;
  status: "loading" | "ready" | "error";
};

export function useCollectionCounts() {
  const [state, setState] = useState<CountsState>({
    allCount: 0,
    uncategorizedCount: 0,
    favoriteCount: 0,
    privateFolderCount: 0,
    status: "loading",
  });

  const load = useCallback(async () => {
    try {
      const [allCount, uncategorizedCount, favoriteCount, privateFolderCount] =
        await Promise.all([
          countPublicBookmarks("all"),
          countPublicBookmarks("uncategorized"),
          countPublicBookmarks("favorites"),
          countPrivateFolders(),
        ]);
      setState({
        allCount,
        uncategorizedCount,
        favoriteCount,
        privateFolderCount,
        status: "ready",
      });
    } catch (error) {
      console.warn("Could not load bookmark counts.", error);
      setState((previous) => ({ ...previous, status: "error" }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { ...state, reload: load };
}
