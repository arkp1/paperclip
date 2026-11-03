import type { FolderColorKey } from "@/theme/colors";

export type Folder = {
  id: string;
  name: string;
  iconKey: string | null;
  colorKey: FolderColorKey | null;
  isPrivate: boolean;
  sortOrder: number;
  lastOpenedAt: number | null;
  createdAt: number;
  updatedAt: number;
  /** Null while a private folder's count is deliberately hidden. */
  bookmarkCount: number | null;
};

export type CreateFolderInput = {
  name: string;
  iconKey?: string | null;
  colorKey?: FolderColorKey | null;
};

export type FolderDeleteStrategy = "keepBookmarks" | "deleteBookmarks";
