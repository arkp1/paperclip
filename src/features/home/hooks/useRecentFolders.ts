import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getRecentFolders } from "@/features/folders/data/folderRepository";
import type { Folder } from "@/features/folders/types";
import { RECENT_FOLDER_LIMIT } from "@/features/home/constants";

type RecentFoldersState = {
  folders: Folder[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
};

export function useRecentFolders() {
  const [state, setState] = useState<RecentFoldersState>({
    folders: [],
    status: "loading",
    errorMessage: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const folders = await getRecentFolders(RECENT_FOLDER_LIMIT);
      setState({ folders, status: "ready", errorMessage: null });
    } catch (error) {
      console.warn("Could not load recent folders.", error);
      setState((previous) => ({
        folders: previous.folders,
        status: "error",
        errorMessage: "Could not load your recent folders.",
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

  return {
    ...state,
    refreshing,
    refresh,
    reload: load,
  };
}
