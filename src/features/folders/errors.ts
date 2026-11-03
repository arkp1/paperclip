export class FolderNameTakenError extends Error {
  constructor() {
    super("A folder with this name already exists.");
    this.name = "FolderNameTakenError";
  }
}

export class InvalidFolderNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidFolderNameError";
  }
}

export class FolderNotFoundError extends Error {
  constructor() {
    super("This folder no longer exists.");
    this.name = "FolderNotFoundError";
  }
}

export class PrivateFolderLockedError extends Error {
  constructor() {
    super("This folder is locked.");
    this.name = "PrivateFolderLockedError";
  }
}

/** Maps a repository failure to copy that is safe to show in the UI. */
export function describeFolderError(error: unknown): string {
  if (
    error instanceof FolderNameTakenError ||
    error instanceof InvalidFolderNameError ||
    error instanceof FolderNotFoundError
  ) {
    return error.message;
  }

  return "Something went wrong while saving the folder.";
}
