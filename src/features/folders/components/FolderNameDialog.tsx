import { useEffect, useState } from "react";
import { View } from "react-native";

import { validateFolderName } from "@/features/folders/validation";
import { AppDialog } from "@/shared/ui/AppDialog";
import { Button } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/TextField";

type FolderNameDialogProps = {
  visible: boolean;
  title: string;
  description?: string;
  initialValue?: string;
  confirmLabel: string;
  onClose: () => void;
  /** Resolves to an error message, or null when the folder was saved. */
  onSubmit: (name: string) => Promise<string | null>;
};

export function FolderNameDialog({
  visible,
  title,
  description,
  initialValue = "",
  confirmLabel,
  onClose,
  onSubmit,
}: FolderNameDialogProps) {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialValue);
      setError(null);
      setSubmitting(false);
    }
  }, [initialValue, visible]);

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
      const message = await onSubmit(validation.name);
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
      </View>
    </AppDialog>
  );
}
