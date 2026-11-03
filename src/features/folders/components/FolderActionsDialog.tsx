import type { Folder } from "@/features/folders/types";
import { ActionRow } from "@/shared/ui/ActionRow";
import { AppDialog } from "@/shared/ui/AppDialog";

type FolderActionsDialogProps = {
  folder: Folder | null;
  visible: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
};

export function FolderActionsDialog({
  folder,
  visible,
  onClose,
  onRename,
  onDelete,
}: FolderActionsDialogProps) {
  return (
    <AppDialog
      visible={visible && folder !== null}
      onRequestClose={onClose}
      actions={
        <>
          <ActionRow icon="pencil-outline" label="Rename folder" onPress={onRename} />
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
