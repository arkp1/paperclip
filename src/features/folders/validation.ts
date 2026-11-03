export const FOLDER_NAME_MAX_LENGTH = 40;

/**
 * These names belong to virtual collections and must not be claimed by a
 * user-created folder, otherwise the library would show two different things
 * with the same label.
 */
const RESERVED_FOLDER_NAMES = new Set(["all bookmarks", "uncategorized"]);

export type FolderNameValidation =
  | { valid: true; name: string }
  | { valid: false; message: string };

export function validateFolderName(rawName: string): FolderNameValidation {
  const name = rawName.trim();

  if (name.length === 0) {
    return { valid: false, message: "Enter a folder name." };
  }

  if (name.length > FOLDER_NAME_MAX_LENGTH) {
    return {
      valid: false,
      message: `Use ${FOLDER_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (RESERVED_FOLDER_NAMES.has(name.toLowerCase())) {
    return {
      valid: false,
      message: "That name is reserved for a built-in view. Choose another name.",
    };
  }

  return { valid: true, name };
}
