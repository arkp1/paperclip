import { useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  createBookmark,
  findBookmarkByUrl,
} from "@/features/bookmarks/data/bookmarkRepository";
import { enrichBookmarkPreview } from "@/features/bookmarks/services/previewService";
import type { Bookmark, PreviewStatus } from "@/features/bookmarks/types";
import { FolderPickerDialog } from "@/features/folders/components/FolderPickerDialog";
import { useFolders } from "@/features/folders/hooks/useFolders";
import {
  fetchLinkMetadata,
  type LinkMetadata,
} from "@/features/save-link/services/metadataService";
import { AppDialog } from "@/shared/ui/AppDialog";
import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import { ScalePressable } from "@/shared/ui/ScalePressable";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { Screen } from "@/shared/ui/Screen";
import { TextField } from "@/shared/ui/TextField";
import { validateHttpUrl } from "@/shared/utils/url";
import {
  previewImageStyle,
  styles,
} from "@/styles/features/save-link/SaveLinkScreen.styles";
import {
  folderColors,
  pickFolderColorKey,
  spacing,
  useTheme,
} from "@/theme";

export function SaveLinkScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { folders } = useFolders();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [folderPickerVisible, setFolderPickerVisible] = useState(false);
  const [duplicate, setDuplicate] = useState<Bookmark | null>(null);
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [metadataStatus, setMetadataStatus] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >("idle");
  const [titleVersion, setTitleVersion] = useState(0);
  const titleEditedRef = useRef(false);

  useEffect(() => {
    const validation = validateHttpUrl(url);

    if (!validation.valid) {
      setMetadata(null);
      setMetadataStatus("idle");
      if (!titleEditedRef.current) {
        setTitle("");
        setTitleVersion((version) => version + 1);
      }
      return;
    }

    let cancelled = false;
    setMetadataStatus("loading");

    if (!titleEditedRef.current) {
      setTitle("");
      setTitleVersion((version) => version + 1);
    }

    const timer = setTimeout(() => {
      void fetchLinkMetadata(validation.url)
        .then((result) => {
          if (cancelled) {
            return;
          }

          setMetadata(result);
          setMetadataStatus("ready");

          if (!titleEditedRef.current) {
            setTitle(result.title ?? validation.domain);
            setTitleVersion((version) => version + 1);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setMetadata(null);
            setMetadataStatus("unavailable");
          }
        });
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url]);

  const parsedUrl = validateHttpUrl(url);
  const previewDomain = parsedUrl.valid ? parsedUrl.domain : null;
  const previewTitle = title.trim() || previewDomain || "Your saved link";
  const previewTint = folderColors[pickFolderColorKey(previewDomain ?? url)];
  const selectedFolder = folders.find((folder) => folder.id === folderId);
  const folderLabel = selectedFolder?.name ?? "Uncategorized";
  const metadataMessage =
    metadataStatus === "loading"
      ? "Fetching preview…"
      : metadataStatus === "ready"
        ? "Preview found · title and description saved"
        : metadataStatus === "unavailable"
          ? "Preview unavailable · you can still save the link"
          : "Preview pending";

  const performSave = async (allowDuplicate: boolean) => {
    const validation = validateHttpUrl(url);
    if (!validation.valid) {
      setUrlError(validation.message);
      return;
    }

    setUrlError(null);
    setSaveError(null);
    setSaving(true);

    try {
      if (!allowDuplicate) {
        const existing = await findBookmarkByUrl(validation.url);
        if (existing) {
          setDuplicate(existing);
          return;
        }
      }

      const saved = await createBookmark({
        originalUrl: validation.url,
        canonicalUrl: metadata?.canonicalUrl ?? null,
        title: title.trim() || validation.domain,
        titleIsUserEdited: title.trim().length > 0,
        description: metadata?.description ?? null,
        note: note.trim() || null,
        folderId,
        sourceName: metadata?.siteName ?? validation.domain,
        domain: validation.domain,
        previewStatus: previewStatusFor(metadataStatus, metadata),
      });

      await enrichBookmarkPreview(saved.id, metadata?.imageUrl ?? null);

      if (folderId) {
        router.replace({
          pathname: "/folders/[folderId]",
          params: { folderId },
        });
      } else {
        router.replace("/bookmarks/uncategorized");
      }
    } catch (error) {
      console.warn("Could not save the link.", error);
      setSaveError("Could not save this link. Your library was not changed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <IconButton icon="close" label="Cancel" onPress={() => router.back()} />
        <MaterialCommunityIcons
          name="link-variant"
          size={22}
          color={theme.colors.onSurfaceVariant}
        />
        <AppText variant="headlineMedium" accessibilityRole="header" style={styles.title}>
          Save a link
        </AppText>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing[8] },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <AppText variant="bodyMedium" color={theme.colors.onSurfaceVariant}>
            A little context makes it easier to find later.
          </AppText>

          <AppText variant="eyebrow" color={theme.colors.primary}>
            Link preview
          </AppText>

          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={[styles.previewCover, { backgroundColor: previewTint.background }]}>
              <MaterialCommunityIcons
                name="link-variant"
                size={34}
                color={previewTint.foreground}
              />
              {metadata?.imageUrl ? (
                <Image
                  source={{ uri: metadata.imageUrl }}
                  style={previewImageStyle}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  accessible={false}
                />
              ) : null}
            </View>

            <View style={styles.previewCopy}>
              <AppText variant="titleLarge" numberOfLines={2}>
                {previewTitle}
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
                {previewDomain ?? "Paste a link to preview it"}
              </AppText>
              {metadata?.description ? (
                <AppText
                  variant="bodySmall"
                  color={theme.colors.onSurfaceVariant}
                  numberOfLines={2}
                >
                  {metadata.description}
                </AppText>
              ) : null}
              <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
                {metadataMessage}
              </AppText>
            </View>
          </View>

          <TextField
            label="URL"
            value={url}
            onChangeText={(value) => {
              setUrl(value);
              if (urlError) {
                setUrlError(null);
              }
            }}
            placeholder="https://example.com/article"
            autoFocus
            keyboardType="uri"
            error={urlError}
          />

          <TextField
            key={`title-${titleVersion}`}
            label="Title (optional)"
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              titleEditedRef.current = true;
            }}
            placeholder="A short, recognizable title"
          />

          <TextField
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Why are you saving this?"
            multiline
          />

          <AppText variant="eyebrow" color={theme.colors.primary}>
            Save to folder
          </AppText>

          <ScalePressable
            accessibilityRole="button"
            accessibilityLabel={`Save to folder: ${folderLabel}`}
            onPress={() => setFolderPickerVisible(true)}
            scaleTo={0.99}
            style={[
              styles.folderRow,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View
              style={[
                styles.folderTile,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="folder"
                size={20}
                color={theme.colors.onPrimaryContainer}
              />
            </View>
            <AppText variant="titleSmall" style={styles.folderName}>
              {folderLabel}
            </AppText>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
          </ScalePressable>

          {saveError ? (
            <AppText variant="bodySmall" color={theme.colors.error} accessibilityLiveRegion="polite">
              {saveError}
            </AppText>
          ) : null}

          <View style={styles.saveAction}>
            <Button
              label="Save to Paperclip"
              onPress={() => {
                void performSave(false);
              }}
              loading={saving}
              disabled={saving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <FolderPickerDialog
        visible={folderPickerVisible}
        folders={folders}
        selectedFolderId={folderId}
        onSelect={setFolderId}
        onClose={() => setFolderPickerVisible(false)}
      />

      <AppDialog
        visible={duplicate !== null}
        onRequestClose={() => setDuplicate(null)}
        title="Already in Paperclip"
        description={
          duplicate
            ? `“${duplicate.title}” is already saved. You can keep another copy if you want.`
            : undefined
        }
        actions={
          <>
            <Button
              label="Save another copy"
              variant="tonal"
              onPress={() => {
                setDuplicate(null);
                void performSave(true);
              }}
            />
            <Button label="Cancel" variant="text" onPress={() => setDuplicate(null)} />
          </>
        }
      />
    </Screen>
  );
}

function previewStatusFor(
  status: "idle" | "loading" | "ready" | "unavailable",
  metadata: LinkMetadata | null
): PreviewStatus {
  if (status === "idle" || status === "loading") {
    return "pending";
  }
  if (metadata && (metadata.title || metadata.description)) {
    return "partial";
  }
  return "unavailable";
}
