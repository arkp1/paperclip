import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import {
  createFolder,
  deleteFolder,
  getAllFolders,
  renameFolder,
  setFolderColor,
} from "@/features/folders/data/folderRepository";
import type { Folder, FolderDeleteStrategy } from "@/features/folders/types";
import type { FolderColorKey } from "@/theme";

type FoldersState = {
  folders: Folder[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
};

export function useFolders() {
  const [state, setState] = useState<FoldersState>({
    folders: [],
    status: "loading",
    errorMessage: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const folders = await getAllFolders();
      setState({ folders, status: "ready", errorMessage: null });
    } catch (error) {
      console.warn("Could not load folders.", error);
      setState((previous) => ({
        folders: previous.folders,
        status: "error",
        errorMessage: "Could not load your folders.",
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

  const create = useCallback(
    async (name: string, colorKey?: FolderColorKey): Promise<Folder> => {
      const folder = await createFolder({ name, colorKey });
      await load();
      return folder;
    },
    [load]
  );

  const rename = useCallback(
    async (
      id: string,
      name: string,
      colorKey?: FolderColorKey
    ): Promise<void> => {
      await renameFolder(id, name);
      if (colorKey) {
        await setFolderColor(id, colorKey);
      }
      await load();
    },
    [load]
  );

  const remove = useCallback(
    async (id: string, strategy: FolderDeleteStrategy): Promise<void> => {
      await deleteFolder(id, strategy);
      await load();
    },
    [load]
  );

  return {
    ...state,
    refreshing,
    refresh,
    reload: load,
    create,
    rename,
    remove,
  };
}
