import { LoadingIndicator } from "@expo/ui/jetpack-compose";
import { View } from "react-native";

import { AppText } from "@/shared/ui/AppText";
import { MaterialHost } from "@/shared/ui/MaterialHost";
import { styles } from "@/styles/shared/ui/LoadingState.styles";
import { useTheme } from "@/theme";

type LoadingStateProps = {
  message?: string;
  compact?: boolean;
};

export function LoadingState({ message = "Loading…", compact = false }: LoadingStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, compact ? styles.compact : styles.full]}>
      <MaterialHost matchContents>
        <LoadingIndicator color={theme.colors.primary} />
      </MaterialHost>
      <AppText variant="bodyMedium" color={theme.colors.onSurfaceVariant}>
        {message}
      </AppText>
    </View>
  );
}
