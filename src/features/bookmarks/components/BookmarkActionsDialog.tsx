import { useEffect, useState } from "react";
import { Alert, Platform, Share, ToastAndroid, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";

import {
  moveBookmark,
  setBookmarkFavorite,
  updateBookmarkContent,
} from "@/features/bookmarks/data/bookmarkRepository";
import {
  deleteBookmarkWithAssets,
  refreshBookmarkPreview,
} from "@/features/bookmarks/services/previewService";
import type { Bookmark, BookmarkView } from "@/features/bookmarks/types";
import { getAllFolders } from "@/features/folders/data/folderRepository";
import { FolderPickerContent } from "@/features/folders/components/FolderPickerDialog";
import type { Folder } from "@/features/folders/types";
import { ActionRow } from "@/shared/ui/ActionRow";
import { AppDialog } from "@/shared/ui/AppDialog";
import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/TextField";
import { styles } from "@/styles/features/bookmarks/BookmarkActionsDialog.styles";
import { useTheme } from "@/theme";

type Mode = "actions" | "edit" | "move" | "delete";

type BookmarkActionsDialogProps = {
  bookmark: Bookmark | BookmarkView | null;
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
  showDetails?: boolean;
};

export function BookmarkActionsDialog({
  bookmark,
  visible,
  onClose,
  onChanged,
  showDetails = true,
}: BookmarkActionsDialogProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [mode, setMode] = useState<Mode>("actions");
  const [editTitle, setEditTitle] = useState("");
  const [editNote, setEditNote] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMode("actions");
      setError(null);
    }
  }, [bookmark?.id, visible]);

  if (!bookmark) {
    return null;
  }

  const closeAll = () => {
    setMode("actions");
    setError(null);
    onClose();
  };

  const startEdit = () => {
    setEditTitle(bookmark.title);
    setEditNote(bookmark.note ?? "");
    setError(null);
    setMode("edit");
  };

  const saveEdit = async () => {
    if (editTitle.trim().length === 0) {
      setError("A title is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateBookmarkContent(bookmark.id, {
        title: editTitle,
        note: editNote.trim() || null,
      });
      onChanged();
      closeAll();
    } catch {
      setError("Could not update this link.");
    } finally {
      setSaving(false);
    }
  };

  const openMove = async () => {
    setError(null);

    try {
      const loadedFolders = await getAllFolders();
      setFolders(loadedFolders);
      setMode("move");
    } catch {
      setError("Could not load your folders.");
    }
  };

  const applyMove = async (folderId: string | null) => {
    try {
      await moveBookmark(bookmark.id, folderId);
      onChanged();
      closeAll();
    } catch {
      setError("Could not move this link.");
    }
  };

  const copyLink = async () => {
    try {
      await Clipboard.setStringAsync(bookmark.originalUrl);
      closeAll();
      if (Platform.OS === "android" && Number(Platform.Version) < 33) {
        ToastAndroid.show("Link copied", ToastAndroid.SHORT);
      }
    } catch {
      Alert.alert("Could not copy the link", "Please try again.");
    }
  };

  const shareLink = async () => {
    try {
      await Share.share({ message: bookmark.originalUrl });
      closeAll();
    } catch {
      Alert.alert("Could not share the link", "Please try again.");
    }
  };

  const refreshPreview = async () => {
    setRefreshing(true);
    setError(null);

    try {
      await refreshBookmarkPreview(bookmark.id);
      onChanged();
      closeAll();
    } catch {
      setError("Could not refresh this preview.");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      await setBookmarkFavorite(bookmark.id, !bookmark.isFavorite);
      onChanged();
      closeAll();
    } catch {
      setError("Could not update favourites.");
    }
  };

  const removeBookmark = async () => {
    setSaving(true);
    setError(null);

    try {
      await deleteBookmarkWithAssets(bookmark.id);
      onChanged();
      closeAll();
    } catch {
      setError("Could not delete this link.");
    } finally {
      setSaving(false);
    }
  };

  const isActionsMode = mode === "actions";
  const dialogTitle =
    mode === "edit"
      ? "Edit link"
      : mode === "delete"
        ? "Delete this link?"
        : mode === "move"
          ? "Move to folder"
          : undefined;
  const dialogDescription =
    mode === "edit"
      ? "Update the title or note. The URL is never changed here."
      : mode === "delete"
        ? `“${bookmark.title}” will be removed from Paperclip. This cannot be undone.`
        : mode === "move"
          ? "Choose a destination. Uncategorized removes it from its folder."
          : undefined;

  return (
    <>
      <AppDialog
        visible={visible}
        onRequestClose={isActionsMode ? closeAll : () => setMode("actions")}
        title={dialogTitle}
        description={dialogDescription}
        actions={
          <>
            {isActionsMode ? (
              <>
                {showDetails ? (
                  <ActionRow
                    icon="information-outline"
                    label="View details"
                    onPress={() => {
                      closeAll();
                      router.push({
                        pathname: "/bookmarks/[bookmarkId]",
                        params: { bookmarkId: bookmark.id },
                      });
                    }}
                  />
                ) : null}
                <ActionRow
                  icon="pencil-outline"
                  label="Edit title & note"
                  onPress={startEdit}
                />
                <ActionRow
                  icon={bookmark.isFavorite ? "heart" : "heart-outline"}
                  label={
                    bookmark.isFavorite ? "Remove from favourites" : "Add to favourites"
                  }
                  onPress={() => {
                    void toggleFavorite();
                  }}
                />
                <ActionRow
                  icon="folder-move-outline"
                  label="Move to folder"
                  onPress={() => {
                    void openMove();
                  }}
                />
                <ActionRow
                  icon="content-copy"
                  label="Copy link"
                  onPress={() => {
                    void copyLink();
                  }}
                />
                <ActionRow
                  icon="share-variant"
                  label="Share link"
                  onPress={() => {
                    void shareLink();
                  }}
                />
                <ActionRow
                  icon="refresh"
                  label={refreshing ? "Refreshing preview…" : "Refresh preview"}
                  disabled={refreshing}
                  onPress={() => {
                    void refreshPreview();
                  }}
                />
                <ActionRow
                  icon="delete-outline"
                  label="Delete link"
                  destructive
                  onPress={() => {
                    setError(null);
                    setMode("delete");
                  }}
                />
                {error ? (
                  <AppText variant="bodySmall" color={theme.colors.error}>
                    {error}
                  </AppText>
                ) : null}
              </>
            ) : mode === "edit" ? (
              <>
                <Button
                  label="Save changes"
                  onPress={() => {
                    void saveEdit();
                  }}
                  loading={saving}
                  disabled={saving}
                />
                <Button
                  label="Cancel"
                  variant="text"
                  onPress={() => setMode("actions")}
                  disabled={saving}
                />
              </>
            ) : mode === "move" ? (
              <>
                <Button
                  label="Cancel"
                  variant="text"
                  onPress={() => setMode("actions")}
                />
                {error ? (
                  <AppText variant="bodySmall" color={theme.colors.error}>
                    {error}
                  </AppText>
                ) : null}
              </>
            ) : (
              <>
                <Button
                  label="Delete link"
                  variant="destructive"
                  onPress={() => {
                    void removeBookmark();
                  }}
                  loading={saving}
                  disabled={saving}
                />
                <Button
                  label="Cancel"
                  variant="text"
                  onPress={() => setMode("actions")}
                  disabled={saving}
                />
                {error ? (
                  <AppText variant="bodySmall" color={theme.colors.error}>
                    {error}
                  </AppText>
                ) : null}
              </>
            )}
          </>
        }
      >
        {mode === "edit" ? (
          <View style={styles.form}>
            <TextField
              label="Title"
              value={editTitle}
              onChangeText={(value) => {
                setEditTitle(value);
                if (error) {
                  setError(null);
                }
              }}
              maxLength={300}
              autoFocus
            />
            <TextField
              label="Note"
              value={editNote}
              onChangeText={setEditNote}
              multiline
            />
            {error ? (
              <AppText variant="bodySmall" color={theme.colors.error}>
                {error}
              </AppText>
            ) : null}
          </View>
        ) : mode === "move" ? (
          <FolderPickerContent
            folders={folders}
            selectedFolderId={bookmark.folderId}
            onSelect={(folderId) => {
              void applyMove(folderId);
            }}
          />
        ) : null}
      </AppDialog>
    </>
  );
}