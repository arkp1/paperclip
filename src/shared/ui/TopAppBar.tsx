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
};

export function TopAppBar({ title, icon, onBack, actions }: TopAppBarProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {onBack ? (
        <IconButton icon="arrow-left" label="Go back" onPress={onBack} color={theme.colors.onSurface} />
      ) : null}

      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={theme.colors.onSurfaceVariant}
          style={styles.titleIcon}
        />
      ) : null}

      <AppText
        variant="headlineSmall"
        numberOfLines={1}
        style={styles.title}
        accessibilityRole="header"
      >
        {title}
      </AppText>

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}
