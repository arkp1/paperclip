import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import {
  PaperclipLargeWidget,
  PaperclipMediumWidget,
  PaperclipSmallWidget,
} from "@/features/widgets/PaperclipWidgets";
import { loadWidgetData } from "@/features/widgets/widgetData";

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
  const { widgetInfo, widgetAction } = props;

  if (widgetAction === "WIDGET_DELETED" || widgetAction === "WIDGET_CLICK") {
    return;
  }

  const data = await loadWidgetData();
  renderForWidget(widgetInfo.widgetName, data, props.renderWidget);
}
