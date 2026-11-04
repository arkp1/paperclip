import { useEffect } from "react";
import { BackHandler, Pressable, View } from "react-native";

import type { BookmarkSortMode } from "@/features/bookmarks/types";
import { ActionRow } from "@/shared/ui/ActionRow";
import { styles } from "@/styles/features/bookmarks/BookmarkSortMenu.styles";
import { useTheme } from "@/theme";

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

/**
 * In-screen sort menu. Avoiding a native Modal here removes the white-window
 * flash that occurred when opening sort from the app bar.
 */
export function BookmarkSortDialog({
  visible,
  sortMode,
  onChange,
  onClose,
}: BookmarkSortDialogProps) {
  const { theme } = useTheme();

  useEffect(() => {
    if (!visible) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onClose();
        return true;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [onClose, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.scrim }]}
        onPress={onClose}
        accessibilityLabel="Close sort menu"
      />
      <View
        style={[
          styles.menu,
          {
            backgroundColor: theme.colors.surfaceContainerLowest,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
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
      </View>
    </View>
  );
}
