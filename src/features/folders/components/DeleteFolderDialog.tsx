import { useState } from "react";
import { View } from "react-native";

import { describeFolderError } from "@/features/folders/errors";
import type { Folder, FolderDeleteStrategy } from "@/features/folders/types";
import { AppDialog } from "@/shared/ui/AppDialog";
import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { styles } from "@/styles/features/folders/DeleteFolderDialog.styles";
import { useTheme } from "@/theme";

type DeleteFolderDialogProps = {
  folder: Folder | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (strategy: FolderDeleteStrategy) => Promise<void>;
};

export function DeleteFolderDialog({
  folder,
  visible,
  onClose,
  onConfirm,
}: DeleteFolderDialogProps) {
  const { theme } = useTheme();
  const [pendingStrategy, setPendingStrategy] = useState<FolderDeleteStrategy | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!folder) {
    return null;
  }

  const hasBookmarks = folder.bookmarkCount === null || folder.bookmarkCount > 0;

  const run = async (strategy: FolderDeleteStrategy) => {
    setPendingStrategy(strategy);
    setError(null);

    try {
      await onConfirm(strategy);
      onClose();
    } catch (confirmError) {
      setError(describeFolderError(confirmError));
    } finally {
      setPendingStrategy(null);
    }
  };

  return (
    <AppDialog
      visible={visible}
      onRequestClose={() => {
        if (!pendingStrategy) {
          onClose();
        }
      }}
      title={`Delete “${folder.name}”?`}
      description={
        hasBookmarks
          ? "Choose what happens to the links in this folder. Nothing is deleted until you confirm."
          : "This folder is empty. Deleting it cannot be undone."
      }
      actions={
        <>
          {hasBookmarks ? (
            <>
              <View style={styles.option}>
                <Button
                  label="Move links to Uncategorized"
                  variant="tonal"
                  onPress={() => {
                    void run("keepBookmarks");
                  }}
                  loading={pendingStrategy === "keepBookmarks"}
                  disabled={pendingStrategy !== null}
                />
                <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
                  Recommended — every saved link is kept.
                </AppText>
              </View>

              <View style={styles.option}>
                <Button
                  label="Delete folder and its links"
                  variant="destructive"
                  onPress={() => {
                    void run("deleteBookmarks");
                  }}
                  loading={pendingStrategy === "deleteBookmarks"}
                  disabled={pendingStrategy !== null}
                />
                <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
                  This permanently deletes the folder's saved links.
                </AppText>
              </View>
            </>
          ) : (
            <Button
              label="Delete folder"
              variant="destructive"
              onPress={() => {
                void run("keepBookmarks");
              }}
              loading={pendingStrategy === "keepBookmarks"}
              disabled={pendingStrategy !== null}
            />
          )}

          {error ? (
            <AppText variant="bodySmall" color={theme.colors.error} accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}

          <Button
            label="Cancel"
            variant="text"
            onPress={onClose}
            disabled={pendingStrategy !== null}
          />
        </>
      }
    />
  );
}

