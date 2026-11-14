import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { moveBookmark } from "@/features/bookmarks/data/bookmarkRepository";
import { deleteBookmarkWithAssets } from "@/features/bookmarks/services/previewService";
import { usePrivateSpaceSession } from "@/core/security/privateSpaceSession";
import { isVaultBookmark } from "@/core/database/privateVaultRepository";
import { FolderPickerContent } from "@/features/folders/components/FolderPickerDialog";
import { getAllFolders } from "@/features/folders/data/folderRepository";
import type { Folder } from "@/features/folders/types";
import { ReaderActionMenu } from "@/features/reader/components/ReaderActionMenu";
import { ReaderAnnotationSheet } from "@/features/reader/components/ReaderAnnotationSheet";
import { ReaderImageViewer } from "@/features/reader/components/ReaderImageViewer";
import { ReaderSearchBar } from "@/features/reader/components/ReaderSearchBar";
import { ReaderSettingsSheet } from "@/features/reader/components/ReaderSettingsSheet";
import { useReaderAudio } from "@/features/reader/audio/ReaderAudioProvider";
import { useArticleReader } from "@/features/reader/hooks/useArticleReader";
import {
  readerFontFamily,
  readerPalette,
  useReaderPreferences,
} from "@/features/reader/hooks/useReaderPreferences";
import type { ArticleBlock } from "@/features/reader/services/articleService";
import {
  annotationTints,
  blockAnnotationKey,
  loadAnnotations,
  saveAnnotations,
  type HighlightColor,
  type ReaderAnnotation,
} from "@/features/reader/services/annotationService";
import {
  loadReadingProgress,
  saveReadingProgress,
} from "@/features/reader/services/readingProgressService";
import { AppDialog } from "@/shared/ui/AppDialog";
import { Button } from "@/shared/ui/Button";
import { ErrorState } from "@/shared/ui/ErrorState";
import { IconButton } from "@/shared/ui/IconButton";
import type { MenuAnchor } from "@/shared/ui/MenuAnchor";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";
import { TopAppBar } from "@/shared/ui/TopAppBar";
import { openExternalUrl } from "@/shared/utils/openExternalUrl";
import { styles } from "@/styles/features/reader/ReaderScreen.styles";
import { spacing, useTheme } from "@/theme";

type ReaderScreenProps = {
  bookmarkId: string;
};

type ReaderPage = {
  key: string;
  blocks: ArticleBlock[];
};

/**
 * Distraction-free article view with paginated reading, listening controls,
 * offline cached content, and per-user reading preferences.
 */
export function ReaderScreen({ bookmarkId }: ReaderScreenProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [fullscreen, setFullscreen] = useState(false);
  const pageHeight = Math.max(
    240,
    height - insets.top - (fullscreen ? 0 : 64)
  );
  const { bookmark, blocks, wordCount, status, errorMessage, reload } =
    useArticleReader(bookmarkId);
  const { preferences, setFont, setFontSize, setLineHeight, setParagraphSpacing, setWidth, setAlign, setBackground, setPaginate } =
    useReaderPreferences();
  const { play: playAudio, clear: clearAudio } = useReaderAudio();
  const palette = readerPalette(preferences.background);
  const fontFamily = readerFontFamily(preferences.font);
  const { isUnlocked } = usePrivateSpaceSession();
  const previousUnlocked = useRef(isUnlocked);
  const [bookmarkIsPrivate, setBookmarkIsPrivate] = useState(false);
  const menuTriggerRef = useRef<ComponentRef<typeof View>>(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<MenuAnchor | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [moveVisible, setMoveVisible] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCursor, setSearchCursor] = useState(0);
  const [annotateMode, setAnnotateMode] = useState(false);
  const [annotations, setAnnotations] = useState<ReaderAnnotation[]>([]);
  const [annotationKey, setAnnotationKey] = useState<string | null>(null);
  const [annotationVisible, setAnnotationVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [progressHydrated, setProgressHydrated] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const pagesRef = useRef<FlatList<ReaderPage>>(null);
  const savedProgressRef = useRef<Awaited<
    ReturnType<typeof loadReadingProgress>
  > | null>(null);
  const restoredRef = useRef(false);
  const lastSavedProgress = useRef(-1);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockPositions = useRef(new Map<string, number>());
  const latestProgress = useRef<{
    progress: number;
    offset: number;
    pageIndex: number;
    mode: "scroll" | "pages";
    completed: boolean;
  } | null>(null);

  const contentWidth =
    preferences.width === "narrow"
      ? Math.min(560, width - 80)
      : preferences.width === "wide"
        ? width - 16
        : Math.min(680, width - 48);
  const contentWidthStyle = {
    width: "100%" as const,
    maxWidth: Math.max(220, contentWidth),
    alignSelf: "center" as const,
  };
  const bodyStyle = {
    fontFamily,
    fontWeight: "normal" as const,
    fontSize: preferences.fontSize,
    lineHeight: Math.round(preferences.fontSize * preferences.lineHeight),
    textAlign: preferences.align,
    color: palette.text,
  };
  const sharedContentStyle = [
    styles.content,
    {
      gap: preferences.paragraphSpacing,
      ...contentWidthStyle,
    },
  ];

  const pages = useMemo(
    () =>
      preferences.paginate
        ? paginate(
            blocks,
            preferences.fontSize,
            Math.max(220, contentWidth),
            height,
            preferences.lineHeight
          )
        : [],
    [
      blocks,
      contentWidth,
      preferences.fontSize,
      preferences.lineHeight,
      height,
      preferences.paginate,
    ]
  );
  const hasPaginatedContent = pages.some((item) => item.blocks.length > 0);
  const displayProgress = completed
    ? 1
    : preferences.paginate && pages.length > 0
      ? Math.max(0, Math.min(1, (pageIndex + 1) / pages.length))
      : readingProgress;
  const annotationMap = useMemo(() => {
    const map = new Map<string, ReaderAnnotation>();
    for (const annotation of annotations) {
      map.set(annotation.blockKey, annotation);
    }
    return map;
  }, [annotations]);
  const darkReader =
    preferences.background === "grey" || preferences.background === "black";
  const tints = annotationTints(darkReader);
  const searchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [] as { index: number; key: string }[];
    }
    return blocks.reduce<{ index: number; key: string }[]>(
      (matches, block, index) => {
        if (block.type !== "image" && block.text.toLowerCase().includes(query)) {
          matches.push({ index, key: blockAnnotationKey(block) });
        }
        return matches;
      },
      []
    );
  }, [blocks, searchQuery]);

  useEffect(() => {
    let active = true;
    void loadAnnotations(bookmarkId).then((next) => {
      if (active) {
        setAnnotations(next);
      }
    });
    return () => {
      active = false;
    };
  }, [bookmarkId]);

  useEffect(() => {
    setSearchCursor(0);
  }, [searchQuery]);
  useEffect(() => {
    setPageIndex(0);
  }, [bookmarkId, fontFamily, preferences.fontSize, preferences.paginate]);
  const speechParagraphs = useMemo(
    () =>
      blocks
        .filter(
          (block): block is Extract<ArticleBlock, { text: string }> =>
            block.type !== "image"
        )
        .map((block) => block.text),
    [blocks]
  );

  useEffect(() => {
    if (status === "ready" && bookmark) {
      playAudio({
        id: bookmark.id,
        title: bookmark.title,
        paragraphs: speechParagraphs,
      });
    }
  }, [bookmark, playAudio, speechParagraphs, status]);

  useEffect(() => {
    let active = true;
    restoredRef.current = false;
    setProgressHydrated(false);
    setReadingProgress(0);
    setCompleted(false);
    void loadReadingProgress(bookmarkId)
      .then((progress) => {
        if (!active) {
          return;
        }
        savedProgressRef.current = progress;
        setReadingProgress(progress.progress);
        setCompleted(progress.completed);
        setProgressHydrated(true);
      })
      .catch(() => {
        if (active) {
          setProgressHydrated(true);
        }
      });
    return () => {
      active = false;
    };
  }, [bookmarkId]);

  useEffect(() => {
    if (
      !progressHydrated ||
      restoredRef.current ||
      status !== "ready"
    ) {
      return;
    }
    const saved = savedProgressRef.current;
    if (!saved) {
      return;
    }

    if (preferences.paginate && pages.length > 0) {
      const index = Math.max(
        0,
        Math.min(
          pages.length - 1,
          saved.mode === "pages"
            ? saved.pageIndex
            : Math.floor(saved.progress * pages.length)
        )
      );
      setPageIndex(index);
      setReadingProgress((index + 1) / pages.length);
      restoredRef.current = true;
      requestAnimationFrame(() => {
        pagesRef.current?.scrollToIndex({ index, animated: false });
      });
      return;
    }

    if (!preferences.paginate && contentHeight > 0 && viewportHeight > 0) {
      const maxOffset = Math.max(0, contentHeight - viewportHeight);
      const y =
        saved.mode === "scroll"
          ? Math.min(maxOffset, saved.offset)
          : saved.progress * maxOffset;
      scrollRef.current?.scrollTo({ y, animated: false });
      setReadingProgress(saved.progress);
      restoredRef.current = true;
    }
  }, [
    contentHeight,
    pages,
    preferences.paginate,
    progressHydrated,
    status,
    viewportHeight,
  ]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      if (latestProgress.current) {
        void saveReadingProgress(bookmarkId, {
          ...latestProgress.current,
          updatedAt: Date.now(),
        }).catch(() => undefined);
      }
    };
  }, [bookmarkId]);

  const persistProgress = (
    progress: number,
    offset: number,
    index: number,
    mode: "scroll" | "pages",
    isCompleted = completed,
    force = false
  ) => {
    if (
      !force &&
      Math.abs(progress - lastSavedProgress.current) < 0.004 &&
      !isCompleted
    ) {
      return;
    }
    lastSavedProgress.current = progress;
    latestProgress.current = {
      progress,
      offset,
      pageIndex: index,
      mode,
      completed: isCompleted,
    };
    void saveReadingProgress(bookmarkId, {
      progress,
      offset,
      pageIndex: index,
      mode,
      completed: isCompleted,
      updatedAt: Date.now(),
    }).catch(() => undefined);
  };

  const handleScroll = (event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const maxOffset = Math.max(1, contentHeight - viewportHeight);
    const progress = Math.max(
      0,
      Math.min(1, event.nativeEvent.contentOffset.y / maxOffset)
    );
    setReadingProgress(progress);
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    const offset = event.nativeEvent.contentOffset.y;
    latestProgress.current = {
      progress,
      offset,
      pageIndex: 0,
      mode: "scroll",
      completed,
    };
    saveTimer.current = setTimeout(() => {
      persistProgress(progress, offset, 0, "scroll");
    }, 500);
  };

  const handlePageChange = (index: number) => {
    setPageIndex(index);
    const progress = pages.length > 0 ? (index + 1) / pages.length : 0;
    setReadingProgress(progress);
    persistProgress(progress, 0, index, "pages");
  };

  const toggleCompleted = () => {
    const next = !completed;
    const progress = next ? 1 : Math.max(0.01, readingProgress);
    setCompleted(next);
    setReadingProgress(progress);
    persistProgress(
      progress,
      0,
      pageIndex,
      preferences.paginate ? "pages" : "scroll",
      next,
      true
    );
  };

  const jumpToTop = () => {
    setReadingProgress(0);
    setPageIndex(0);
    if (preferences.paginate) {
      pagesRef.current?.scrollToIndex({ index: 0, animated: true });
      persistProgress(0, 0, 0, "pages", completed);
    } else {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      persistProgress(0, 0, 0, "scroll", completed);
    }
  };

  const jumpToBlock = (blockIndex: number, blockKey: string) => {
    if (preferences.paginate && pages.length > 0) {
      const page = pages.findIndex((candidate) =>
        candidate.blocks.some(
          (block) =>
            block.type !== "image" && blockAnnotationKey(block) === blockKey
        )
      );
      if (page >= 0) {
        setPageIndex(page);
        pagesRef.current?.scrollToIndex({ index: page, animated: true });
        persistProgress((page + 1) / pages.length, 0, page, "pages", completed);
      }
      return;
    }

    const measured = blockPositions.current.get(blockKey);
    const ratio = blocks.length > 0 ? blockIndex / blocks.length : 0;
    const y =
      measured !== undefined
        ? Math.max(0, measured - 72)
        : ratio * Math.max(1, contentHeight - viewportHeight);
    scrollRef.current?.scrollTo({ y, animated: true });
    setReadingProgress(ratio);
  };

  const navigateSearch = (direction: -1 | 1) => {
    if (searchMatches.length === 0) {
      return;
    }
    const next =
      (searchCursor + direction + searchMatches.length) %
      searchMatches.length;
    setSearchCursor(next);
    const match = searchMatches[next];
    if (match) {
      jumpToBlock(match.index, match.key);
    }
  };

  useEffect(() => {
    if (!searchVisible || !searchQuery.trim() || searchMatches.length === 0) {
      return;
    }
    setSearchCursor(0);
    const match = searchMatches[0];
    if (match) {
      jumpToBlock(match.index, match.key);
    }
    // Jump as the query changes; arrow navigation is handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchVisible]);

  const openAnnotationFor = (key: string) => {
    setAnnotationKey(key);
    setAnnotationVisible(true);
    setAnnotateMode(false);
  };

  const saveAnnotation = (color: HighlightColor, note: string) => {
    if (!annotationKey) {
      return;
    }
    const next = annotations.filter(
      (annotation) => annotation.blockKey !== annotationKey
    );
    next.push({
      id: `${Date.now()}-${annotationKey.slice(0, 20)}`,
      blockKey: annotationKey,
      color,
      note,
      createdAt: Date.now(),
    });
    setAnnotations(next);
    void saveAnnotations(bookmarkId, next).catch(() => undefined);
    setAnnotationVisible(false);
    setAnnotationKey(null);
  };

  const removeAnnotation = () => {
    if (!annotationKey) {
      return;
    }
    const next = annotations.filter(
      (annotation) => annotation.blockKey !== annotationKey
    );
    setAnnotations(next);
    void saveAnnotations(bookmarkId, next).catch(() => undefined);
    setAnnotationVisible(false);
    setAnnotationKey(null);
  };

  useEffect(() => {
    let active = true;
    if (isUnlocked) {
      void isVaultBookmark(bookmarkId).then((isPrivate) => {
        if (active) {
          setBookmarkIsPrivate(isPrivate);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [bookmarkId, isUnlocked]);

  useEffect(() => {
    if (previousUnlocked.current && !isUnlocked) {
      setActionsVisible(false);
      setMoveVisible(false);
      setSettingsVisible(false);
      setSearchVisible(false);
      clearAudio();
      if (bookmarkIsPrivate) {
        router.back();
      } else {
        void reload();
      }
    }
    previousUnlocked.current = isUnlocked;
  }, [bookmarkIsPrivate, clearAudio, isUnlocked, reload, router]);

  const openMove = async () => {
    setActionsVisible(false);
    try {
      setFolders(await getAllFolders());
      setMoveVisible(true);
    } catch {
      Alert.alert("Move to folder", "Could not load your folders.");
    }
  };

  const handleMove = async (folderId: string | null) => {
    if (!bookmark) {
      return;
    }
    try {
      await moveBookmark(bookmark.id, folderId);
      setMoveVisible(false);
    } catch {
      Alert.alert("Move to folder", "Could not move this link.");
    }
  };

  const confirmDelete = () => {
    if (!bookmark) {
      return;
    }
    setActionsVisible(false);
    Alert.alert(
      "Delete this link?",
      `“${bookmark.title}” will be removed from Paperclip.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            clearAudio();
            void deleteBookmarkWithAssets(bookmark.id)
              .then(() => router.back())
              .catch(() => Alert.alert("Delete", "Could not delete this link."));
          },
        },
      ]
    );
  };

  const share = async () => {
    setActionsVisible(false);
    if (bookmark) {
      await Share.share({ message: bookmark.originalUrl });
    }
  };

  const headingStyle = {
    ...bodyStyle,
    fontWeight: "700" as const,
    fontSize: preferences.fontSize + 4,
    lineHeight: Math.round(
      (preferences.fontSize + 4) * preferences.lineHeight
    ),
    marginTop: 18,
  };

  const renderContent = (
    pageBlocks: ArticleBlock[],
    showTitle: boolean,
    paginated = false
  ) => (
    <>
      {showTitle ? (
        <>
          <Text
            key={`title-${fontFamily}-${preferences.fontSize}`}
            style={[
              styles.title,
              {
                fontFamily,
                color: palette.text,
                fontSize: preferences.fontSize + 12,
                lineHeight: Math.round((preferences.fontSize + 12) * 1.2),
              },
            ]}
          >
            {bookmark?.title}
          </Text>
          <Text
            style={[styles.meta, { color: palette.muted, fontFamily }]}
          >
            {bookmark?.domain}
            {wordCount > 0
              ? ` · ${Math.max(1, Math.round(wordCount / 220))} min read`
              : ""}
            {` · ${Math.round(displayProgress * 100)}%${completed ? " · Finished" : ""}`}
          </Text>
        </>
      ) : null}

      {pageBlocks.map((block, blockIndex) => {
        if (block.type === "image") {
          return (
            <ArticleImageBlock
              key={`image-${blockIndex}`}
              block={block}
              paginated={paginated}
              captionColor={palette.muted}
              onOpen={(image) => setViewerImage(image)}
            />
          );
        }

        const annotation = annotationMap.get(blockAnnotationKey(block));
        const tint = annotation ? tints[annotation.color] : null;
        const blockKey = blockAnnotationKey(block);

        return (
          <View
            key={`${block.type}-${blockIndex}-${fontFamily}-${preferences.fontSize}`}
            onLayout={(event) => {
              blockPositions.current.set(
                blockKey,
                event.nativeEvent.layout.y
              );
            }}
          >
            <Text
              selectable={!annotateMode}
              onPress={
                annotateMode
                  ? () => openAnnotationFor(blockAnnotationKey(block))
                  : undefined
              }
              style={[
                block.type === "heading"
                  ? headingStyle
                  : block.type === "quote"
                    ? [
                        styles.quote,
                        bodyStyle,
                        { borderLeftColor: palette.muted },
                      ]
                    : bodyStyle,
                tint
                  ? {
                      backgroundColor: tint.background,
                      borderBottomColor: tint.border,
                      borderBottomWidth: 1,
                    }
                  : null,
              ]}
            >
              {renderInlineText(
                block.text,
                searchQuery,
                annotateMode
                  ? null
                  : (url) => {
                      void openExternalUrl(url);
                    },
                palette.text
              )}
            </Text>
            {annotation?.note ? (
              <Text
                style={[
                  styles.annotationNote,
                  {
                    color: palette.muted,
                    borderLeftColor: tint?.border ?? palette.muted,
                  },
                ]}
              >
                {annotation.note}
              </Text>
            ) : null}
          </View>
        );
      })}
    </>
  );

  return (
    <Screen style={{ backgroundColor: palette.background }}>
      <StatusBar
        style={
          preferences.background === "black" || preferences.background === "grey"
            ? "light"
            : "dark"
        }
      />
      {!fullscreen ? (
        <TopAppBar
          title="Read"
          icon="book-open-page-variant-outline"
          foregroundColor={palette.text}
          onBack={() => router.back()}
          actions={
            bookmark && (status === "ready" || status === "error") ? (
              <View style={styles.headerActions}>
                <IconButton
                  icon="fullscreen"
                  label="Enter full-screen reading"
                  onPress={() => setFullscreen(true)}
                  color={palette.text}
                />
                <IconButton
                  icon="format-size"
                  label="Reading settings"
                  onPress={() => setSettingsVisible(true)}
                  color={palette.text}
                />
                <View ref={menuTriggerRef} collapsable={false}>
                  <IconButton
                    icon="dots-vertical"
                    label="Reading options"
                    color={palette.text}
                    onPress={() => {
                      setActionsAnchor({ x: width - 12, y: 80 });
                      setActionsVisible(true);
                      menuTriggerRef.current?.measureInWindow(
                        (x, y, triggerWidth, triggerHeight) => {
                          setActionsAnchor({
                            x: x + triggerWidth,
                            y: y + triggerHeight,
                          });
                        }
                      );
                    }}
                  />
                </View>
              </View>
            ) : undefined
          }
        />
      ) : (
        <View
          style={[
            styles.floatingTop,
            { top: insets.top + spacing[2], right: spacing[4] },
          ]}
        >
          <IconButton
            icon="fullscreen-exit"
            label="Exit full-screen reading"
            onPress={() => setFullscreen(false)}
            withBackground
            color={palette.text}
            inkColor={palette.text}
          />
        </View>
      )}

      {status === "ready" ? (
        <View
          pointerEvents="none"
          style={[styles.progressTrack, { backgroundColor: palette.muted }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${displayProgress * 100}%`,
                backgroundColor: palette.text,
              },
            ]}
          />
        </View>
      ) : null}

      {annotateMode ? (
        <View
          style={[
            styles.annotateBanner,
            {
              backgroundColor: palette.background,
              borderColor: palette.muted,
            },
          ]}
        >
          <Text style={[styles.annotateBannerText, { color: palette.muted }]}>
            Tap a paragraph to highlight
          </Text>
          <IconButton
            icon="close"
            label="Cancel highlighting"
            size={18}
            onPress={() => setAnnotateMode(false)}
            color={palette.muted}
          />
        </View>
      ) : null}

      <ReaderSearchBar
        visible={searchVisible}
        query={searchQuery}
        currentMatch={searchCursor}
        matchCount={searchMatches.length}
        onQueryChange={setSearchQuery}
        onPrevious={() => navigateSearch(-1)}
        onNext={() => navigateSearch(1)}
        onClose={() => {
          setSearchVisible(false);
          setSearchQuery("");
        }}
      />

      {status === "loading" ? (
        <LoadingState message="Preparing article…" />
      ) : status === "not_found" ? (
        <ErrorState message="This saved link no longer exists." />
      ) : status === "error" ? (
        <ErrorState
          message={errorMessage ?? "This article could not be prepared."}
          onRetry={() => {
            void reload();
          }}
        />
      ) : (
        <>
          {preferences.paginate && hasPaginatedContent ? (
            <FlatList
              key={`${fontFamily}-${preferences.fontSize}-${preferences.lineHeight}`}
              ref={pagesRef}
              data={pages}
              horizontal
              pagingEnabled
              initialScrollIndex={0}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              style={styles.pageList}
              keyExtractor={(item) => item.key}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              initialNumToRender={1}
              windowSize={7}
              maxToRenderPerBatch={5}
              removeClippedSubviews={false}
              onMomentumScrollEnd={(event) => {
                handlePageChange(
                  Math.round(event.nativeEvent.contentOffset.x / width)
                );
              }}
              renderItem={({ item, index }) => (
                <View style={[styles.page, { width, height: pageHeight }]}>
                  <View style={[sharedContentStyle, { height: pageHeight }]}>
                    {renderContent(item.blocks, index === 0, true)}
                  </View>
                </View>
              )}
            />
          ) : (
            <ScrollView
              key={`${fontFamily}-${preferences.fontSize}-${preferences.lineHeight}`}
              ref={scrollRef}
              contentContainerStyle={sharedContentStyle}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={32}
              onScroll={handleScroll}
              onContentSizeChange={(_, nextHeight) => {
                setContentHeight(nextHeight);
              }}
              onLayout={(event) => {
                setViewportHeight(event.nativeEvent.layout.height);
              }}
            >
              {renderContent(blocks, true)}
            </ScrollView>
          )}

          {preferences.paginate && hasPaginatedContent ? (
            <View
              pointerEvents="none"
              style={[styles.fixedPageFooter, { bottom: insets.bottom + 84 }]}
            >
              <View
                style={[
                  styles.pageNumberPill,
                  {
                    backgroundColor: palette.background,
                    borderColor: palette.muted,
                  },
                ]}
              >
                <Text style={[styles.pageIndicator, { color: palette.muted }]}>
                  {Math.min(pageIndex + 1, pages.length)} / {pages.length} ·{" "}
                  {Math.round(displayProgress * 100)}%
                </Text>
              </View>
            </View>
          ) : null}
        </>
      )}

      <ReaderActionMenu
        visible={actionsVisible}
        anchor={actionsAnchor}
        completed={completed}
        onClose={() => setActionsVisible(false)}
        onDelete={confirmDelete}
        onOpenBrowser={() => {
          if (bookmark) {
            void openExternalUrl(bookmark.originalUrl);
          }
        }}
        onShare={() => {
          void share();
        }}
        onMove={() => {
          void openMove();
        }}
        onSearch={() => setSearchVisible(true)}
        onAnnotate={() => {
          setAnnotateMode(true);
        }}
        onToggleCompleted={toggleCompleted}
        onJumpToTop={jumpToTop}
      />

      <ReaderSettingsSheet
        visible={settingsVisible}
        preferences={preferences}
        onClose={() => setSettingsVisible(false)}
        onFontChange={setFont}
        onFontSizeChange={setFontSize}
        onLineHeightChange={setLineHeight}
        onParagraphSpacingChange={setParagraphSpacing}
        onWidthChange={setWidth}
        onAlignChange={setAlign}
        onBackgroundChange={setBackground}
        onPaginateChange={setPaginate}
      />

      <ReaderAnnotationSheet
        visible={annotationVisible}
        initialColor={
          (annotationKey
            ? annotationMap.get(annotationKey)?.color
            : undefined) ?? "yellow"
        }
        initialNote={
          (annotationKey ? annotationMap.get(annotationKey)?.note : "") ?? ""
        }
        canDelete={Boolean(annotationKey && annotationMap.has(annotationKey))}
        onDelete={removeAnnotation}
        onClose={() => {
          setAnnotationVisible(false);
          setAnnotationKey(null);
        }}
        onSave={saveAnnotation}
      />

      <ReaderImageViewer
        visible={viewerImage !== null}
        source={viewerImage?.src ?? null}
        alt={viewerImage?.alt ?? "Article image"}
        onClose={() => setViewerImage(null)}
      />

      <AppDialog
        visible={moveVisible}
        onRequestClose={() => setMoveVisible(false)}
        title="Move to folder"
        description="Choose where this link should live."
        actions={
          <Button
            label="Cancel"
            variant="text"
            onPress={() => setMoveVisible(false)}
          />
        }
      >
        <FolderPickerContent
          folders={folders}
          selectedFolderId={bookmark?.folderId ?? null}
          onSelect={(folderId) => {
            void handleMove(folderId);
          }}
        />
      </AppDialog>
    </Screen>
  );
}

/**
 * Splits article text into search highlights and tappable external links.
 */
function renderInlineText(
  text: string,
  query: string,
  onLink: ((url: string) => void) | null,
  linkColor: string
) {
  const nodes: ReactNode[] = [];
  const urlPattern = /https?:\/\/[^\s)]+/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const pushText = (value: string) => {
    if (!value) {
      return;
    }
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      nodes.push(value);
      return;
    }
    const lower = value.toLowerCase();
    let index = 0;
    let found = lower.indexOf(normalizedQuery, index);
    if (found < 0) {
      nodes.push(value);
      return;
    }
    while (found >= 0) {
      if (found > index) {
        nodes.push(value.slice(index, found));
      }
      const end = found + normalizedQuery.length;
      nodes.push(
        <Text key={`hit-${key++}`} style={styles.searchHit}>
          {value.slice(found, end)}
        </Text>
      );
      index = end;
      found = lower.indexOf(normalizedQuery, index);
    }
    if (index < value.length) {
      nodes.push(value.slice(index));
    }
  };

  while ((match = urlPattern.exec(text))) {
    pushText(text.slice(cursor, match.index));
    const url = match[0].replace(/[.,;:!?]+$/, "");
    nodes.push(
      <Text
        key={`link-${key++}`}
        suppressHighlighting
        style={[styles.link, { color: linkColor }]}
        onPress={
          onLink
            ? () => {
                onLink(url);
              }
            : undefined
        }
      >
        {url}
      </Text>
    );
    cursor = match.index + url.length;
    if (url.length < match[0].length) {
      pushText(match[0].slice(url.length));
      cursor = match.index + match[0].length;
    }
  }
  pushText(text.slice(cursor));
  return nodes;
}

/**
 * Renders an article image and hides tiny inline icons or social badges that
 * would otherwise be enlarged to a full-width image.
 */
function ArticleImageBlock({
  block,
  paginated,
  captionColor,
  onOpen,
}: {
  block: Extract<ArticleBlock, { type: "image" }>;
  paginated: boolean;
  captionColor: string;
  onOpen: (image: { src: string; alt: string }) => void;
}) {
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return null;
  }

  return (
    <Pressable
      onPress={() => onOpen({ src: block.src, alt: block.alt })}
      accessibilityRole="imagebutton"
      accessibilityLabel={block.alt || "View article image"}
    >
      <View style={styles.imageBlock}>
        <Image
          source={{ uri: block.src }}
          style={[styles.image, paginated && styles.pageImage]}
          contentFit="cover"
          cachePolicy="memory"
          transition={150}
          accessibilityLabel={block.alt}
          onLoad={(event) => {
            if (event.source.width < 140 || event.source.height < 100) {
              setHidden(true);
            }
          }}
          onError={() => setHidden(true)}
        />
        {block.alt && block.alt !== "Article image" ? (
          <Text style={[styles.caption, { color: captionColor }]}>
            {block.alt}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Groups article blocks into swipe-sized pages. This is an estimate based on
 * font size and viewport; each page is a non-scrolling horizontal page.
 */
function paginate(
  blocks: ArticleBlock[],
  fontSize: number,
  width: number,
  height: number,
  lineHeightMultiplier: number
): ReaderPage[] {
  const lineHeight = fontSize * lineHeightMultiplier;
  const contentHeight = Math.max(260, height - 250);
  const charsPerLine = Math.max(18, width / (fontSize * 0.54));
  const viewportBudget = Math.max(
    280,
    Math.floor((contentHeight / lineHeight) * charsPerLine * 0.82)
  );
  const pages: ReaderPage[] = [];
  let current: ArticleBlock[] = [];
  let used = 220;

  for (const originalBlock of blocks) {
    const blocksForPage =
      originalBlock.type === "image"
        ? [originalBlock]
        : splitLongTextBlock(originalBlock, Math.floor(viewportBudget * 0.92));

    for (const block of blocksForPage) {
      const size =
        block.type === "image"
          ? 0
          : block.text.length + (block.type === "heading" ? 100 : 0);
      if (current.length > 0 && used + size > viewportBudget) {
        pages.push({ key: `page-${pages.length}`, blocks: current });
        current = [];
        used = 0;
      }
      current.push(block);
      used += size;
    }
  }

  if (current.length > 0) {
    pages.push({ key: `page-${pages.length}`, blocks: current });
  }

  if (pages.length > 0) {
    const merged: ReaderPage[] = [];
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const imageOnly =
        page.blocks.length > 0 &&
        page.blocks.every((block) => block.type === "image");
      if (!imageOnly) {
        merged.push(page);
        continue;
      }

      const next = pages[index + 1];
      if (next) {
        next.blocks = [...page.blocks, ...next.blocks];
        continue;
      }

      if (merged.length > 0) {
        merged[merged.length - 1].blocks.push(...page.blocks);
      } else {
        merged.push(page);
      }
    }

    return merged.map((page, index) => ({
      ...page,
      key: `page-${index}`,
    }));
  }

  return [{ key: "page-0", blocks: [] }];
}

function splitLongTextBlock(
  block: Extract<ArticleBlock, { text: string }>,
  maxLength: number
): ArticleBlock[] {
  if (block.text.length <= maxLength) {
    return [block];
  }

  const parts: ArticleBlock[] = [];
  let remaining = block.text;
  while (remaining.length > maxLength) {
    let cut = remaining.lastIndexOf(" ", maxLength);
    if (cut < Math.floor(maxLength * 0.55)) {
      cut = maxLength;
    }
    parts.push({ ...block, text: remaining.slice(0, cut).trim() });
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) {
    parts.push({ ...block, text: remaining });
  }
  return parts;
}
