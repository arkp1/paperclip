import { useEffect } from "react";
import { BackHandler, Pressable, View } from "react-native";

import { ActionRow } from "@/shared/ui/ActionRow";
import { styles } from "@/styles/features/reader/ReaderActionMenu.styles";
import { useTheme } from "@/theme";

type ReaderActionMenuProps = {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onOpenBrowser: () => void;
  onShare: () => void;
  onMove: () => void;
};

export function ReaderActionMenu({
  visible,
  onClose,
  onDelete,
  onOpenBrowser,
  onShare,
  onMove,
}: ReaderActionMenuProps) {
  const { theme } = useTheme();

  useEffect(() => {
    if (!visible) {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });

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
        accessibilityLabel="Close reading menu"
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
        <ActionRow icon="folder-move-outline" label="Move to folder" onPress={onMove} />
        <ActionRow icon="open-in-new" label="Open in browser" onPress={onOpenBrowser} />
        <ActionRow icon="share-variant" label="Share" onPress={onShare} />
        <ActionRow icon="delete-outline" label="Delete" destructive onPress={onDelete} />
      </View>
    </View>
  );
}
