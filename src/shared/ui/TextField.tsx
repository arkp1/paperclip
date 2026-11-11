import type { Ref } from "react";
import {
  OutlinedTextField,
  Shape,
  Text,
  useNativeState,
  type TextFieldKeyboardType,
  type TextFieldRef,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";

import { MaterialHost } from "@/shared/ui/MaterialHost";
import { styles } from "@/styles/shared/ui/TextField.styles";
import { useTheme } from "@/theme";

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  autoFocus?: boolean;
  maxLength?: number;
  multiline?: boolean;
  editable?: boolean;
  keyboardType?: TextFieldKeyboardType;
  onSubmitEditing?: () => void;
  inputRef?: Ref<TextFieldRef>;
};

/**
 * Native Material 3 outlined text field. The native field owns its editing
 * buffer; remount it with a `key` when the initial value must change (for
 * example when a dialog reopens for a different folder).
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  autoFocus = false,
  maxLength,
  multiline = false,
  editable = true,
  keyboardType = "text",
  onSubmitEditing,
  inputRef,
}: TextFieldProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const state = useNativeState(value);
  const hasError = Boolean(error);

  return (
    <MaterialHost matchContents={{ vertical: true }} style={styles.host}>
      <OutlinedTextField
        ref={inputRef}
        value={state}
        onValueChange={onChangeText}
        autoFocus={autoFocus}
        enabled={editable}
        singleLine={!multiline}
        minLines={multiline ? 3 : undefined}
        maxLength={maxLength}
        isError={hasError}
        textStyle={{ fontFamily: "GoogleSansFlex-Regular" }}
        shape={Shape.RoundedCorner({
          cornerRadii: { topStart: 12, topEnd: 12, bottomStart: 12, bottomEnd: 12 },
        })}
        keyboardOptions={{
          imeAction: onSubmitEditing ? "done" : "default",
          keyboardType,
        }}
        keyboardActions={onSubmitEditing ? { onDone: () => onSubmitEditing() } : undefined}
        colors={{
          focusedTextColor: colors.onSurface,
          unfocusedTextColor: colors.onSurface,
          errorTextColor: colors.onSurface,
          focusedContainerColor: colors.surface,
          unfocusedContainerColor: colors.surface,
          errorContainerColor: colors.surface,
          disabledContainerColor: colors.surfaceContainer,
          cursorColor: colors.primary,
          errorCursorColor: colors.error,
          focusedIndicatorColor: colors.primary,
          unfocusedIndicatorColor: colors.outline,
          errorIndicatorColor: colors.error,
          focusedLabelColor: colors.primary,
          unfocusedLabelColor: colors.onSurfaceVariant,
          errorLabelColor: colors.error,
          focusedPlaceholderColor: colors.onSurfaceVariant,
          unfocusedPlaceholderColor: colors.onSurfaceVariant,
          focusedSupportingTextColor: colors.onSurfaceVariant,
          unfocusedSupportingTextColor: colors.onSurfaceVariant,
          errorSupportingTextColor: colors.error,
        }}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField.Label>
          <Text style={{ fontFamily: "GoogleSansFlex-Regular" }}>{label}</Text>
        </OutlinedTextField.Label>

        {placeholder ? (
          <OutlinedTextField.Placeholder>
            <Text style={{ fontFamily: "GoogleSansFlex-Regular" }}>{placeholder}</Text>
          </OutlinedTextField.Placeholder>
        ) : null}

        {error ? (
          <OutlinedTextField.SupportingText>
            <Text style={{ fontFamily: "GoogleSansFlex-Regular" }}>{error}</Text>
          </OutlinedTextField.SupportingText>
        ) : null}
      </OutlinedTextField>
    </MaterialHost>
  );
}


