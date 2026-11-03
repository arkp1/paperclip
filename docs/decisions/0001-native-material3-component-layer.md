# ADR 0001 — Native Material 3 component layer

**Date:** 3 November 2026  
**Status:** Accepted

## Context

The TRD recommends evaluating `react-native-platform-components` for Android
Material 3 Expressive controls, with a proof of concept before making it
foundational. That package only supports a development client / EAS build; it
does not run in Expo Go. Paperclip is currently tested in Expo Go on a physical
device, and this machine has no Android SDK/adb, so a native Expressive package
would stop the existing test loop immediately.

The product owner chose to standardise the control layer on `@expo/ui`,
Expo's official Jetpack Compose Material 3 bridge, which is included in Expo Go
and already installed in this project.

## Decision

- Use `@expo/ui/jetpack-compose` for standard controls: buttons, text fields,
  the theme segmented control, and loading indicators.
- Keep Paperclip-specific cards, list layouts, the floating capsule navigation,
  app bars, and dialogs in React Native with the typed theme tokens. This is
  the boundary the architecture and UI documents require.
- Theme every native host from Paperclip tokens (`seedColor`, `colorScheme`) so
  Material 3 does not adopt the device wallpaper palette.
- Keep one icon family (`MaterialCommunityIcons`) for custom chrome until a
  reviewed Material Symbols drawable set is added for native controls.
- Disable NativeWind's `globalClassNamePolyfill`: it rewrites every
  `react-native` import to `react-native-css/components`, which omits
  `AssetRegistry` and breaks `expo-asset`/icon fonts. The UI uses StyleSheet and
  tokens, so the polyfill is not needed.

## Consequences

- The app remains testable in Expo Go.
- Controls are genuine native Material 3 widgets, not JavaScript lookalikes.
- Material 3 Expressive-specific widgets that `@expo/ui` does not expose are
  out of scope for now. Revisit `react-native-platform-components` only after a
  development build is set up and verified.
- Native controls are uncontrolled internally (text fields own their editing
  buffer); remount via `key` when a field must reset, as the folder-name dialog
  does.
