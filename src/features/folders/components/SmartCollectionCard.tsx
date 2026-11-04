import { View } from "react-native";

import { AppText } from "@/shared/ui/AppText";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { MaterialCommunityIcons, type IconName } from "@/shared/ui/icons";
import { styles } from "@/styles/features/folders/SmartCollectionCard.styles";
import { useTheme } from "@/theme";

type SmartCollectionCardProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function SmartCollectionCard({
  icon,
  title,
  subtitle,
  onPress,
}: SmartCollectionCardProps) {
  const { theme } = useTheme();

  return (
    <ScalePressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}.`}
      onPress={onPress}
      scaleTo={0.985}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={theme.colors.onPrimaryContainer}
        />
      </View>

      <View style={styles.copy}>
        <AppText variant="titleSmall" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant} numberOfLines={2}>
          {subtitle}
        </AppText>
      </View>
    </ScalePressable>
  );
}

