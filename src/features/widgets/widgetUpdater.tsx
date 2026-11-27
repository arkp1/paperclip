import { requestWidgetUpdate } from "react-native-android-widget";

import {
  PaperclipLargeWidget,
  PaperclipMediumWidget,
  PaperclipSmallWidget,
} from "@/features/widgets/PaperclipWidgets";
import { loadWidgetData } from "@/features/widgets/widgetData";

const widgetNames = [
  "PaperclipSmall",
  "PaperclipMedium",
  "PaperclipLarge",
] as const;

let refreshPromise: Promise<void> | null = null;
let lastRefreshAt = 0;
let pendingRefresh = false;

export async function refreshPaperclipWidgets(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise;
  }
  if (Date.now() - lastRefreshAt < 750) {
    pendingRefresh = true;
    setTimeout(() => {
      if (pendingRefresh) {
        pendingRefresh = false;
        void refreshPaperclipWidgets();
      }
    }, 760);
    return;
  }
  pendingRefresh = false;
  lastRefreshAt = Date.now();
  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function performRefresh(): Promise<void> {
  const data = await loadWidgetData();
  await Promise.all(
    widgetNames.map((widgetName) =>
      requestWidgetUpdate({
        widgetName,
        renderWidget: () => ({
          light:
            widgetName === "PaperclipSmall" ? (
              <PaperclipSmallWidget data={data} theme="light" />
            ) : widgetName === "PaperclipMedium" ? (
              <PaperclipMediumWidget data={data} theme="light" />
            ) : (
              <PaperclipLargeWidget data={data} theme="light" />
            ),
          dark:
            widgetName === "PaperclipSmall" ? (
              <PaperclipSmallWidget data={data} theme="dark" />
            ) : widgetName === "PaperclipMedium" ? (
              <PaperclipMediumWidget data={data} theme="dark" />
            ) : (
              <PaperclipLargeWidget data={data} theme="dark" />
            ),
        }),
      }).catch(() => undefined)
    )
  );
}
