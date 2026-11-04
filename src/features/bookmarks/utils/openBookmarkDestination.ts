import { useRouter } from "expo-router";

import { isReadableArticleUrl } from "@/features/reader/utils/isReadableArticleUrl";
import { openExternalUrl } from "@/shared/utils/openExternalUrl";

type AppRouter = ReturnType<typeof useRouter>;

type OpenableBookmark = {
  id: string;
  originalUrl: string;
};

/**
 * Article-like links open in the distraction-free reader. Social, video, and
 * media links keep opening in their native app/browser.
 */
export function openBookmarkDestination(
  bookmark: OpenableBookmark,
  router: AppRouter
): void {
  if (isReadableArticleUrl(bookmark.originalUrl)) {
    router.push({
      pathname: "/read/[bookmarkId]",
      params: { bookmarkId: bookmark.id },
    });
    return;
  }

  void openExternalUrl(bookmark.originalUrl);
}
