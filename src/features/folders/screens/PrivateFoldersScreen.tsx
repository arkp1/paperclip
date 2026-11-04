import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { useRouter } from "expo-router";

import {
  isPrivateSpaceUnlocked,
  unlockPrivateSpace,
  usePrivateSpaceSession,
} from "@/core/security/privateSpaceSession";
import { DeleteFolderDialog } from "@/features/folders/components/DeleteFolderDialog";
import { FolderActionsDialog } from "@/features/folders/components/FolderActionsDialog";
import { FolderCard } from "@/features/folders/components/FolderCard";
import { FolderNameDialog } from "@/features/folders/components/FolderNameDialog";
import {
  createFolder,
  deleteFolder,
  getPrivateFolders,
  renameFolder as renameFolderRecord,
  setFolderColor,
  setFolderPrivate,
} from "@/features/folders/data/folderRepository";
import { describeFolderError } from "@/features/folders/errors";
import type { Folder, FolderDeleteStrategy } from "@/features/folders/types";
import type { FolderColorKey } from "@/theme";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { IconButton } from "@/shared/ui/IconButton";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";
import { TopAppBar } from "@/shared/ui/TopAppBar";
import { styles } from "@/styles/features/folders/PrivateFoldersScreen.styles";

export function PrivateFoldersScreen() {
  const router = useRouter();
  const { isUnlocked } = usePrivateSpaceSession();
  const [authorized, setAuthorized] = useState(isUnlocked);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const started = useRef(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [actionsFolder, setActionsFolder] = useState<Folder | null>(null);
  const [renameFolder, setRenameFolder] = useState<Folder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);

  const load = useCallback(async () => {
    try {
      const privateFolders = await getPrivateFolders();
      setFolders(privateFolders);
      setStatus("ready");
      setErrorMessage(null);
    } catch (error) {
      console.warn("Could not load private folders.", error);
      setStatus("error");
      setErrorMessage("Could not open private folders.");
    }
  }, []);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    if (isUnlocked) {
      setAuthorized(true);
      void load();
      return;
    }

    void unlockPrivateSpace().then((result) => {
      if (!result.success) {
        if (result.message !== "Unlock cancelled.") {
          Alert.alert("Private folders", result.message);
        }
        router.back();
        return;
      }
      setAuthorized(true);
      void load();
    });
  }, [isUnlocked, load, router]);

  useEffect(() => {
    if (authorized && !isPrivateSpaceUnlocked()) {
      router.back();
    }
  }, [authorized, isUnlocked, router]);

  const handleCreate = async (
    name: string,
    colorKey: FolderColorKey
  ): Promise<string | null> => {
    try {
      const folder = await createFolder({ name, colorKey });
      await setFolderPrivate(folder.id, true);
      await load();
      return null;
    } catch (error) {
      return describeFolderError(error);
    }
  };

  const handleRename = async (
    name: string,
    colorKey: FolderColorKey
  ): Promise<string | null> => {
    if (!renameFolder) {
      return null;
    }
    try {
      await renameFolderRecord(renameFolder.id, name);
      await setFolderColor(renameFolder.id, colorKey);
      await load();
      return null;
    } catch (error) {
      return describeFolderError(error);
    }
  };

  const handleDelete = async (strategy: FolderDeleteStrategy): Promise<void> => {
    if (!deleteTarget) {
      return;
    }
    await deleteFolder(deleteTarget.id, strategy);
    setDeleteTarget(null);
    await load();
  };

  const openFolder = (folder: Folder) => {
    router.push({
      pathname: "/folders/[folderId]",
      params: { folderId: folder.id },
    });
  };

  return (
    <Screen>
      <TopAppBar
        title="Private"
        icon="lock-outline"
        onBack={() => router.back()}
        actions={
          <IconButton
            icon="plus"
            label="Create private folder"
            onPress={() => setCreateVisible(true)}
          />
        }
      />

      <FlatList
        data={folders}
        keyExtractor={(folder) => folder.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          status === "loading" ? (
            <LoadingState compact message="Opening private folders…" />
          ) : status === "error" ? (
            <ErrorState
              compact
              message={errorMessage ?? "Could not open private folders."}
              onRetry={() => {
                void load();
              }}
            />
          ) : (
            <EmptyState
              icon="folder-lock-outline"
              title="No private folders"
              description="Create one here or mark an existing folder as private from its menu."
              action={{
                label: "Create private folder",
                onPress: () => setCreateVisible(true),
              }}
            />
          )
        }
        renderItem={({ item }) => (
          <FolderCard
            folder={item}
            onPress={openFolder}
            onMore={setActionsFolder}
          />
        )}
      />

      <FolderNameDialog
        visible={createVisible}
        title="New private folder"
        description="Private folders only appear after device authentication."
        confirmLabel="Create"
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreate}
      />

      <FolderNameDialog
        visible={renameFolder !== null}
        title="Rename folder"
        description="Choose a new name for this private folder."
        initialValue={renameFolder?.name ?? ""}
        initialColorKey={renameFolder?.colorKey}
        confirmLabel="Save"
        onClose={() => setRenameFolder(null)}
        onSubmit={handleRename}
      />

      <FolderActionsDialog
        folder={actionsFolder}
        visible={actionsFolder !== null}
        onClose={() => setActionsFolder(null)}
        onRename={() => {
          setRenameFolder(actionsFolder);
          setActionsFolder(null);
        }}
        onDelete={() => {
          setDeleteTarget(actionsFolder);
          setActionsFolder(null);
        }}
        onTogglePrivacy={() => {
          const folder = actionsFolder;
          setActionsFolder(null);
          if (!folder) {
            return;
          }
          void setFolderPrivate(folder.id, false)
            .then(load)
            .catch(() =>
              Alert.alert("Private folders", "Could not make this folder public.")
            );
        }}
      />

      <DeleteFolderDialog
        folder={deleteTarget}
        visible={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Screen>
  );
}
