import type { Folder } from "@/features/folders/types";
import type { MenuAnchor } from "@/shared/ui/MenuAnchor";
import { OverflowMenu } from "@/shared/ui/OverflowMenu";
import { ActionRow } from "@/shared/ui/ActionRow";

type FolderActionsDialogProps = {
  folder: Folder | null;
  visible: boolean;
  anchor: MenuAnchor | null;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onTogglePrivacy: () => void;
};

/**
 * Anchored folder overflow menu. The anchor is the measured page position of
 * the three-dot trigger so the scale origin follows the actual button.
 */
export function FolderActionsDialog({
  folder,
  visible,
  anchor,
  onClose,
  onRename,
  onDelete,
  onTogglePrivacy,
}: FolderActionsDialogProps) {
  return (
    <OverflowMenu
      visible={visible && folder !== null}
      anchor={anchor ?? { x: 24, y: 72 }}
      onClose={onClose}
    >
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
    </OverflowMenu>
  );
}
