import { View } from "react-native";

import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/shared/ui/ErrorState.styles";
import { useTheme } from "@/theme";

type ErrorStateProps = {
  message: string;
  title?: string;
  onRetry?: () => void;
  compact?: boolean;
};

export function ErrorState({
  message,
  title = "Something went wrong",
  onRetry,
  compact = false,
}: ErrorStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, compact ? styles.compact : styles.full]}>
      <View
        style={[styles.iconCircle, { backgroundColor: theme.colors.errorContainer }]}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={30}
          color={theme.colors.onErrorContainer}
        />
      </View>

      <View style={styles.copy}>
        <AppText variant="titleMedium" style={styles.centered} accessibilityRole="header">
          {title}
        </AppText>
        <AppText
          variant="bodyMedium"
          color={theme.colors.onSurfaceVariant}
          style={styles.centered}
        >
          {message}
        </AppText>
      </View>

      {onRetry ? (
        <Button label="Try again" variant="tonal" onPress={onRetry} />
      ) : null}
    </View>
  );
}
