import { getSetting, setSetting } from "@/core/preferences/appSettingsRepository";
import { getBookmarkPrivacy } from "@/core/database/privateVaultRepository";
import { withPrivacyWriteLock } from "@/core/database/privacyWriteLock";
import {
  getVaultSetting,
  setVaultSetting,
} from "@/core/database/privateVault";

export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export type ReaderAnnotation = {
  id: string;
  blockKey: string;
  color: HighlightColor;
  note: string;
  createdAt: number;
};

export const highlightTints: Record<
  HighlightColor,
  { background: string; border: string }
> = {
  yellow: { background: "#FFF1A8", border: "#D9B93F" },
  green: { background: "#CDEBD3", border: "#5B9B68" },
  blue: { background: "#CFE5F5", border: "#5A8FB5" },
  pink: { background: "#F7D3DF", border: "#B96A87" },
};

export const darkHighlightTints: Record<
  HighlightColor,
  { background: string; border: string }
> = {
  yellow: { background: "#4A421B", border: "#FFE082" },
  green: { background: "#24452B", border: "#9ED8A9" },
  blue: { background: "#1E3547", border: "#9CCBE8" },
  pink: { background: "#4A2733", border: "#F0AFC4" },
};

export function annotationTints(dark: boolean) {
  return dark ? darkHighlightTints : highlightTints;
}

function keyFor(bookmarkId: string) {
  return `reader_annotations:${bookmarkId}` as const;
}

export function blockAnnotationKey(block: {
  type: string;
  text?: string;
  sourceKey?: string;
}): string {
  if (block.sourceKey) {
    return block.sourceKey;
  }
  return contentAnnotationKey(block);
}

/** Legacy key format used by annotations saved before stable block IDs. */
export function contentAnnotationKey(block: {
  type: string;
  text?: string;
}): string {
  return `${block.type}:${(block.text ?? "").slice(0, 120)}`;
}

export async function loadAnnotations(
  bookmarkId: string
): Promise<ReaderAnnotation[]> {
  return withPrivacyWriteLock(async () => {
    const privacy = await getBookmarkPrivacy(bookmarkId);
    if (privacy === "unavailable") {
      throw new Error("The private vault is locked.");
    }
    const raw =
      privacy === "private"
        ? await getVaultSetting(keyFor(bookmarkId))
        : await getSetting(keyFor(bookmarkId));
    if (!raw) {
      return [];
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        `Reader annotations are malformed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    if (!Array.isArray(parsed)) {
      throw new Error("Reader annotations are not an array.");
    }
    const annotations = parsed.filter(isAnnotation);
    if (annotations.length !== parsed.length) {
      throw new Error("Reader annotations contain invalid entries.");
    }
    return annotations;
  });
}

export async function saveAnnotations(
  bookmarkId: string,
  annotations: ReaderAnnotation[]
): Promise<void> {
  return withPrivacyWriteLock(async () => {
    const privacy = await getBookmarkPrivacy(bookmarkId);
    if (privacy === "unavailable") {
      throw new Error("The private vault is locked. Annotations were not saved.");
    }
    const serialized = JSON.stringify(annotations);
    if (privacy === "private") {
      await setVaultSetting(keyFor(bookmarkId), serialized);
      return;
    }
    await setSetting(keyFor(bookmarkId), serialized);
  });
}

function isAnnotation(value: unknown): value is ReaderAnnotation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<ReaderAnnotation>;
  return (
    typeof record.id === "string" &&
    typeof record.blockKey === "string" &&
    (record.color === "yellow" ||
      record.color === "green" ||
      record.color === "blue" ||
      record.color === "pink") &&
    typeof record.note === "string" &&
    typeof record.createdAt === "number"
  );
}
