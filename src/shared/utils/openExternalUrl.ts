import { Linking, Share } from "react-native";

import { appAlert as Alert } from "@/shared/ui/appAlert";

import { validateHttpUrl } from "@/shared/utils/url";

/**
 * Opens a saved link through Android's normal link handling. If no handler is
 * available, the user is offered a copy/share fallback instead of a dead tap.
 */
export async function openExternalUrl(url: string): Promise<void> {
  const validation = validateHttpUrl(url);
  if (!validation.valid) {
    Alert.alert("Couldn’t open this link", validation.message);
    return;
  }

  try {
    await Linking.openURL(validation.url);
  } catch {
    Alert.alert("Couldn’t open this link", "No app on this device handled the URL.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Share link instead",
        onPress: () => {
          void Share.share({ message: validation.url }).catch(() => {
            Alert.alert("Couldn’t share the link", "Please try again.");
          });
        },
      },
    ]);
  }
}
