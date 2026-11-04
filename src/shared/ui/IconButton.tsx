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
  inkColor?: string;
};

export function IconButton({
  icon,
  label,
  onPress,
  color,
  size = 24,
  disabled = false,
  withBackground = false,
  inkColor,
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
      scaleTo={0.94}
      inkColor={inkColor}
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
