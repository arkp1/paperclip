import type { BookmarkSortMode } from "@/features/bookmarks/types";
import { ActionRow } from "@/shared/ui/ActionRow";
import type { MenuAnchor } from "@/shared/ui/MenuAnchor";
import { OverflowMenu } from "@/shared/ui/OverflowMenu";

const SORT_OPTIONS: {
  icon: "clock-outline" | "sort-alphabetical-ascending";
  label: string;
  mode: BookmarkSortMode;
}[] = [
  { mode: "recent", icon: "clock-outline", label: "Newest first" },
  { mode: "oldest", icon: "clock-outline", label: "Oldest first" },
  { mode: "title", icon: "sort-alphabetical-ascending", label: "Title A–Z" },
];

type BookmarkSortDialogProps = {
  visible: boolean;
  sortMode: BookmarkSortMode;
  anchor: MenuAnchor | null;
  onChange: (mode: BookmarkSortMode) => void;
  onClose: () => void;
};

/**
 * Anchored sort menu with the same Reanimated scale/fade motion as the
 * three-dot overflow menus.
 */
export function BookmarkSortDialog({
  visible,
  sortMode,
  anchor,
  onChange,
  onClose,
}: BookmarkSortDialogProps) {
  return (
    <OverflowMenu
      visible={visible}
      anchor={anchor ?? { x: 24, y: 72 }}
      onClose={onClose}
    >
      {SORT_OPTIONS.map((option) => (
        <ActionRow
          key={option.mode}
          icon={option.icon}
          label={option.label}
          selected={sortMode === option.mode}
          onPress={() => {
            onChange(option.mode);
            onClose();
          }}
        />
      ))}
    </OverflowMenu>
  );
}
