import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { countPublicBookmarks } from "@/features/bookmarks/data/bookmarkRepository";

type CountsState = {
  allCount: number;
  uncategorizedCount: number;
  favoriteCount: number;
  status: "loading" | "ready" | "error";
};

export function useCollectionCounts() {
  const [state, setState] = useState<CountsState>({
    allCount: 0,
    uncategorizedCount: 0,
    favoriteCount: 0,
    status: "loading",
  });

  const load = useCallback(async () => {
    try {
      const [allCount, uncategorizedCount, favoriteCount] = await Promise.all([
        countPublicBookmarks("all"),
        countPublicBookmarks("uncategorized"),
        countPublicBookmarks("favorites"),
      ]);
      setState({ allCount, uncategorizedCount, favoriteCount, status: "ready" });
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
