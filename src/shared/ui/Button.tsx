import {
  Button as FilledButton,
  FilledTonalButton,
  OutlinedButton,
  Shape,
  Text,
  TextButton,
} from "@expo/ui/jetpack-compose";
import { fillMaxSize } from "@expo/ui/jetpack-compose/modifiers";

import { MaterialHost } from "@/shared/ui/MaterialHost";
import { styles } from "@/styles/shared/ui/Button.styles";
import { useTheme } from "@/theme";
import type { ColorScheme } from "@/theme/colors";

export type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "destructive";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

const buttonByVariant = {
  filled: FilledButton,
  tonal: FilledTonalButton,
  outlined: OutlinedButton,
  text: TextButton,
  destructive: FilledButton,
} as const;

function getButtonColors(
  variant: ButtonVariant,
  inactive: boolean,
  colors: ColorScheme
) {
  const disabledContainer = colors.surfaceContainer;
  const disabledContent = colors.onSurfaceVariant;

  if (inactive) {
    return {
      containerColor: variant === "outlined" || variant === "text" ? "transparent" : disabledContainer,
      contentColor: disabledContent,
      disabledContainerColor: disabledContainer,
      disabledContentColor: disabledContent,
    };
  }

  switch (variant) {
    case "filled":
      return {
        containerColor: colors.primary,
        contentColor: colors.onPrimary,
        disabledContainerColor: disabledContainer,
        disabledContentColor: disabledContent,
      };
    case "tonal":
      return {
        containerColor: colors.primaryContainer,
        contentColor: colors.onPrimaryContainer,
        disabledContainerColor: disabledContainer,
        disabledContentColor: disabledContent,
      };
    case "outlined":
      return {
        containerColor: "transparent",
        contentColor: colors.onSurface,
        disabledContainerColor: "transparent",
        disabledContentColor: disabledContent,
      };
    case "text":
      return {
        containerColor: "transparent",
        contentColor: colors.primary,
        disabledContainerColor: "transparent",
        disabledContentColor: disabledContent,
      };
    case "destructive":
      return {
        containerColor: colors.error,
        contentColor: colors.onError,
        disabledContainerColor: disabledContainer,
        disabledContentColor: disabledContent,
      };
  }
}

/**
 * Native Material 3 button. Paperclip uses the pill shape from the design
 * system for every prominent action.
 */
export function Button({
  label,
  onPress,
  variant = "filled",
  disabled = false,
  loading = false,
}: ButtonProps) {
  const { theme } = useTheme();
  const Component = buttonByVariant[variant];
  const isInactive = disabled || loading;
  const colors = getButtonColors(variant, isInactive, theme.colors);

  return (
    <MaterialHost style={styles.host}>
      <Component
        onClick={onPress}
        enabled={!isInactive}
        colors={colors}
        shape={Shape.Pill({})}
        modifiers={[fillMaxSize()]}
      >
        <Text>{loading ? `${label}…` : label}</Text>
      </Component>
    </MaterialHost>
  );
}
