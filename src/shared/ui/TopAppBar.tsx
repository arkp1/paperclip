import type { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@/shared/ui/AppText";
import { IconButton } from "@/shared/ui/IconButton";
import { MaterialCommunityIcons, type IconName } from "@/shared/ui/icons";
import { styles } from "@/styles/shared/ui/TopAppBar.styles";
import { useTheme } from "@/theme";

type TopAppBarProps = {
  title: string;
  icon?: IconName;
  onBack?: () => void;
  actions?: ReactNode;
  foregroundColor?: string;
};

export function TopAppBar({ title, icon, onBack, actions, foregroundColor }: TopAppBarProps) {
  const { theme } = useTheme();
  const foreground = foregroundColor ?? theme.colors.onSurface;

  return (
    <View style={styles.container}>
      {onBack ? (
        <IconButton icon="arrow-left" label="Go back" onPress={onBack} color={foreground} />
      ) : null}

      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={foregroundColor ?? theme.colors.onSurfaceVariant}
          style={styles.titleIcon}
        />
      ) : null}

      <AppText
        variant="headlineSmall"
        numberOfLines={1}
        style={styles.title}
        color={foreground}
        accessibilityRole="header"
      >
        {title}
      </AppText>

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}
