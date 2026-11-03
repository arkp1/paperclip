import { useCallback, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";

import { useCollectionCounts } from "@/features/bookmarks/hooks/useCollectionCounts";
import { describeFolderError } from "@/features/folders/errors";
import { DeleteFolderDialog } from "@/features/folders/components/DeleteFolderDialog";
import { FolderActionsDialog } from "@/features/folders/components/FolderActionsDialog";
import { FolderCard } from "@/features/folders/components/FolderCard";
import { FolderNameDialog } from "@/features/folders/components/FolderNameDialog";
import { SmartCollectionCard } from "@/features/folders/components/SmartCollectionCard";
import { useFolders } from "@/features/folders/hooks/useFolders";
import type { Folder, FolderDeleteStrategy } from "@/features/folders/types";
import { AppText } from "@/shared/ui/AppText";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { FloatingAddButton } from "@/shared/ui/FloatingAddButton";
import { useFloatingNavigationInset } from "@/shared/ui/FloatingBottomNavigation";
import { useCollapsingFab } from "@/shared/hooks/useCollapsingFab";
import { IconButton } from "@/shared/ui/IconButton";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";
import { TopAppBar } from "@/shared/ui/TopAppBar";
import { styles } from "@/styles/features/folders/FoldersScreen.styles";
import { useTheme } from "@/theme";

export function FoldersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const bottomInset = useFloatingNavigationInset();
  const { collapsed: fabCollapsed, onScroll: handleScroll } = useCollapsingFab();

  const {
    folders,
    status,
    errorMessage,
    refreshing,
    refresh,
    reload,
    create,
    rename,
    remove,
  } = useFolders();
  const { allCount, uncategorizedCount, favoriteCount } = useCollectionCounts();

  const [createVisible, setCreateVisible] = useState(false);
  const [actionsFolder, setActionsFolder] = useState<Folder | null>(null);
  const [renameFolder, setRenameFolder] = useState<Folder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);

  const handleCreate = async (name: string): Promise<string | null> => {
    try {
      await create(name);
      return null;
    } catch (error) {
      return describeFolderError(error);
    }
  };

  const handleRename = async (name: string): Promise<string | null> => {
    if (!renameFolder) {
      return null;
    }

    try {
      await rename(renameFolder.id, name);
      return null;
    } catch (error) {
      return describeFolderError(error);
    }
  };

  const handleDelete = async (strategy: FolderDeleteStrategy): Promise<void> => {
    if (!deleteTarget) {
      return;
    }
    await remove(deleteTarget.id, strategy);
  };

  const openFolder = useCallback(
    (folder: Folder) => {
      router.push({
        pathname: "/folders/[folderId]",
        params: { folderId: folder.id },
      });
    },
    [router]
  );

  const openFolderActions = useCallback((folder: Folder) => {
    setActionsFolder(folder);
  }, []);

  return (
    <Screen>
      <TopAppBar
        title="Folders"
        icon="folder-outline"
        actions={
          <>
            <IconButton
              icon="magnify"
              label="Search bookmarks"
              onPress={() => router.push("/search")}
            />
            <IconButton
              icon="plus"
              label="Create folder"
              onPress={() => setCreateVisible(true)}
            />
          </>
        }
      />

      <FlatList
        data={folders}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(folder) => folder.id}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.smartCollections}>
              <SmartCollectionCard
                icon="bookmark-multiple-outline"
                title="All bookmarks"
                subtitle={`${allCount} saved`}
                onPress={() => router.push("/bookmarks/all")}
              />
              <SmartCollectionCard
                icon="heart-outline"
                title="Favourites"
                subtitle={`${favoriteCount} saved`}
                onPress={() => router.push("/bookmarks/favourites")}
              />
              <SmartCollectionCard
                icon="inbox-outline"
                title="Uncategorized"
                subtitle={`${uncategorizedCount} saved`}
                onPress={() => router.push("/bookmarks/uncategorized")}
              />
            </View>

            <View style={styles.sectionHeader}>
              <AppText variant="titleLarge">Your folders</AppText>
              <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
                {folders.length} {folders.length === 1 ? "folder" : "folders"}
              </AppText>
            </View>
          </View>
        }
        ListEmptyComponent={
          status === "loading" ? (
            <LoadingState compact message="Loading your folders…" />
          ) : status === "error" ? (
            <ErrorState
              compact
              message={errorMessage ?? "Could not load your folders."}
              onRetry={() => {
                void reload();
              }}
            />
          ) : (
            <EmptyState
              icon="folder-plus-outline"
              title="No folders yet"
              description="Folders keep saved links together. Create one to get started."
              action={{ label: "Create folder", onPress: () => setCreateVisible(true) }}
            />
          )
        }
        renderItem={({ item }) => (
          <FolderCard
            folder={item}
            onPress={openFolder}
            onMore={openFolderActions}
          />
        )}
      />

      <FloatingAddButton
        collapsed={fabCollapsed}
        onPress={() => router.push("/bookmarks/save")}
      />

      <FolderNameDialog
        visible={createVisible}
        title="New folder"
        description="Give this folder a short, memorable name."
        confirmLabel="Create"
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreate}
      />

      <FolderNameDialog
        visible={renameFolder !== null}
        title="Rename folder"
        description="Choose a new name for this folder."
        initialValue={renameFolder?.name ?? ""}
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
