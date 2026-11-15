import { useRouter } from "expo-router";

import { getSetting } from "@/core/preferences/appSettingsRepository";
import { getBookmarkPrivacy } from "@/core/database/privateVaultRepository";
import { isReadableArticleUrl } from "@/features/reader/utils/isReadableArticleUrl";
import {
  shouldBypassReaderForDomain,
} from "@/features/reader/utils/readerDomainFallbacks";
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
export async function openBookmarkDestination(
  bookmark: OpenableBookmark,
  router: AppRouter
): Promise<void> {
  if (!isReadableArticleUrl(bookmark.originalUrl)) {
    await openExternalUrl(bookmark.originalUrl);
    return;
  }

  const preference = await getSetting("reader_open_links").catch(() => null);
  const bypassReader =
    preference === "browser" ||
    (await shouldBypassReaderForDomain(bookmark.originalUrl));
  if (bypassReader) {
    const privacy = await getBookmarkPrivacy(bookmark.id).catch(
      () => "unavailable" as const
    );
    if (privacy === "public") {
      await openExternalUrl(bookmark.originalUrl);
      return;
    }
  }

  router.push({
    pathname: "/read/[bookmarkId]",
    params: { bookmarkId: bookmark.id },
  });
}
