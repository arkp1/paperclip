import { useEffect } from "react";
import { ToastAndroid } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";

import { quickSaveLink } from "@/features/save-link/services/quickSaveService";
import { extractSharedUrl } from "@/features/save-link/utils/sharePayload";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";
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
            ToastAndroid.show("No link in clipboard", ToastAndroid.SHORT);
            router.replace("/");
          }
          return;
        }
        const result = await quickSaveLink(url);
        if (cancelled) {
          return;
        }
        ToastAndroid.show(
          result.status === "duplicate" ? "Already saved" : "Link saved",
          ToastAndroid.SHORT
        );
        router.replace("/");
      })
      .catch(() => {
        if (!cancelled) {
          ToastAndroid.show("Could not read the clipboard", ToastAndroid.SHORT);
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
