import { useCallback, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookmarkActionsDialog } from "@/features/bookmarks/components/BookmarkActionsDialog";
import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import { BookmarkSortDialog } from "@/features/bookmarks/components/BookmarkSortDialog";
import { BookmarkViewSelector } from "@/features/bookmarks/components/BookmarkViewSelector";
import { openBookmarkDestination } from "@/features/bookmarks/utils/openBookmarkDestination";
import { useBookmarkSortMode } from "@/features/bookmarks/hooks/useBookmarkSortMode";
import { useBookmarkViewMode } from "@/features/bookmarks/hooks/useBookmarkViewMode";
import { useCollectionBookmarks } from "@/features/bookmarks/hooks/useCollectionBookmarks";
import { refreshMissingPreviews } from "@/features/bookmarks/services/previewService";
import type {
  Bookmark,
  BookmarkCollection,
  BookmarkView,
  BookmarkViewMode,
} from "@/features/bookmarks/types";
import { BOOKMARK_VIEW_MODES } from "@/features/bookmarks/types";
import { AnimatedLayoutChange } from "@/shared/ui/AnimatedLayoutChange";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { IconButton } from "@/shared/ui/IconButton";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";
import { TopAppBar } from "@/shared/ui/TopAppBar";
import { openExternalUrl } from "@/shared/utils/openExternalUrl";
import { styles } from "@/styles/features/bookmarks/BookmarkCollectionScreen.styles";
import { spacing } from "@/theme";

type BookmarkCollectionScreenProps = {
  collection: BookmarkCollection;
  title: string;
};

export function BookmarkCollectionScreen({ collection, title }: BookmarkCollectionScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sortMode, setSortMode } = useBookmarkSortMode();
  const { bookmarks, status, errorMessage, reload } = useCollectionBookmarks(
    collection,
    sortMode
  );
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | BookmarkView | null>(
    null
  );
  const [sortVisible, setSortVisible] = useState(false);
  const { viewMode, setViewMode } = useBookmarkViewMode();
  const [viewDirection, setViewDirection] = useState<1 | -1>(1);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
      await refreshMissingPreviews();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

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

  const collectionIcon =
    collection === "all"
      ? "bookmark-multiple-outline"
      : collection === "favorites"
        ? "heart-outline"
        : "inbox-outline";
  const emptyTitle =
    collection === "all"
      ? "No saved links yet"
      : collection === "favorites"
        ? "No favourites yet"
        : "Nothing uncategorized";
  const emptyDescription =
    collection === "all"
      ? "Links you share to Paperclip or add manually will appear here."
      : collection === "favorites"
        ? "Long-press a saved link and choose Add to favourites."
        : "Every saved link already belongs to a folder.";

  return (
    <Screen>
      <TopAppBar
        title={title}
        icon={collectionIcon}
        onBack={() => router.back()}
        actions={
          <IconButton
            icon="sort-variant"
            label="Sort bookmarks"
            onPress={() => setSortVisible(true)}
          />
        }
      />

      {status === "ready" && bookmarks.length > 0 ? (
        <BookmarkViewSelector viewMode={viewMode} onChange={handleViewModeChange} />
      ) : null}

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
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing[6] },
        ]}
        ListEmptyComponent={
          status === "loading" ? (
            <LoadingState compact message="Loading your links…" />
          ) : status === "error" ? (
            <ErrorState
              compact
              message={errorMessage ?? "Could not load these bookmarks."}
              onRetry={() => {
                void reload();
              }}
            />
          ) : (
            <EmptyState
              icon={collectionIcon}
              title={emptyTitle}
              description={emptyDescription}
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
          void reload();
        }}
      />
    </Screen>
  );
}
