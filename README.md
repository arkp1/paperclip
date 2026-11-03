# Paperclip

Paperclip is an Android-first, local-first library for links: save links from
other apps or by hand, see visual preview cards, organize them into folders,
search locally, and protect private folders.

The product contract lives in [`AGENTS.md`](AGENTS.md) and the [`docs/`](docs/)
folder (PRD, TRD, schema, user flows, UI/UX, design system, architecture).

## Current state

Implemented:

- Three-tab shell (Home, Folders, Settings) with a floating capsule navigation
  bar, horizontal tab swiping, and a Home screen with recent folders plus a
  four-item Recently saved preview and View all.
- Folder create, rename, delete (with the two documented deletion choices), and
  recent-folder ordering in SQLite.
- Manual Save Link flow with URL validation, automatic title/description from
  page metadata, optional note, folder picker, duplicate confirmation, and
  save-before-preview behaviour. Saved links appear in All bookmarks, folders,
  and search.
- Bookmark actions from every card via long press: edit title/note, add/remove
  favourite, move folder, copy, share, refresh preview, and delete.
- Favourites collection with the same layout, sort, and empty-state treatment as
  All bookmarks; a heart marks favourited cards.
- Extended Save-link FAB collapses to a circular + while scrolling down and
  expands on scroll-up.
- Local preview-image caching from Open Graph/Twitter metadata, rendered from
  app-managed files; preview refresh and asset cleanup on delete.
- Persisted Grid / List / Cards layout and sort order (newest, oldest, title)
  for folder and collection bookmark lists.
- Local library foundation: `expo-sqlite` database, versioned migration,
  folders/bookmarks/settings schema, typed repositories.
- Search, All bookmarks, and Uncategorized routes with real data and empty
  states.
- Paperclip light/dark themes with persisted appearance.
- Native Material 3 controls through `@expo/ui` (buttons, text fields, segmented
  control, loading indicator), themed from Paperclip tokens.

Not implemented yet: Android share-intent capture, private folders, backups, and
tests/lint setup.

## Run it

```bash
npm install
npx expo start
```

Open the project in Expo Go on the Android device. `expo-sqlite` and `@expo/ui`
are included in Expo Go for SDK 58.

## Checks

```bash
npx tsc --noEmit
```

The Android bundle is compiled by Metro (`npx expo start` → open the app).
ESLint and unit tests are not configured yet.

## Architecture notes

- `src/app/` contains thin Expo Router routes; the `(main)` group holds the
  three primary tabs.
- `src/features/` owns product behavior (home, folders, bookmarks, search,
  settings).
- `src/core/` owns database/migrations and preferences.
- `src/shared/ui/` contains the screen shell, floating navigation, cards, and
  native Material 3 control wrappers.
- `src/styles/` contains every static `StyleSheet` definition, mirroring the
  feature/shared structure; components import their styles from here.
- `src/theme/` contains the semantic color, type, spacing, shape, and motion
  tokens.

Native Material 3 controls use `@expo/ui` Jetpack Compose components; Paperclip
cards, layouts, and the floating capsule remain React Native per the
architecture documents. See
[ADR 0001](docs/decisions/0001-native-material3-component-layer.md).

## App identity

Expo project name/slug/scheme are `Paperclip`/`paperclip`/`paperclip`. No
Android application ID has been committed yet; it is required before the first
development or EAS build.
