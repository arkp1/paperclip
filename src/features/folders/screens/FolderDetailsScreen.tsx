import { useCallback, useState } from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";

import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import { BookmarkActionsDialog } from "@/features/bookmarks/components/BookmarkActionsDialog";
import { BookmarkSortDialog } from "@/features/bookmarks/components/BookmarkSortDialog";
import { BookmarkViewSelector } from "@/features/bookmarks/components/BookmarkViewSelector";
import type { Bookmark, BookmarkViewMode } from "@/features/bookmarks/types";
import { BOOKMARK_VIEW_MODES } from "@/features/bookmarks/types";
import { useBookmarkSortMode } from "@/features/bookmarks/hooks/useBookmarkSortMode";
import { useBookmarkViewMode } from "@/features/bookmarks/hooks/useBookmarkViewMode";
import { useFolderBookmarks } from "@/features/bookmarks/hooks/useFolderBookmarks";
import { DeleteFolderDialog } from "@/features/folders/components/DeleteFolderDialog";
import { FolderActionsDialog } from "@/features/folders/components/FolderActionsDialog";
import { FolderNameDialog } from "@/features/folders/components/FolderNameDialog";
import {
  deleteFolder,
  renameFolder,
} from "@/features/folders/data/folderRepository";
import { describeFolderError } from "@/features/folders/errors";
import { useFolderDetails } from "@/features/folders/hooks/useFolderDetails";
import type { FolderDeleteStrategy } from "@/features/folders/types";
import { AppText } from "@/shared/ui/AppText";
import { AnimatedLayoutChange } from "@/shared/ui/AnimatedLayoutChange";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { useFloatingNavigationInset } from "@/shared/ui/FloatingBottomNavigation";
import { IconButton } from "@/shared/ui/IconButton";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";
import { TopAppBar } from "@/shared/ui/TopAppBar";
import { openExternalUrl } from "@/shared/utils/openExternalUrl";
import { styles } from "@/styles/features/folders/FolderDetailsScreen.styles";
import { folderColors, pickFolderColorKey, useTheme } from "@/theme";

type FolderDetailsScreenProps = {
  folderId: string;
};

export function FolderDetailsScreen({ folderId }: FolderDetailsScreenProps) {
  const { theme } = useTheme();
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
  const [sortVisible, setSortVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const { viewMode, setViewMode } = useBookmarkViewMode();
  const [viewDirection, setViewDirection] = useState<1 | -1>(1);

  const handleViewModeChange = useCallback(
    (nextMode: BookmarkViewMode) => {
      const nextIndex = BOOKMARK_VIEW_MODES.indexOf(nextMode);
      const currentIndex = BOOKMARK_VIEW_MODES.indexOf(viewMode);
      setViewDirection(nextIndex >= currentIndex ? 1 : -1);
      setViewMode(nextMode);
    },
    [setViewMode, viewMode]
  );

  const openBookmark = useCallback((bookmark: Bookmark) => {
    void openExternalUrl(bookmark.originalUrl);
  }, []);

  const handleRename = async (name: string): Promise<string | null> => {
    if (!folder) {
      return null;
    }

    try {
      await renameFolder(folder.id, name);
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

  const tint = folder
    ? folderColors[folder.colorKey ?? pickFolderColorKey(folder.id)]
    : null;

  const count = folder?.isPrivate ? "Private" : `${bookmarks.length} saved links`;

  return (
    <Screen>
      <TopAppBar
        title={folder?.name ?? "Folder"}
        icon="folder-outline"
        onBack={() => router.back()}
        actions={
          folder && status === "ready" ? (
            <>
              <IconButton
                icon="sort-variant"
                label="Sort bookmarks"
                onPress={() => setSortVisible(true)}
              />
              <IconButton
                icon="dots-vertical"
                label="Folder actions"
                onPress={() => setActionsVisible(true)}
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
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset }]}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={[styles.folderMark, { backgroundColor: tint?.background }]}>
                <MaterialCommunityIcons
                  name={folder?.isPrivate ? "folder-lock" : "folder"}
                  size={30}
                  color={tint?.foreground}
                />
              </View>

              <View style={styles.headerCopy}>
                <AppText variant="headlineSmall" accessibilityRole="header">
                  {folder?.name}
                </AppText>
                <AppText variant="bodyMedium" color={theme.colors.onSurfaceVariant}>
                  {count}
                </AppText>
              </View>
            </View>
          }
          ListEmptyComponent={
            bookmarksStatus === "loading" ? (
              <LoadingState compact message="Loading links…" />
            ) : bookmarksStatus === "locked" ? (
              <EmptyState
                icon="lock-outline"
                title="This folder is locked"
                description="Unlocking private folders arrives with the privacy and security milestone."
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
        onClose={() => setActionsVisible(false)}
        onRename={() => {
          setActionsVisible(false);
          setRenameVisible(true);
        }}
        onDelete={() => {
          setActionsVisible(false);
          setDeleteVisible(true);
        }}
      />

      <FolderNameDialog
        visible={renameVisible}
        title="Rename folder"
        description="Choose a new name for this folder."
        initialValue={folder?.name ?? ""}
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
