import { Alert, Linking, Share } from "react-native";

/**
 * Opens a saved link through Android's normal link handling. If no handler is
 * available, the user is offered a copy/share fallback instead of a dead tap.
 */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn’t open this link", "No app on this device handled the URL.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Share link instead",
        onPress: () => {
          void Share.share({ message: url }).catch(() => {
            Alert.alert("Couldn’t share the link", "Please try again.");
          });
        },
      },
    ]);
  }
}
