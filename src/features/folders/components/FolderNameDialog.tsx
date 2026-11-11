import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { validateFolderName } from "@/features/folders/validation";
import { AppDialog } from "@/shared/ui/AppDialog";
import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { TextField } from "@/shared/ui/TextField";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/features/folders/FolderNameDialog.styles";
import {
  defaultFolderColorKey,
  folderColors,
  type FolderColorKey,
  useTheme,
} from "@/theme";

type FolderNameDialogProps = {
  visible: boolean;
  title: string;
  description?: string;
  initialValue?: string;
  initialColorKey?: FolderColorKey | null;
  confirmLabel: string;
  onClose: () => void;
  /** Resolves to an error message, or null when the folder was saved. */
  onSubmit: (name: string, colorKey: FolderColorKey) => Promise<string | null>;
};

const COLOR_KEYS = Object.keys(folderColors) as FolderColorKey[];

export function FolderNameDialog({
  visible,
  title,
  description,
  initialValue = "",
  initialColorKey,
  confirmLabel,
  onClose,
  onSubmit,
}: FolderNameDialogProps) {
  const { theme } = useTheme();
  const [name, setName] = useState(initialValue);
  const [colorKey, setColorKey] = useState<FolderColorKey>(
    initialColorKey ?? defaultFolderColorKey
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const wasVisible = useRef(false);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      setName(initialValue);
      setColorKey(initialColorKey ?? defaultFolderColorKey);
      setError(null);
      setSubmitting(false);
    }
    wasVisible.current = visible;
  }, [initialColorKey, initialValue, visible]);

  const handleConfirm = async () => {
    if (submitting) {
      return;
    }

    const validation = validateFolderName(name);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const message = await onSubmit(validation.name, colorKey);
      if (message) {
        setError(message);
      } else {
        onClose();
      }
    } catch {
      setError("Something went wrong while saving the folder.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppDialog
      visible={visible}
      onRequestClose={() => {
        if (!submitting) {
          onClose();
        }
      }}
      title={title}
      description={description}
      actions={
        <>
          <Button
            label={confirmLabel}
            onPress={() => {
              void handleConfirm();
            }}
            loading={submitting}
            disabled={submitting}
          />
          <Button label="Cancel" variant="text" onPress={onClose} disabled={submitting} />
        </>
      }
    >
      <View>
        <TextField
          key={visible ? `folder-name-${initialValue}` : "folder-name-closed"}
          label="Folder name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (error) {
              setError(null);
            }
          }}
          placeholder="For example, Reading list"
          autoFocus
          maxLength={40}
          error={error}
          editable={!submitting}
          onSubmitEditing={() => {
            void handleConfirm();
          }}
        />

        <View style={styles.colorSection}>
          <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
            Folder color
          </AppText>
          <View style={styles.colorRow}>
            {COLOR_KEYS.map((key) => {
              const selected = colorKey === key;
              return (
                <ScalePressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityLabel={`${key} folder color`}
                  accessibilityState={{ checked: selected }}
                  onPress={() => setColorKey(key)}
                  scaleTo={0.9}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: folderColors[key].background,
                      borderColor: selected ? theme.colors.onSurface : "transparent",
                    },
                  ]}
                >
                  {selected ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={19}
                      color={folderColors[key].foreground}
                    />
                  ) : null}
                </ScalePressable>
              );
            })}
          </View>
        </View>
      </View>
    </AppDialog>
  );
}
