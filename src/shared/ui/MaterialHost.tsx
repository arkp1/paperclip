import { Host } from "@expo/ui/jetpack-compose";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { useTheme } from "@/theme";

type MaterialHostProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  matchContents?: boolean | { vertical?: boolean; horizontal?: boolean };
};

/**
 * Single bridge to Jetpack Compose. Every native Material 3 control is hosted
 * here so the seed color and light/dark scheme always follow the Paperclip
 * theme instead of the device wallpaper.
 */
export function MaterialHost({ children, style, matchContents }: MaterialHostProps) {
  const { theme, dynamic } = useTheme();

  return (
    <Host
      colorScheme={theme.scheme}
      {...(dynamic ? {} : { seedColor: theme.colors.primary })}
      style={style}
      matchContents={matchContents}
    >
      {children}
    </Host>
  );
}
