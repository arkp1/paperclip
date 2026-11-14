import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { BookmarkActionsDialog } from "@/features/bookmarks/components/BookmarkActionsDialog";
import { useBookmarkDetails } from "@/features/bookmarks/hooks/useBookmarkDetails";
import { useReaderAudioInset } from "@/features/reader/audio/ReaderAudioProvider";
import { resolvePreviewImageUri } from "@/core/files/previewFileStore";
import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { ErrorState } from "@/shared/ui/ErrorState";
import { IconButton } from "@/shared/ui/IconButton";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";
import { TopAppBar } from "@/shared/ui/TopAppBar";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { openExternalUrl } from "@/shared/utils/openExternalUrl";
import { styles } from "@/styles/features/bookmarks/BookmarkDetailsScreen.styles";
import { useTheme } from "@/theme";

type BookmarkDetailsScreenProps = {
  bookmarkId: string;
};

export function BookmarkDetailsScreen({
  bookmarkId,
}: BookmarkDetailsScreenProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { bookmark, status, errorMessage, reload } =
    useBookmarkDetails(bookmarkId);
  const audioInset = useReaderAudioInset();
  const [actionsVisible, setActionsVisible] = useState(false);

  const previewUri = bookmark?.previewImagePath
    ? resolvePreviewImageUri(bookmark.previewImagePath)
    : null;

  return (
    <Screen>
      <TopAppBar
        title="Saved link"
        icon="link-variant"
        onBack={() => router.back()}
        actions={
          bookmark ? (
            <IconButton
              icon="dots-vertical"
              label="Link actions"
              onPress={() => setActionsVisible(true)}
            />
          ) : undefined
        }
      />

      {status === "loading" ? (
        <LoadingState message="Opening saved link…" />
      ) : status === "not_found" ? (
        <ErrorState message="This saved link may have been deleted." />
      ) : status === "error" || !bookmark ? (
        <ErrorState
          message={errorMessage ?? "Could not open this saved link."}
          onRetry={() => {
            void reload();
          }}
        />
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: audioInset + 24 }]}
          >
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={styles.preview}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={bookmark.id}
              />
            ) : (
              <View
                style={[
                  styles.previewFallback,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="link-variant"
                  size={44}
                  color={theme.colors.onPrimaryContainer}
                />
              </View>
            )}

            <View style={styles.titleRow}>
              <AppText variant="headlineSmall" style={styles.title}>
                {bookmark.title}
              </AppText>
              {bookmark.isFavorite ? (
                <MaterialCommunityIcons
                  name="heart"
                  size={22}
                  color={theme.colors.primary}
                />
              ) : null}
            </View>

            <View style={styles.meta}>
              <MaterialCommunityIcons
                name={bookmark.folderName ? "folder-outline" : "inbox-outline"}
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
                {[bookmark.domain, bookmark.folderName]
                  .filter(Boolean)
                  .join(" · ")}
              </AppText>
            </View>

            {bookmark.description ? (
              <View style={styles.section}>
                <AppText variant="eyebrow" color={theme.colors.primary}>
                  About
                </AppText>
                <AppText variant="bodyMedium">{bookmark.description}</AppText>
              </View>
            ) : null}

            {bookmark.note ? (
              <View style={styles.section}>
                <AppText variant="eyebrow" color={theme.colors.primary}>
                  Your note
                </AppText>
                <View
                  style={[
                    styles.noteCard,
                    {
                      backgroundColor: theme.colors.surfaceContainerLowest,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <AppText variant="bodyMedium">{bookmark.note}</AppText>
                </View>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Button
                label="Open link"
                onPress={() => {
                  void openExternalUrl(bookmark.originalUrl);
                }}
              />
              <Button
                label="Copy link"
                variant="tonal"
                onPress={() => {
                  void Clipboard.setStringAsync(bookmark.originalUrl);
                }}
              />
            </View>

            <View
              style={[
                styles.metaGroup,
                { borderColor: theme.colors.outlineVariant },
              ]}
            >
              <MetaRow
                label="Domain"
                value={bookmark.domain ?? "Unknown"}
              />
              <MetaRow
                label="Folder"
                value={bookmark.folderName ?? "Uncategorized"}
              />
              {bookmark.sourceName ? (
                <MetaRow label="Source" value={bookmark.sourceName} />
              ) : null}
              <MetaRow label="Saved" value={formatDate(bookmark.createdAt)} />
            </View>
          </ScrollView>

          <BookmarkActionsDialog
            bookmark={bookmark}
            visible={actionsVisible}
            showDetails={false}
            onClose={() => setActionsVisible(false)}
            onChanged={() => {
              void reload();
            }}
          />
        </>
      )}
    </Screen>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.metaRow}>
      <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
        {label}
      </AppText>
      <AppText variant="bodySmall" style={styles.metaValue} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
