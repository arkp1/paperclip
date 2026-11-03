import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

let reduceMotionEnabled = false;
let initialized = false;
const listeners = new Set<(value: boolean) => void>();

function initialize() {
  if (initialized) {
    return;
  }
  initialized = true;

  void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
    reduceMotionEnabled = enabled;
    for (const listener of listeners) {
      listener(enabled);
    }
  });

  AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
    reduceMotionEnabled = enabled;
    for (const listener of listeners) {
      listener(enabled);
    }
  });
}

/**
 * Tracks the Android "Remove animations" accessibility setting. A single
 * app-wide listener feeds every animated component.
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(reduceMotionEnabled);

  useEffect(() => {
    initialize();
    listeners.add(setReduceMotion);
    return () => {
      listeners.delete(setReduceMotion);
    };
  }, []);

  return reduceMotion;
}
