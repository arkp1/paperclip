import { AppText } from "@/shared/ui/AppText";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { MaterialCommunityIcons, type IconName } from "@/shared/ui/icons";
import { styles } from "@/styles/shared/ui/ActionRow.styles";
import { useTheme } from "@/theme";

type ActionRowProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  selected?: boolean;
};

export function ActionRow({
  icon,
  label,
  onPress,
  destructive = false,
  disabled = false,
  selected = false,
}: ActionRowProps) {
  const { theme } = useTheme();
  const contentColor = destructive ? theme.colors.error : theme.colors.onSurface;

  return (
    <ScalePressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.99}
      style={[styles.row, disabled ? styles.disabled : null]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={disabled ? theme.colors.onSurfaceVariant : contentColor}
      />
      <AppText
        variant="bodyLarge"
        color={disabled ? theme.colors.onSurfaceVariant : contentColor}
        style={styles.label}
      >
        {label}
      </AppText>
      <MaterialCommunityIcons
        name={selected ? "check" : "chevron-right"}
        size={20}
        color={selected ? theme.colors.primary : theme.colors.onSurfaceVariant}
      />
    </ScalePressable>
  );
}
