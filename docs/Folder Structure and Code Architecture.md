# Paperclip — Folder Structure and Code Architecture

**Product:** Paperclip — Android link and article saver  
**Document type:** Code organization and architecture guide  
**Version:** 1.0  
**Date:** 2 November 2026  
**Related documents:** `Paperclip_PRD.md`, `Paperclip_TRD.md`  
**Platform:** Android  
**Framework:** React Native  
**Language:** TypeScript  
**Navigation:** Expo Router (working baseline; verify the existing repository first)  
**Design system:** Material 3 Expressive

---

## 1. Purpose

This document defines how Paperclip's code should be organized and how its main parts should work together. Its purpose is not to introduce a large enterprise architecture. It is to keep the project **small, understandable, modular, and straightforward for another developer to maintain**.

The codebase should make it easy to answer these questions:

- Where does a screen live?
- Where is the logic for saving a bookmark?
- Where are database queries written?
- Where is link-preview extraction handled?
- Where are Android-only features implemented?
- Where are shared UI components and design tokens defined?
- How can a developer change one feature without unintentionally breaking another?

The implementation should favour simple, explicit code over abstractions created only for architectural appearance.

## 2. Architecture principles

### 2.1 Keep the architecture proportional to the app

Use a **feature-oriented structure with clear data and UI boundaries**. Avoid creating a class, interface, service, hook, provider, or folder for every small operation.

Apply these rules:

1. Put code near the feature that owns it.
2. Keep screens responsible for presenting UI and connecting UI state to feature logic—not for writing SQL, parsing HTML, or handling encryption.
3. Keep database access behind repositories.
4. Keep Android-specific functionality behind small adapters.
5. Extract reusable code only when it is genuinely shared or has a clear responsibility.
6. Add an abstraction when it reduces coupling, complexity, duplication, or testing difficulty—not simply because a pattern exists.
7. Prefer a few well-named functions over many layers that only pass arguments through.
8. Keep every module understandable without having to trace the entire application.

### 2.2 Single source of truth

SQLite is the source of truth for folders and bookmarks. Do not keep a second persistent copy of this data in Zustand, Context, AsyncStorage, or component state.

- Screens read database-backed data through feature hooks/repositories.
- Mutations write to SQLite through repositories.
- UI state may temporarily hold form values, selected items, loading state, and other short-lived interaction state.
- Settings that are genuinely preferences may be stored in DataStore/AsyncStorage as appropriate, but not as a duplicate of database records.

### 2.3 Clear dependency direction

Use this dependency direction:

```text
Expo Router routes
        |
Feature screens and feature hooks
        |
Feature services / business workflows
        |
Feature repositories
        |
Core infrastructure (SQLite, files, native adapters)
```

Shared UI and theme tokens can be used by any feature, but they must not import feature-specific code.

**Dependency rules:**

- `app/` may import feature screens and shared navigation components.
- `features/` may import `shared/` and `core/`.
- A feature may use another feature only through its small, documented public API when necessary.
- `shared/` must not import from `features/`.
- `core/` must not import from `features/` or `shared/` UI.
- Database code must not import React components or screen files.
- Native adapters must not contain product UI or navigation logic.

Do not create circular imports. If two features repeatedly need each other's internal code, reconsider ownership and move the genuinely shared capability into an appropriate lower-level module.

---

## 3. Recommended project structure

The following is the target structure for a new or clean Paperclip repository. **Do not blindly recreate or move an existing working project.** First inspect the repository and adapt this structure with the smallest reasonable set of changes.

```text
paperclip/
│
├── app/                              # Expo Router route declarations only
│   ├── _layout.tsx                   # Root providers, theme, status bar
│   ├── (main)/
│   │   ├── _layout.tsx               # Home / Folders / Settings + floating bar
│   │   ├── index.tsx                 # Home: recent folders only
│   │   ├── folders.tsx               # Complete folder library
│   │   └── settings.tsx              # Settings destination
│   ├── search.tsx                    # Secondary route opened from Folders
│   ├── folders/
│   │   ├── [folderId].tsx            # Folder details
│   │   ├── create.tsx
│   │   └── edit/[folderId].tsx
│   ├── bookmarks/
│   │   ├── all.tsx                   # All Bookmarks
│   │   ├── [bookmarkId].tsx          # Bookmark details/actions
│   │   ├── save.tsx                  # Save shared/pasted URL
│   │   └── edit/[bookmarkId].tsx
│   ├── private/
│   │   └── unlock.tsx
│   └── backup/
│       ├── index.tsx
│       └── import-preview.tsx
│
├── src/
│   ├── features/                     # Product features, organized by responsibility
│   │   ├── home/
│   │   │   ├── screens/
│   │   │   │   └── HomeScreen.tsx
│   │   │   └── hooks/
│   │   │       └── useRecentFolders.ts
│   │   │
│   │   ├── folders/
│   │   │   ├── screens/
│   │   │   │   ├── FoldersScreen.tsx
│   │   │   │   └── FolderDetailsScreen.tsx
│   │   │   ├── components/
│   │   │   │   └── FolderCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useFolders.ts
│   │   │   │   └── useFolderDetails.ts
│   │   │   ├── data/
│   │   │   │   └── folderRepository.ts
│   │   │   ├── services/
│   │   │   │   └── folderService.ts       # Only for multi-step folder rules
│   │   │   └── types.ts
│   │   │
│   │   ├── bookmarks/
│   │   │   ├── screens/
│   │   │   │   ├── AllBookmarksScreen.tsx
│   │   │   │   └── BookmarkDetailsScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── BookmarkCard.tsx
│   │   │   │   ├── BookmarkPreview.tsx
│   │   │   │   └── BookmarkFallback.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useBookmarks.ts
│   │   │   ├── data/
│   │   │   │   └── bookmarkRepository.ts
│   │   │   ├── services/
│   │   │   │   └── bookmarkService.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── save-link/
│   │   │   ├── screens/
│   │   │   │   └── SaveLinkScreen.tsx
│   │   │   ├── components/
│   │   │   │   └── SaveLinkForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSaveLink.ts
│   │   │   ├── services/
│   │   │   │   └── saveLinkService.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── search/
│   │   │   ├── screens/
│   │   │   │   └── SearchScreen.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSearchBookmarks.ts
│   │   │   ├── data/
│   │   │   │   └── searchRepository.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── private-folders/
│   │   │   ├── screens/
│   │   │   │   └── PrivateFolderUnlockScreen.tsx
│   │   │   ├── hooks/
│   │   │   │   └── usePrivateFolderSession.ts
│   │   │   ├── services/
│   │   │   │   └── privateFolderService.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── settings/
│   │   │   ├── screens/
│   │   │   │   └── SettingsScreen.tsx
│   │   │   └── hooks/
│   │   │       └── useAppSettings.ts
│   │   │
│   │   └── backup/
│   │       ├── screens/
│   │       │   ├── BackupScreen.tsx
│   │       │   └── ImportPreviewScreen.tsx
│   │       ├── hooks/
│   │       │   └── useBackup.ts
│   │       ├── services/
│   │       │   └── backupService.ts
│   │       ├── data/
│   │       │   └── backupRepository.ts       # Optional; only if needed
│   │       └── types.ts
│   │
│   ├── core/                         # App-wide infrastructure; no product screens
│   │   ├── database/
│   │   │   ├── database.ts            # Open/configure the SQLite connection
│   │   │   ├── migrations/
│   │   │   └── transaction.ts         # Add only if transaction helper is useful
│   │   ├── files/
│   │   │   ├── fileSystem.ts
│   │   │   └── previewFileStore.ts
│   │   ├── network/
│   │   │   ├── safeUrl.ts
│   │   │   └── safeFetch.ts
│   │   ├── platform/
│   │   │   ├── shareIntent.ts
│   │   │   ├── biometricAuth.ts
│   │   │   └── secureKeyStore.ts
│   │   ├── security/
│   │   │   ├── encryption.ts
│   │   │   └── keyManager.ts
│   │   ├── errors/
│   │   │   └── AppError.ts
│   │   └── config/
│   │       └── appConfig.ts
│   │
│   ├── shared/                       # Reusable UI and generic utilities
│   │   ├── ui/
│   │   │   ├── AppScreen.tsx
│   │   │   ├── FloatingBottomNavigation.tsx
│   │   │   ├── FloatingAddButton.tsx
│   │   │   ├── AppTopBar.tsx
│   │   │   ├── SearchField.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── ConfirmationDialog.tsx
│   │   │   └── SnackbarHost.tsx
│   │   ├── hooks/
│   │   └── utils/
│   │
│   ├── theme/
│   │   ├── index.ts
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── shapes.ts
│   │   ├── spacing.ts
│   │   └── motion.ts
│   │
│   └── types/
│       └── common.ts                 # Truly app-wide primitive types only
│
├── assets/
│   ├── icons/
│   └── illustrations/
│
├── tests/
│   ├── fixtures/
│   └── e2e/
│
├── docs/
│   └── decisions/                    # Small ADRs for important choices only
│
├── app.json / app.config.ts
├── package.json
├── tsconfig.json
├── eslint.config.js
├── prettier.config.js
└── README.md
```

### 3.1 Important: this is a guide, not a requirement to create empty folders

Create a directory only when it contains real code. For a small feature, one or two files may be enough. For example, do not create `services/`, `hooks/`, `types/`, and `utils/` folders for a feature just because the template shows them. Add them when the feature has a genuine need.

Similarly, avoid one-file directories and empty placeholder modules. A small, coherent module is preferable to a large tree full of pass-through files.

---

## 4. Responsibility of each top-level area

### `app/` — Navigation only

Expo Router files should be thin route declarations.

Their responsibilities are to:

- Define route paths and layouts.
- Read route parameters and validate their shape.
- Connect a route to its feature screen.
- Configure the root and primary navigation layouts.

They should NOT:

- Contain SQL queries.
- Extract link metadata.
- Implement folder or bookmark business rules.
- Implement encryption.
- Contain large UI trees that belong in feature screens.

Example:

```tsx
// app/(main)/index.tsx
import { HomeScreen } from "@/features/home/screens/HomeScreen";

export default function HomeRoute() {
  return <HomeScreen />;
}
```

A route should not grow into the place where feature logic accumulates.

### `features/` — Product behavior

A feature owns the screens, components, hooks, types, and data access needed for one product capability.

Examples:

- `home`: recent folders only.
- `folders`: complete folder library, folder cards, folder CRUD, folder details.
- `bookmarks`: bookmark browsing, bookmark details, edit/delete/move actions.
- `save-link`: accepting a URL, previewing it, and saving it.
- `search`: searching the local library.
- `private-folders`: private access flow and session behavior.
- `backup`: importing and exporting local data.

Do not split every screen into its own feature. Group code around product capabilities that change together.

### `core/` — Technical infrastructure

`core/` contains capabilities that are not owned by a single screen and should not depend on product UI:

- Opening the SQLite database and applying migrations.
- Reading and writing app-managed files.
- Safe HTTP/URL utilities.
- Android share-intent adapter.
- Android authentication and secure key-store adapters.
- Cryptographic primitives and key-management integration.
- Shared error types and application configuration.

Do not put all business logic in `core/`. For example, `saveLinkService` belongs to `features/save-link`, not `core/`, because it describes a Paperclip product workflow.

### `shared/` — Reusable UI and generic helpers

Use this for components that are genuinely used by multiple features and have no ownership by one feature.

Examples include the app screen shell, top app bar, floating navigation, common dialogs, empty states, and snackbar presentation.

Do not move a component into `shared/` just to make a feature folder smaller. A `FolderCard` belongs to `features/folders` unless another feature has a genuine use for the same component. A `BookmarkCard` belongs to `features/bookmarks`.

### `theme/` — One source for design tokens

Keep Material 3 Expressive-related tokens centralized:

- Semantic color roles for light and dark themes.
- Typography roles.
- Shapes and corner radii.
- Spacing scale.
- Motion durations/easing where used.

Do not hardcode brand colors, spacing, radii, or typography values throughout screens. Product-specific components should consume tokens rather than create their own independent palette.

---

## 5. How the main features should work

### 5.1 Home — recent folders and recently saved

Home is deliberately focused. It must not become a second folder-library screen.

**Responsibilities:**

- Fetch up to six recently accessed folders.
- Display a `Recent folders` heading and folder cards.
- Display up to four recently saved public bookmarks with a `Recently saved` heading and a `View all` action.
- Show useful empty states when the user has no folders or no saved links.
- Keep the separate Add Link action if that is part of the approved design.

**It must not display:**

- A bookmark feed longer than the four-item recently saved preview.
- Search input.
- A See All action for folders.
- The complete folder list.

Use the folder feature's repository function through a focused hook, for example `useRecentFolders()`, and the bookmark repository through `useRecentBookmarks()`. Do not create a separate Home repository.

When a user opens a folder, update its `last_opened_at` value. Recent folders should be ordered by most recently opened. For folders that have never been opened, use a documented fallback such as creation time.

### 5.2 Folders — complete collection

**Responsibilities:**

- Show the complete user-created folder collection.
- Provide clear All Bookmarks and Uncategorized entry points.
- Provide folder creation and management actions.
- Provide Search through a search action in the top app bar.
- Show a private/locked indicator without exposing private bookmark details.

Search is a secondary route. It is not part of the floating navigation bar.

### 5.3 Bookmarks

**Responsibilities:**

- Browse All Bookmarks and folder contents.
- Display a rich preview or designed fallback card for every bookmark.
- Open the original URL through Android link handling.
- Support edit, move, copy, share, refresh-preview, and delete actions.

Bookmark preview UI must not perform metadata fetching. It renders the metadata already stored by the bookmark feature.

### 5.4 Save Link

The save-link workflow should be implemented in one feature service that coordinates the required steps.

1. Receive a shared or pasted URL.
2. Validate and normalize it for comparison while preserving the original URL.
3. Detect likely duplicates and return an explicit result.
4. Persist a provisional bookmark locally with a pending or fallback preview state.
5. Start metadata extraction separately from the initial persistence operation.
6. Update metadata and preview status when extraction succeeds or fails.
7. Preserve a user-edited title if metadata is refreshed later.

The screen should call a hook such as `useSaveLink()`. The hook delegates to the service. The service uses repositories and infrastructure adapters.

Do not place the entire workflow in a button's `onPress` callback or in the screen component.

### 5.5 Link-preview extraction

Keep network parsing separate from UI:

```text
SaveLinkScreen
      |
useSaveLink()
      |
saveLinkService
      |----------------------------|
bookmarkRepository       metadataService
                                |
                         safe HTTP client
                                |
                         HTML metadata parser
                                |
                         preview image downloader
                                |
                         local preview file store
```

The metadata service should return a typed result. It should not know about React components, navigation, or snackbars.

A metadata failure should update the preview status and leave the bookmark usable. The card component selects a visual fallback based on stored data; it should never make its own network request.

### 5.6 Search

Search should query the local database and return bookmarks with the fields required to render the same reusable bookmark cards.

- Search title, URL/domain, description, note, and folder name.
- Keep search parsing and query construction in the search feature/repository.
- Do not fetch remote data while typing.
- Exclude locked private-folder content from public search.
- Keep recent search terms transient unless a deliberate product decision makes them persistent.

### 5.7 Private folders

Keep cryptographic mechanisms in `core/security` and Android authentication adapters in `core/platform`. Keep Paperclip's private-folder workflow in `features/private-folders`.

The private-folder feature controls when private data can be accessed. It should not implement cryptography itself; it calls the core security boundary.

Public folder and bookmark repositories must not accidentally return locked private data. Do not rely on a component-level conditional to protect it.

Private data and preview files must follow the security approach described in the TRD. Do not claim encryption is complete merely because the UI requires a fingerprint or PIN.

### 5.8 Backup and restore

Keep backup workflows in `features/backup`:

- Export public data and any explicitly included protected data.
- Serialize using a versioned manifest.
- Include local preview assets where supported by the backup format.
- Validate imports before changing the active database.
- Handle duplicates according to the user's chosen policy.
- Use transactions or a staging approach so a failed import does not leave a partial library.

The archive reader/writer may use generic file adapters from `core/files`, but Paperclip-specific manifest rules belong in the backup feature.

---

## 6. Repository and service boundaries

### 6.1 Repository responsibilities

A repository is the boundary between a feature and its stored data. It should:

- Execute parameterized SQLite queries.
- Map database rows to typed application models.
- Apply simple database-level filters and ordering.
- Expose focused operations with meaningful names.
- Use transactions for multi-step database changes.

A repository should NOT:

- Render UI.
- Navigate between screens.
- Show alerts or snackbars.
- Fetch page metadata unless that repository explicitly owns a network-backed data source (not recommended for Paperclip's bookmark storage repository).
- Contain large business workflows spanning several adapters.

Example API shape:

```ts
export interface FolderRepository {
  getRecent(limit: number): Promise<Folder[]>;
  getAll(): Promise<Folder[]>;
  getById(id: string): Promise<Folder | null>;
  create(input: CreateFolderInput): Promise<Folder>;
  rename(id: string, name: string): Promise<void>;
  delete(id: string, strategy: FolderDeleteStrategy): Promise<void>;
  markOpened(id: string, openedAt: number): Promise<void>;
}
```

Keep this interface in the folder feature if an interface is useful. Do not add an interface and a separate implementation class for a simple repository unless the separation provides a concrete benefit.

### 6.2 Service responsibilities

A service coordinates a business workflow or multiple dependencies.

Good candidates in Paperclip:

- `saveLinkService`: validate, detect duplicates, persist, and schedule metadata work.
- `metadataService`: fetch and parse link metadata.
- `privateFolderService`: coordinate unlock, session, and lock behavior.
- `backupService`: coordinate archive validation, serialization, encryption, and database import/export.

Do not create a service that simply calls one repository method without adding meaningful behavior. In that case, call the repository from a feature hook.

### 6.3 Hook responsibilities

Hooks connect React components to repositories/services and expose screen-friendly state.

Examples:

- `useRecentFolders()` — recent folder data and refresh state.
- `useFolders()` — folder collection and basic folder mutations.
- `useBookmarks(folderId)` — bookmarks for a folder.
- `useSearchBookmarks(query)` — local search results.
- `useSaveLink()` — save-link action and pending/error state.

Hooks should not contain long SQL statements or cryptographic algorithms. They should not become generic framework layers.

### 6.4 When to add a use-case function

Do not require a use-case class for every action. A plain function in a feature service is enough for the MVP.

Extract a named workflow when it:

- Coordinates multiple repositories or native services.
- Has non-trivial validation or failure behavior.
- Is used by more than one screen.
- Needs to be tested independently from React.

For example, saving a link is a workflow; renaming a folder may be a direct repository mutation.

---

## 7. Data and TypeScript conventions

### 7.1 Domain types

Define feature-owned models and inputs near the feature that owns them. Avoid a giant global `types.ts` file containing every application type.

Example:

```ts
export type PreviewStatus =
  | "pending"
  | "success"
  | "partial"
  | "unavailable"
  | "failed";

export type Bookmark = {
  id: string;
  originalUrl: string;
  canonicalUrl: string | null;
  title: string;
  titleIsUserEdited: boolean;
  description: string | null;
  note: string | null;
  folderId: string | null;
  domain: string | null;
  sourceName: string | null;
  previewImagePath: string | null;
  previewStatus: PreviewStatus;
  createdAt: number;
  updatedAt: number;
};
```

Keep database row types separate from feature model types when column names or nullability differ. Map rows in the repository rather than spreading database naming conventions throughout the UI.

### 7.2 Input types

Use dedicated input types for create/update operations where they improve safety and readability:

```ts
export type CreateFolderInput = {
  name: string;
  iconKey?: string | null;
  colorKey?: string | null;
  isPrivate?: boolean;
};
```

Do not pass an entire screen form object into SQL without validation. Validate external input at boundaries: shared URLs, user-entered URLs, imported backup files, and data from native modules.

### 7.3 TypeScript rules

- Enable `strict` mode.
- Avoid `any`; use `unknown` for untrusted values and validate/narrow them.
- Do not use non-null assertions (`!`) to silence errors unless the invariant is truly guaranteed and documented.
- Prefer explicit return types for exported functions and public repository APIs.
- Use discriminated unions for outcomes that have distinct success/failure states.
- Avoid excessive generic types that make ordinary code harder to read.
- Do not duplicate types when a single feature-owned type can be imported.

### 7.4 Naming conventions

Use one consistent convention:

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `FolderCard.tsx` |
| Screens | PascalCase + `Screen` | `FoldersScreen.tsx` |
| Hooks | camelCase with `use` prefix | `useRecentFolders.ts` |
| Services | camelCase + `Service` | `saveLinkService.ts` |
| Repositories | camelCase + `Repository` | `bookmarkRepository.ts` |
| Types | PascalCase | `Bookmark`, `Folder` |
| Constants | camelCase or UPPER_SNAKE_CASE for true constants | `defaultFolderLimit` |
| Functions | Verb + subject | `markFolderOpened()` |
| Database tables/columns | snake_case | `last_opened_at` |

Names should explain intent. Avoid vague names such as `data`, `helper`, `manager`, `common`, `misc`, and `utils2` when a more specific name is possible.

---

## 8. UI and Material 3 Expressive conventions

### 8.1 Components should have one clear purpose

Keep reusable UI components focused. For example:

- `FolderCard` renders one folder and emits press/action callbacks.
- `BookmarkCard` renders one bookmark preview and exposes its actions.
- `FloatingBottomNavigation` renders the three primary destinations.
- `FloatingAddButton` starts the add-link flow; it is separate from navigation.
- `EmptyState` renders a reusable empty state with configurable text/action.

A component should not open SQLite, fetch metadata, or implement encryption.

### 8.2 Navigation contract

The only primary navigation destinations are:

1. Home — recent folders only.
2. Folders — complete folder library.
3. Settings.

The bottom bar must be a floating, centered capsule with clear spacing from the screen edges and Android system navigation area. It must not be a full-width edge-attached tab bar.

Search is a secondary route opened from the Search action in the Folders top app bar. It is not a fourth tab.

The Add Link action remains a separate floating action and must not overlap the floating navigation.

### 8.3 Tokens and theme

Use semantic Material 3 Expressive tokens for colors, typography, shapes, spacing, and motion. Screens should consume the theme; avoid raw hex colors and arbitrary spacing repeated throughout components.

Use a single, consistent icon family. Respect light/dark mode, dynamic color where supported, contrast, font scaling, TalkBack, safe areas, and reduced motion.

### 8.4 Keep components presentational

Prefer:

```tsx
<FolderCard
  folder={folder}
  onPress={() => router.push(`/folders/${folder.id}`)}
/>
```

Avoid a `FolderCard` that imports the database, queries all bookmarks, performs navigation internally, and manages folder deletion. Keep the card reusable and let the screen/hook coordinate actions.

---

## 9. State management

Do not introduce multiple state-management systems.

### Use local component state for

- Text input values.
- Open/closed menus and dialogs.
- Temporary selection within a screen.
- Form validation messages.
- Small view-only toggles.

### Use feature hooks for

- Loading database-backed folder/bookmark data.
- Performing feature operations.
- Exposing loading, error, and empty states.
- Refreshing data after mutations.

### Use a global store only when justified

A small store such as Zustand may be used for genuinely cross-screen transient state, for example an incoming share payload awaiting save or a short-lived private-session state. Do not add Zustand by default if React state and feature hooks are sufficient.

### Do not

- Mirror all SQLite data into a global store.
- Store bookmark lists in AsyncStorage.
- Create a large global context containing unrelated feature state.
- Use effects to copy one piece of state into another when the value can be derived.
- Use a global event bus for normal parent-child or feature interactions.

---

## 10. Error handling and logging

### 10.1 Handle errors at the right boundary

- Repositories throw or return typed persistence errors; they do not display UI messages.
- Services translate low-level failures into meaningful feature outcomes when useful.
- Hooks expose a screen-friendly error state.
- Screens decide how to present errors using the shared snackbar/dialog/error components.

Use a small set of known error types. Do not build an elaborate error framework.

### 10.2 User-facing behavior

Always provide a meaningful state for:

- Invalid or unsupported URL.
- Duplicate bookmark.
- Metadata unavailable or timed out.
- Preview image failed.
- Offline save.
- Database/storage failure.
- Authentication cancelled or failed.
- Backup invalid, encrypted with a wrong password, or unsupported.

A metadata failure must never cause a valid URL to be lost. Show a designed fallback preview card.

### 10.3 Logging rules

- Never log PINs, encryption keys, tokens, or decrypted private data.
- Avoid logging private URLs, titles, or notes.
- Do not log whole bookmark/folder objects.
- Log enough context to debug non-sensitive failures, such as operation name and error category.
- Remove noisy temporary debug logs before release.

---

## 11. Testing strategy

Keep tests close to the feature or in the agreed `tests/` structure. Follow one convention consistently; do not duplicate test locations without a reason.

### Unit tests

Prioritize logic that can fail in subtle ways:

- URL extraction, validation, and duplicate comparison.
- Metadata parser and fallback selection.
- User-edited title preservation.
- Folder deletion behavior.
- Recent-folder ordering.
- Search matching and private-content exclusion.
- Backup manifest validation and migration.
- Encryption/key-management boundaries.

### Component tests

Test reusable states rather than implementation details:

- Rich, partial, loading, failed, and fallback bookmark cards.
- Folder cards, including locked/private states.
- Empty/loading/error states.
- Floating navigation selected states and destination behavior.
- Save-link form validation.

### End-to-end tests

At minimum, cover:

1. Create a folder and verify it appears on Home and Folders.
2. Open a folder and verify it moves to the top of Recent Folders.
3. Verify Home has no See All action and no bookmark section.
4. Verify the floating navigation has only Home, Folders, and Settings.
5. Open Search from the Folders screen, not from a navigation tab.
6. Save a link manually and from Android sharing.
7. Verify a rich preview and a fallback preview.
8. Move, edit, and delete bookmarks.
9. Lock and unlock a private folder.
10. Export and restore a backup.

Do not write tests that merely assert that a component rendered. Assert the behavior that matters to a user.

---

## 12. Code quality and development protocols

### 12.1 Required standards

- TypeScript strict mode.
- ESLint for static checks.
- Prettier for consistent formatting.
- Meaningful, descriptive names.
- Small functions with one clear responsibility.
- Parameterized SQL only.
- Runtime validation for untrusted input.
- No secrets or private data in logs.
- Automated tests for important logic and bug fixes.
- No unused dependencies, dead code, or commented-out implementations left behind.
- No duplicate implementations of the same behavior.

### 12.2 Function and component size

There is no arbitrary line limit, but a function or component that is difficult to understand at a glance should be split by responsibility.

Do not split code solely to achieve short files. A few cohesive functions in one file can be clearer than many one-function files.

### 12.3 Comments and documentation

Write comments to explain:

- Why a non-obvious decision exists.
- Platform limitations or security constraints.
- Tricky behavior that cannot be understood from the code alone.

Do not add comments that simply repeat the code. Public service/repository functions should have clear names and types; add documentation where behavior, side effects, or failure conditions are not obvious.

### 12.4 Dependency discipline

Before adding a package, answer:

1. Does the feature genuinely need it?
2. Can the existing React Native/Expo APIs handle the requirement?
3. Is the package compatible with the current Expo/RN version and New Architecture?
4. Is it maintained and acceptable for an Android native build?
5. Does it duplicate an existing library?

Add one dependency for one clear purpose. Avoid installing several overlapping UI, navigation, state, database, or utility libraries.

### 12.5 Git and change discipline

- Use small, focused commits.
- Do not combine unrelated refactors with feature changes.
- Keep the application buildable after each milestone.
- Update tests and relevant docs with behavior changes.
- Never commit signing credentials, private keys, or local user data.
- Do not modify generated native files manually when a supported config plugin can manage the change.

---

## 13. Recommended implementation order

Build the architecture gradually. Do not create all directories and placeholder files before they are needed.

### Step 1 — Audit and foundation

- Inspect the current repository and preserve existing working configuration.
- Confirm Expo/bare React Native status, package manager, versions, and Android build.
- Establish TypeScript strict mode, ESLint, Prettier, and path aliases.
- Set up the root layout, theme tokens, and floating navigation shell.

### Step 2 — Local data foundation

- Configure SQLite and the migration approach.
- Create the folder and bookmark tables.
- Implement focused folder and bookmark repositories.
- Add repository tests.

### Step 3 — Folders and Home

- Implement folder CRUD.
- Add `last_opened_at` and the recent-folder query.
- Build Home with recent folders only.
- Build Folders with the complete collection.
- Confirm no See All action appears on Home.

### Step 4 — Save links and previews

- Implement Android share-intent handling.
- Implement manual URL entry.
- Persist the URL before metadata fetching.
- Implement metadata extraction and local preview caching.
- Build rich and fallback bookmark cards.

### Step 5 — Bookmark actions and search

- Implement All Bookmarks and folder contents.
- Implement edit, move, copy, share, refresh-preview, and delete.
- Add local search as a secondary route from Folders.

### Step 6 — Privacy and backup

- Finalize the security boundary and key lifecycle before coding the private-folder workflow.
- Implement private folders and lifecycle locking.
- Implement validated JSON backup/import and encrypted private backups.

### Step 7 — Polish and verification

- Verify Material 3 Expressive behavior and visual consistency.
- Test light/dark and dynamic color.
- Test accessibility, performance, Android intents, offline behavior, and restore paths.
- Remove unused code and dependencies.

---

## 14. Definition of done

A feature is complete only when:

- Its code is in the correct feature/module.
- UI, business workflow, persistence, and native integration responsibilities are separated appropriately.
- The feature works with real local data; mock data is not used as a substitute for a required implementation.
- Loading, empty, error, and success states are handled.
- Important behavior has tests.
- TypeScript, lint, formatting, and relevant Android build checks pass.
- No unrelated feature or navigation behavior has regressed.
- The implementation is understandable to a developer who has not written it.

For the application as a whole:

- The floating bottom navigation contains exactly Home, Folders, and Settings.
- Home shows recent folders only, with no See All action or recent bookmarks section.
- Folders exposes the complete folder library and the Search entry point.
- Bookmarks, folders, previews, private storage, and backups use the architecture described in the PRD and TRD.
- There is no unnecessary backend, duplicate state store, or architecture layer added without a demonstrated need.

---

## 15. Instructions for the coding agent

Treat this document as the source of truth for code organization and maintainability. Use it together with `Paperclip_PRD.md` and `Paperclip_TRD.md`.

Before writing feature code:

1. Inspect the actual repository. Do not assume it is empty or reorganize it blindly.
2. Compare the existing folder structure against this recommendation and propose only changes that improve clarity or maintainability.
3. Present a concise implementation plan and list any genuine blockers or architecture decisions that need to be made.
4. Do not create empty layers or placeholder files just to match the diagram.
5. Do not introduce a global state manager, ORM, dependency-injection framework, or additional UI library unless there is a concrete reason.
6. Keep route files thin and feature code close to the feature that owns it.
7. Keep SQLite as the persistent source of truth.
8. Implement one milestone at a time and keep the Android app buildable.
9. Add or update tests alongside the relevant code.
10. Explain non-obvious architecture changes in a short note or an Architecture Decision Record.
11. Before finishing, summarize which files were added/changed, which checks were run, and any remaining limitations.

**Primary quality bar:** another developer should be able to open the repository, locate a feature, understand its data flow, and make a safe change without needing to understand the whole application first.
