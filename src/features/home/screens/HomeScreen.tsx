import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import {
  LegacyScrollView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";

import { BookmarkActionsDialog } from "@/features/bookmarks/components/BookmarkActionsDialog";
import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import { refreshMissingPreviews } from "@/features/bookmarks/services/previewService";
import type { Bookmark, BookmarkView } from "@/features/bookmarks/types";
import { openBookmarkDestination } from "@/features/bookmarks/utils/openBookmarkDestination";
import { resolvePreviewImageUri } from "@/core/files/previewFileStore";
import { FolderCard } from "@/features/folders/components/FolderCard";
import type { Folder } from "@/features/folders/types";
import { useRecentBookmarks } from "@/features/home/hooks/useRecentBookmarks";
import { useRecentFolders } from "@/features/home/hooks/useRecentFolders";
import { AppText } from "@/shared/ui/AppText";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { useFloatingNavigationInset } from "@/shared/ui/FloatingBottomNavigation";
import { useTabSwipeCarouselControl } from "@/shared/ui/TabSwipeArea";
import { LoadingState } from "@/shared/ui/LoadingState";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { Screen } from "@/shared/ui/Screen";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/features/home/HomeScreen.styles";
import { spacing, useTheme } from "@/theme";

const AnimatedLegacyScrollView =
  Animated.createAnimatedComponent(LegacyScrollView);

export function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const bottomInset = useFloatingNavigationInset();
  const setCarouselActive = useTabSwipeCarouselControl();
  const reduceMotion = useReducedMotion();
  const overviewWidth = Math.max(240, width - spacing[6] * 2);
  const overviewCardWidth = overviewWidth;
  const overviewCompactWidth = Math.round(overviewCardWidth * 0.4);
  const overviewInterval = overviewCardWidth;
  const overviewScrollX = useSharedValue(0);
  const overviewScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      overviewScrollX.value = event.contentOffset.x;
    },
  });

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
  const [overviewIndex, setOverviewIndex] = useState(0);
  const prefetchedUris = useRef(new Set<string>());
  const overviewBookmarks = useMemo(
    () => bookmarks.slice(0, 4),
    [bookmarks]
  );

  useEffect(() => {
    const nearbyUris = [
      overviewBookmarks[overviewIndex - 1],
      overviewBookmarks[overviewIndex],
      overviewBookmarks[overviewIndex + 1],
    ]
      .map((bookmark) =>
        bookmark?.previewImagePath
          ? resolvePreviewImageUri(bookmark.previewImagePath)
          : null
      )
      .filter((uri): uri is string => Boolean(uri))
      .filter((uri) => !prefetchedUris.current.has(uri));

    if (nearbyUris.length === 0) {
      return;
    }

    if (prefetchedUris.current.size > 32) {
      prefetchedUris.current.clear();
    }
    nearbyUris.forEach((uri) => prefetchedUris.current.add(uri));
    void Image.prefetch(nearbyUris, "memory-disk").catch(() => {
      nearbyUris.forEach((uri) => prefetchedUris.current.delete(uri));
    });
  }, [overviewBookmarks, overviewIndex]);

  const carouselRef = useRef<ComponentRef<typeof LegacyScrollView>>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSettleTimer = useCallback(() => {
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  const settleOverview = useCallback(
    (offset: number) => {
      if (overviewBookmarks.length === 0) {
        return;
      }
      const index = Math.max(
        0,
        Math.min(
          overviewBookmarks.length - 1,
          Math.round(offset / overviewInterval)
        )
      );
      const target = index * overviewInterval;
      if (Math.abs(offset - target) > 1) {
        carouselRef.current?.scrollTo({ x: target, animated: true });
      }
      setOverviewIndex(index);
    },
    [overviewBookmarks.length, overviewInterval]
  );

  const goToOverview = useCallback(
    (index: number) => {
      clearSettleTimer();
      setOverviewIndex(index);
      carouselRef.current?.scrollTo({
        x: index * overviewInterval,
        animated: true,
      });
    },
    [clearSettleTimer, overviewInterval]
  );

  const previewOverviewIndex = useCallback(
    (offset: number) => {
      if (overviewBookmarks.length === 0) {
        return;
      }
      const index = Math.max(
        0,
        Math.min(
          overviewBookmarks.length - 1,
          Math.round(offset / overviewInterval)
        )
      );
      setOverviewIndex((current) => (current === index ? current : index));
    },
    [overviewBookmarks.length, overviewInterval]
  );

  const scheduleSettle = useCallback(
    (offset: number) => {
      clearSettleTimer();
      settleTimer.current = setTimeout(() => settleOverview(offset), 160);
    },
    [clearSettleTimer, settleOverview]
  );

  useEffect(() => clearSettleTimer, [clearSettleTimer]);
  const refreshing =
    foldersRefreshing || bookmarksRefreshing || previewRefreshing;
  const [selectedBookmark, setSelectedBookmark] = useState<
    Bookmark | BookmarkView | null
  >(null);

  useEffect(() => {
    const maxIndex = Math.max(0, overviewBookmarks.length - 1);
    if (overviewIndex > maxIndex) {
      setOverviewIndex(maxIndex);
      carouselRef.current?.scrollTo({
        x: maxIndex * overviewInterval,
        animated: false,
      });
    }
  }, [overviewBookmarks.length, overviewIndex, overviewInterval]);

  const openFolder = useCallback(
    (folder: Folder) => {
      router.push({
        pathname: "/folders/[folderId]",
        params: { folderId: folder.id },
      });
    },
    [router],
  );

  const openBookmark = useCallback(
    (bookmark: Bookmark) => {
      void openBookmarkDestination(bookmark, router);
    },
    [router],
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
          <AppText
            variant="titleLarge"
            style={styles.wordmark}
            accessibilityRole="header"
          >
            paperclip
          </AppText>

          <View style={styles.hero}>
            <AppText variant="eyebrow" color={theme.colors.primary}>
              Your own little corner
            </AppText>
            <AppText variant="headlineLarge">Save now. Read later.</AppText>
          </View>

          <ScalePressable
            accessibilityRole="button"
            accessibilityLabel="Search your saved links"
            onPress={() => router.push("/search")}
            scaleTo={0.99}
            style={[
              styles.searchField,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
            <AppText
              variant="bodyLarge"
              color={theme.colors.onSurfaceVariant}
            >
              Search your saved links
            </AppText>
          </ScalePressable>
        </View>

        {bookmarks.length > 0 ? (
          <View style={styles.overviewSection}>
            <AppText variant="titleLarge">Worth a look</AppText>

            <AnimatedLegacyScrollView
                ref={carouselRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                disableIntervalMomentum
                directionalLockEnabled
                nestedScrollEnabled
                snapToInterval={overviewInterval}
                snapToAlignment="start"
                onScroll={overviewScrollHandler}
                scrollEventThrottle={16}
                onTouchStartCapture={() => setCarouselActive(true)}
                onTouchStart={() => setCarouselActive(true)}
                onTouchEnd={() => setCarouselActive(false)}
                onTouchCancel={() => setCarouselActive(false)}
                onScrollBeginDrag={() => {
                  setCarouselActive(true);
                  clearSettleTimer();
                }}
                onScrollEndDrag={(event) => {
                  setCarouselActive(false);
                  previewOverviewIndex(event.nativeEvent.contentOffset.x);
                  scheduleSettle(event.nativeEvent.contentOffset.x);
                }}
                onMomentumScrollBegin={clearSettleTimer}
                onMomentumScrollEnd={(event) => {
                  setCarouselActive(false);
                  clearSettleTimer();
                  settleOverview(event.nativeEvent.contentOffset.x);
                }}
                style={{ width: overviewWidth, overflow: "hidden" }}
              >
                {overviewBookmarks.map((bookmark, index) => (
                  <QuickOverviewCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    index={index}
                    scrollX={overviewScrollX}
                    cardWidth={overviewCardWidth}
                    compactWidth={overviewCompactWidth}
                    interval={overviewInterval}
                    reduceMotion={reduceMotion}
                    onPress={openBookmark}
                  />
                ))}
              </AnimatedLegacyScrollView>

            {overviewBookmarks.length > 1 ? (
              <View style={styles.overviewDots}>
                {overviewBookmarks.map((bookmark, index) => (
                  <OverviewDot
                    key={bookmark.id}
                    active={index === overviewIndex}
                    onPress={() => goToOverview(index)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

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
          <EmptyState
            icon="bookmark-plus-outline"
            title="Nothing saved yet"
            description="Share any link to Paperclip from your browser or another app, or add one here."
            action={{
              label: "Save a link",
              onPress: () => router.push("/bookmarks/save"),
            }}
          />
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
    </Screen>
  );
}

function QuickOverviewCard({
  bookmark,
  index,
  scrollX,
  cardWidth,
  compactWidth,
  interval,
  reduceMotion,
  onPress,
}: {
  bookmark: BookmarkView;
  index: number;
  scrollX: SharedValue<number>;
  cardWidth: number;
  compactWidth: number;
  interval: number;
  reduceMotion: boolean;
  onPress: (bookmark: Bookmark) => void;
}) {
  const { theme } = useTheme();
  const uri = bookmark.previewImagePath
    ? resolvePreviewImageUri(bookmark.previewImagePath)
    : null;
  const translateStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { transform: [{ translateX: 0 }] };
    }
    const signedDistance = (scrollX.value - index * interval) / interval;
    const proximity = Math.min(1, Math.abs(signedDistance));
    const scale = 1 - (1 - compactWidth / cardWidth) * proximity;
    const shift =
      (signedDistance >= 0 ? 1 : -1) *
      ((cardWidth - cardWidth * scale) / 2);
    return { transform: [{ translateX: shift }] };
  });
  const squishStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { transform: [{ scaleX: 1 }] };
    }
    const signedDistance = (scrollX.value - index * interval) / interval;
    const proximity = Math.min(1, Math.abs(signedDistance));
    const scale = 1 - (1 - compactWidth / cardWidth) * proximity;
    return { transform: [{ scaleX: scale }] };
  });
  const contentStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { transform: [{ scaleX: 1 }] };
    }
    const signedDistance = (scrollX.value - index * interval) / interval;
    const proximity = Math.min(1, Math.abs(signedDistance));
    const scale = 1 - (1 - compactWidth / cardWidth) * proximity;
    return { transform: [{ scaleX: 1 / scale }] };
  });

  return (
    <View style={{ width: cardWidth, height: 240, alignItems: "center" }}>
      <Animated.View style={[{ width: cardWidth }, translateStyle]}>
        <Animated.View
          style={[
            styles.overviewCard,
            {
              width: cardWidth,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
            squishStyle,
          ]}
        >
          <Animated.View style={[{ flex: 1 }, contentStyle]}>
            <ScalePressable
              accessibilityRole="button"
              accessibilityLabel={bookmark.title}
              onPress={() => onPress(bookmark)}
              scaleTo={0.99}
              style={{ flex: 1 }}
            >
          <OverviewThumbnail
            key={`${bookmark.id}-${uri ?? "none"}`}
            bookmarkId={bookmark.id}
            uri={uri}
          />

        <View pointerEvents="none" style={styles.overviewShade}>
          {[0.04, 0.07, 0.11, 0.17, 0.24, 0.34, 0.47, 0.62].map(
            (opacity, index) => (
              <View
                key={index}
                style={[styles.overviewShadeBand, { opacity }]}
              />
            )
          )}
        </View>

        <View style={styles.overviewTitle}>
          <AppText
            variant="titleLarge"
            color="#FFFFFF"
            numberOfLines={3}
            style={styles.overviewTitleText}
          >
            {bookmark.title}
          </AppText>
        </View>
      </ScalePressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function OverviewThumbnail({
  bookmarkId,
  uri,
}: {
  bookmarkId: string;
  uri: string | null;
}) {
  const { theme } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageOpacity = useSharedValue(0);
  const isDark = theme.scheme === "dark";
  const placeholderColor = isDark ? "#2B2B2B" : "#E8E8E8";
  const placeholderIconColor = isDark
    ? "rgba(255, 255, 255, 0.36)"
    : "rgba(0, 0, 0, 0.3)";

  useEffect(() => {
    setImageFailed(false);
    setImageLoaded(false);
    imageOpacity.value = 0;
  }, [imageOpacity, uri]);

  useEffect(() => {
    if (!uri || imageFailed || imageLoaded) {
      return;
    }
    const timeout = setTimeout(() => {
      setImageFailed(true);
    }, 10_000);
    return () => clearTimeout(timeout);
  }, [imageFailed, imageLoaded, uri]);

  useEffect(() => {
    imageOpacity.value = withTiming(imageLoaded ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [imageLoaded, imageOpacity]);

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  return (
    <View
      style={[styles.overviewImage, { backgroundColor: placeholderColor }]}
    >
      {!imageLoaded ? (
        <MaterialCommunityIcons
          name={imageFailed ? "image-off-outline" : "image-outline"}
          size={30}
          color={placeholderIconColor}
        />
      ) : null}
      {uri && !imageFailed ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
            imageStyle,
          ]}
        >
          <Image
            key={`${bookmarkId}-${uri}`}
            source={{ uri }}
            style={{
              width: "100%",
              height: "100%",
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={bookmarkId}
            transition={0}
            onLoad={() => setImageLoaded(true)}
            onDisplay={() => setImageLoaded(true)}
            onError={() => {
              setImageFailed(true);
              setImageLoaded(false);
            }}
            accessible={false}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

function OverviewDot({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: 220,
      easing: Easing.bezier(0.2, 0, 0, 1),
    });
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    width: 6 + progress.value * 14,
    opacity: 0.35 + progress.value * 0.65,
    backgroundColor: theme.colors.primary,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        active ? "Current article" : "Go to article in carousel"
      }
      accessibilityState={{ selected: active }}
      hitSlop={8}
      onPress={onPress}
      style={styles.overviewDotHit}
    >
      <Animated.View style={[styles.overviewDot, style]} />
    </Pressable>
  );
}
