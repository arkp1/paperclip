import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { Image } from "expo-image";

import {
  closePrivateVault,
  openPrivateVaultForSession,
  revokePrivateVaultSession,
} from "@/core/database/privateVault";
import {
  migrateLegacyPrivateFoldersToVault,
  recoverPendingTransfers,
} from "@/core/database/vaultTransfers";

let privateSpaceUnlocked = false;
let unlockGeneration = 0;
let authenticationInProgress = false;
let screenCaptureProtected = false;
let screenCaptureAllowTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleScreenCaptureAllow(): void {
  if (screenCaptureAllowTimer) {
    clearTimeout(screenCaptureAllowTimer);
  }
  screenCaptureAllowTimer = setTimeout(() => {
    screenCaptureAllowTimer = null;
    if (privateSpaceUnlocked || !screenCaptureProtected) {
      return;
    }
    screenCaptureProtected = false;
    void ScreenCapture.allowScreenCaptureAsync("paperclip-private").catch(
      (error: unknown) => {
        console.warn("Could not re-enable screen capture.", error);
      }
    );
  }, 350);
}
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
    if (state !== "active" && !authenticationInProgress) {
      lockPrivateSpace();
      return;
    }
    if (
      state === "active" &&
      !privateSpaceUnlocked &&
      screenCaptureProtected
    ) {
      scheduleScreenCaptureAllow();
    }
  });
}

export function isPrivateSpaceUnlocked(): boolean {
  return privateSpaceUnlocked;
}

export function lockPrivateSpace(): void {
  unlockGeneration += 1;
  revokePrivateVaultSession();
  if (AppState.currentState === "active" && screenCaptureProtected) {
    scheduleScreenCaptureAllow();
  }
  if (!privateSpaceUnlocked) {
    void closePrivateVault();
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
  // A second authorization attempt must not inherit an already-open session.
  if (privateSpaceUnlocked) {
    lockPrivateSpace();
  }
  const attempt = unlockGeneration;

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
  authenticationInProgress = true;
  try {
    result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock private folders",
      cancelLabel: "Cancel",
      fallbackLabel: "Use device PIN",
      disableDeviceFallback: false,
    });
  } catch (error) {
    authenticationInProgress = false;
    console.warn("Device authentication could not start.", error);
    return {
      success: false,
      message: isMissingNativeModule(error)
        ? "This development build is missing the authentication modules. Install the new development build."
        : "Device authentication is unavailable on this device.",
    };
  } finally {
    authenticationInProgress = false;
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

  // The app may have backgrounded while the prompt was open. A successful
  // prompt must not publish a session after the foreground lock event.
  if (
    attempt !== unlockGeneration ||
    AppState.currentState !== "active"
  ) {
    await closePrivateVault();
    return { success: false, message: "Unlock cancelled." };
  }

  try {
    await openPrivateVaultForSession();
    await migrateLegacyPrivateFoldersToVault();
    await recoverPendingTransfers();
  } catch (error) {
    await closePrivateVault();
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

  if (
    attempt !== unlockGeneration ||
    AppState.currentState !== "active"
  ) {
    await closePrivateVault();
    return { success: false, message: "Unlock cancelled." };
  }

  if (screenCaptureAllowTimer) {
    clearTimeout(screenCaptureAllowTimer);
    screenCaptureAllowTimer = null;
  }
  screenCaptureProtected = true;
  try {
    await ScreenCapture.preventScreenCaptureAsync("paperclip-private");
  } catch (error) {
    screenCaptureProtected = false;
    await closePrivateVault();
    console.warn("Could not enable app-switcher protection.", error);
    return {
      success: false,
      message:
        "Private content could not be protected from screenshots or the app switcher. The private session was not opened.",
    };
  }
  if (
    attempt !== unlockGeneration ||
    AppState.currentState !== "active"
  ) {
    screenCaptureProtected = false;
    await closePrivateVault();
    await ScreenCapture.allowScreenCaptureAsync("paperclip-private").catch(
      () => undefined
    );
    return { success: false, message: "Unlock cancelled." };
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
