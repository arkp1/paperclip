import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import {
  Alert,
  FlatList,
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
import { FolderPickerContent } from "@/features/folders/components/FolderPickerDialog";
import { getAllFolders } from "@/features/folders/data/folderRepository";
import type { Folder } from "@/features/folders/types";
import { ReaderActionMenu } from "@/features/reader/components/ReaderActionMenu";
import { ReaderSettingsSheet } from "@/features/reader/components/ReaderSettingsSheet";
import { useReaderAudio } from "@/features/reader/audio/ReaderAudioProvider";
import { useArticleReader } from "@/features/reader/hooks/useArticleReader";
import {
  readerFontFamily,
  readerPalette,
  useReaderPreferences,
} from "@/features/reader/hooks/useReaderPreferences";
import type { ArticleBlock } from "@/features/reader/services/articleService";
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
import { useTheme } from "@/theme";

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
  const pageHeight = Math.max(240, height - insets.top - 64);
  const { bookmark, blocks, wordCount, status, errorMessage, reload } =
    useArticleReader(bookmarkId);
  const { preferences, setFont, setFontSize, setBackground, setPaginate } =
    useReaderPreferences();
  const { play: playAudio, clear: clearAudio } = useReaderAudio();
  const palette = readerPalette(preferences.background);
  const fontFamily = readerFontFamily(preferences.font);
  const { isUnlocked } = usePrivateSpaceSession();
  const previousUnlocked = useRef(isUnlocked);
  const menuTriggerRef = useRef<ComponentRef<typeof View>>(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<MenuAnchor | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [moveVisible, setMoveVisible] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const pages = useMemo(
    () =>
      preferences.paginate
        ? paginate(blocks, preferences.fontSize, width, height)
        : [],
    [blocks, preferences.fontSize, height, preferences.paginate, width]
  );
  const hasPaginatedContent = pages.some((item) => item.blocks.length > 0);
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
    if (previousUnlocked.current && !isUnlocked) {
      setActionsVisible(false);
      setMoveVisible(false);
      setSettingsVisible(false);
      clearAudio();
      void reload();
    }
    previousUnlocked.current = isUnlocked;
  }, [clearAudio, isUnlocked, reload]);

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

  const bodyStyle = {
    fontFamily,
    fontSize: preferences.fontSize,
    lineHeight: Math.round(preferences.fontSize * 1.72),
    color: palette.text,
  };
  const headingStyle = {
    ...bodyStyle,
    fontWeight: "700" as const,
    fontSize: preferences.fontSize + 4,
    lineHeight: Math.round((preferences.fontSize + 4) * 1.4),
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
            />
          );
        }

        return (
          <Text
            key={`${block.type}-${blockIndex}-${fontFamily}-${preferences.fontSize}`}
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
            ]}
          >
            {block.text}
          </Text>
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
      <TopAppBar
        title="Read"
        icon="book-open-page-variant-outline"
        foregroundColor={palette.text}
        onBack={() => router.back()}
        actions={
          bookmark && (status === "ready" || status === "error") ? (
            <View style={styles.headerActions}>
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
              key={`${fontFamily}-${preferences.fontSize}`}
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
                setPageIndex(
                  Math.round(event.nativeEvent.contentOffset.x / width)
                );
              }}
              renderItem={({ item, index }) => (
                <View
                  style={[styles.page, styles.content, { width, height: pageHeight }]}
                >
                  {renderContent(item.blocks, index === 0, true)}
                </View>
              )}
            />
          ) : (
            <ScrollView
              key={`${fontFamily}-${preferences.fontSize}`}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
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
                  {Math.min(pageIndex + 1, pages.length)} / {pages.length}
                </Text>
              </View>
            </View>
          ) : null}
        </>
      )}

      <ReaderActionMenu
        visible={actionsVisible}
        anchor={actionsAnchor}
        onClose={() => setActionsVisible(false)}
        onDelete={confirmDelete}
        onOpenBrowser={() => {
          setActionsVisible(false);
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
      />

      <ReaderSettingsSheet
        visible={settingsVisible}
        preferences={preferences}
        onClose={() => setSettingsVisible(false)}
        onFontChange={setFont}
        onFontSizeChange={setFontSize}
        onBackgroundChange={setBackground}
        onPaginateChange={setPaginate}
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
 * Renders an article image and hides tiny inline icons or social badges that
 * would otherwise be enlarged to a full-width image.
 */
function ArticleImageBlock({
  block,
  paginated,
  captionColor,
}: {
  block: Extract<ArticleBlock, { type: "image" }>;
  paginated: boolean;
  captionColor: string;
}) {
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return null;
  }

  return (
    <View style={styles.imageBlock}>
      <Image
        source={{ uri: block.src }}
        style={[styles.image, paginated && styles.pageImage]}
        contentFit="cover"
        transition={150}
        accessibilityLabel={block.alt}
        onLoad={(event) => {
          if (event.source.width < 140 || event.source.height < 100) {
            setHidden(true);
          }
        }}
      />
      {block.alt && block.alt !== "Article image" ? (
        <Text style={[styles.caption, { color: captionColor }]}>
          {block.alt}
        </Text>
      ) : null}
    </View>
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
  height: number
): ReaderPage[] {
  const lineHeight = fontSize * 1.72;
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
