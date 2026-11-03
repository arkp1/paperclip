import { View } from "react-native";

import { AppText } from "@/shared/ui/AppText";
import { Button, type ButtonVariant } from "@/shared/ui/Button";
import { MaterialCommunityIcons, type IconName } from "@/shared/ui/icons";
import { styles } from "@/styles/shared/ui/EmptyState.styles";
import { useTheme } from "@/theme";

type EmptyStateProps = {
  icon: IconName;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
    variant?: ButtonVariant;
  };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <MaterialCommunityIcons
          name={icon}
          size={32}
          color={theme.colors.onPrimaryContainer}
        />
      </View>

      <View style={styles.copy}>
        <AppText variant="titleLarge" style={styles.centered} accessibilityRole="header">
          {title}
        </AppText>
        <AppText
          variant="bodyMedium"
          color={theme.colors.onSurfaceVariant}
          style={styles.centered}
        >
          {description}
        </AppText>
      </View>

      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant={action.variant ?? "tonal"}
        />
      ) : null}
    </View>
  );
}
