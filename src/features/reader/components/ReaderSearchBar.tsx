import { TextInput, View } from "react-native";

import { IconButton } from "@/shared/ui/IconButton";
import { AppText } from "@/shared/ui/AppText";
import { styles } from "@/styles/features/reader/ReaderSearchBar.styles";
import { useTheme } from "@/theme";

type ReaderSearchBarProps = {
  visible: boolean;
  query: string;
  currentMatch: number;
  matchCount: number;
  onQueryChange: (query: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
};

/**
 * Compact in-reader search bar. It sits above the article instead of covering
 * it in a modal, so highlight jumps remain visible while typing.
 */
export function ReaderSearchBar({
  visible,
  query,
  currentMatch,
  matchCount,
  onQueryChange,
  onPrevious,
  onNext,
  onClose,
}: ReaderSearchBarProps) {
  const { theme } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surfaceContainerHigh,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder="Search in article"
        placeholderTextColor={theme.colors.onSurfaceVariant}
        autoFocus
        returnKeyType="search"
        onSubmitEditing={onNext}
        style={[styles.input, { color: theme.colors.onSurface }]}
        accessibilityLabel="Search in article"
      />
      <AppText variant="labelSmall" color={theme.colors.onSurfaceVariant}>
        {matchCount > 0 ? `${currentMatch + 1}/${matchCount}` : "0/0"}
      </AppText>
      <IconButton
        icon="chevron-up"
        label="Previous match"
        size={20}
        onPress={onPrevious}
        disabled={matchCount === 0}
      />
      <IconButton
        icon="chevron-down"
        label="Next match"
        size={20}
        onPress={onNext}
        disabled={matchCount === 0}
      />
      <IconButton
        icon="close"
        label="Close search"
        size={20}
        onPress={onClose}
      />
    </View>
  );
}
