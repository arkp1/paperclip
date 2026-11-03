export type PreviewStatus =
  | "pending"
  | "success"
  | "partial"
  | "unavailable"
  | "failed";

export type Bookmark = {
  id: string;
  originalUrl: string;
  canonicalUrl: string | null;
  title: string;
  titleIsUserEdited: boolean;
  description: string | null;
  note: string | null;
  folderId: string | null;
  sourceName: string | null;
  domain: string | null;
  previewImagePath: string | null;
  faviconPath: string | null;
  previewStatus: PreviewStatus;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
};

export type BookmarkView = Bookmark & {
  folderName: string | null;
};

export type BookmarkCollection = "all" | "uncategorized" | "favorites";

export type BookmarkViewMode = "grid" | "list" | "cards";

export const BOOKMARK_VIEW_MODES: BookmarkViewMode[] = ["grid", "list", "cards"];

export type BookmarkSortMode = "recent" | "oldest" | "title";

export type CreateBookmarkInput = {
  originalUrl: string;
  canonicalUrl: string | null;
  title: string;
  titleIsUserEdited: boolean;
  description: string | null;
  note: string | null;
  folderId: string | null;
  sourceName: string | null;
  domain: string | null;
  previewStatus: PreviewStatus;
};
