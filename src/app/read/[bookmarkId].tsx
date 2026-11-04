import { useLocalSearchParams } from "expo-router";

import { ReaderScreen } from "@/features/reader/screens/ReaderScreen";

export default function ReaderRoute() {
  const { bookmarkId } = useLocalSearchParams<{ bookmarkId: string }>();

  if (!bookmarkId || Array.isArray(bookmarkId)) {
    return null;
  }

  return <ReaderScreen bookmarkId={bookmarkId} />;
}
