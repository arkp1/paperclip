import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import { BookmarkActionsDialog } from "@/features/bookmarks/components/BookmarkActionsDialog";
import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import { openBookmarkDestination } from "@/features/bookmarks/utils/openBookmarkDestination";
import { refreshMissingPreviews } from "@/features/bookmarks/services/previewService";
import type { Bookmark, BookmarkView } from "@/features/bookmarks/types";
import { FolderCard } from "@/features/folders/components/FolderCard";
import type { Folder } from "@/features/folders/types";
import { useRecentBookmarks } from "@/features/home/hooks/useRecentBookmarks";
import { useRecentFolders } from "@/features/home/hooks/useRecentFolders";
import { AppText } from "@/shared/ui/AppText";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { FloatingAddButton } from "@/shared/ui/FloatingAddButton";
import { useFloatingNavigationInset } from "@/shared/ui/FloatingBottomNavigation";
import { useCollapsingFab } from "@/shared/hooks/useCollapsingFab";
import { LoadingState } from "@/shared/ui/LoadingState";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { Screen } from "@/shared/ui/Screen";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { openExternalUrl } from "@/shared/utils/openExternalUrl";
import { styles } from "@/styles/features/home/HomeScreen.styles";
import { useTheme } from "@/theme";

export function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const bottomInset = useFloatingNavigationInset();
  const { collapsed: fabCollapsed, onScroll: handleScroll } = useCollapsingFab();
  const {
    folders,
    status: foldersStatus,
    errorMessage: foldersError,
    refreshing: foldersRefreshing,
    refresh: refreshFolders,
    reload: reloadFolders,
  } = useRecentFolders();
  const {
    bookmarks,
    status: bookmarksStatus,
    errorMessage: bookmarksError,
    refreshing: bookmarksRefreshing,
    refresh: refreshBookmarks,
    reload: reloadBookmarks,
  } = useRecentBookmarks();
  const [previewRefreshing, setPreviewRefreshing] = useState(false);
  const refreshing =
    foldersRefreshing || bookmarksRefreshing || previewRefreshing;
  const [selectedBookmark, setSelectedBookmark] = useState<
    Bookmark | BookmarkView | null
  >(null);

  const openFolder = useCallback(
    (folder: Folder) => {
      router.push({
        pathname: "/folders/[folderId]",
        params: { folderId: folder.id },
      });
    },
    [router]
  );

  const openBookmark = useCallback(
    (bookmark: Bookmark) => {
      openBookmarkDestination(bookmark, router);
    },
    [router]
  );

  const refreshAll = useCallback(async () => {
    setPreviewRefreshing(true);
    try {
      await refreshMissingPreviews();
      await Promise.all([refreshFolders(), refreshBookmarks()]);
    } catch (error) {
      console.warn("Could not refresh the library.", error);
    } finally {
      setPreviewRefreshing(false);
    }
  }, [refreshBookmarks, refreshFolders]);

  return (
    <Screen>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refreshAll();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <AppText variant="titleLarge" style={styles.wordmark} accessibilityRole="header">
            paperclip
          </AppText>

          <View style={styles.hero}>
            <AppText variant="eyebrow" color={theme.colors.primary}>
              Your own little corner
            </AppText>
            <AppText variant="headlineLarge">A place for all the good things.</AppText>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons
              name="folder-outline"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <AppText variant="titleLarge">Recent folders</AppText>
          </View>
          {folders.length > 0 ? (
            <ScalePressable
              accessibilityRole="button"
              accessibilityLabel="View all folders"
              onPress={() => router.navigate("/folders")}
              scaleTo={0.95}
              style={styles.viewAll}
            >
              <AppText variant="labelLarge" color={theme.colors.primary}>
                View all
              </AppText>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={theme.colors.primary}
              />
            </ScalePressable>
          ) : null}
        </View>

        {foldersStatus === "loading" ? (
          <LoadingState compact message="Loading your folders…" />
        ) : foldersStatus === "error" ? (
          <ErrorState
            compact
            message={foldersError ?? "Could not load your recent folders."}
            onRetry={() => {
              void reloadFolders();
            }}
          />
        ) : folders.length === 0 ? (
          <EmptyState
            icon="folder-open-outline"
            title="No folders yet"
            description="Create a folder from Folders and it will appear here for quick access."
            action={{
              label: "Go to Folders",
              onPress: () => router.navigate("/folders"),
            }}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContent}
          >
            {folders.map((folder) => (
              <View key={folder.id} style={styles.folderSlide}>
                <FolderCard folder={folder} onPress={openFolder} />
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <AppText variant="titleLarge">Recently saved</AppText>
          </View>
          {bookmarks.length > 0 ? (
            <ScalePressable
              accessibilityRole="button"
              accessibilityLabel="View all saved links"
              onPress={() => router.push("/bookmarks/all")}
              scaleTo={0.95}
              style={styles.viewAll}
            >              <AppText variant="labelLarge" color={theme.colors.primary}>
                View all
              </AppText>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={theme.colors.primary}
              />
            </ScalePressable>
          ) : null}
        </View>

        {bookmarksStatus === "loading" ? (
          <LoadingState compact message="Loading saved links…" />
        ) : bookmarksStatus === "error" ? (
          <ErrorState
            compact
            message={bookmarksError ?? "Could not load recently saved links."}
            onRetry={() => {
              void reloadBookmarks();
            }}
          />
        ) : bookmarks.length === 0 ? (
          <AppText variant="bodyMedium" color={theme.colors.onSurfaceVariant}>
            Links you save will appear here. Use Save link to add your first one.
          </AppText>
        ) : (
          <View style={styles.grid}>
            {bookmarks.map((bookmark: BookmarkView) => (
              <View key={bookmark.id} style={styles.gridItem}>
                <BookmarkCard
                  bookmark={bookmark}
                  variant="grid"
                  onPress={openBookmark}
                  onLongPress={setSelectedBookmark}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BookmarkActionsDialog
        bookmark={selectedBookmark}
        visible={selectedBookmark !== null}
        onClose={() => setSelectedBookmark(null)}
        onChanged={() => {
          void reloadBookmarks();
        }}
      />

      <FloatingAddButton
        collapsed={fabCollapsed}
        onPress={() => router.push("/bookmarks/save")}
      />
    </Screen>
  );
}
