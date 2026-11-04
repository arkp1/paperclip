import type { Folder } from "@/features/folders/types";
import { ActionRow } from "@/shared/ui/ActionRow";
import { AppDialog } from "@/shared/ui/AppDialog";

type FolderActionsDialogProps = {
  folder: Folder | null;
  visible: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onTogglePrivacy: () => void;
};

export function FolderActionsDialog({
  folder,
  visible,
  onClose,
  onRename,
  onDelete,
  onTogglePrivacy,
}: FolderActionsDialogProps) {
  return (
    <AppDialog
      visible={visible && folder !== null}
      onRequestClose={onClose}
      actions={
        <>
          <ActionRow
            icon={folder?.isPrivate ? "lock-open-outline" : "lock-outline"}
            label={folder?.isPrivate ? "Remove from private" : "Make private"}
            onPress={onTogglePrivacy}
          />
          <ActionRow icon="pencil-outline" label="Edit name & color" onPress={onRename} />
          <ActionRow
            icon="delete-outline"
            label="Delete folder"
            destructive
            onPress={onDelete}
          />
        </>
      }
    />
  );
}
