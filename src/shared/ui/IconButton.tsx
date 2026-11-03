import { ScalePressable } from "@/shared/ui/ScalePressable";
import { MaterialCommunityIcons, type IconName } from "@/shared/ui/icons";
import { styles } from "@/styles/shared/ui/IconButton.styles";
import { useTheme } from "@/theme";

type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
  withBackground?: boolean;
};

export function IconButton({
  icon,
  label,
  onPress,
  color,
  size = 24,
  disabled = false,
  withBackground = false,
}: IconButtonProps) {
  const { theme } = useTheme();

  return (
    <ScalePressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      scaleTo={0.9}
      style={[
        styles.container,
        withBackground ? { backgroundColor: theme.colors.surfaceContainerLow } : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={size}
        color={color ?? theme.colors.onSurfaceVariant}
      />
    </ScalePressable>
  );
}
