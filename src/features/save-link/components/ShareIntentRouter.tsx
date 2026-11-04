import { useEffect, useRef, useState } from "react";
import { Platform, ToastAndroid } from "react-native";
import { useRootNavigationState, useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";

import { quickSaveLink } from "@/features/save-link/services/quickSaveService";
import { ActionRow } from "@/shared/ui/ActionRow";
import { AppDialog } from "@/shared/ui/AppDialog";
import { validateHttpUrl } from "@/shared/utils/url";

/**
 * Routes Android share-sheet text/URLs into a two-action chooser: the normal
 * Save Link form or an immediate Quick Save. The shared payload is untrusted,
 * so only a complete http(s) URL is accepted.
 */
export function ShareIntentRouter() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  const lastHandledUrl = useRef<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!hasShareIntent || !navigationState?.key) {
      if (!hasShareIntent) {
        lastHandledUrl.current = null;
      }
      return;
    }

    const rawValue = shareIntent.webUrl ?? shareIntent.text ?? "";
    const extracted =
      rawValue.match(/https?:\/\/[^\s<>"']+/i)?.[0]?.replace(/[.,;)]+$/, "") ??
      rawValue.trim();
    const validation = validateHttpUrl(extracted);

    resetShareIntent();

    if (!validation.valid || lastHandledUrl.current === validation.url) {
      return;
    }

    lastHandledUrl.current = validation.url;
    setPendingUrl(validation.url);
  }, [
    hasShareIntent,
    navigationState?.key,
    resetShareIntent,
    router,
    shareIntent.text,
    shareIntent.webUrl,
  ]);

  const handleQuickSave = async () => {
    if (!pendingUrl) {
      return;
    }

    const result = await quickSaveLink(pendingUrl);
    setPendingUrl(null);

    if (Platform.OS === "android") {
      const message =
        result.status === "saved"
          ? "Saved to Paperclip"
          : result.status === "duplicate"
            ? "Already saved"
            : "Could not quick-save this link";
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  return (
    <AppDialog
      visible={pendingUrl !== null}
      onRequestClose={() => setPendingUrl(null)}
      actions={
        <>
          <ActionRow
            icon="pencil-outline"
            label="Save"
            onPress={() => {
              if (!pendingUrl) {
                return;
              }
              const url = pendingUrl;
              setPendingUrl(null);
              router.push({
                pathname: "/bookmarks/save",
                params: { sharedUrl: url },
              });
            }}
          />
          <ActionRow
            icon="lightning-bolt-outline"
            label="Quick save"
            onPress={() => {
              void handleQuickSave();
            }}
          />
        </>
      }
    />
  );
}
