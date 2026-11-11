import { memo } from "react";
import { View } from "react-native";

import type { Folder } from "@/features/folders/types";
import { AppText } from "@/shared/ui/AppText";
import { IconButton } from "@/shared/ui/IconButton";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import type { MenuAnchor } from "@/shared/ui/MenuAnchor";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/features/folders/FolderCard.styles";
import { folderColors, pickFolderColorKey, useTheme } from "@/theme";

type FolderCardProps = {
  folder: Folder;
  onPress: (folder: Folder) => void;
  onMore?: (folder: Folder, anchor: MenuAnchor) => void;
};

function FolderCardComponent({ folder, onPress, onMore }: FolderCardProps) {
  const { theme } = useTheme();
  const tint = folderColors[folder.colorKey ?? pickFolderColorKey(folder.id)];
  const countLabel = `${folder.bookmarkCount ?? 0} saved`;

  return (
    <ScalePressable
      accessibilityRole="button"
      accessibilityLabel={`${folder.name}. ${countLabel}.`}
      accessibilityHint="Opens this folder"
      onPress={() => onPress(folder)}
      scaleTo={0.985}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: tint.background }]}>
        <MaterialCommunityIcons
          name="folder"
          size={22}
          color={tint.foreground}
        />
      </View>

      <View style={styles.copy}>
        <AppText variant="titleSmall" numberOfLines={1}>
          {folder.name}
        </AppText>
        <View style={styles.metaRow}>
          <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            {countLabel}
          </AppText>
        </View>
      </View>

      {onMore ? (
        <IconButton
          icon="dots-vertical"
          label={`More actions for ${folder.name}`}
          onPress={(event) =>
            onMore(folder, {
              x: event.nativeEvent.pageX,
              y: event.nativeEvent.pageY,
            })
          }
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      ) : null}
    </ScalePressable>
  );
}

/**
 * Folder data changes are infrequent, so memoizing the card keeps list rows
 * from re-rendering when dialogs or other screen state change.
 */
export const FolderCard = memo(FolderCardComponent);
