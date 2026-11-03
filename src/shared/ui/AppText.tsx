import { Text, type TextProps } from "react-native";

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

  return (
    <Text
      {...rest}
      style={[typography[variant], { color: color ?? theme.colors.onSurface }, style]}
    />
  );
}
