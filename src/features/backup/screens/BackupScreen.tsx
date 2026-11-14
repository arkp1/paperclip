import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import {
  applyBackup,
  exportLibraryBackup,
  pickBackupFile,
  type BackupSummary,
  type PickedBackup,
} from "@/features/backup/services/backupService";
import { useReaderAudioInset } from "@/features/reader/audio/ReaderAudioProvider";
import { AppDialog } from "@/shared/ui/AppDialog";
import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { Screen } from "@/shared/ui/Screen";
import { TopAppBar } from "@/shared/ui/TopAppBar";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { styles } from "@/styles/features/backup/BackupScreen.styles";
import { useTheme } from "@/theme";

export function BackupScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const audioInset = useReaderAudioInset();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState<PickedBackup | null>(null);

  const handleExport = async () => {
    setBusy(true);
    setStatus(null);

    try {
      const summary = await exportLibraryBackup();
      setStatus(
        summary
          ? `Exported ${summary.bookmarks} links and ${summary.folders} folders.`
          : "Export cancelled."
      );
    } catch (error) {
      console.warn("Could not export the library.", error);
      setStatus("Could not create the backup file.");
    } finally {
      setBusy(false);
    }
  };

  const handlePickImport = async () => {
    setBusy(true);
    setStatus(null);

    try {
      const picked = await pickBackupFile();
      if (picked) {
        setPending(picked);
      }
    } catch (error) {
      console.warn("Could not read the backup file.", error);
      setStatus(
        error instanceof Error ? error.message : "This backup could not be read."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!pending) {
      return;
    }

    setBusy(true);
    try {
      const summary = await applyBackup(pending.document);
      setPending(null);
      setStatus(formatImportSummary(summary));
    } catch (error) {
      console.warn("Could not import the backup.", error);
      setStatus("Import failed. Your existing library was not replaced.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <TopAppBar
        title="Import & export"
        icon="database-outline"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: audioInset + 24 }]}
      >
        <View
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={30}
            color={theme.colors.onPrimaryContainer}
          />
          <AppText variant="titleMedium" color={theme.colors.onPrimaryContainer}>
            Public library only
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.onPrimaryContainer}>
            Locked folders and their links are excluded. A versioned JSON backup
            includes folders, links, notes, favourites, and cached preview
            images.
          </AppText>
        </View>

        <View style={styles.actions}>
          <Button
            label={busy ? "Working…" : "Export backup"}
            onPress={() => {
              void handleExport();
            }}
            loading={busy}
            disabled={busy}
          />
          <Button
            label="Import backup"
            variant="tonal"
            onPress={() => {
              void handlePickImport();
            }}
            disabled={busy}
          />
        </View>

        {status ? (
          <AppText variant="bodyMedium" color={theme.colors.onSurfaceVariant}>
            {status}
          </AppText>
        ) : null}

        <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
          Import merges by ID: existing links and folder-name conflicts are
          skipped, and new links without a matching folder go to Uncategorized.
          Your library is changed only after the whole file validates.
        </AppText>
      </ScrollView>

      <AppDialog
        visible={pending !== null}
        onRequestClose={() => setPending(null)}
        title="Import this backup?"
        description={
          pending
            ? `${pending.counts.bookmarks} links, ${pending.counts.folders} folders, and ${pending.counts.images} preview images will be merged.`
            : undefined
        }
        actions={
          <>
            <Button
              label="Import"
              onPress={() => {
                void handleConfirmImport();
              }}
              loading={busy}
              disabled={busy}
            />
            <Button
              label="Cancel"
              variant="text"
              onPress={() => setPending(null)}
              disabled={busy}
            />
          </>
        }
      />
    </Screen>
  );
}

function formatImportSummary(summary: BackupSummary): string {
  return `Imported ${summary.bookmarks} links, ${summary.folders} folders, and ${summary.images} preview images.`;
}
