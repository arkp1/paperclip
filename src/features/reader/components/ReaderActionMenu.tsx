import { ActionRow } from "@/shared/ui/ActionRow";
import type { MenuAnchor } from "@/shared/ui/MenuAnchor";
import { OverflowMenu } from "@/shared/ui/OverflowMenu";

type ReaderActionMenuProps = {
  visible: boolean;
  anchor: MenuAnchor | null;
  onClose: () => void;
  onDelete: () => void;
  onOpenBrowser: () => void;
  onShare: () => void;
  onMove: () => void;
};

/**
 * Reader overflow menu, anchored beneath the top-right three-dot trigger.
 */
export function ReaderActionMenu({
  visible,
  anchor,
  onClose,
  onDelete,
  onOpenBrowser,
  onShare,
  onMove,
}: ReaderActionMenuProps) {
  return (
    <OverflowMenu
      visible={visible}
      anchor={anchor ?? { x: 24, y: 72 }}
      onClose={onClose}
    >
      <ActionRow icon="folder-move-outline" label="Move to folder" onPress={onMove} />
      <ActionRow icon="open-in-new" label="Open in browser" onPress={onOpenBrowser} />
      <ActionRow icon="share-variant" label="Share" onPress={onShare} />
      <ActionRow icon="delete-outline" label="Delete" destructive onPress={onDelete} />
    </OverflowMenu>
  );
}
