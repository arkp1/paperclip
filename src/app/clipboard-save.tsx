import { useEffect } from "react";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";

import { quickSaveLink } from "@/features/save-link/services/quickSaveService";
import { extractSharedUrl } from "@/features/save-link/utils/sharePayload";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";
import { appSnackbar } from "@/shared/ui/appSnackbar";
import { validateHttpUrl } from "@/shared/utils/url";

/**
 * Foreground clipboard entry point for the small home-screen widget. Reading
 * the clipboard here avoids Android 10+ background clipboard restrictions.
 */
export default function ClipboardSaveScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void Clipboard.getStringAsync()
      .then(async (text) => {
        const url = extractSharedUrl(text);
        if (!validateHttpUrl(url).valid) {
          if (!cancelled) {
            appSnackbar.show("No link in clipboard");
            router.replace("/");
          }
          return;
        }
        const result = await quickSaveLink(url);
        if (cancelled) {
          return;
        }
        appSnackbar.show(
          result.status === "duplicate" ? "Already saved" : "Link saved"
        );
        router.replace("/");
      })
      .catch(() => {
        if (!cancelled) {
          appSnackbar.show("Could not read the clipboard");
          router.replace("/");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <Screen>
      <LoadingState message="Saving clipboard link…" />
    </Screen>
  );
}
