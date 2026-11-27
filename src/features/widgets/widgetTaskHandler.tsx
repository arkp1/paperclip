import * as Clipboard from "expo-clipboard";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { quickSaveLink } from "@/features/save-link/services/quickSaveService";
import { extractSharedUrl } from "@/features/save-link/utils/sharePayload";
import {
  PaperclipLargeWidget,
  PaperclipMediumWidget,
  PaperclipSmallWidget,
} from "@/features/widgets/PaperclipWidgets";
import { refreshPaperclipWidgets } from "@/features/widgets/widgetUpdater";
import { loadWidgetData } from "@/features/widgets/widgetData";
import { validateHttpUrl } from "@/shared/utils/url";

function renderForWidget(
  widgetName: string,
  data: Awaited<ReturnType<typeof loadWidgetData>>,
  renderWidget: WidgetTaskHandlerProps["renderWidget"]
) {
  const light =
    widgetName === "PaperclipSmall" ? (
      <PaperclipSmallWidget data={data} theme="light" />
    ) : widgetName === "PaperclipMedium" ? (
      <PaperclipMediumWidget data={data} theme="light" />
    ) : (
      <PaperclipLargeWidget data={data} theme="light" />
    );
  const dark =
    widgetName === "PaperclipSmall" ? (
      <PaperclipSmallWidget data={data} theme="dark" />
    ) : widgetName === "PaperclipMedium" ? (
      <PaperclipMediumWidget data={data} theme="dark" />
    ) : (
      <PaperclipLargeWidget data={data} theme="dark" />
    );
  renderWidget({ light, dark });
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, clickAction } = props;

  if (widgetAction === "WIDGET_CLICK") {
    if (clickAction === "ADD_FROM_CLIPBOARD") {
      const shared = await Clipboard.getStringAsync();
      const url = extractSharedUrl(shared);
      if (validateHttpUrl(url).valid) {
        await quickSaveLink(url);
        await refreshPaperclipWidgets();
      }
    }
    return;
  }

  if (widgetAction === "WIDGET_DELETED") {
    return;
  }

  const data = await loadWidgetData();
  renderForWidget(widgetInfo.widgetName, data, props.renderWidget);
}
