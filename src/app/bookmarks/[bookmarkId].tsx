import { useLocalSearchParams } from "expo-router";

import { BookmarkDetailsScreen } from "@/features/bookmarks/screens/BookmarkDetailsScreen";

export default function BookmarkDetailsRoute() {
  const { bookmarkId } = useLocalSearchParams<{ bookmarkId: string }>();

  if (!bookmarkId || Array.isArray(bookmarkId)) {
    return null;
  }

  return <BookmarkDetailsScreen bookmarkId={bookmarkId} />;
}
