import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { TextFieldRef } from "@expo/ui/jetpack-compose";

import { IconButton } from "@/shared/ui/IconButton";
import { TextField } from "@/shared/ui/TextField";
import { styles } from "@/styles/shared/ui/SearchField.styles";

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * Native Material 3 search field. Focus is requested after the screen
 * transition so the Android keyboard opens reliably.
 */
export function SearchField({
  value,
  onChangeText,
  placeholder = "Search your library",
  autoFocus = false,
}: SearchFieldProps) {
  const [resetKey, setResetKey] = useState(0);
  const fieldRef = useRef<TextFieldRef>(null);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    const timer = setTimeout(() => {
      void fieldRef.current?.focus();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [autoFocus, resetKey]);

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <TextField
          key={`search-${resetKey}`}
          inputRef={fieldRef}
          label="Search"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
        />
      </View>

      {value.length > 0 ? (
        <IconButton
          icon="close"
          label="Clear search"
          onPress={() => {
            onChangeText("");
            setResetKey((current) => current + 1);
          }}
        />
      ) : null}
    </View>
  );
}
