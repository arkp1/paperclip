import * as Haptics from "expo-haptics";

function run(action: () => Promise<void>): void {
  void action().catch(() => {
    // Haptic feedback is optional and must never block the interaction.
  });
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
