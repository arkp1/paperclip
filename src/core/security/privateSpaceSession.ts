import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Image } from "expo-image";

import {
  closePrivateVault,
  getPrivateVault,
} from "@/core/database/privateVault";

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
  void closePrivateVault();
  void Image.clearMemoryCache().catch(() => undefined);
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
    const enrolledLevel =
      await LocalAuthentication.getEnrolledLevelAsync();
    if (enrolledLevel === LocalAuthentication.SecurityLevel.NONE) {
      return {
        success: false,
        message:
          "Set up a device PIN, pattern, password, or biometric first. Private folders need one of these.",
      };
    }
  } catch {
    // Some devices cannot report the enrolled level; let the authentication
    // prompt decide instead of failing the whole flow.
  }

  let result: LocalAuthentication.LocalAuthenticationResult;
  try {
    result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock private folders",
      cancelLabel: "Cancel",
      fallbackLabel: "Use device PIN",
      disableDeviceFallback: false,
    });
  } catch (error) {
    console.warn("Device authentication could not start.", error);
    return {
      success: false,
      message: isMissingNativeModule(error)
        ? "This development build is missing the authentication modules. Install the new development build."
        : "Device authentication is unavailable on this device.",
    };
  }

  if (!result.success) {
    return {
      success: false,
      message:
        result.error === "user_cancel"
          ? "Unlock cancelled."
          : result.error === "not_enrolled" ||
              result.error === "not_available"
            ? "Set up a device PIN or biometric authentication first."
            : "Authentication failed. Try again.",
    };
  }

  try {
    await getPrivateVault();
  } catch (error) {
    console.warn("The private vault could not be opened.", error);
    return {
      success: false,
      message: isMissingNativeModule(error)
        ? "This development build is missing SecureStore/SQLCipher. Install the new development build."
        : error instanceof Error && error.message.includes("SQLCipher")
          ? "Encrypted storage is unavailable in this build. Rebuild the development client."
          : error instanceof Error && error.message.includes("encrypted")
            ? "The private vault could not be opened securely."
            : __DEV__
              ? `Private vault error: ${error instanceof Error ? error.message : String(error)}`
              : "Device authentication succeeded, but the private vault could not be opened.",
    };
  }

  privateSpaceUnlocked = true;
  emit();
  return { success: true };
}

function isMissingNativeModule(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /native module|ExpoSecureStore|ExpoCrypto|SQLCipher/i.test(message);
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
