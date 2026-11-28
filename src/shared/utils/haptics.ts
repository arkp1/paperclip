import * as Haptics from "expo-haptics";

function run(action: () => Promise<void>): void {
  try {
    const result = action();
    void result.catch(() => {
      // Haptics are optional; absence of a native module or hardware must not
      // interrupt saving or any other user action.
    });
  } catch {
    // Native haptics can throw synchronously when the installed development
    // client predates the haptics module. Keep the interaction functional.
  }
}

export const haptics = {
  selection(): void {
    run(() => Haptics.selectionAsync());
  },
  light(): void {
    run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  success(): void {
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  warning(): void {
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
  error(): void {
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
};
