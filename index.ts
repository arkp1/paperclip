import { registerWidgetTaskHandler } from "react-native-android-widget";

import { widgetTaskHandler } from "./src/features/widgets/widgetTaskHandler";

registerWidgetTaskHandler(widgetTaskHandler);

// Register the widget task handler before Expo Router initialises.
// eslint-disable-next-line import/first
import "expo-router/entry";
