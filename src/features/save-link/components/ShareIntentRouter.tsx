import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useShareIntentContext } from "expo-share-intent";

import { quickSaveLink } from "@/features/save-link/services/quickSaveService";
import {
  enqueueShareRetry,
  readShareRetryQueue,
  removeShareRetry,
} from "@/features/save-link/services/shareRetryQueue";
import { extractSharedUrl } from "@/features/save-link/utils/sharePayload";
import { AppDialog } from "@/shared/ui/AppDialog";
import { AppText } from "@/shared/ui/AppText";
import { Button } from "@/shared/ui/Button";
import { MaterialCommunityIcons } from "@/shared/ui/icons";
import { haptics } from "@/shared/utils/haptics";
import { validateHttpUrl } from "@/shared/utils/url";
import { useTheme } from "@/theme";

type ShareStatus = "saving" | "saved" | "failed";

/**
 * Saves shared text/URLs automatically. The dialog is status-only; dismissing
 * it never cancels the in-flight save.
 */
export function ShareIntentRouter() {
  const { theme } = useTheme();
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  const lastHandledUrl = useRef<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ShareStatus>("saving");
  const [message, setMessage] = useState("");
  const [retryable, setRetryable] = useState(false);

  const consumeSharedPayload = useCallback(
    (extracted: string) => {
      if (lastHandledUrl.current === extracted) {
        return;
      }
      lastHandledUrl.current = extracted;

      const validation = validateHttpUrl(extracted);
      if (!validation.valid) {
        setPendingUrl(extracted || "Shared text");
        setStatus("failed");
        setRetryable(false);
        setMessage("This share did not contain a valid link.");
        return;
      }

      setPendingUrl(validation.url);
      setStatus("saving");
      setMessage("");
      setRetryable(true);
    },
    []
  );

  useEffect(() => {
    if (!hasShareIntent) {
      lastHandledUrl.current = null;
      return;
    }

    const rawValue = shareIntent.webUrl ?? shareIntent.text ?? "";
    const extracted = extractSharedUrl(rawValue);
    resetShareIntent();
    queueMicrotask(() => consumeSharedPayload(extracted));
  }, [hasShareIntent, resetShareIntent, shareIntent.text, shareIntent.webUrl, consumeSharedPayload]);

  useEffect(() => {
    if (!pendingUrl || status !== "saving") {
      return;
    }
    let active = true;
    void quickSaveLink(pendingUrl).then((result) => {
      if (!active) {
        return;
      }
      if (result.status === "saved" || result.status === "duplicate") {
        haptics.success();
        setStatus("saved");
        setRetryable(false);
        void removeShareRetry(pendingUrl);
        return;
      }
      haptics.error();
      setStatus("failed");
      setRetryable(result.status !== "invalid");
      setMessage(
        result.status === "invalid"
          ? "This share did not contain a valid link."
          : "Could not save this link. It will remain queued."
      );
      if (result.status === "error") {
        void enqueueShareRetry(pendingUrl);
      }
    });
    return () => {
      active = false;
    };
  }, [pendingUrl, status]);

  useEffect(() => {
    if (status !== "saved" || !pendingUrl) {
      return;
    }
    const timer = setTimeout(() => setPendingUrl(null), 1000);
    return () => clearTimeout(timer);
  }, [pendingUrl, status]);

  useEffect(() => {
    void readShareRetryQueue().then((queue) => {
      for (const url of queue) {
        void quickSaveLink(url).then((result) => {
          if (result.status === "saved" || result.status === "duplicate") {
            void removeShareRetry(url);
          }
        });
      }
    });
  }, []);

  const title =
    status === "saved"
      ? "Saved"
      : status === "failed"
        ? "Could not save"
        : "Saving link";

  return (
    <AppDialog
      visible={pendingUrl !== null}
      onRequestClose={() => setPendingUrl(null)}
      title={title}
      description={
        status === "saving"
          ? "Adding this link to Paperclip…"
          : status === "saved"
            ? "Saved to Paperclip."
            : message
      }
      actions={
        status === "failed" && pendingUrl ? (
          <>
            {retryable ? (
              <Button
                label="Retry"
                onPress={() => {
                  setStatus("saving");
                  setMessage("");
                }}
              />
            ) : null}
            <Button
              label="Close"
              variant="text"
              onPress={() => setPendingUrl(null)}
            />
          </>
        ) : (
          <></>
        )
      }
    >
      <View style={{ alignItems: "center", gap: 12, paddingVertical: 8 }}>
        {status === "saving" ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <MaterialCommunityIcons
            name={
              status === "saved"
                ? "check-circle-outline"
                : "alert-circle-outline"
            }
            size={34}
            color={
              status === "saved"
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant
            }
          />
        )}
        <AppText variant="bodySmall" color={theme.colors.onSurfaceVariant}>
          {status === "saving" ? "Saving" : status === "saved" ? "Saved" : "Failed"}
        </AppText>
      </View>
    </AppDialog>
  );
}
