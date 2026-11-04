import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

let privateSpaceUnlocked = false;
const listeners = new Set<() => void>();
let version = 0;
let appStateSubscription: { remove: () => void } | null = null;

function emit() {
  version += 1;
  for (const listener of listeners) {
    listener();
  }
}

function ensureAppStateListener() {
  if (appStateSubscription) {
    return;
  }

  appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state !== "active") {
      lockPrivateSpace();
    }
  });
}

export function isPrivateSpaceUnlocked(): boolean {
  return privateSpaceUnlocked;
}

export function lockPrivateSpace(): void {
  if (!privateSpaceUnlocked) {
    return;
  }
  privateSpaceUnlocked = false;
  emit();
}

export type UnlockPrivateSpaceResult =
  | { success: true }
  | { success: false; message: string };

/**
 * Biometric/device-credential gate for the private-folder space. The session
 * lives in memory only and clears whenever the app leaves the foreground.
 */
export async function unlockPrivateSpace(): Promise<UnlockPrivateSpaceResult> {
  ensureAppStateListener();

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock private folders",
      cancelLabel: "Cancel",
      fallbackLabel: "Use device PIN",
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return {
        success: false,
        message:
          result.error === "user_cancel"
            ? "Unlock cancelled."
            : "Authentication failed. Try again.",
      };
    }

    privateSpaceUnlocked = true;
    emit();
    return { success: true };
  } catch (error) {
    console.warn("Could not authenticate the private folder space.", error);
    return {
      success: false,
      message: "Device authentication is unavailable.",
    };
  }
}

export function usePrivateSpaceSession() {
  ensureAppStateListener();

  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      ensureAppStateListener();
      return () => {
        listeners.delete(listener);
      };
    },
    () => version,
    () => version
  );

  return {
    isUnlocked: privateSpaceUnlocked,
    unlock: unlockPrivateSpace,
    lock: lockPrivateSpace,
  };
}
