import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";

import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import { BookmarkActionsDialog } from "@/features/bookmarks/components/BookmarkActionsDialog";
import { BookmarkSortDialog } from "@/features/bookmarks/components/BookmarkSortDialog";
import { BookmarkViewSelector } from "@/features/bookmarks/components/BookmarkViewSelector";
import { openBookmarkDestination } from "@/features/bookmarks/utils/openBookmarkDestination";
import type { Bookmark, BookmarkViewMode } from "@/features/bookmarks/types";
import { BOOKMARK_VIEW_MODES } from "@/features/bookmarks/types";
import { useBookmarkSortMode } from "@/features/bookmarks/hooks/useBookmarkSortMode";
import { useBookmarkViewMode } from "@/features/bookmarks/hooks/useBookmarkViewMode";
import { useFolderBookmarks } from "@/features/bookmarks/hooks/useFolderBookmarks";
import { refreshMissingPreviews } from "@/features/bookmarks/services/previewService";
import {
  unlockPrivateSpace,
  usePrivateSpaceSession,
} from "@/core/security/privateSpaceSession";
import { DeleteFolderDialog } from "@/features/folders/components/DeleteFolderDialog";
import { FolderActionsDialog } from "@/features/folders/components/FolderActionsDialog";
import { FolderNameDialog } from "@/features/folders/components/FolderNameDialog";
import type { MenuAnchor } from "@/shared/ui/MenuAnchor";
import {
  deleteFolder,
  renameFolder,
  setFolderColor,
  setFolderPrivate,
} from "@/features/folders/data/folderRepository";
import type { FolderColorKey } from "@/theme";
import { describeFolderError } from "@/features/folders/errors";
import { useFolderDetails } from "@/features/folders/hooks/useFolderDetails";
import type { FolderDeleteStrategy } from "@/features/folders/types";
import { AnimatedLayoutChange } from "@/shared/ui/AnimatedLayoutChange";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { useFloatingNavigationInset } from "@/shared/ui/FloatingBottomNavigation";
import { IconButton } from "@/shared/ui/IconButton";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";
import { TopAppBar } from "@/shared/ui/TopAppBar";
import { openExternalUrl } from "@/shared/utils/openExternalUrl";
import { styles } from "@/styles/features/folders/FolderDetailsScreen.styles";

type FolderDetailsScreenProps = {
  folderId: string;
};

export function FolderDetailsScreen({ folderId }: FolderDetailsScreenProps) {
  const router = useRouter();
  const bottomInset = useFloatingNavigationInset();

  const { folder, status, errorMessage, reload } = useFolderDetails(folderId);
  const { sortMode, setSortMode } = useBookmarkSortMode();
  const {
    bookmarks,
    status: bookmarksStatus,
    errorMessage: bookmarksError,
    reload: reloadBookmarks,
  } = useFolderBookmarks(folderId, sortMode);

  const [actionsVisible, setActionsVisible] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<MenuAnchor | null>(null);
  const [sortVisible, setSortVisible] = useState(false);
  const [sortAnchor, setSortAnchor] = useState<MenuAnchor | null>(null);
  const [renameVisible, setRenameVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const { viewMode, setViewMode } = useBookmarkViewMode();
  const [viewDirection, setViewDirection] = useState<1 | -1>(1);
  const [refreshing, setRefreshing] = useState(false);
  const { isUnlocked } = usePrivateSpaceSession();

  useEffect(() => {
    if (folder?.isPrivate) {
      void reloadBookmarks();
    }
  }, [folder?.isPrivate, isUnlocked, reloadBookmarks]);

  useEffect(() => {
    if (folder?.isPrivate && !isUnlocked) {
      setSelectedBookmark(null);
      setActionsVisible(false);
    }
  }, [folder?.isPrivate, isUnlocked]);

  const unlockCurrentFolder = async () => {
    const result = await unlockPrivateSpace();
    if (!result.success) {
      Alert.alert("Private folders", result.message);
    }
  };

  const handleTogglePrivacy = async () => {
    setActionsVisible(false);
    if (!folder) {
      return;
    }

    try {
      if (folder.isPrivate) {
        await setFolderPrivate(folder.id, false);
        await reload();
      } else {
        await setFolderPrivate(folder.id, true);
        router.back();
      }
    } catch {
      Alert.alert("Private folders", "Could not update this folder.");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshMissingPreviews();
      await reloadBookmarks();
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewModeChange = useCallback(
    (nextMode: BookmarkViewMode) => {
      const nextIndex = BOOKMARK_VIEW_MODES.indexOf(nextMode);
      const currentIndex = BOOKMARK_VIEW_MODES.indexOf(viewMode);
      setViewDirection(nextIndex >= currentIndex ? 1 : -1);
      setViewMode(nextMode);
    },
    [setViewMode, viewMode]
  );

  const openBookmark = useCallback(
    (bookmark: Bookmark) => {
      openBookmarkDestination(bookmark, router);
    },
    [router]
  );

  const handleRename = async (
    name: string,
    colorKey: FolderColorKey
  ): Promise<string | null> => {
    if (!folder) {
      return null;
    }

    try {
      await renameFolder(folder.id, name);
      await setFolderColor(folder.id, colorKey);
      await reload();
      return null;
    } catch (error) {
      return describeFolderError(error);
    }
  };

  const handleDelete = async (strategy: FolderDeleteStrategy): Promise<void> => {
    if (!folder) {
      return;
    }

    await deleteFolder(folder.id, strategy);
    router.back();
  };

  return (
    <Screen>
      <TopAppBar
        title={folder?.name ?? "Folder"}
        icon="folder-outline"
        onBack={() => router.back()}
        actions={
          folder &&
          status === "ready" &&
          (!folder.isPrivate || isUnlocked) ? (
            <>
              <IconButton
                icon="sort-variant"
                label="Sort bookmarks"
                onPress={(event) => {
                  setSortAnchor({
                    x: event.nativeEvent.pageX,
                    y: event.nativeEvent.pageY,
                  });
                  setSortVisible(true);
                }}
              />
              <IconButton
                icon="dots-vertical"
                label="Folder actions"
                onPress={(event) => {
                  setActionsAnchor({
                    x: event.nativeEvent.pageX,
                    y: event.nativeEvent.pageY,
                  });
                  setActionsVisible(true);
                }}
              />
            </>
          ) : undefined
        }
      />

      {folder && status === "ready" && bookmarks.length > 0 ? (
        <BookmarkViewSelector viewMode={viewMode} onChange={handleViewModeChange} />
      ) : null}

      {status === "loading" ? (
        <LoadingState message="Opening folder…" />
      ) : status === "not_found" || status === "error" ? (
        <ErrorState
          message={
            status === "not_found"
              ? "This folder may have been deleted."
              : (errorMessage ?? "Could not open this folder.")
          }
          onRetry={
            status === "error"
              ? () => {
                  void reload();
                }
              : undefined
          }
        />
      ) : (
        <AnimatedLayoutChange
          transitionKey={`${viewMode}-${sortMode}`}
          direction={viewDirection}
        >
        <FlatList
          key={viewMode}
          data={bookmarks}
          keyExtractor={(bookmark) => bookmark.id}
          numColumns={viewMode === "grid" ? 2 : 1}
          columnWrapperStyle={viewMode === "grid" ? styles.column : undefined}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void handleRefresh();
              }}
            />
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset }]}
          ListEmptyComponent={
            bookmarksStatus === "loading" ? (
              <LoadingState compact message="Loading links…" />
            ) : bookmarksStatus === "locked" ? (
              <EmptyState
                icon="lock-outline"
                title="This folder is locked"
                description="Unlock with biometrics or your device PIN to view these links."
                action={{
                  label: "Unlock folder",
                  onPress: () => {
                    void unlockCurrentFolder();
                  },
                }}
              />
            ) : bookmarksStatus === "error" ? (
              <ErrorState
                compact
                message={bookmarksError ?? "Could not load the links in this folder."}
                onRetry={() => {
                  void reloadBookmarks();
                }}
              />
            ) : (
              <EmptyState
                icon="link-variant"
                title="No links here yet"
                description="Links you save into this folder will appear here."
              />
            )
          }
          renderItem={({ item }) =>
            viewMode === "grid" ? (
              <View style={styles.gridItem}>
                <BookmarkCard
                  bookmark={item}
                  variant="grid"
                  onPress={openBookmark}
                  onLongPress={setSelectedBookmark}
                />
              </View>
            ) : (
              <BookmarkCard
                bookmark={item}
                variant={viewMode === "cards" ? "cards" : "list"}
                onPress={openBookmark}
                onLongPress={setSelectedBookmark}
              />
            )
          }
        />
        </AnimatedLayoutChange>
      )}

      <FolderActionsDialog
        folder={folder}
        visible={actionsVisible}
        anchor={actionsAnchor}
        onClose={() => setActionsVisible(false)}
        onRename={() => {
          setActionsVisible(false);
          setRenameVisible(true);
        }}
        onDelete={() => {
          setActionsVisible(false);
          setDeleteVisible(true);
        }}
        onTogglePrivacy={() => {
          void handleTogglePrivacy();
        }}
      />

      <FolderNameDialog
        visible={renameVisible}
        title="Rename folder"
        description="Choose a new name for this folder."
        initialValue={folder?.name ?? ""}
        initialColorKey={folder?.colorKey}
        confirmLabel="Save"
        onClose={() => setRenameVisible(false)}
        onSubmit={handleRename}
      />

      <DeleteFolderDialog
        folder={folder}
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        onConfirm={handleDelete}
      />

      <BookmarkSortDialog
        visible={sortVisible}
        sortMode={sortMode}
        anchor={sortAnchor}
        onChange={setSortMode}
        onClose={() => setSortVisible(false)}
      />

      <BookmarkActionsDialog
        bookmark={selectedBookmark}
        visible={selectedBookmark !== null}
        onClose={() => setSelectedBookmark(null)}
        onChanged={() => {
          void reloadBookmarks();
          void reload();
        }}
      />
    </Screen>
  );
}
