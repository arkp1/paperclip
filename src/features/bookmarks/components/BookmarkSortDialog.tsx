import type { BookmarkSortMode } from "@/features/bookmarks/types";
import { ActionRow } from "@/shared/ui/ActionRow";
import { AppDialog } from "@/shared/ui/AppDialog";
import { Button } from "@/shared/ui/Button";

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
  onChange: (mode: BookmarkSortMode) => void;
  onClose: () => void;
};

export function BookmarkSortDialog({
  visible,
  sortMode,
  onChange,
  onClose,
}: BookmarkSortDialogProps) {
  return (
    <AppDialog
      visible={visible}
      onRequestClose={onClose}
      title="Sort bookmarks"
      description="Choose the order for this list."
      actions={<Button label="Done" variant="tonal" onPress={onClose} />}
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
    </AppDialog>
  );
}
