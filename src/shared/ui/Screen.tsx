import type { PropsWithChildren } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

type ScreenProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Shared screen background and status-bar inset. Screens own their own
 * scrolling so lists can stay virtualized.
 */
export function Screen({ children, style }: ScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top },
        style,
      ]}
    >
      {children}
    </View>
  );
}
