import { ScrollView, View } from "react-native";

import type { Folder } from "@/features/folders/types";
import { AppDialog } from "@/shared/ui/AppDialog";
import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/features/folders/FolderPickerDialog.styles";
import {
  folderColors,
  pickFolderColorKey,
  useTheme,
} from "@/theme";

type FolderPickerDialogProps = {
  visible: boolean;
  folders: Folder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onClose: () => void;
};

export function FolderPickerDialog({
  visible,
  folders,
  selectedFolderId,
  onSelect,
  onClose,
}: FolderPickerDialogProps) {
  const { theme } = useTheme();

  const choose = (folderId: string | null) => {
    onSelect(folderId);
    onClose();
  };

  return (
    <AppDialog
      visible={visible}
      onRequestClose={onClose}
      title="Save to folder"
      description="Choose where this link should live. Uncategorized is the default."
      actions={<Button label="Done" variant="tonal" onPress={onClose} />}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <FolderRow
          title="Uncategorized"
          subtitle="No folder"
          tint={folderColors.butter}
          selected={selectedFolderId === null}
          onPress={() => choose(null)}
        />

        {folders.map((folder) => {
          const tint = folderColors[folder.colorKey ?? pickFolderColorKey(folder.id)];
          const isLocked = folder.isPrivate;

          return (
            <FolderRow
              key={folder.id}
              title={folder.name}
              subtitle={
                isLocked
                  ? "Locked private folder"
                  : `${folder.bookmarkCount ?? 0} saved`
              }
              tint={tint}
              selected={selectedFolderId === folder.id}
              disabled={isLocked}
              onPress={() => {
                if (!isLocked) {
                  choose(folder.id);
                }
              }}
            />
          );
        })}
      </ScrollView>
    </AppDialog>
  );
}

type FolderRowProps = {
  title: string;
  subtitle: string;
  tint: { background: string; foreground: string };
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function FolderRow({
  title,
  subtitle,
  tint,
  selected,
  disabled = false,
  onPress,
}: FolderRowProps) {
  const { theme } = useTheme();

  return (
    <ScalePressable
      accessibilityRole="radio"
      accessibilityLabel={`${title}. ${subtitle}.`}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.99}
      style={[
        styles.row,
        {
          borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
          backgroundColor: selected
            ? theme.colors.primaryContainer
            : theme.colors.surfaceContainerLowest,
        },
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: tint.background }]}>
        <MaterialCommunityIcons name="folder" size={20} color={tint.foreground} />
      </View>

      <View style={styles.copy}>
        <AppText variant="titleSmall">{title}</AppText>
        <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
          {subtitle}
        </AppText>
      </View>

      <MaterialCommunityIcons
        name={disabled ? "lock-outline" : selected ? "radiobox-marked" : "radiobox-blank"}
        size={22}
        color={selected ? theme.colors.primary : theme.colors.onSurfaceVariant}
      />
    </ScalePressable>
  );
}

