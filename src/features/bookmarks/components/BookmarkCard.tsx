import { Image } from "expo-image";
import { memo, useRef } from "react";
import { View, type ImageStyle, type StyleProp } from "react-native";

import { resolvePreviewImageUri } from "@/core/files/previewFileStore";
import type { Bookmark, BookmarkView } from "@/features/bookmarks/types";
import { AppText } from "@/shared/ui/AppText";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/features/bookmarks/BookmarkCard.styles";
import { folderColors, pickFolderColorKey, useTheme } from "@/theme";

type BookmarkCardProps = {
  bookmark: Bookmark | BookmarkView;
  variant?: "grid" | "list" | "cards";
  onPress: (bookmark: Bookmark | BookmarkView) => void;
  onLongPress?: (bookmark: Bookmark | BookmarkView) => void;
};

function BookmarkCardComponent({
  bookmark,
  variant = "grid",
  onPress,
  onLongPress,
}: BookmarkCardProps) {
  const { theme } = useTheme();
  const domain = getDisplayDomain(bookmark);
  const folderName = "folderName" in bookmark ? bookmark.folderName : null;
  const lastLongPressAt = useRef(0);

  const handlePress = () => {
    if (Date.now() - lastLongPressAt.current < 800) {
      return;
    }
    onPress(bookmark);
  };

  const handleLongPress = () => {
    lastLongPressAt.current = Date.now();
    onLongPress?.(bookmark);
  };

  return (
    <ScalePressable
      accessibilityRole="button"
      accessibilityLabel={`${bookmark.title}. ${domain}.${
        bookmark.isFavorite ? " Favourite." : ""
      }`}
      accessibilityHint="Opens the saved link. Long press for actions."
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={350}
      scaleTo={0.985}
      style={[
        variant === "list"
          ? styles.listCard
          : variant === "cards"
            ? styles.cardsCard
            : styles.gridCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <BookmarkPreview
        bookmark={bookmark}
        style={
          variant === "list"
            ? previewStyles.list
            : variant === "cards"
              ? previewStyles.cards
              : previewStyles.grid
        }
      />

      <View
        style={
          variant === "list"
            ? styles.listContent
            : variant === "cards"
              ? styles.cardsContent
              : styles.gridContent
        }
      >
        <AppText variant="titleSmall" numberOfLines={2} style={styles.titleBlock}>
          {bookmark.title}
        </AppText>

        <View style={styles.metaRow}>
          <AppText
            variant="bodySmall"
            color={theme.colors.onSurfaceVariant}
            numberOfLines={1}
          >
            {folderName ? `${domain} · ${folderName}` : domain}
          </AppText>
        </View>
      </View>

      {bookmark.isFavorite ? (
        <View
          style={styles.favoriteBadge}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          <MaterialCommunityIcons name="heart" size={16} color={theme.colors.primary} />
        </View>
      ) : null}
    </ScalePressable>
  );
}

export const BookmarkCard = memo(BookmarkCardComponent);

type BookmarkPreviewProps = {
  bookmark: Bookmark | BookmarkView;
  style: StyleProp<ImageStyle>;
};

function BookmarkPreview({ bookmark, style }: BookmarkPreviewProps) {
  const uri = bookmark.previewImagePath
    ? resolvePreviewImageUri(bookmark.previewImagePath)
    : null;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={style}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={bookmark.id}
        accessible={false}
      />
    );
  }

  return (
    <View style={style}>
      <FallbackArtwork seed={bookmark.domain ?? bookmark.originalUrl} />
    </View>
  );
}

function FallbackArtwork({ seed }: { seed: string }) {
  const tint = folderColors[pickFolderColorKey(seed)];

  return (
    <View
      style={[styles.fallback, { backgroundColor: tint.background }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <MaterialCommunityIcons
        name="link-variant"
        size={26}
        color={tint.foreground}
      />
    </View>
  );
}

function getDisplayDomain(bookmark: Bookmark | BookmarkView): string {
  if (bookmark.domain) {
    return bookmark.domain;
  }

  try {
    return new URL(bookmark.originalUrl).hostname.replace(/^www\./, "");
  } catch {
    return "Saved link";
  }
}

const previewStyles = {
  grid: { width: "100%", aspectRatio: 16 / 9 },
  cards: { width: "100%", aspectRatio: 2.15 },
  list: { width: 76, height: 76, borderRadius: 14, overflow: "hidden" },
} satisfies Record<string, ImageStyle>;
