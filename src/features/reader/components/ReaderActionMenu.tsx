import { ActionRow } from "@/shared/ui/ActionRow";
import type { MenuAnchor } from "@/shared/ui/MenuAnchor";
import { OverflowMenu } from "@/shared/ui/OverflowMenu";

type ReaderActionMenuProps = {
  visible: boolean;
  anchor: MenuAnchor | null;
  completed: boolean;
  onClose: () => void;
  onDelete: () => void;
  onOpenBrowser: () => void;
  onShare: () => void;
  onMove: () => void;
  onSearch: () => void;
  onAnnotate: () => void;
  onToggleCompleted: () => void;
  onJumpToTop: () => void;
};

/**
 * Reader overflow menu, anchored beneath the top-right three-dot trigger.
 */
export function ReaderActionMenu({
  visible,
  anchor,
  completed,
  onClose,
  onDelete,
  onOpenBrowser,
  onShare,
  onMove,
  onSearch,
  onAnnotate,
  onToggleCompleted,
  onJumpToTop,
}: ReaderActionMenuProps) {
  const run = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <OverflowMenu
      visible={visible}
      anchor={anchor ?? { x: 24, y: 72 }}
      onClose={onClose}
    >
      <ActionRow icon="magnify" label="Search in article" onPress={() => run(onSearch)} />
      <ActionRow icon="format-color-fill" label="Highlight paragraph" onPress={() => run(onAnnotate)} />
      <ActionRow icon="arrow-up" label="Jump to top" onPress={() => run(onJumpToTop)} />
      <ActionRow
        icon={completed ? "check-circle-outline" : "check-circle"}
        label={completed ? "Mark as unread" : "Mark as finished"}
        onPress={() => run(onToggleCompleted)}
      />
      <ActionRow icon="folder-move-outline" label="Move to folder" onPress={() => run(onMove)} />
      <ActionRow icon="open-in-new" label="Open in browser" onPress={() => run(onOpenBrowser)} />
      <ActionRow icon="share-variant" label="Share" onPress={() => run(onShare)} />
      <ActionRow icon="delete-outline" label="Delete" destructive onPress={() => run(onDelete)} />
    </OverflowMenu>
  );
}
