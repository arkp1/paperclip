import { useCallback, useState } from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookmarkActionsDialog } from "@/features/bookmarks/components/BookmarkActionsDialog";
import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import { openBookmarkDestination } from "@/features/bookmarks/utils/openBookmarkDestination";
import { useReaderAudioInset } from "@/features/reader/audio/ReaderAudioProvider";
import { useCollectionCounts } from "@/features/bookmarks/hooks/useCollectionCounts";
import { useSearchBookmarks } from "@/features/bookmarks/hooks/useSearchBookmarks";
import type { Bookmark, BookmarkView } from "@/features/bookmarks/types";
import { AppText } from "@/shared/ui/AppText";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { IconButton } from "@/shared/ui/IconButton";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";
import { SearchField } from "@/shared/ui/SearchField";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/features/search/SearchScreen.styles";
import { spacing, useTheme } from "@/theme";

export function SearchScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const audioInset = useReaderAudioInset();
  const [query, setQuery] = useState("");
  const { results, status, errorMessage, reload } = useSearchBookmarks(query);
  const { allCount, status: countsStatus } = useCollectionCounts();
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | BookmarkView | null>(
    null
  );

  const trimmedQuery = query.trim();
  const libraryIsEmpty = countsStatus === "ready" && allCount === 0;

  const openBookmark = useCallback(
    (bookmark: Bookmark) => {
      openBookmarkDestination(bookmark, router);
    },
    [router]
  );

  return (
    <Screen>
      <View style={styles.headerRow}>
        <IconButton icon="arrow-left" label="Go back" onPress={() => router.back()} />
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={theme.colors.onSurfaceVariant}
        />
        <AppText variant="headlineLarge" accessibilityRole="header" style={styles.title}>
          Find that thing.
        </AppText>
      </View>

      <View style={styles.searchArea}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder="Title, URL, note, or folder"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(bookmark) => bookmark.id}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing[6] + audioInset },
        ]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          status === "idle" ? (
            libraryIsEmpty ? (
              <EmptyState
                icon="bookmark-outline"
                title="Nothing to search yet"
                description="Save a link to Paperclip and search it by title, URL, note, or folder."
              />
            ) : (
              <EmptyState
                icon="magnify"
                title="Search your library"
                description="Find saved links by title, URL, note, domain, or folder name."
              />
            )
          ) : status === "loading" ? (
            <LoadingState compact message="Searching…" />
          ) : status === "error" ? (
            <ErrorState compact message={errorMessage ?? "Search failed."} />
          ) : libraryIsEmpty ? (
            <EmptyState
              icon="bookmark-outline"
              title="Nothing to search yet"
              description="Save a link to Paperclip and search it by title, URL, note, or folder."
            />
          ) : (
            <EmptyState
              icon="magnify-close"
              title="No links found"
              description={`Nothing in your library matches “${trimmedQuery}”.`}
            />
          )
        }
        ListHeaderComponent={
          status === "ready" && results.length > 0 ? (
            <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
              {results.length} {results.length === 1 ? "result" : "results"}
            </AppText>
          ) : undefined
        }
        renderItem={({ item }) => (
          <BookmarkCard
            bookmark={item}
            variant="list"
            onPress={openBookmark}
            onLongPress={setSelectedBookmark}
          />
        )}
      />

      <BookmarkActionsDialog
        bookmark={selectedBookmark}
        visible={selectedBookmark !== null}
        onClose={() => setSelectedBookmark(null)}
        onChanged={() => {
          reload();
        }}
      />
    </Screen>
  );
}
