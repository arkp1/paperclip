# Paperclip — Technical Requirements Document (TRD)

**Product:** Paperclip — Instagram and article link saver  
**Platform:** Android (MVP)  
**Application framework:** React Native  
**Design direction:** Material 3 Expressive  
**Document version:** 1.1  
**Status:** Proposed technical baseline — validate against the existing repository before implementation  
**Date:** 2 November 2026  
**Related product specification:** `Paperclip_PRD.md`  
**Design reference:** [Paperclip Android screens in Figma](https://www.figma.com/design/2XBBMl0bawDPNQcWXKUz9P)

---

## 1. Purpose and scope

This document translates the Paperclip Product Requirements Document (PRD) into a practical technical plan for an Android application built with React Native.

The TRD defines the proposed application architecture, libraries, local data model, storage strategy, native Android integrations, security boundaries, preview extraction pipeline, backup format, testing strategy, and implementation sequence. It is intended to be supplied to the implementation agent together with the PRD and Figma design.

### 1.1 Confirmed decisions

The product owner has confirmed the following:

- The app is an **Android application**.
- The application will use **React Native**.
- The visual direction is **Material 3 Expressive**.
- The primary navigation is a floating bottom bar with **Home**, **Folders**, and **Settings**.
- **Folders** replaces Search as the second navigation destination; Search remains accessible as a secondary route from the Folders screen.
- The Home screen shows **recent folders only** and has no See All action or recently saved bookmark section.

### 1.2 Working technical assumptions

The following are recommendations for the implementation agent, not additional decisions already made by the product owner:

- Use **Expo with TypeScript** unless the existing repository is already configured for bare React Native and has a good reason to remain that way.
- Use **Expo Router** for navigation.
- Use **SQLite** as the local source of truth.
- Use **local-only storage**; no account, backend, cloud sync, or remote database is required for the MVP.
- Use a custom Paperclip design-token layer and native Material 3 Expressive controls where practical.
- Use an Expo development build / EAS Build workflow. Do not rely on Expo Go for features that require custom native code or config plugins.

The implementation agent MUST inspect the existing repository before making project, version, or dependency changes. Do not recreate an existing app or upgrade its React Native / Expo versions blindly.

### 1.3 In scope

- Receiving URLs shared from other Android apps.
- Manually pasting or entering a URL.
- Saving the URL locally before preview extraction completes.
- Extracting page metadata and caching preview images locally.
- Rendering a rich card or designed fallback card for every bookmark.
- Folder creation, editing, deletion, browsing, and moving bookmarks.
- Local search across saved content.
- Private folders protected by Android authentication and encrypted storage.
- Offline access to saved bookmark data and cached previews.
- Importing and exporting a versioned JSON backup.
- Material 3 Expressive-inspired UI, dynamic color where supported, and light/dark themes.

### 1.4 Out of scope for the MVP

- User accounts, sign-in, or cloud sync.
- A backend API or hosted database.
- Downloading or rehosting original Instagram, YouTube, or other platform media.
- AI summaries, recommendations, or semantic search.
- Social features, shared folders, or collaboration.
- A complete in-app browser or offline article reader.
- iOS release.

---

## 2. Recommended technology baseline

### 2.1 Framework and runtime

For a new project created on the date of this document, the recommended baseline is:

| Layer | Recommendation | Notes |
|---|---|---|
| Framework | Expo SDK 58 | Current stable Expo SDK checked on 2 November 2026. |
| React Native | 0.88.x (SDK-managed) | SDK 58 targets React Native 0.88. Do not manually override the version Expo selects. |
| React | 19.3.x (SDK-managed) | Keep compatible with the Expo SDK. |
| Language | TypeScript | Enable strict type checking. |
| Navigation | Expo Router | File-based navigation and deep-link integration. |
| JavaScript engine | Hermes | Use the SDK default unless a verified incompatibility requires otherwise. |
| Android architecture | New Architecture / Fabric | Required by some current native component libraries. |
| Node.js | 22.13+ for the SDK 58 baseline | The local development environment must satisfy Expo and React Native tooling requirements. |

**Version policy:** Treat the versions above as a compatibility baseline, not a reason to replace versions in an existing project. First inspect `package.json`, the lockfile, `app.json` / `app.config.ts`, and the generated Android project (if present). Use `npx expo install` for Expo SDK packages. Run `npx expo install --check` and `npx expo-doctor` after dependency changes.

Do not use `latest`, nightly, canary, alpha, or release-candidate dependencies for production without an explicit decision and compatibility testing. Commit the lockfile.

### 2.2 Proposed dependency set

Install only the packages needed for the implementation stage. The following is a recommended shortlist, not an instruction to add every package at project setup.

| Concern | Proposed package / approach | Purpose |
|---|---|---|
| Routing | `expo-router` | App routes, nested screens, deep links, share-intent routing. |
| Local database | `expo-sqlite` | SQLite persistence and database migrations. |
| Database encryption | SQLCipher support in `expo-sqlite` | Encrypt local database files in custom native builds. |
| Local files | `expo-file-system` | Store preview images, temporary backup files, and archive assets. |
| Image rendering | `expo-image` | Render local preview files with caching and placeholders. |
| Secure key/value storage | `expo-secure-store` | Store small secret values or wrapped key material using Android Keystore-backed storage. Not a general database. |
| Biometrics | `expo-local-authentication` | Biometric capability detection and authentication UI. Use a native cryptographic bridge when key release must be bound to authentication. |
| Incoming shares | `expo-share-intent` | Receive shared URL/text payloads from Android apps. Verify the package version against the selected Expo SDK. |
| Outgoing share | `expo-sharing` / React Native Share API | Share a saved URL or generated backup file with other apps. |
| File import | `expo-document-picker` | Let the user choose a backup file. |
| Runtime validation | `zod` or equivalent | Validate URLs, parsed metadata, and imported backup data. |
| HTML parsing | `node-html-parser` or another small RN/Hermes-compatible parser | Parse HTML metadata without running page JavaScript. Verify Hermes compatibility before adoption. |
| UI state | React hooks; Zustand only if cross-screen transient state needs it | Do not duplicate the database as a second persistent source of truth. |
| Tests | Jest, React Native Testing Library, and Maestro (or Detox) | Unit, component, and end-to-end coverage. |

Do not introduce a backend-oriented data-fetching library merely to read local SQLite data. Keep local database queries behind repository hooks. Add an ORM such as Drizzle only if it simplifies migrations and is verified to work with the chosen SQLCipher configuration; raw parameterized SQLite queries are acceptable for this MVP.

### 2.3 Expo Go versus development builds

Paperclip will require native capabilities including Android share-intent registration, SQLCipher configuration, Android Keystore integration, and potentially native Material 3 Expressive components.

Therefore:

- Use a **development build / custom Expo client** for real feature development and integration testing.
- Use EAS Build or local `npx expo run:android` builds for native functionality.
- Expo Go may be used for early visual experiments only; it is not the target runtime for the complete app.
- Native config changes require a regenerated/rebuilt native app. A JavaScript refresh alone is not sufficient.
- Prefer Expo config plugins and Continuous Native Generation (CNG). Do not make untracked manual changes to generated native files if a config plugin can express the change.

---

## 3. Material 3 Expressive implementation strategy

### 3.1 Important distinction

Material 3 Expressive is a design system, not simply a purple theme or rounded-corner treatment. The implementation must use its visual and interaction principles: semantic color roles, expressive typography, shape variety and morphing where appropriate, tonal surfaces, component state layers, accessible touch targets, and purposeful motion.

React Native Paper provides Material Design 3 / Material You components, but it should **not** automatically be treated as a complete implementation of the newer Material 3 Expressive component set.

### 3.2 Recommended approach

Use a hybrid approach while keeping the application itself in React Native:

1. **App layouts and product-specific components:** Build with React Native views and the Paperclip token system. This includes bookmark cards, folder cards, preview layouts, empty states, and screen composition.
2. **Native Android controls:** Evaluate `react-native-platform-components` for the Android Material 3 Expressive controls it exposes, such as buttons, text fields, segmented controls, tab/navigation bars, floating action buttons, and context menus.
3. **Custom component variants:** Build any components not covered by the native library as reusable React Native components, matching the Material 3 Expressive token system.
4. **Fallback:** If the native component package fails the compatibility or maintenance review, use React Native primitives plus the same token system. React Native Paper may be used as a fallback for conventional Material 3 controls, but custom work will still be required for Expressive-specific behavior.

`react-native-platform-components` is a relatively new third-party dependency. Before making it foundational, run a focused proof of concept on the exact Expo / React Native version in the repository. Test build stability, theme inheritance, accessibility, Android back behavior, and interaction states. Do not adopt it solely because its README advertises Material 3 Expressive.

### 3.3 Design system requirements

Create a centralized token layer. Do not scatter one-off colors, spacing values, corner radii, or typography values throughout feature components.

Suggested token groups:

```text
src/theme/
  index.ts
  colors.ts
  typography.ts
  shapes.ts
  spacing.ts
  elevation.ts
  motion.ts
  components.ts
```

The token system must provide:

- Semantic light and dark color schemes: primary, on-primary, primary-container, secondary, tertiary, surface, surface-container, on-surface, on-surface-variant, outline, error, and inverse roles.
- Paperclip's fallback seed palette inspired by the Figma direction: warm neutral surfaces, lavender/purple as the main accent, and restrained secondary tones.
- Android dynamic color on supported versions where it can be retrieved reliably. The app must retain a designed fallback palette on unsupported devices or when dynamic color is disabled.
- Material typography roles rather than arbitrary per-screen font sizes.
- A defined shape scale and card-specific shape tokens.
- Spacing and icon-size scales.
- Motion durations and easing guidance, respecting the system reduced-motion setting.
- Consistent pressed, focused, disabled, loading, selected, and error states.

Use Material Symbols or one consistent icon family. Do not mix several unrelated icon packs in the same UI.

### 3.4 Required reusable UI components

At minimum, create and test:

- `AppScaffold` / screen shell.
- `TopAppBar` variants.
- `FloatingBottomNavigation` (Home, Folders, Settings) — a centered floating capsule, not a full-width edge-attached bar.
- `RecentFoldersSection` and `RecentFolderCard`.
- `FolderLibraryScreen` components, including All Bookmarks / Uncategorized shortcuts.
- A search icon/action in the Folders top app bar; Search is a secondary route, not a navigation destination.
- `BookmarkCardGrid` and `BookmarkCardList`.
- `BookmarkPreviewImage` and `BookmarkFallbackArtwork`.
- `FolderCard`.
- `SearchField` and filter chips.
- `PrimaryButton`, `TonalButton`, and icon button wrappers.
- `FloatingAddButton`.
- `ConfirmationDialog` and bottom-sheet wrapper.
- `EmptyState`, `LoadingState`, `ErrorState`, and `OfflineState`.
- `PrivateContentPlaceholder` and authentication entry point.
- `Snackbar` / transient feedback component.

### 3.5 Figma alignment

Use the Paperclip Figma file as the visual reference for hierarchy and screen composition. The Figma file contains visual explorations, not a complete native component specification. Where a Figma mock differs from actual Android Material 3 Expressive behavior, preserve the product's visual intent while following native accessibility and interaction conventions.

Do not use screenshots of Figma screens as app backgrounds or flattened images. Rebuild the screens as real React Native components.

---

## 4. Application architecture

### 4.1 Architecture style

Use a feature-oriented architecture with clear separation between UI, domain behavior, persistence, native integrations, and infrastructure.

```text
React Native Screens / Components
             |
       View hooks / UI state
             |
         Use cases
             |
         Repositories
       /      |       \
   SQLite  File store  Native bridges
       \      |       /
      Metadata / Security / Backup services
```

Principles:

- SQLite is the source of truth for saved data.
- UI components must not execute SQL directly.
- Metadata extraction must not be coupled to a screen lifecycle.
- Saving a bookmark must not wait for network metadata.
- No feature should rely on an in-memory array as the only copy of saved data.
- Private data must go through private-data repositories and access-control checks.
- Native Android features must sit behind typed service interfaces so the UI remains testable.

### 4.2 Suggested project structure

Adapt this structure to the existing repository instead of reorganizing files without need.

```text
app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx                 # Home — recent folders only
    folders.tsx               # Complete folder library
    settings.tsx
  search.tsx                  # Secondary route launched from Folders
  folders/
    [folderId].tsx
    create.tsx
    edit/[folderId].tsx
  bookmarks/
    all.tsx
    [bookmarkId].tsx
    save.tsx
    edit/[bookmarkId].tsx
  private/
    unlock.tsx
  backup/
    index.tsx
    import-preview.tsx

src/
  core/
    database/
      client.ts
      migrations/
      schema.ts
      queries/
    files/
      preview-file-store.ts
      backup-file-store.ts
    security/
      key-manager.ts
      authentication.ts
      private-data-gate.ts
      encrypted-file-store.ts
    network/
      safe-url.ts
      metadata-client.ts
      html-metadata-parser.ts
      image-downloader.ts
    share/
      share-intent-service.ts
      shared-payload-parser.ts
    backup/
      archive-reader.ts
      archive-writer.ts
      import-validator.ts
      backup-crypto.ts
    config/
    errors/
  features/
    home/
    folders/
    bookmarks/
    search/
    save-link/
    private-folders/
    settings/
    backup/
  shared/
    components/
    hooks/
    utils/
  theme/
  types/

assets/
  icons/
  illustrations/
```

Keep route files thin. Screen-specific rendering and data logic should live in feature modules.

### 4.3 State management

- Use local React state for form and component state.
- Use repository-backed hooks for database-backed screens.
- Use a small shared state store (for example Zustand) only for transient cross-screen state such as active selection, pending share payload, current theme choice, or temporary authentication state.
- Do not persist bookmarks or folders in AsyncStorage as a duplicate of SQLite.
- Do not log entire application state in development when it could contain private URLs, titles, or notes.

### 4.4 Navigation map

#### Primary destinations

The app has exactly three primary navigation destinations:

1. **Home** — recent folders only.
2. **Folders** — complete folder library.
3. **Settings** — appearance, privacy, backup, and app information.

Search is not a tab. It is a secondary screen opened from the search icon/action in the Folders screen's top app bar. It must not appear as a fourth item in the floating navigation.

#### Floating bottom navigation contract

Implement a reusable `FloatingBottomNavigation` component and mount it in the root tab layout.

- Center the bar horizontally and position it above the Android navigation/system inset.
- Use a floating capsule / rounded container with visible space around it. Do not render a full-width background strip and do not attach it flush to the bottom edge.
- Use a Material 3 tonal surface, restrained elevation, expressive rounded geometry, and a distinct selected-destination indicator.
- Show exactly three items: Home, Folders, Settings. Each item needs an icon, accessible label, selected state, and at least a 48dp interactive target.
- Reserve content bottom padding equal to the navigation height plus safe-area clearance so scrollable content is never obscured.
- Keep the Add Link FAB separate from navigation. On Home / Folders, position it above and clear of the floating bar.
- Show the floating navigation on the three primary root destinations. Hide it on focused routes such as Search, Save Link, Folder Details, Bookmark Details, Private Unlock, and Import Preview unless a tested hierarchy explicitly calls for it.
- Ensure the bar does not cover an open keyboard, dialog, or bottom sheet.
- Respect safe-area changes, Android gesture navigation, three-button navigation, font scaling, and reduced motion.

#### Secondary routes

- Search
- All Bookmarks
- Uncategorized
- Folder Details
- Save Link
- Bookmark Details / Edit Bookmark
- Create / Edit Folder
- Private Folder Unlock
- Backup & Restore
- Import Preview / Confirmation

A share intent should route directly to the Save Link flow with the incoming URL prefilled. Do not add a permanent bottom-navigation destination solely for adding a bookmark.

### 4.5 Screen behavior contract

#### Home — recent folders only

- Home must display only the recent-folder collection as its primary content.
- Include a compact Paperclip top app bar and a heading such as "Recent folders".
- Show up to six folder cards ordered by most recently opened; use recently created/updated order for folders with no open timestamp.
- Do not render bookmark preview cards, recent bookmark rows, a search field, or a See All / View All action on Home.
- The user reaches the full folder collection through the Folders navigation destination.
- A separate Add Link FAB may be shown, but it must not overlap the floating navigation.
- If there are no folders, show a focused Create Folder empty state.

#### Folders — complete collection

- Display all user-created folders.
- Provide All Bookmarks and Uncategorized entry points in a clear, non-confusing location.
- Expose Search through a top-app-bar icon/action; Search pushes a secondary route and is not added to the bottom navigation.
- Provide folder creation and folder management actions.
- Show lock state for private folders without exposing their bookmark content.

#### Search

- Search the PRD's specified fields locally.
- Render rich preview list cards for results.
- Exclude private-folder data until the corresponding folder is unlocked.
- Provide a back path to the Folders destination; do not add a Search tab.

## 5. Local data architecture

### 5.1 Persistence requirements

- Use SQLite for folders, bookmarks, metadata, and indexed search data.
- Use app-private file storage for preview images and backup working files.
- Use database migrations for every schema change.
- Use parameterized SQL statements; never interpolate user-entered strings into SQL.
- Use transactions for multi-step data changes such as folder deletion, moving bookmarks, import, and visibility changes.
- Keep stable IDs for folders and bookmarks.
- Store timestamps as UTC epoch milliseconds or ISO 8601 consistently. Pick one representation and document it.

### 5.2 Suggested database tables

The exact SQL schema may be refined after implementation begins, but it must preserve these concepts.

#### `folders`

| Column | Type | Requirements |
|---|---|---|
| `id` | TEXT primary key | UUID or another stable ID. |
| `name` | TEXT | Required; trim whitespace and validate length. |
| `icon_key` | TEXT nullable | A known icon/emoji identifier, not arbitrary executable content. |
| `color_key` | TEXT nullable | Prefer a theme token rather than a hard-coded color. |
| `is_private` | INTEGER / BOOLEAN | Determines access boundary. |
| `sort_order` | INTEGER | Stable folder ordering. |
| `created_at` | INTEGER | Creation timestamp. |
| `updated_at` | INTEGER | Last modification timestamp. |
| `last_opened_at` | INTEGER nullable | Last time the folder was opened; drives Home recent-folder ordering. |

`All Bookmarks` is a virtual view, not a stored folder. `Uncategorized` is represented by `folder_id = NULL` unless a product decision later requires it to be a physical folder.

#### `bookmarks`

| Column | Type | Requirements |
|---|---|---|
| `id` | TEXT primary key | Stable bookmark ID. |
| `original_url` | TEXT | User-submitted URL; preserve it. |
| `canonical_url` | TEXT nullable | Valid canonical URL from metadata, if available. |
| `title` | TEXT | Extracted or user-edited title. |
| `title_is_user_edited` | INTEGER / BOOLEAN | Metadata refresh must not overwrite a user-edited title. |
| `description` | TEXT nullable | Page description. |
| `note` | TEXT nullable | User-authored note. |
| `folder_id` | TEXT nullable | References `folders.id`; null means Uncategorized. |
| `source_name` | TEXT nullable | Website or platform label. |
| `domain` | TEXT nullable | Normalized hostname. |
| `favicon_path` | TEXT nullable | Local asset path or asset ID. |
| `preview_image_path` | TEXT nullable | Local asset path or asset ID. |
| `preview_status` | TEXT | `pending`, `success`, `partial`, `unavailable`, or `failed`. |
| `preview_fetched_at` | INTEGER nullable | Last metadata fetch attempt or success timestamp; distinguish the two if both are stored. |
| `created_at` | INTEGER | First saved timestamp. |
| `updated_at` | INTEGER | Last edited timestamp. |

Add indexes for folder membership, creation order, `last_opened_at`, normalized URL / duplicate detection, and search fields as needed.

#### `bookmark_assets` (optional but recommended)

Use this table if each bookmark has multiple assets or if asset lifecycle requires independent reference tracking.

| Column | Type | Requirements |
|---|---|---|
| `id` | TEXT primary key | Stable asset ID. |
| `bookmark_id` | TEXT | Bookmark relationship. |
| `asset_type` | TEXT | `preview`, `favicon`, or another explicitly supported type. |
| `local_path` | TEXT | App-private file path. |
| `mime_type` | TEXT nullable | Validated MIME type. |
| `byte_size` | INTEGER nullable | Asset size. |
| `width` / `height` | INTEGER nullable | Image dimensions if known. |
| `is_encrypted` | INTEGER / BOOLEAN | Whether the asset is encrypted at the file level. |

#### Settings

Store non-secret preferences such as theme choice, dynamic-color preference, and default view using SQLite or AsyncStorage. Store only small secrets or wrapped key material in secure storage. Never store raw encryption keys or PINs in ordinary AsyncStorage.

### 5.3 Data integrity rules

- A bookmark may belong to zero or one folder in the MVP.
- Opening a folder updates `folders.last_opened_at`. Home queries up to six folders ordered by `last_opened_at DESC`; folders with a null value fall back to `updated_at DESC` / `created_at DESC`.
- Home must not query or render recent bookmark cards; it is a recent-folders-only destination.
- A folder deletion must follow the user's explicitly selected behavior.
- A bookmark cannot reference a deleted folder.
- A bookmark can be saved when metadata extraction fails.
- A bookmark cannot be deleted from the database while its referenced files remain permanently orphaned. File cleanup may run after a successful database transaction.
- Import must validate relationships before inserting records.
- Duplicate detection must not silently discard data. Offer the PRD-defined duplicate policy.

### 5.4 Search implementation

Use SQLite full-text search (FTS5) where available in the selected build. Search at minimum:

- Title
- Original URL and hostname
- Description
- User note
- Folder name

Requirements:

- Search locally; do not require a network connection.
- Use case-insensitive matching.
- Debounce keystrokes modestly (for example, 150–250 ms) without making the interface feel delayed.
- Limit and paginate result sets; do not load thousands of complete bookmark objects into one render tree.
- Return visual list-card data for results.
- Apply a strict private-folder exclusion filter until the user has unlocked private content.
- If private content is indexed, keep its index in the protected data boundary and only query it after unlock.
- Aim for the PRD target of under 300 ms for 10,000 bookmarks on a representative mid-range Android device. Benchmark rather than assume it is achieved.

---

## 6. Bookmark save and metadata pipeline

### 6.1 Save-first workflow

Saving the URL and fetching its preview are separate operations.

```text
Shared URL / Manual URL
       |
       v
Parse and validate input
       |
       v
Normalize for comparison (preserve original URL)
       |
       v
Persist provisional bookmark immediately
       |
       +------------------------------+
       |                              |
       v                              v
Render loading/fallback card      Queue metadata fetch
                                      |
                                      v
                            Fetch and parse metadata safely
                                      |
                                      v
                             Validate preview image URL
                                      |
                                      v
                             Download and cache image
                                      |
                                      v
                               Update bookmark row
                                      |
                                      v
                              Refresh visible card
```

The user must be able to save, search, move, reopen, export, and delete the bookmark even if metadata retrieval fails.

### 6.2 Incoming URL handling

The share-intent service must:

- Accept Android `ACTION_SEND` with `text/plain`.
- Extract a direct URL from the shared text where possible.
- Trim surrounding whitespace and common punctuation without changing valid query parameters.
- Reject unsupported schemes such as `javascript:`, `file:`, `content:`, and `intent:` as bookmark URLs.
- Accept `https` and optionally `http`; prefer HTTPS when constructing a request only if a safe, valid HTTPS destination is known. Do not silently rewrite arbitrary user URLs.
- Handle empty, malformed, and multiple-URL share text gracefully. If multiple URLs are detected, ask the user which one to save or present a supported multi-save flow; do not guess silently.
- Clear the consumed share payload after it has been processed so it is not repeatedly saved on later app launches.
- Prevent duplicate processing of the same intent payload.

Provide manual paste/add using the same URL validation and save pipeline.

### 6.3 Metadata extraction order

Attempt metadata extraction in this order:

1. Open Graph: `og:title`, `og:description`, `og:image`, `og:site_name`, `og:url`.
2. Twitter/X card metadata: `twitter:title`, `twitter:description`, `twitter:image`, `twitter:card`.
3. Standard HTML metadata: `<title>`, description meta tag, favicon links.
4. URL-derived fallback: hostname, normalized URL, and reliably detected platform label.

Use the final redirect destination when it is safe. Preserve the original submitted URL separately from the canonical URL discovered in metadata.

### 6.4 Metadata fetching service

The metadata service must:

- Run off the UI thread and expose cancellable asynchronous operations.
- Use a maintained HTTP client / `fetch` implementation compatible with the selected React Native runtime.
- Use explicit connection/read timeouts and an `AbortController` or equivalent cancellation path.
- Limit redirect count and revalidate every redirect destination.
- Reject localhost, loopback, link-local, private-network, and other non-public IP destinations. Re-check resolved destinations to reduce DNS-rebinding and redirect-to-local-network risk.
- Only fetch `http` or `https` pages.
- Never execute page JavaScript, load embedded scripts, or render arbitrary page HTML in a WebView to obtain metadata.
- Enforce a small maximum HTML response size (set an explicit configurable limit, such as 2 MB).
- Handle non-HTML content types safely.
- Avoid sending user URLs to third-party unfurling services by default.
- Avoid fetching private-folder URLs automatically while locked. Any user-initiated refresh must respect the privacy policy and explain that the page URL will be requested from its host.
- Store metadata-fetch state and timestamps to prevent repeated requests on every screen render.

A redirect/DNS policy implemented only in JavaScript must be reviewed carefully because React Native networking APIs can differ from browser APIs. If the selected client cannot enforce the redirect and destination checks, move this part into a small native Android networking module or use a safer maintained implementation. Do not claim SSRF protection without tests.

### 6.5 HTML parser and metadata normalization

Create a single parser module that accepts HTML and the final URL and returns a typed result. It must not be coupled to components.

Suggested result:

```ts
export type PreviewResult = {
  resolvedUrl: string;
  canonicalUrl?: string;
  title?: string;
  description?: string;
  siteName?: string;
  domain: string;
  previewImageUrl?: string;
  faviconUrl?: string;
  status: 'success' | 'partial' | 'unavailable';
  fetchedAt: number;
};
```

Normalize whitespace, strip unsafe control characters, cap title/description lengths, resolve relative metadata URLs against the final page URL, and reject unsupported metadata image schemes.

### 6.6 Preview image download and cache

- Download only validated `http` / `https` image URLs.
- Validate response status and image MIME type; do not trust only the file extension.
- Apply a configurable maximum download size and maximum pixel dimensions.
- Prefer a useful aspect ratio and sufficient image dimensions, but avoid downloading very large source images unnecessarily.
- Cache images in app-managed storage.
- Store asset IDs/paths in SQLite, not image bytes or base64 strings.
- Use deterministic, bookmark-associated asset names or generated asset IDs.
- Clean up replaced or deleted assets safely. Check that another record does not reference the asset before deleting it.
- Render a local cached file when available. Do not rely on hotlinking as the only display path.
- Keep private preview assets in a protected directory and encrypt them at the file level.
- Handle image decoding errors and missing files with a designed fallback state.

### 6.7 Required card states

Every bookmark must render one of the designed variants:

1. Rich preview: image, title, description/source.
2. Image + title: image, title, domain/source.
3. Source preview: source/favicon/icon, title/domain, tonal background.
4. Generated fallback: designed artwork/gradient, generic link/source icon, hostname and available title/URL.

The user must never see a blank image slot, broken-image glyph, or URL-only primary card.

Card states must include loading, partial metadata, unavailable metadata, image-download failure, offline save, refresh in progress, and manually edited title. Metadata refresh must never overwrite a user-edited title.

### 6.8 Metadata refresh policy

- Do not fetch metadata every time a card or screen mounts.
- Refresh on first save, explicit user action, or a controlled retry policy.
- Use bounded retries and backoff for transient failures.
- Do not poll in the background.
- Persist status before scheduling any retry, so an app restart does not create repeated fetch loops.
- Do not refresh private URLs while the private folder is locked.

---

## 7. Folder and bookmark behavior

### 7.1 Folder operations

Implement create, rename, delete, browse, reorder (if included in MVP), and move bookmark operations through folder repositories / use cases.

Folder card data includes name, icon/color token, bookmark count, and privacy indicator. Never show the titles or preview images of private bookmarks on the public Home screen.

### 7.2 Folder deletion

Before deleting a folder, show two explicit options:

1. Delete folder and move its bookmarks to Uncategorized.
2. Delete folder and all its bookmarks.

The safer option should be emphasized. The destructive option requires clear confirmation. Execute the chosen operation transactionally and clean up any assets that are no longer referenced.

### 7.3 Bookmark actions

Each bookmark must support:

- Open original link through Android URL / VIEW intent resolution.
- Edit title and note.
- Move to another folder.
- Copy URL.
- Share URL.
- Refresh preview metadata.
- Delete.

If no suitable application can open a URL, show a useful error and a copy/share alternative. Do not trap the user inside an in-app browser for MVP.

### 7.4 Duplicate handling

Compare a normalized URL form (for example, remove known tracking parameters only for comparison) while preserving the original URL exactly as submitted. Do not remove query parameters required for the resource to open. When a likely duplicate exists, offer to open the existing bookmark or save another copy. The duplicate rule must be documented and covered by tests.

---

## 8. Private folder security architecture

### 8.1 Security is not a visual-only lock

A lock icon and hidden route are not sufficient. Private folder data, search indexes, preview images, logs, app-switcher snapshots, and backups must be protected.

### 8.2 Recommended storage boundary

Use a dedicated private-data boundary:

- Keep public and private data logically separated in repositories and preferably in separate database files or tables with a separate key boundary.
- Enable SQLCipher for protected SQLite data in the custom native build.
- Store database encryption keys only as wrapped key material protected by Android Keystore-backed storage.
- Use a private-folder key that is unavailable to the normal library flow until successful authentication.
- Keep the decrypted private key in memory only while the private session is active. Remove it and close the private database connection when the app locks or the session expires.
- Encrypt private preview files separately using authenticated encryption; SQLCipher does not encrypt standalone image files.
- Keep private image files outside the public preview cache namespace.

A single SQLCipher-protected database can be used if the implementation provides an equally clear private-key and access boundary. The agent must document the trade-offs before choosing the simpler design. The security objective cannot be reduced to filtering private rows in a React component.

### 8.3 Key management requirements

- Use Android Keystore for key protection.
- Prefer a cryptographic key operation that is authorized by the Android biometric/device-credential prompt, rather than treating a successful UI prompt as proof that arbitrary key material is protected.
- Use AES-GCM or another reviewed authenticated-encryption construction for data/assets that require application-layer encryption.
- Use a unique random nonce/IV per encryption operation; never reuse an AES-GCM nonce with the same key.
- Never hardcode keys, salts, PINs, or test secrets in production code.
- Never store the raw private-folder key or an app PIN in AsyncStorage or ordinary SQLite columns.
- Define key generation, wrapping, rotation, invalidation, recovery, and destructive-reset behavior.
- Verify SQLCipher is actually present in the built binary (for example, by checking `PRAGMA cipher_version`) before treating data as encrypted. SQLCipher configuration can silently fail if the app was not rebuilt with the required native configuration.

### 8.4 Authentication behavior

- Support biometric authentication.
- Provide Android device credential fallback (PIN, pattern, or password) where supported and configured. This is preferred over inventing a custom PIN system for MVP.
- If a product-specific app PIN is later required, treat it as a separate security feature and use a vetted key-derivation and rate-limiting implementation. Never hash a PIN with a fast general-purpose hash or use the raw PIN as an encryption key.
- Lock private content when the user leaves the private area or after the configured inactivity period.
- Hide private content when the app goes into the background and redact the app-switcher snapshot.
- Do not expose private titles, URLs, notes, or thumbnails in notifications, logs, crash payloads, or analytics.
- Handle biometric enrollment changes and invalidated keys explicitly. Fail closed and provide a documented recovery path.

`expo-local-authentication` can supply biometric capability checks and a user prompt. It must not be assumed, by itself, to implement the full Android Keystore cryptographic key-release policy. If a cryptographic prompt is required, implement and test a small Android native module using AndroidX Biometric / Android Keystore or another security-reviewed solution.

### 8.5 Private search behavior

- Exclude private folder content from all normal library and search queries while locked.
- After unlock, query private records through a private repository.
- Clear private search results and in-memory card data when locking.
- Do not create plaintext private search-index files.
- Confirm that private data cannot appear in recent searches, search suggestions, widgets, or accessibility labels while locked.

### 8.6 Threat model and limitations

The MVP protects against casual access by another person using the device and against offline inspection of protected app files, subject to correct key management. It does not promise security against a rooted or fully compromised device, malware running with app privileges, debugging of a compromised process, or forensic attacks beyond the chosen encryption model. Document these limitations clearly.

Do not begin implementing private folders until the key lifecycle and storage boundary are reviewed and written down.

---

## 9. Backup and restore

### 9.1 Backup format

Use a versioned ZIP archive with a JSON manifest and asset directory. Suggested format:

```text
paperclip-backup-<timestamp>.zip
  manifest.json
  assets/
    <asset-id>.jpg
    <asset-id>.png
```

Example manifest shape:

```json
{
  "app": "Paperclip",
  "schemaVersion": 1,
  "exportedAt": "2026-11-02T12:00:00.000Z",
  "folders": [],
  "bookmarks": [],
  "assets": []
}
```

The manifest must include the app identifier, schema version, export timestamp, folder records, bookmark records, and asset references. Define the allowed field names, nullability, and migration rules. Keep the format documented and backward-compatible.

### 9.2 Export requirements

- Let the user export the public library without requiring broad filesystem permissions.
- Provide a clear choice about including private folders.
- Never include private data or thumbnails in plaintext by default.
- If private content is included, encrypt the private archive or full backup using a user-provided backup password and a vetted password-based key-derivation/encryption implementation.
- Clearly label a full encrypted backup versus a public-only backup.
- Preserve folder relationships, timestamps, user notes, edited titles, metadata, and supported preview assets.
- Verify the archive after writing it.
- Show a success summary and final destination.

### 9.3 Import requirements

- Use the Android document picker / Storage Access Framework to select the backup.
- Validate archive contents and manifest schema before writing to the live database.
- Reject path traversal, unexpected file types, oversized archives, malformed manifests, and unsupported schema versions.
- If encrypted, request the backup password and authenticate/decrypt before changing the live database.
- Show a summary and duplicate policy before import.
- Import transactionally where practical.
- On failure, roll back inserted records and clean up temporary assets.
- Show imported, skipped, duplicate, and failed counts.
- Never overwrite a user's library without explicit confirmation.

### 9.4 Versioning and migration

- `schemaVersion` is mandatory.
- Implement import migrations for older supported backup versions.
- Unknown future schema versions must be rejected with a useful error rather than partially imported.
- Add test fixtures for valid, malformed, encrypted, duplicated, and older-version backups.

---

## 10. Android-specific integration requirements

### 10.1 Share intents

Implement the Android share target using `expo-share-intent` or a tested native equivalent.

Requirements:

- Register intent filters for shared text (`ACTION_SEND`, `text/plain`).
- Receive and parse shared URLs/text.
- Route into the Save Link screen.
- Handle both cold-start and already-running-app share intents.
- Prevent duplicate processing.
- Test sharing from Instagram, YouTube, Reddit, Chrome, and at least one generic app.
- Do not rely on Expo Go for final verification.

The package version must match the Expo SDK used by the repository. If the project is on a different SDK, select the matching supported release rather than using the latest package blindly.

### 10.2 Opening links

Use React Native Linking or an equivalent Android VIEW-intent integration. Verify behavior for:

- HTTPS web URL with browser installed.
- Instagram/YouTube/Reddit URL with and without the corresponding app installed.
- Invalid or unsupported scheme.
- No handler available.

### 10.3 Storage Access Framework

Use a document picker / Android Storage Access Framework flow for backup selection and writing. Do not request broad external-storage access for ordinary backup import/export.

### 10.4 App lifecycle and lock behavior

Listen to app lifecycle state changes. When the app backgrounds:

- Hide private content immediately.
- Redact the recent-apps snapshot.
- Start or enforce the private-session timeout.
- Clear sensitive temporary UI state.

On resume, require authentication again when the lock policy says the private session has expired.

### 10.5 Android versions and Play requirements

- Use the minimum Android API supported by the selected Expo / React Native / native dependency set. Confirm it from the generated native project and package documentation; do not invent a minimum version in application code.
- Set `targetSdkVersion` to the current Google Play requirement at release time.
- Test system bars, edge-to-edge behavior, navigation modes, permissions, Android Sharesheet, biometric/device credential flows, and background lifecycle behavior on supported Android versions.
- Keep Android-specific native code in small modules with typed JavaScript interfaces.

---

## 11. Error handling and reliability

Create typed error categories and consistent UI handling for:

- Invalid URL.
- Unsupported share payload.
- Duplicate bookmark.
- Metadata unavailable / timeout.
- Redirect rejected / destination blocked.
- Preview image invalid / too large / download failed.
- Offline at save time.
- Database failure / migration failure.
- Asset write/read failure.
- Authentication cancelled / failed / unavailable.
- Private key unavailable or invalidated.
- Backup validation / decryption / write / import failure.

Important reliability rules:

- Persist the URL before starting non-essential work.
- Never lose a valid URL because preview extraction fails.
- Show a useful fallback card for every saved bookmark.
- Do not swallow database or security errors silently.
- Do not present success until the database/file operation succeeds.
- Make import/export operations recoverable and report the number of processed records.
- Avoid infinite retry loops.

---

## 12. Performance requirements

Use the following PRD-derived targets as measurable goals:

| Area | Target |
|---|---|
| Save interaction | Under 5 seconds of user interaction for a normal online save. Metadata fetch is not part of the blocking interaction. |
| URL persistence | Save the URL independently of metadata success. |
| Search | Under 300 ms for 10,000 bookmarks on a representative mid-range Android device. |
| Library | Home screen should feel immediate with a normal personal library. |
| Scale | Support at least 10,000 bookmarks without noticeable degradation. |
| Preview coverage | 100% of saved bookmarks render a rich or designed fallback card. |
| Offline | Browse folders, bookmark metadata, notes, and cached previews offline. |

Implementation rules:

- Paginate large SQLite result sets.
- Use FlatList or a maintained high-performance list component. Start with the simplest suitable option and profile before adding a more complex dependency.
- Keep item keys stable.
- Avoid rerendering every bookmark card when one item changes.
- Store image files locally and pass file URIs to the image renderer.
- Resize or constrain preview images to appropriate dimensions before caching.
- Avoid decoding large image files on the UI thread.
- Do not download every preview at once when opening a library with many items.
- Measure cold launch, warm launch, list scrolling, image memory, and search latency on a physical mid-range Android device.

---

## 13. Accessibility and UX quality

- Support TalkBack and meaningful accessibility labels/hints.
- Keep touch targets large enough for Android accessibility guidance (target at least 48 dp for primary interactive controls where practical).
- Support system font scaling without clipping important controls.
- Maintain sufficient contrast in light and dark themes.
- Do not communicate privacy status using color alone; pair color with text/iconography.
- Provide visible focus/pressed/selected states.
- Respect reduced-motion preferences.
- Ensure dialogs, menus, bottom sheets, and keyboard interactions work with Android Back.
- Ensure text truncation does not prevent access to the full bookmark title and URL on a detail/edit surface.
- Test on small phones and large font settings.

---

## 14. Testing strategy

### 14.1 Unit tests

Cover:

- URL extraction from shared text.
- URL normalization and duplicate detection.
- URL scheme validation and blocked destinations.
- Metadata parsing for Open Graph, Twitter cards, standard HTML, and no metadata.
- Relative preview image and favicon URL resolution.
- Malformed HTML and duplicate metadata tags.
- Metadata timeout, redirect limit, oversized response, and invalid MIME type.
- User-edited title preservation.
- Database repository operations and migrations.
- Folder deletion behavior.
- Search matching and private-data filtering.
- Backup manifest validation and migration.
- Backup encryption/decryption and corrupted archive handling.

### 14.2 Component tests

Cover:

- Rich, partial, and fallback bookmark cards.
- Folder cards and private indicators.
- Loading, error, offline, empty, and no-results states.
- Save-link form validation.
- Search result rendering.
- Floating navigation selected/unselected states and safe-area positioning.
- Home recent-folder cards, empty state, and absence of See All / recent bookmark content.
- Folders screen complete collection and Search entry point.
- Private lock/unlock state transitions.
- Import summary and confirmation behavior.

### 14.3 End-to-end tests

At minimum:

1. Launch app and create a folder.
2. Manually paste a URL and save it.
3. Share a URL from another app into Paperclip.
4. Save a URL when offline.
5. Verify a rich preview and a fallback preview.
6. Restart app and verify local data persists.
7. Move a bookmark between folders.
8. Search by title, domain, description, note, and folder.
9. Lock and unlock a private folder.
10. Verify private content is absent from public search and recent-apps preview while locked.
11. Export a public backup and import it into a clean app state.
12. Export an encrypted private backup and verify that a wrong password cannot import it.
13. Delete a bookmark and verify orphaned preview files are cleaned up safely.

### 14.4 Device / manual testing

Test on physical Android hardware, not only an emulator:

- Share targets from Instagram, YouTube, Reddit, Chrome, and a generic app.
- Airplane mode / intermittent network.
- Biometric available, biometric unavailable, and device-credential fallback.
- App background/foreground while a private folder is open.
- App force-stop/restart during metadata fetch.
- Low storage / failed image write.
- Android light/dark mode and dynamic color.
- Font scaling and TalkBack.
- System navigation modes and edge-to-edge layout.

### 14.5 Security tests

- Attempt to fetch localhost, loopback, private IP, link-local, and redirect-to-private destinations.
- Confirm metadata response and image size limits are enforced.
- Verify SQLCipher is present in the release-like build.
- Verify database files and private assets are not readable as plaintext at rest.
- Verify private key release requires the intended authentication path.
- Verify a locked private database cannot be queried by ordinary public repositories.
- Verify private content is not present in logs, crash reports, analytics, notifications, or app-switcher snapshots.
- Verify wrong backup passwords and altered encrypted archives fail safely.
- Verify invalidated Keystore keys produce a recoverable, clearly explained state.

---

## 15. Build, tooling, and repository standards

### 15.1 Development workflow

- Use the package manager and lockfile already present in the repository. Do not change package managers mid-project without a reason.
- Run the Expo compatibility checks after dependency changes.
- Use a custom development client once native plugins/modules are added.
- Keep the project buildable after every milestone.
- Use environment variables only for non-secret build configuration. This app should not require any application API key for its local-first MVP.
- Do not place credentials or signing keys in source control.

### 15.2 Quality gates

Before a change is considered complete, run the relevant set of:

```bash
npx expo install --check
npx expo-doctor
npx tsc --noEmit
npm run lint
npm test
```

Adjust commands if the repository uses Yarn, pnpm, Bun, or different scripts. Also run Android build / E2E checks for any native, share-intent, SQLCipher, or authentication changes.

### 15.3 Code standards

- TypeScript strict mode.
- Explicit domain types and typed repository interfaces.
- No `any` in core data/security paths unless a third-party API requires it and is safely narrowed.
- Small, focused feature modules.
- Parameterized SQL.
- No business logic embedded in large screen components.
- No private data in debug logs.
- Add tests with bug fixes.
- Document every native module and config plugin.

---

## 16. Proposed implementation milestones

Build incrementally. Each milestone must leave the app buildable.

### Milestone 0 — Repository and native compatibility audit

- Inspect project files and current dependency versions.
- Confirm Expo versus bare React Native setup.
- Confirm New Architecture status.
- Run Expo Doctor / TypeScript checks.
- Confirm Android build works before changing architecture.
- Prototype Material 3 Expressive native controls with the chosen library (if any).
- Prototype incoming share-intent handling.
- Prototype SQLCipher in a development build and verify `PRAGMA cipher_version`.
- Document any incompatibilities and revise the technology selection before feature implementation.

**Exit criteria:** the existing project builds; selected Expo/React Native baseline is documented; key native dependencies pass a minimal proof of concept.

### Milestone 1 — App foundation and design system

- Configure TypeScript, routing, app theme, and reusable UI primitives.
- Implement light/dark token schemes and fallback palette.
- Add dynamic-color integration where supported.
- Implement the floating Home / Folders / Settings navigation and screen shells; keep Search as a secondary route launched from Folders.
- Build folder card, bookmark card, search field, button, empty-state, and error-state components.
- Match the Figma hierarchy and visual direction.

**Exit criteria:** all primary screens can render with local mock data; theme switching and basic accessibility work.

### Milestone 2 — Local storage and bookmark capture

- Implement database schema and migrations.
- Implement typed repositories for folders and bookmarks.
- Implement manual URL entry.
- Implement Android receive-share flow.
- Persist provisional bookmark immediately.
- Implement duplicate warning and Uncategorized behavior.

**Exit criteria:** URLs can be manually entered or shared into the app and remain saved after restart, without requiring metadata retrieval.

### Milestone 3 — Metadata extraction and visual previews

- Implement safe URL validation and metadata client.
- Implement metadata parser and fallback hierarchy.
- Implement preview image downloader and local cache.
- Implement loading, partial, unavailable, offline, and error preview states.
- Add explicit refresh action.

**Exit criteria:** every saved link displays a rich or fallback card; image failures never block saving; user-edited titles survive refresh.

### Milestone 4 — Folders, search, and bookmark actions

- Implement folder CRUD and folder deletion confirmation.
- Implement move bookmark.
- Implement the complete Folders destination, including All Bookmarks and Uncategorized entry points.
- Implement Home recent-folder query and ordering using `last_opened_at`; do not add recent bookmark cards or See All.
- Implement FTS search as a secondary route opened from the Folders top app bar, with private-content filtering.
- Implement open/copy/share/edit/delete/refresh actions.
- Test 10,000-bookmark performance target.

**Exit criteria:** the complete public library is usable offline and can be searched and organized.

### Milestone 5 — Private folders and secure storage

- Review and document the threat model and key lifecycle.
- Implement encrypted private data and private preview assets.
- Implement biometric + device-credential authentication.
- Implement lock on exit/background/inactivity.
- Implement private search only after unlock.
- Redact app-switcher previews and remove sensitive logs.

**Exit criteria:** private folder access is enforced outside the UI; data/assets are encrypted at rest; locking removes private session access.

### Milestone 6 — Import/export

- Implement versioned ZIP + JSON manifest.
- Implement public export/import.
- Implement encrypted private backup support.
- Implement duplicate handling and import summary.
- Add archive size/path validation and recovery handling.

**Exit criteria:** valid backups round-trip without loss; private data cannot be silently exported as plaintext.

### Milestone 7 — Polish and release readiness

- Complete responsive and accessibility checks.
- Verify Material 3 Expressive fidelity and motion restraint.
- Test light/dark/dynamic color.
- Run functional, security, performance, and E2E suites.
- Test app lifecycle, low storage, offline, and failed network states.
- Verify Android release build and Play submission requirements at release time.

**Exit criteria:** all P0 PRD acceptance criteria pass and there are no known data-loss or private-data exposure defects.

---

## 17. Technical risks and decisions requiring validation

| Risk / decision | Why it matters | Required action |
|---|---|---|
| Material 3 Expressive library maturity | Native component packages may be new or change rapidly. | Run a POC; keep app-specific cards and layouts independent of the library. |
| Expo Go limitations | Native plugins, SQLCipher, share intents, and custom native code require a custom binary. | Use a development build early. |
| Share intent compatibility | Android apps share different text payload formats. | Test real source apps and cold/warm launch paths. |
| Social-platform metadata restrictions | Instagram and other platforms may block or omit metadata. | Save URL first and always provide fallback artwork. |
| Private-folder key lifecycle | A UI lock does not secure data. | Write and review a threat model and key design before coding. |
| SQLCipher configuration | A misconfigured build may create unencrypted databases. | Verify cipher support at startup and in CI / release-like builds. |
| Preview image privacy | Private images can leak through a shared cache. | Separate and encrypt private preview storage. |
| Backup compatibility | Future schema changes can break old backups. | Version the manifest and test migrations. |
| URL fetching security | User-provided URLs can point at local or sensitive services. | Strict URL, redirect, DNS, content-type, and size validation. |
| Android version / Play target | Platform requirements evolve. | Check current official requirements when cutting each release. |

---

## 18. Definition of done

The MVP is technically complete when all of the following are true:

- The app builds as an Android development build and release-like build.
- Home, Folders, Settings, Search, Save Link, Folder Details, and Backup screens are implemented.
- The floating bottom navigation contains exactly Home, Folders, and Settings and is visually detached from the bottom edge.
- Home displays recent folders plus a four-item recently saved preview with a View all action; it has no See All action for folders and no search field.
- The Folders destination exposes the complete folder collection and a Search entry point.
- The app receives URLs shared from other Android apps and also supports manual URL entry.
- A URL is persisted before preview extraction and remains saved after restart.
- Every saved bookmark displays a rich preview or designed fallback card.
- Preview images are cached locally and remain visible offline.
- Folder CRUD, moving bookmarks, All Bookmarks, and Uncategorized work correctly.
- Search covers the PRD fields and respects private-folder access boundaries.
- Private content and preview assets are encrypted at rest, and authentication is enforced outside the UI layer.
- Public and encrypted private backups can be exported and restored with validation and duplicate handling.
- The app follows Material 3 Expressive principles, supports light/dark themes, and uses dynamic color where supported.
- Performance, accessibility, lifecycle, offline, security, and backup tests pass.
- No P0 PRD acceptance criterion is represented by mock-only behavior.

---

## 19. Instructions to the implementation agent

Treat `Paperclip_PRD.md` as the source of truth for product behavior and this TRD as the technical implementation guide. Use the Paperclip Figma file as a visual reference, but note that its existing screens may need to be brought into alignment with the revised navigation model.

Before writing feature code:

1. Inspect the existing repository, package manager, Expo / React Native versions, app configuration, Android native setup, and current build status.
2. Do not recreate the project or upgrade dependencies unless the audit identifies a concrete need.
3. Implement the agreed navigation model exactly: a floating bottom bar with Home, Folders, and Settings. Search is a secondary route launched from Folders, not a tab.
4. Keep Home focused: recent folders plus a four-item recently saved preview with View all. Do not add a See All action for folders, a full bookmark feed, or a search field to Home.
5. Implement the Folders destination as the complete folder library, including All Bookmarks and Uncategorized entry points and a Search action.
6. Confirm whether the app is Expo-managed / CNG or bare React Native.
7. Confirm the Material 3 Expressive component strategy with a small Android proof of concept. Do not install multiple competing UI libraries.
8. Confirm the share-intent package and SQLCipher configuration in a custom development build.
9. Write a short task plan and identify unresolved risks before implementation.
10. Implement one milestone at a time. Keep the app buildable after each milestone.
11. Write tests alongside feature code; do not postpone all testing until the end.
12. Never substitute mock data for local SQLite persistence, real Android share-intent handling, or actual import/export.
13. Do not claim private-folder encryption is complete until the key lifecycle, protected files, locked-state behavior, and security tests pass.
14. Do not claim a bookmark preview is complete if it only displays the raw URL or an empty image placeholder.
15. Do not add a backend, sign-in, cloud sync, analytics SDK, or AI feature unless the product owner changes the scope.
16. Record dependency and architecture decisions in the repository so future changes can be reviewed.

**Priority rule:** When a technical convenience conflicts with a P0 product or privacy requirement, preserve the P0 requirement and revise the implementation approach. When an optional dependency increases risk without clear product value, leave it out.

## 20. Reference documentation

Version-sensitive documentation was checked on **2 November 2026**. Re-check it when implementation begins and before release; do not assume a library's latest version remains compatible indefinitely.

### React Native and Expo

- React Native releases and support: https://reactnative.dev/releases/overview
- React Native security guidance: https://reactnative.dev/docs/security
- Expo SDK versions: https://docs.expo.dev/versions/latest/
- Expo SDK release history: https://expo.dev/sdk
- Expo Router: https://docs.expo.dev/router/introduction/
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Expo FileSystem: https://docs.expo.dev/versions/latest/sdk/filesystem/
- Expo SecureStore: https://docs.expo.dev/versions/latest/sdk/securestore/
- Expo LocalAuthentication: https://docs.expo.dev/versions/latest/sdk/local-authentication/
- Expo Sharing: https://docs.expo.dev/versions/latest/sdk/sharing/

### Material 3 Expressive

- Material 3 / Material 3 Expressive design guidance: https://developer.android.com/develop/ui/compose/designsystems/material3
- React Native Paper (Material 3 / Material You): https://oss.callstack.com/react-native-paper/
- Native React Native platform components with Android Material 3 Expressive controls: https://github.com/JarX-Concepts/react-native-platform-components

### Android security and storage

- Android Keystore system: https://developer.android.com/privacy-and-security/keystore
- Android biometric authentication: https://developer.android.com/identity/sign-in/biometric-auth
- Android Storage Access Framework: https://developer.android.com/guide/topics/providers/document-provider

