import { useCallback, useEffect, useRef, useState } from "react";

import { isPrivateVaultOpen } from "@/core/database/privateVault";
import {
  getFolderById,
  markFolderOpened,
} from "@/features/folders/data/folderRepository";
import type { Folder } from "@/features/folders/types";

type FolderDetailsState = {
  folder: Folder | null;
  status: "loading" | "ready" | "not_found" | "locked" | "error";
  errorMessage: string | null;
};

export function useFolderDetails(folderId: string) {
  const [state, setState] = useState<FolderDetailsState>({
    folder: null,
    status: "loading",
    errorMessage: null,
  });
  const markedOpenedFor = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const folder = await getFolderById(folderId);

      if (!folder) {
        setState({ folder: null, status: "not_found", errorMessage: null });
        return;
      }

      if (folder.isPrivate && !isPrivateVaultOpen()) {
        setState({ folder, status: "locked", errorMessage: null });
        return;
      }

      setState({ folder, status: "ready", errorMessage: null });

      if (markedOpenedFor.current !== folder.id) {
        markedOpenedFor.current = folder.id;
        try {
          await markFolderOpened(folder.id, Date.now());
        } catch (error) {
          console.warn("Could not update the folder's recent-open timestamp.", error);
        }
      }
    } catch (error) {
      console.warn("Could not load the folder.", error);
      setState({
        folder: null,
        status: "error",
        errorMessage: "Could not open this folder.",
      });
    }
  }, [folderId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
