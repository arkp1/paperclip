import type { useRouter } from "expo-router";

type AppRouter = ReturnType<typeof useRouter>;

/**
 * Returns to the previous screen when one exists. Screens can be opened
 * directly through deep links or the share intent, in which case there is no
 * history to pop and replacing with the main tab is the safe fallback.
 */
export function navigateBack(router: AppRouter): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace("/");
}
