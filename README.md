# Paperclip

Paperclip is an Android-first, local-first library for links: save links from
other apps or by hand, see visual preview cards, organize them into folders,
search locally, read saved articles in a distraction-free reader, and protect
private folders behind device authentication.

There is no account, backend, cloud sync, analytics, or advertising. SQLite is
the source of truth and the library works offline.

## Screenshots

Runtime screenshots have not been captured automatically because the app
requires a native development build and a connected Android device. The images
below are the Figma design references kept in this repository; they are not
current runtime captures.

<table>
  <tr>
    <td><img src="docs/figma/01%20%E2%80%94%20Library.png" width="240" alt="Library design reference" /></td>
    <td><img src="docs/figma/03%20%E2%80%94%20Folder%20detail.png" width="240" alt="Folder detail design reference" /></td>
    <td><img src="docs/figma/08%20%E2%80%94%20Settings.png" width="240" alt="Settings design reference" /></td>
    <td><img src="docs/figma/10%20%E2%80%94%20Dark%20theme.png" width="240" alt="Dark theme design reference" /></td>
  </tr>
</table>

## Highlights

### Library and organization
- Three primary destinations: **Home**, **Folders**, and **Settings**.
- Home shows recent folders and a four-item Recently saved preview.
- Folders is the full library: All bookmarks, Favourites, Uncategorized, and
  user-created folders.
- Grid, list, and card bookmark layouts with persisted sort order.
- Search across titles, URLs, domains, descriptions, notes, and folder names.
- Visual preview cards with locally cached preview images and designed
  fallbacks.
- Folder colours, rename, safe deletion options, and recents ordering.

### Capture and previews
- Android Sharesheet integration with **Save** and **Quick save** actions.
- Manual URL save flow with validation, optional notes, folder selection, and
  duplicate handling.
- YouTube oEmbed and Reddit social-card metadata fallbacks for sites that block
  generic metadata requests.
- Preview images cached in app-managed storage and refreshed with bounded retry
  behaviour.

### Reading and listening
- Article-like links open in the in-app reader; social, video, and media links
  open externally.
- Cached article text for offline reading.
- Article images, including lazy `data-src`, `data-original`, and `srcset`
  sources. Small social icons are filtered out.
- Reader controls for typeface, text size, white/sepia/grey/black page colours,
  and optional horizontal pagination.
- A persistent listening player with play/pause, previous/next section,
  draggable seeking, and 0.75×–1.5× speech speeds.
- Playback continues while navigating outside the reader. The mini player can
  be reopened or closed with the X button.

### Appearance and interaction
- Paperclip light and dark themes, five accent palettes, and AMOLED black.
- Android 12+ dynamic colour for native Material controls when enabled.
- Google Sans Flex typography for the app and reader.
- Material 3 Expressive-inspired controls, shapes, and Reanimated interaction
  feedback.
- Radial-ink press feedback clipped to each control, plus scale feedback only
  for the theme selector.

### Privacy and data
- Private folders gated by biometrics or device PIN.
- The private-folder gate is **app-level lock only**; database encryption is not
  enabled in this build. The gate clears when the app leaves the foreground.
- Versioned public JSON export/import with folders, links, notes, favourites,
  and cached preview images. Private folders and their contents are excluded.
- Import validates before changing the library.

## Tech stack

- Expo SDK 58, React Native 0.88, React 19, TypeScript strict
- Expo Router with the three-tab floating capsule navigation
- `expo-sqlite` for the local database and `PRAGMA user_version` migrations
- `@expo/ui` Jetpack Compose for native Material controls
- React Native Reanimated for interaction and reader motion
- `expo-share-intent`, `expo-local-authentication`, `expo-speech`,
  `expo-file-system`, and `expo-image`
- Google Sans Flex variable font, licensed under the SIL Open Font License
  ([license](assets/fonts/OFL.txt))

## Run it

Prerequisites: Node.js, npm, and an Android device with the Paperclip
development build installed.

```bash
npm install
npx expo start --dev-client --host lan --port 8081 --clear
```

Expo Go is not sufficient: share-intent capture, device authentication, and
native speech require a development/native build.

## Android development build

The application ID is `com.arkp.paperclip`, configured in
[`app.json`](app.json).

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

`eas.json` defines `development`, `preview`, and `production` profiles. Build a
new development client whenever native configuration or native modules change,
including `expo-speech`, share intents, local authentication, and predictive
back.

## Checks

```bash
npx tsc --noEmit
```

The Android bundle is compiled by Metro. ESLint configuration remains minimal
and the repository does not yet have an automated unit/component test suite.

## Architecture

- `src/app/` — thin Expo Router routes and layouts.
- `src/features/` — home, folders, bookmarks, search, save link, backup, reader,
  and settings behavior.
- `src/core/` — SQLite connection/migrations, preferences, filesystem, and
  security session.
- `src/shared/ui/` — screen shell, cards, dialogs, overflow menus, native
  Material wrappers, and interaction primitives.
- `src/styles/` — static feature and shared `StyleSheet` definitions.
- `src/theme/` — semantic colour, typography, spacing, shape, and motion tokens.

Native Material controls use `@expo/ui`; Paperclip cards, layouts, reader pages,
and the floating navigation remain React Native. See
[ADR 0001](docs/decisions/0001-native-material3-component-layer.md).

The product contract and implementation decisions live in [`AGENTS.md`](AGENTS.md)
and [`docs/`](docs/).

## Known limitations

- Private folder records and private reader data live in a separate SQLCipher
  vault (`paperclip-private.db`). The vault key is stored in Expo SecureStore
  (Android Keystore-backed), but key release is still gated by the app’s
  biometric/device-PIN flow rather than a cryptographically auth-bound native
  Keystore key.
- Private preview images are not retained. They are deleted when a folder
  becomes private so no private image files remain in plaintext app storage.
  Existing private data from builds before this change is removed on first
  launch.
- Dynamic colour affects native Compose controls; React Native surfaces keep
  the selected Paperclip accent because the wallpaper palette is not exposed to
  JS.
- Article text is cached locally, but article images depend on the source
  server and the platform image cache. Reader article images use the in-memory
  image cache only.
- Predictive back, native speech, SQLCipher, and SecureStore require a rebuilt
  development client.
