import { useEffect, useState } from "react";
import { View } from "react-native";

import {
  highlightTints,
  type HighlightColor,
} from "@/features/reader/services/annotationService";
import { AppDialog } from "@/shared/ui/AppDialog";
import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { TextField } from "@/shared/ui/TextField";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/features/reader/ReaderAnnotationSheet.styles";
import { useTheme } from "@/theme";

type ReaderAnnotationSheetProps = {
  visible: boolean;
  initialColor: HighlightColor;
  initialNote: string;
  canDelete: boolean;
  onClose: () => void;
  onDelete: () => void;
  onSave: (color: HighlightColor, note: string) => void;
};

const COLORS = Object.keys(highlightTints) as HighlightColor[];

/**
 * Paragraph-level highlight + note editor.
 */
export function ReaderAnnotationSheet({
  visible,
  initialColor,
  initialNote,
  canDelete,
  onClose,
  onDelete,
  onSave,
}: ReaderAnnotationSheetProps) {
  const { theme } = useTheme();
  const [color, setColor] = useState<HighlightColor>(initialColor);
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (visible) {
      setColor(initialColor);
      setNote(initialNote);
    }
  }, [initialColor, initialNote, visible]);

  return (
    <AppDialog
      visible={visible}
      onRequestClose={onClose}
      title="Highlight paragraph"
      description="Save a colour and an optional note."
      actions={
        <>
          <Button label="Save" onPress={() => onSave(color, note.trim())} />
          {canDelete ? (
            <Button
              label="Remove highlight"
              variant="text"
              onPress={onDelete}
            />
          ) : null}
          <Button label="Cancel" variant="text" onPress={onClose} />
        </>
      }
    >
      <View style={styles.content}>
        <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
          Highlight colour
        </AppText>
        <View style={styles.colourRow}>
          {COLORS.map((key) => {
            const selected = color === key;
            return (
              <ScalePressable
                key={key}
                accessibilityRole="radio"
                accessibilityLabel={`${key} highlight`}
                accessibilityState={{ checked: selected }}
                onPress={() => setColor(key)}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: highlightTints[key].background,
                    borderColor: selected
                      ? theme.colors.onSurface
                      : "transparent",
                  },
                ]}
              >
                {selected ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={highlightTints[key].border}
                  />
                ) : null}
              </ScalePressable>
            );
          })}
        </View>

        <TextField
          label="Note"
          value={note}
          onChangeText={setNote}
          placeholder="Why does this matter?"
          multiline
          maxLength={500}
        />
      </View>
    </AppDialog>
  );
}
