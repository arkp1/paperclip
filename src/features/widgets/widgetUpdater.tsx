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

export async function refreshPaperclipWidgets(): Promise<void> {
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
