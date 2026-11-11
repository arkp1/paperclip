import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

import { typography, useTheme, type TypographyVariant } from "@/theme";

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
};

export function AppText({
  variant = "bodyMedium",
  color,
  style,
  ...rest
}: AppTextProps) {
  const { theme } = useTheme();
  const resolved = StyleSheet.flatten([
    typography[variant],
    style,
  ]) as TextStyle | undefined;
  const fontFamily = resolved?.fontFamily ?? "GoogleSansFlex-Regular";

  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { fontFamily },
        { color: color ?? theme.colors.onSurface },
        style,
      ]}
    />
  );
}


