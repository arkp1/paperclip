import { useState } from "react";
import { Alert, ScrollView, Share, Text } from "react-native";
import { useRouter } from "expo-router";

import { moveBookmark } from "@/features/bookmarks/data/bookmarkRepository";
import { deleteBookmarkWithAssets } from "@/features/bookmarks/services/previewService";
import { FolderPickerContent } from "@/features/folders/components/FolderPickerDialog";
import { getAllFolders } from "@/features/folders/data/folderRepository";
import type { Folder } from "@/features/folders/types";
import { ReaderActionMenu } from "@/features/reader/components/ReaderActionMenu";
import { ReaderPlayer } from "@/features/reader/components/ReaderPlayer";
import { useArticleReader } from "@/features/reader/hooks/useArticleReader";
import { AppDialog } from "@/shared/ui/AppDialog";
import { Button } from "@/shared/ui/Button";
import { ErrorState } from "@/shared/ui/ErrorState";
import { IconButton } from "@/shared/ui/IconButton";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";
import { TopAppBar } from "@/shared/ui/TopAppBar";
import { openExternalUrl } from "@/shared/utils/openExternalUrl";
import { styles } from "@/styles/features/reader/ReaderScreen.styles";
import { useTheme } from "@/theme";

type ReaderScreenProps = {
  bookmarkId: string;
};

export function ReaderScreen({ bookmarkId }: ReaderScreenProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { bookmark, blocks, wordCount, status, errorMessage, reload } =
    useArticleReader(bookmarkId);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [moveVisible, setMoveVisible] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);

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

  return (
    <Screen>
      <TopAppBar
        title="Read"
        icon="book-open-page-variant-outline"
        onBack={() => router.back()}
        actions={
          status === "ready" ? (
            <IconButton
              icon="dots-vertical"
              label="Reading options"
              onPress={() => setActionsVisible(true)}
            />
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
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              {bookmark?.title}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
              {bookmark?.domain}
              {wordCount > 0
                ? ` · ${Math.max(1, Math.round(wordCount / 220))} min read`
                : ""}
            </Text>

            {blocks.map((block, index) => (
              <Text
                key={`${block.type}-${index}`}
                style={[
                  block.type === "heading"
                    ? styles.heading
                    : block.type === "quote"
                      ? styles.quote
                      : styles.paragraph,
                  { color: theme.colors.onBackground },
                ]}
              >
                {block.text}
              </Text>
            ))}
          </ScrollView>

          <ReaderPlayer
            title={bookmark?.title ?? "Saved article"}
            paragraphs={blocks.map((block) => block.text)}
          />
        </>
      )}

      <ReaderActionMenu
        visible={actionsVisible}
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
